// VirtualWorldGame.js - Main game class
import { CONFIG } from './config.js';
import { NetworkManager } from './network/NetworkManager.js';
import { CharacterBuilder } from './character/CharacterBuilder.js';
import { RemotePlayer } from './character/RemotePlayer.js';
import { EmoteManager } from './systems/EmoteManager.js';
import { StoreManager } from './systems/StoreManager.js';
import { InputManager } from './input/InputManager.js';
import { Environment } from './world/Environment.js';
import { CollisionManager } from './physics/CollisionManager.js';

export class VirtualWorldGame {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = null;
        this.camera = null;
        this.player = null;
        this.players = new Map();
        
        // Managers
        this.inputManager = null;
        this.networkManager = null;
        this.storeManager = null;
        this.emoteManager = null;
        this.collisionManager = null;
        this.environment = null;
        
        // Game state
        this.currency = 1000;
        this.isMobile = window.innerWidth <= CONFIG.MOBILE_THRESHOLD;
        this.playerTopId = 'default-blue';
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            this.updateLoadingProgress(10);
            
            // Create scene
            this.createScene();
            this.updateLoadingProgress(20);
            
            // Setup lighting
            this.setupLighting();
            this.updateLoadingProgress(30);
            
            // Create environment
            await this.createEnvironment();
            this.updateLoadingProgress(50);
            
            // Create player
            this.createPlayer();
            this.updateLoadingProgress(60);
            
            // Initialize managers
            this.initializeManagers();
            this.updateLoadingProgress(80);
            
            // Start render loop
            this.startRenderLoop();
            this.updateLoadingProgress(90);
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.engine.resize();
                this.isMobile = window.innerWidth <= CONFIG.MOBILE_THRESHOLD;
            });
            
            // Hide loading screen
            this.updateLoadingProgress(100);
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
            
            // Make game globally accessible for debugging
            window.game = this;
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }
    
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.5, 0.8, 1);
        
        // Create camera
        this.camera = new BABYLON.UniversalCamera('camera', 
            new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        
        // Fog for atmosphere
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.95);
        this.scene.fogStart = 20;
        this.scene.fogEnd = 100;
    }
    
    setupLighting() {
        // Hemisphere light for ambient
        const hemiLight = new BABYLON.HemisphericLight('hemiLight', 
            new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0.7;
        hemiLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
        hemiLight.specular = new BABYLON.Color3(0.5, 0.5, 0.5);
        hemiLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        // Directional light for sun
        const dirLight = new BABYLON.DirectionalLight('dirLight',
            new BABYLON.Vector3(-1, -2, -1), this.scene);
        dirLight.position = new BABYLON.Vector3(20, 40, 20);
        dirLight.intensity = 0.5;
        
        // Shadow generator
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator = shadowGenerator;
    }
    
    async createEnvironment() {
        this.environment = new Environment(this.scene);
        this.environment.setShadowGenerator(this.shadowGenerator);
        const collisionObjects = await this.environment.create();
        
        // Setup collision manager
        this.collisionManager = new CollisionManager();
        this.collisionManager.setCollisionObjects(collisionObjects);
    }
    
    createPlayer() {
        // Create character
        this.player = CharacterBuilder.createCharacter(this.scene, 'player');
        CharacterBuilder.applyMaterials(this.player, this.scene, this.playerTopId);
        
        // Add movement properties
        this.player.velocity = new BABYLON.Vector3(0, 0, 0);
        this.player.isGrounded = true;
        this.player.isJumping = false;
        this.player.groundLevel = CONFIG.GROUND_LEVEL;
        
        // Movement state
        this.player.moveForward = false;
        this.player.moveBackward = false;
        this.player.moveLeft = false;
        this.player.moveRight = false;
        
        // Movement methods
        this.player.jump = () => {
            if (this.player.isGrounded && !this.player.isJumping) {
                this.player.isJumping = true;
                this.player.isGrounded = false;
                this.player.velocity.y = CONFIG.JUMP_FORCE;
            }
        };
        
        this.player.interact = () => {
            console.log('Interact!');
            // Check if near store door
            const storePosition = new BABYLON.Vector3(30, 0, -7.5);
            const distance = BABYLON.Vector3.Distance(this.player.position, storePosition);
            if (distance < 5) {
                this.toggleStore();
            }
        };
        
        // Store properties
        this.player.topId = this.playerTopId;
    }
    
    initializeManagers() {
        // Input manager
        this.inputManager = new InputManager(this);
        this.inputManager.setPlayer(this.player);
        
        // Network manager
        this.networkManager = new NetworkManager(CONFIG.WS_URL, this);
        
        // Emote manager
        this.emoteManager = new EmoteManager(this.scene);
        
        // Store manager
        this.storeManager = new StoreManager(this);
    }
    
    startRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.update();
        });
    }
    
    update() {
        // Update player movement
        this.updatePlayer();
        
        // Update camera
        this.updateCamera();
        
        // Update remote players
        this.players.forEach(player => player.update());
        
        // Update managers
        this.inputManager.update();
        this.emoteManager.update();
        this.storeManager.update();
        
        // Send network updates
        if (this.networkManager && this.player) {
            const pos = this.player.position;
            this.networkManager.sendMove(pos.x, pos.y, pos.z, this.player.topId);
        }
    }
    
    updatePlayer() {
        if (!this.player || !this.camera) return;
        
        const oldPosition = this.player.position.clone();
        
        // Apply gravity
        if (!this.player.isGrounded) {
            this.player.velocity.y -= CONFIG.GRAVITY;
        }
        
        // Handle horizontal movement
        let moveDirection = new BABYLON.Vector3(0, 0, 0);
        if (this.player.moveForward) moveDirection.z += 1;
        if (this.player.moveBackward) moveDirection.z -= 1;
        if (this.player.moveLeft) moveDirection.x -= 1;
        if (this.player.moveRight) moveDirection.x += 1;
        
        if (moveDirection.length() > 0) {
            // Normalize and apply camera rotation
            moveDirection = moveDirection.normalize();
            const camYaw = this.camera.rotation.y;
            const rotMat = BABYLON.Matrix.RotationY(camYaw);
            const worldDir = BABYLON.Vector3.TransformCoordinates(moveDirection, rotMat);
            
            // Set velocity
            this.player.velocity.x = worldDir.x * CONFIG.PLAYER_SPEED;
            this.player.velocity.z = worldDir.z * CONFIG.PLAYER_SPEED;
            
            // Rotate character
            const targetYaw = Math.atan2(worldDir.x, worldDir.z);
            this.player.rotation.y = BABYLON.Scalar.LerpAngle(
                this.player.rotation.y, targetYaw, 0.15
            );
        } else {
            // Apply friction
            this.player.velocity.x *= 0.85;
            this.player.velocity.z *= 0.85;
        }
        
        // Calculate new position
        const newPosition = new BABYLON.Vector3(
            this.player.position.x + this.player.velocity.x,
            this.player.position.y + this.player.velocity.y,
            this.player.position.z + this.player.velocity.z
        );
        
        // Check collisions
        const collision = this.collisionManager.checkCollisions(newPosition);
        
        if (collision) {
            const resolved = this.collisionManager.resolveCollision(
                oldPosition, newPosition, collision, this.player.velocity
            );
            this.player.position = resolved.position;
            this.player.velocity = resolved.velocity;
            this.player.groundLevel = resolved.groundLevel;
        } else {
            this.player.position = newPosition;
            
            // Check if on elevated ground
            const elevatedCheck = this.collisionManager.checkCollisions(newPosition);
            if (elevatedCheck && elevatedCheck.onElevatedGround) {
                this.player.groundLevel = elevatedCheck.height + CONFIG.PLAYER_HEIGHT;
            } else {
                this.player.groundLevel = CONFIG.GROUND_LEVEL;
            }
        }
        
        // Ground collision
        if (this.player.position.y <= this.player.groundLevel) {
            this.player.position.y = this.player.groundLevel;
            this.player.velocity.y = 0;
            this.player.isGrounded = true;
            this.player.isJumping = false;
        } else {
            this.player.isGrounded = false;
        }
        
        // World bounds
        const bounds = CONFIG.WORLD_BOUNDS;
        this.player.position.x = BABYLON.Scalar.Clamp(this.player.position.x, -bounds, bounds);
        this.player.position.z = BABYLON.Scalar.Clamp(this.player.position.z, -bounds, bounds);
        
        // Animate character
        this.animateCharacter(this.player);
        
        // Keep upright
        this.player.rotation.x = 0;
        this.player.rotation.z = 0;
    }
    
    updateCamera() {
        if (!this.player || !this.camera) return;
        
        const camYaw = this.camera.rotation.y;
        const offset = new BABYLON.Vector3(
            Math.sin(camYaw) * CONFIG.CAMERA_DISTANCE,
            0,
            Math.cos(camYaw) * CONFIG.CAMERA_DISTANCE
        );
        
        const camTarget = this.player.position.add(offset.negate());
        const minY = Math.max(this.player.position.y + 2, 3);
        
        this.camera.position = BABYLON.Vector3.Lerp(
            this.camera.position,
            new BABYLON.Vector3(camTarget.x, minY, camTarget.z),
            0.1
        );
        this.camera.setTarget(this.player.position);
    }
    
    animateCharacter(character) {
        const isMoving = character === this.player ? 
            (this.player.moveForward || this.player.moveBackward || 
             this.player.moveLeft || this.player.moveRight) : 
            character.isMoving;
        
        const t = performance.now() * 0.005;
        
        if (isMoving) {
            const legSwing = Math.sin(t * 8) * 0.8;
            const armSwing = Math.sin(t * 8) * 0.4;
            
            if (character.leftLeg) character.leftLeg.rotation.x = legSwing;
            if (character.rightLeg) character.rightLeg.rotation.x = -legSwing;
            if (character.leftArm) character.leftArm.rotation.x = -armSwing * 0.7;
            if (character.rightArm) character.rightArm.rotation.x = armSwing * 0.7;
        } else {
            const resetSpeed = 0.1;
            if (character.leftArm) {
                character.leftArm.rotation.x = BABYLON.Scalar.Lerp(
                    character.leftArm.rotation.x, 0, resetSpeed
                );
            }
            if (character.rightArm) {
                character.rightArm.rotation.x = BABYLON.Scalar.Lerp(
                    character.rightArm.rotation.x, 0, resetSpeed
                );
            }
            if (character.leftLeg) {
                character.leftLeg.rotation.x = BABYLON.Scalar.Lerp(
                    character.leftLeg.rotation.x, 0, resetSpeed
                );
            }
            if (character.rightLeg) {
                character.rightLeg.rotation.x = BABYLON.Scalar.Lerp(
                    character.rightLeg.rotation.x, 0, resetSpeed
                );
            }
        }
    }
    
    // Multiplayer methods
    addRemotePlayer(playerData) {
        if (this.players.has(playerData.id)) return;
        
        const remotePlayer = new RemotePlayer(playerData.id, this.scene, playerData);
        this.players.set(playerData.id, remotePlayer);
        console.log('Added remote player:', playerData.id);
    }
    
    removeRemotePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.dispose();
            this.players.delete(playerId);
            console.log('Removed remote player:', playerId);
        }
    }
    
    updateRemotePlayer(data) {
        const player = this.players.get(data.id);
        if (player) {
            player.updatePosition(data.x, data.y, data.z);
            if (data.topId) {
                player.updateTopId(data.topId);
            }
        }
    }
    
    playRemoteEmote(playerId, emote) {
        const player = this.players.get(playerId);
        if (player) {
            player.playEmote(emote, this.emoteManager);
        }
    }
    
    // UI methods
    toggleInventory() {
        const panel = document.getElementById('inventoryPanel');
        panel.style.display = panel.style.display === 'none' || panel.style.display === '' ? 
            'block' : 'none';
    }
    
    toggleStore() {
        this.storeManager.toggleStore();
    }
    
    toggleMap() {
        const mapCanvas = document.getElementById('mapCanvas');
        mapCanvas.style.display = mapCanvas.style.display === 'none' || mapCanvas.style.display === '' ? 
            'block' : 'none';
    }
    
    toggleEmoteWheel() {
        const wheel = document.getElementById('emoteWheel');
        wheel.style.display = wheel.style.display === 'none' || wheel.style.display === '' ? 
            'block' : 'none';
    }
    
    playEmote(emote) {
        this.emoteManager.playEmoteForCharacter(this.player, emote);
        this.toggleEmoteWheel();
        
        if (this.networkManager) {
            this.networkManager.sendEmote(emote);
        }
    }
    
    sendChatMessage(message) {
        if (this.networkManager) {
            this.networkManager.sendChat(message);
        }
        this.addChatMessage('You', message);
    }
    
    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    applyItemToCharacter(character, item) {
        if (!character || item.type !== 'shirt') return;
        
        CharacterBuilder.applyMaterials(character, this.scene, item.id);
        
        if (character === this.player && item.id) {
            this.player.topId = item.id;
            
            if (this.networkManager) {
                const pos = this.player.position;
                this.networkManager.sendMove(pos.x, pos.y, pos.z, this.player.topId);
            }
        }
    }
    
    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }
}