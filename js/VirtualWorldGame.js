// VirtualWorldGame.js - Main game class
// Use window.CONFIG if it exists (set by external.html), otherwise use local config
import { CONFIG as DefaultConfig } from './config.js';
import { NetworkManager } from './network/NetworkManager.js';
import { CharacterBuilder } from './character/CharacterBuilder.js';
import { RemotePlayer } from './character/RemotePlayer.js';
import { EmoteManager } from './systems/EmoteManager.js';
import { StoreManager } from './systems/StoreManager.js';
import { CreativeMode } from './systems/CreativeMode.js';
import { InputManager } from './input/InputManager.js';
import { Environment } from './world/Environment.js';
import { CollisionManager } from './physics/CollisionManager.js';

export class VirtualWorldGame {
    constructor() {
        // Use window.CONFIG if set (for external.html), otherwise use DefaultConfig
        this.CONFIG = window.CONFIG || DefaultConfig;
        console.log('Using config:', window.CONFIG ? 'External Config' : 'Default Config');
        
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
        this.creativeMode = null;
        
        // Game state
        this.currency = 1000;
        this.isMobile = window.innerWidth <= this.CONFIG.MOBILE_THRESHOLD;
        this.playerTopId = 'default-blue';
        
        // Camera settings
        this.cameraDistance = this.CONFIG.CAMERA_DISTANCE;
        
        // Environment options
        this.useEditorScene = false; // Default to original environment
        
        // Leash/Collar system
        this.leashTargets = new Map(); // Map of playerId -> leaderId
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            this.updateLoadingProgress(10);
            
            // Create scene
            this.createScene();
            this.updateLoadingProgress(30);
            
            // Setup lighting
            this.setupLighting();
            this.updateLoadingProgress(60);
            
            // Start render loop
            this.startRenderLoop();
            this.updateLoadingProgress(90);
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.engine.resize();
                this.isMobile = window.innerWidth <= this.CONFIG.MOBILE_THRESHOLD;
            });
            
            // Show start options
            this.updateLoadingProgress(100);
            setTimeout(() => {
                const startOptions = document.getElementById('startOptions');
                if (startOptions) {
                    startOptions.style.display = 'block';
                    
                    // Add event listeners for start buttons
                    document.getElementById('startOriginal').addEventListener('click', () => {
                        this.useEditorScene = false;
                        this.startGame();
                    });
                    
                    document.getElementById('startEditor').addEventListener('click', () => {
                        this.useEditorScene = true;
                        this.startGame();
                    });
                }
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
        this.environment = new Environment(this.scene, this.useEditorScene);
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
        this.player.groundLevel = this.CONFIG.GROUND_LEVEL;
        
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
                this.player.velocity.y = this.CONFIG.JUMP_FORCE;
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
        if (this.player) {
            this.inputManager.setPlayer(this.player);
        }
        
        try {
            // Network manager - wrap in try-catch in case the WebSocket URL is invalid
            this.networkManager = new NetworkManager(this.CONFIG.WS_URL, this);
        } catch (error) {
            console.warn("Could not initialize network manager:", error);
            this.addChatMessage('System', 'Playing in offline mode - multiplayer features disabled');
        }
        
        // Emote manager
        this.emoteManager = new EmoteManager(this.scene);
        
        // Store manager
        this.storeManager = new StoreManager(this);
        
        // Creative mode manager
        this.creativeMode = new CreativeMode(this.scene, this.camera);
        
        // Set up environment toggle button
        const toggleEnvBtn = document.getElementById('toggleEnvBtn');
        if (toggleEnvBtn) {
            toggleEnvBtn.addEventListener('click', () => {
                this.toggleEnvironment();
            });
        }
        
        // Set up creative mode button
        const creativeModeBtn = document.getElementById('creativeModeBtn');
        if (creativeModeBtn) {
            creativeModeBtn.addEventListener('click', () => {
                this.toggleCreativeMode();
            });
        }
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
        this.players.forEach(player => {
            if (player.isLeashed && player.leashBy && this.players.has(player.leashBy)) {
                const leader = this.players.get(player.leashBy);
                // Pull leashed player toward leader (with leash length)
                const leashLength = 3.0;
                const dir = leader.character.mesh.position.subtract(player.character.mesh.position);
                if (dir.length() > leashLength) {
                    dir.normalize();
                    player.character.mesh.position = leader.character.mesh.position.subtract(dir.scale(leashLength));
                }
            }
            player.update();
        });
        
        // Update managers if they exist
        if (this.inputManager) this.inputManager.update();
        if (this.emoteManager) this.emoteManager.update();
        if (this.storeManager) this.storeManager.update();
        // CreativeMode doesn't need an update method as it's event-driven
        
        // Send network updates
        if (this.networkManager && this.player) {
            const pos = this.player.position;
            this.networkManager.sendMove(pos.x, pos.y, pos.z, this.playerTopId || this.player.topId);
            
            // Show local player position in console for debugging
            console.log(`Local player pos: x:${pos.x.toFixed(2)}, y:${pos.y.toFixed(2)}, z:${pos.z.toFixed(2)}`);
        }
    }
    
    updatePlayer() {
        if (!this.player || !this.camera) return;
        
        // Skip player movement updates if creative mode is enabled
        if (this.creativeMode && this.creativeMode.isEnabled) {
            // Just handle animations
            this.animateCharacter(this.player);
            return;
        }
        
        const oldPosition = this.player.position.clone();
        
        // Apply gravity
        if (!this.player.isGrounded) {
            this.player.velocity.y -= this.CONFIG.GRAVITY;
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
            this.player.velocity.x = worldDir.x * this.CONFIG.PLAYER_SPEED;
            this.player.velocity.z = worldDir.z * this.CONFIG.PLAYER_SPEED;
            
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
        
        // Check collisions if collision manager exists
        if (this.collisionManager) {
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
                    this.player.groundLevel = elevatedCheck.height + this.CONFIG.PLAYER_HEIGHT;
                } else {
                    this.player.groundLevel = this.CONFIG.GROUND_LEVEL;
                }
            }
        } else {
            // No collision manager, just update position
            this.player.position = newPosition;
            this.player.groundLevel = this.CONFIG.GROUND_LEVEL;
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
        const bounds = this.CONFIG.WORLD_BOUNDS;
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
            Math.sin(camYaw) * this.cameraDistance,
            0,
            Math.cos(camYaw) * this.cameraDistance
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
    
    /**
     * Adjusts camera zoom level based on delta value
     * @param {number} delta - Positive for zoom out, negative for zoom in
     */
    zoomCamera(delta) {
        // Calculate new camera distance
        const zoomSpeed = 1.0;
        this.cameraDistance += delta * zoomSpeed;
        
        // Default values in case they're not defined in CONFIG
        const minDistance = this.CONFIG.CAMERA_MIN_DISTANCE || 5;
        const maxDistance = this.CONFIG.CAMERA_MAX_DISTANCE || 20;
        
        // Clamp to min/max values
        this.cameraDistance = Math.max(
            minDistance, 
            Math.min(maxDistance, this.cameraDistance)
        );
        
        // Log zoom level for debugging
        console.log(`Camera zoom: ${this.cameraDistance.toFixed(1)}`);
        
        // Show visual feedback for zoom level
        this.showZoomIndicator(this.cameraDistance);
    }
    
    /**
     * Shows a temporary visual indicator for zoom level
     * @param {number} level - Current zoom level
     */
    showZoomIndicator(level) {
        // Create or get the zoom indicator
        let indicator = document.getElementById('zoomIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'zoomIndicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '20px';
            indicator.style.left = '50%';
            indicator.style.transform = 'translateX(-50%)';
            indicator.style.background = 'rgba(0, 0, 0, 0.5)';
            indicator.style.color = 'white';
            indicator.style.padding = '5px 10px';
            indicator.style.borderRadius = '4px';
            indicator.style.fontFamily = 'Arial, sans-serif';
            indicator.style.fontSize = '14px';
            indicator.style.transition = 'opacity 0.5s';
            indicator.style.zIndex = '1000';
            document.body.appendChild(indicator);
        }
        
        // Update the indicator
        const zoomPercent = Math.round((level - this.CONFIG.CAMERA_MIN_DISTANCE) / 
            (this.CONFIG.CAMERA_MAX_DISTANCE - this.CONFIG.CAMERA_MIN_DISTANCE) * 100);
        indicator.textContent = `Zoom: ${zoomPercent}%`;
        
        // Reset opacity and set timeout to fade out
        indicator.style.opacity = '1';
        
        // Clear any existing timeout
        if (this.zoomIndicatorTimeout) {
            clearTimeout(this.zoomIndicatorTimeout);
        }
        
        // Set timeout to fade out
        this.zoomIndicatorTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
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
        
        // Add notification to chat
        this.addChatMessage('System', `${playerData.name || 'Player ' + playerData.id.substring(0, 5)} joined the world.`);
        
        const remotePlayer = new RemotePlayer(playerData.id, this.scene, playerData, this);
        this.players.set(playerData.id, remotePlayer);
        
        // Add click event for leading
        if (remotePlayer.character && remotePlayer.character.mesh) {
            remotePlayer.character.mesh.actionManager = new BABYLON.ActionManager(this.scene);
            remotePlayer.character.mesh.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                    this.showLeadButton(playerData.id);
                })
            );
        }
        
        console.log('Added remote player:', playerData);
        
        // Ensure the player mesh is visible
        if (remotePlayer && remotePlayer.character) {
            remotePlayer.character.visibility = 1;
            remotePlayer.character.isVisible = true;
        }
    }
    
    removeRemotePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.dispose();
            this.players.delete(playerId);
            console.log('Removed remote player:', playerId);
        }
    }
    
    clearRemotePlayers() {
        // Remove all remote players
        for (const [playerId, player] of this.players.entries()) {
            if (player) {
                player.dispose();
            }
        }
        this.players.clear();
        console.log('Cleared all remote players');
    }
    
    updateRemotePlayer(data) {
        const player = this.players.get(data.id);
        if (player) {
            console.log(`Updating remote player ${data.id} position:`, data.x, data.y, data.z);
            player.updatePosition(data.x, data.y, data.z);
            
            if (data.rotationY !== undefined) {
                player.updateRotation(data.rotationY);
            }
            
            if (data.topId) {
                player.updateTopId(data.topId);
            }
            
            // Ensure the player remains visible
            if (player.character) {
                player.character.visibility = 1;
                player.character.isVisible = true;
            }
        } else {
            console.warn(`Received update for unknown player: ${data.id}`);
        }
    }
    
    playRemoteEmote(playerId, emote) {
        const player = this.players.get(playerId);
        if (player) {
            player.playEmote(emote, this.emoteManager);
        }
    }
    
    /**
     * Update a player's leash state
     * @param {string} playerId - The ID of the player
     * @param {boolean} isLeashed - Whether the player is leashed
     * @param {string} leashBy - The ID of the player leading them
     * @param {boolean} isOnAllFours - Whether the player is on all fours
     */
    updatePlayerLeashState(playerId, isLeashed, leashBy, isOnAllFours) {
        console.log(`Updating player ${playerId} leash state: leashed=${isLeashed}, by=${leashBy}, allFours=${isOnAllFours}`);
        
        const player = this.players.get(playerId);
        if (player) {
            // Update player properties
            player.isLeashed = isLeashed;
            player.leashBy = leashBy;
            
            // Update visual state
            if (isLeashed) {
                player.showCollar();
                player.setAllFours(isOnAllFours);
            } else {
                player.hideCollar();
                player.setAllFours(false);
            }
            
            // Update leash targets map
            if (isLeashed && leashBy) {
                this.leashTargets.set(playerId, leashBy);
            } else {
                this.leashTargets.delete(playerId);
            }
            
            // Notify in chat
            if (isLeashed) {
                const leaderName = leashBy === this.networkManager.id ? 
                    'You' : 
                    (this.players.get(leashBy)?.playerName || 'Another player');
                const targetName = player.playerName || `Player ${playerId.substring(0, 5)}`;
                
                this.addChatMessage('System', `${leaderName} ${leaderName === 'You' ? 'are' : 'is'} now leading ${targetName}.`);
            } else {
                const targetName = player.playerName || `Player ${playerId.substring(0, 5)}`;
                this.addChatMessage('System', `${targetName} is no longer being led.`);
            }
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
                this.networkManager.sendMove(pos.x, pos.y, pos.z, this.playerTopId || this.player.topId);
            }
        }
    }
    
    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }
    
    /**
     * Shows a lead/leash button when clicking on a player
     * @param {string} targetId - The ID of the player to lead
     */
    showLeadButton(targetId) {
        console.log(`Showing lead button for player ${targetId}`);
        
        // Remove any existing lead UI
        const existingBtn = document.getElementById('leadPlayerBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create lead button
        const leadBtn = document.createElement('button');
        leadBtn.id = 'leadPlayerBtn';
        leadBtn.textContent = 'Lead Player';
        leadBtn.className = 'action-btn';
        leadBtn.style.position = 'fixed';
        leadBtn.style.top = '50%';
        leadBtn.style.left = '50%';
        leadBtn.style.transform = 'translate(-50%, -50%)';
        leadBtn.style.zIndex = '1000';
        leadBtn.style.padding = '10px 20px';
        leadBtn.style.backgroundColor = '#ff5555';
        leadBtn.style.color = 'white';
        leadBtn.style.border = 'none';
        leadBtn.style.borderRadius = '5px';
        leadBtn.style.cursor = 'pointer';
        
        // Add click event
        leadBtn.addEventListener('click', () => {
            if (this.networkManager) {
                console.log(`Sending lead request for player ${targetId}`);
                this.networkManager.send(JSON.stringify({
                    type: 'leadRequest',
                    targetId: targetId
                }));
                
                // Add to leash targets
                this.leashTargets.set(targetId, this.networkManager.id);
                
                // Remove button
                leadBtn.remove();
            }
        });
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '-10px';
        closeBtn.style.right = '-10px';
        closeBtn.style.background = '#333';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.width = '25px';
        closeBtn.style.height = '25px';
        closeBtn.style.cursor = 'pointer';
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            leadBtn.remove();
        });
        
        leadBtn.appendChild(closeBtn);
        document.body.appendChild(leadBtn);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(leadBtn)) {
                leadBtn.remove();
            }
        }, 5000);
    }
    
    // Method to switch environment type
    async switchEnvironment(useEditorScene = true) {
        this.useEditorScene = useEditorScene;
        
        // Clear existing environment
        if (this.environment) {
            // Clean up any resources if needed
        }
        
        // Update loading progress
        this.updateLoadingProgress(30);
        
        // Create new environment
        await this.createEnvironment();
        this.updateLoadingProgress(50);
    }
    
    // Toggle between original environment and Babylon.js Editor scene
    async toggleEnvironment() {
        // If creative mode is enabled, disable it first
        if (this.creativeMode && this.creativeMode.isEnabled) {
            this.creativeMode.setEnabled(false);
        }
        
        // Show loading screen
        document.getElementById('loadingScreen').style.display = 'block';
        this.updateLoadingProgress(10);
        
        // Toggle the environment flag
        this.useEditorScene = !this.useEditorScene;

        console.log(`Switching to ${this.useEditorScene ? 'Babylon.js Editor Scene' : 'Original Environment'}`);
        
        // Reset player position to a safe spot
        if (this.player) {
            this.player.position = new BABYLON.Vector3(0, 5, 0);
            this.player.velocity = new BABYLON.Vector3(0, 0, 0);
        }
        
        try {
            // Dispose the current environment
            if (this.environment) {
                this.environment.dispose();
            }
            
            // If we have existing collisions, clear them
            if (this.collisionManager) {
                // Clear existing collision objects
                this.collisionManager.setCollisionObjects([]);
            }
            
            // Create new environment
            await this.createEnvironment();
            this.updateLoadingProgress(90);
            
            // Use spawn point if available
            if (this.player && this.useEditorScene && this.environment.getSpawnPoint()) {
                const spawn = this.environment.getSpawnPoint();
                this.player.position = spawn.position.clone();
                // Make sure player is above ground
                this.player.position.y += this.CONFIG.PLAYER_HEIGHT;
            }
            
            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
            
            // Show temporary notification when environment changes
            this.showEnvironmentChangeNotification(this.useEditorScene);
            
            console.log("Environment switched successfully");
        } catch (error) {
            console.error("Error switching environment:", error);
            // Hide loading screen even if there was an error
            document.getElementById('loadingScreen').style.display = 'none';
        }
    }
    
    // Show temporary notification when environment changes
    showEnvironmentChangeNotification(isEditorScene) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.className = 'environment-notification';
        notification.textContent = isEditorScene ? 
            'Switched to Babylon.js Editor Scene' : 
            'Switched to Original Environment';
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.background = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = '#fff';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.fontWeight = 'bold';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        
        document.body.appendChild(notification);
        
        // Show and hide with animation
        setTimeout(() => {
            notification.style.opacity = '1';
            
            setTimeout(() => {
                notification.style.opacity = '0';
                
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 3000);
        }, 100);
    }
    
    // Handle interactions with objects in the scene
    handleInteraction(objectName) {
        console.log(`Handling interaction with ${objectName}`);
        
        // Skip interactions if creative mode is enabled
        if (this.creativeMode && this.creativeMode.isEnabled) {
            return;
        }
        
        // Handle different types of interactive objects
        const name = objectName.toLowerCase();
        
        if (name.includes('door')) {
            // Handle door interaction
            if (name.includes('store')) {
                this.toggleStore();
            } else {
                console.log("This door doesn't lead anywhere yet.");
                this.addChatMessage('Game', "This door doesn't lead anywhere yet.");
            }
        }
        else if (name.includes('button')) {
            // Handle button presses
            console.log("Button pressed!");
            this.addChatMessage('Game', "You pressed a button!");
        }
        else if (name.includes('chest') || name.includes('treasure')) {
            // Handle treasure
            console.log("Found treasure!");
            this.addChatMessage('Game', "You found some treasure!");
            
            // Give player some currency
            this.currency += 100;
            document.getElementById('currencyAmount').textContent = this.currency;
        }
        else {
            // Generic interaction
            this.addChatMessage('Game', `You interacted with ${objectName}.`);
        }
    }
    
    // Start the game with the selected environment
    async startGame() {
        try {
            // Hide start options
            document.getElementById('startOptions').style.display = 'none';
            
            // Reset loading progress for environment loading
            this.updateLoadingProgress(30);
            
            console.log(`Starting game with ${this.useEditorScene ? 'Babylon.js Editor Scene' : 'Original Environment'}`);
            
            // Create environment based on selection
            await this.createEnvironment();
            this.updateLoadingProgress(50);
            
            // Create player
            this.createPlayer();
            this.updateLoadingProgress(70);
            
            // Position player correctly based on environment
            if (this.player) {
                if (this.useEditorScene && this.environment.getSpawnPoint()) {
                    // Use spawn point from editor scene
                    const spawn = this.environment.getSpawnPoint();
                    this.player.position = spawn.position.clone();
                    this.player.position.y += this.CONFIG.PLAYER_HEIGHT;
                    console.log(`Player positioned at spawn point: ${this.player.position.x}, ${this.player.position.y}, ${this.player.position.z}`);
                } else {
                    // For original environment, place player in a good starting position
                    this.player.position = new BABYLON.Vector3(0, this.CONFIG.PLAYER_HEIGHT + 0.5, 0);
                    console.log(`Player positioned at default location: ${this.player.position.x}, ${this.player.position.y}, ${this.player.position.z}`);
                }
            }
            
            // Initialize managers
            this.initializeManagers();
            this.updateLoadingProgress(90);
            
            // Make sure the skybox and fog are set up
            if (this.environment) {
                this.environment.setupEnvironmentFog();
            }
            
            // Update camera to follow player properly
            this.updateCamera();
            
            // Start render loop if not already started
            if (!this.engine.isStarted) {
                this.startRenderLoop();
            }
            
            this.updateLoadingProgress(100);
            
            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
            
            // Add a welcome message
            this.addChatMessage('System', `Welcome to the ${this.useEditorScene ? 'Babylon.js Editor Scene' : 'Original Virtual World'}`);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            
            // Show the error to the user
            alert(`Failed to start game: ${error.message}. Please refresh the page.`);
        }
    }
    
    // Toggle Creative Mode on/off
    toggleCreativeMode() {
        if (this.creativeMode) {
            this.creativeMode.toggle();
            
            // If creative mode is now enabled, disable player movement
            if (this.creativeMode.isEnabled) {
                // Store current movement state
                this._previousMovementState = {
                    moveForward: this.player.moveForward,
                    moveBackward: this.player.moveBackward,
                    moveLeft: this.player.moveLeft,
                    moveRight: this.player.moveRight
                };
                
                // Disable movement
                this.player.moveForward = false;
                this.player.moveBackward = false;
                this.player.moveLeft = false;
                this.player.moveRight = false;
                
                // Notify player
                this.addChatMessage('System', 'Creative Mode enabled. Movement controls disabled.');
            } else {
                // Restore movement state if we stored it
                if (this._previousMovementState) {
                    this.player.moveForward = this._previousMovementState.moveForward;
                    this.player.moveBackward = this._previousMovementState.moveBackward;
                    this.player.moveLeft = this._previousMovementState.moveLeft;
                    this.player.moveRight = this._previousMovementState.moveRight;
                }
                
                // Notify player
                this.addChatMessage('System', 'Creative Mode disabled. Movement controls restored.');
            }
        }
    }
}