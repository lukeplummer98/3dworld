// RemotePlayer.js - Manages remote player characters
import { CharacterBuilder } from './CharacterBuilder.js';

export class RemotePlayer {
    constructor(id, scene, playerData, game) {
        this.id = id;
        this.scene = scene;
        this.game = game; // Store game reference
        this.playerName = playerData.name || ('Player ' + id.substring(0, 5)); // Store player name
        this.targetPosition = new BABYLON.Vector3(
            playerData.x || 0,
            playerData.y || 1.1,
            playerData.z || 0
        );
        
        // Create character mesh
        this.character = CharacterBuilder.createCharacter(
            scene,
            'remotePlayer' + id,
            this.targetPosition
        );
        
        // Apply materials with top ID
        CharacterBuilder.applyMaterials(
            this.character,
            scene,
            playerData.topId || 'default-blue'
        );
        
        // Store top ID
        this.topId = playerData.topId || 'default-blue';
        
        // Movement state
        this.isMoving = false;
        this.lastPosition = this.targetPosition.clone();
        
        // Create name tag
        this.createNameTag();
        
        // Make model visible
        this.character.visibility = 1;
        this.character.isVisible = true;
        
        // Emote system
        this.currentEmote = null;
        this.emoteSymbol = null;
        
        console.log(`Remote player created: ${this.playerName || id} at position:`, this.targetPosition);
    }
    
    createNameTag() {
        const nameTag = BABYLON.MeshBuilder.CreatePlane(
            'nameTag' + this.id,
            { width: 2, height: 0.5 },
            this.scene
        );
        nameTag.position = new BABYLON.Vector3(0, 3.5, 0);
        nameTag.parent = this.character;
        nameTag.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const nameMat = new BABYLON.StandardMaterial('nameTagMat' + this.id, this.scene);
        nameMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        nameMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        nameMat.disableLighting = true;
        nameMat.backFaceCulling = false; // Show both sides of the nametag
        
        const texture = new BABYLON.DynamicTexture(
            'nameTexture' + this.id,
            { width: 256, height: 64 },
            this.scene
        );
        texture.hasAlpha = true;
        
        const ctx = texture.getContext();
        ctx.clearRect(0, 0, 256, 64);
        
        // Add background for better visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 256, 64);
        
        // Draw name with outline for better visibility
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.playerName || 'Player ' + this.id.substring(0, 5), 128, 32);
        
        // Text fill
        ctx.fillStyle = 'white';
        ctx.fillText(this.playerName || 'Player ' + this.id.substring(0, 5), 128, 32);
        
        texture.update();
        
        nameMat.diffuseTexture = texture;
        nameTag.material = nameMat;
        
        this.nameTag = nameTag;
        
        // Add a notification for new player
        if (this.game && this.game.addChatMessage) {
            this.game.addChatMessage('System', `${this.playerName || 'Player ' + this.id.substring(0, 5)} joined the world.`);
        }
    }
    
    updatePosition(x, y, z) {
        // Store previous position for calculating direction
        const prevPosition = this.character.position.clone();
        
        // Create new target position
        this.targetPosition = new BABYLON.Vector3(x, y, z);
        
        // Calculate distance to determine if moving
        const distance = BABYLON.Vector3.Distance(prevPosition, this.targetPosition);
        this.isMoving = distance > 0.01;
        
        // Update position directly for immediate effect
        this.character.position = this.targetPosition.clone();
        
        // Make sure character is visible
        this.character.visibility = 1;
        this.character.isVisible = true;
        
        // Update rotation to face movement direction
        if (this.isMoving) {
            const direction = this.targetPosition.subtract(prevPosition);
            if (direction.length() > 0.01) {
                const targetYaw = Math.atan2(direction.x, direction.z);
                // Use direct rotation update for more immediate effect
                this.character.rotation.y = targetYaw;
            }
        }
        
        // Log position update for debugging
        console.log(`Remote player ${this.id} moved to:`, x.toFixed(2), y.toFixed(2), z.toFixed(2));
    }
    
    updateRotation(rotationY) {
        if (this.character) {
            // Update rotation directly for immediate effect
            this.character.rotation.y = rotationY;
        }
    }
    
    updateTopId(topId) {
        if (topId && topId !== this.topId) {
            this.topId = topId;
            // Update character appearance
            CharacterBuilder.applyMaterials(this.character, this.scene, topId);
        }
    }
    
    update() {
        // Smooth movement interpolation
        this.character.position = BABYLON.Vector3.Lerp(
            this.character.position,
            this.targetPosition,
            0.15
        );
        
        // Animate character based on movement
        this.animateCharacter();
    }
    
    animateCharacter() {
        const t = performance.now() * 0.005;
        
        if (this.isMoving) {
            // Walking animation
            const legSwing = Math.sin(t * 8) * 0.8;
            const armSwing = Math.sin(t * 8) * 0.4;
            
            if (this.character.leftLeg) this.character.leftLeg.rotation.x = legSwing;
            if (this.character.rightLeg) this.character.rightLeg.rotation.x = -legSwing;
            if (this.character.leftArm) this.character.leftArm.rotation.x = -armSwing * 0.7;
            if (this.character.rightArm) this.character.rightArm.rotation.x = armSwing * 0.7;
        } else {
            // Reset to neutral position
            const resetSpeed = 0.1;
            if (this.character.leftArm) {
                this.character.leftArm.rotation.x = BABYLON.Scalar.Lerp(
                    this.character.leftArm.rotation.x, 0, resetSpeed
                );
            }
            if (this.character.rightArm) {
                this.character.rightArm.rotation.x = BABYLON.Scalar.Lerp(
                    this.character.rightArm.rotation.x, 0, resetSpeed
                );
            }
            if (this.character.leftLeg) {
                this.character.leftLeg.rotation.x = BABYLON.Scalar.Lerp(
                    this.character.leftLeg.rotation.x, 0, resetSpeed
                );
            }
            if (this.character.rightLeg) {
                this.character.rightLeg.rotation.x = BABYLON.Scalar.Lerp(
                    this.character.rightLeg.rotation.x, 0, resetSpeed
                );
            }
        }
    }
    
    playEmote(emote, emoteManager) {
        if (emoteManager) {
            emoteManager.playEmoteForCharacter(this.character, emote);
        }
    }
    
    dispose() {
        try {
            // Dispose of the character mesh
            if (this.character) {
                this.character.dispose(false, true);
            }
            
            // Dispose of the name tag
            if (this.nameTag) {
                if (this.nameTag.material) {
                    if (this.nameTag.material.diffuseTexture) {
                        this.nameTag.material.diffuseTexture.dispose();
                    }
                    this.nameTag.material.dispose();
                }
                this.nameTag.dispose();
            }
            
            // Dispose of emote symbol if exists
            if (this.emoteSymbol) {
                if (this.emoteSymbol.material) {
                    this.emoteSymbol.material.dispose();
                }
                this.emoteSymbol.dispose();
            }
            
            console.log(`RemotePlayer ${this.id} disposed`);
        } catch (e) {
            console.error(`Error disposing RemotePlayer ${this.id}:`, e);
        }
    }
    
    // Regular update method called each frame
    update() {
        // Ensure character is visible
        if (this.character) {
            this.character.visibility = 1;
            this.character.isVisible = true;
            
            // Ensure nametag is visible and facing camera
            if (this.nameTag) {
                this.nameTag.visibility = 1;
                this.nameTag.isVisible = true;
                // Make sure billboard mode is working
                this.nameTag.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            }
            
            // Handle animation if needed
            if (this.isMoving) {
                // Simple animation for moving players
                const t = performance.now() * 0.005;
                const legSwing = Math.sin(t * 8) * 0.8;
                const armSwing = Math.sin(t * 8) * 0.4;
                
                if (this.character.leftLeg) this.character.leftLeg.rotation.x = legSwing;
                if (this.character.rightLeg) this.character.rightLeg.rotation.x = -legSwing;
                if (this.character.leftArm) this.character.leftArm.rotation.x = -armSwing * 0.7;
                if (this.character.rightArm) this.character.rightArm.rotation.x = armSwing * 0.7;
            }
        }
    }
    
    showCollar() {
        if (!this.collarMesh) {
            // Simple collar: red torus around neck
            this.collarMesh = BABYLON.MeshBuilder.CreateTorus('collar', {diameter: 0.5, thickness: 0.08}, this.scene);
            this.collarMesh.position = this.character.mesh.position.clone();
            this.collarMesh.position.y += 1.1; // neck height
            this.collarMesh.parent = this.character.mesh;
            this.collarMesh.material = new BABYLON.StandardMaterial('collarMat', this.scene);
            this.collarMesh.material.diffuseColor = new BABYLON.Color3(1,0,0);
        }
        this.collarMesh.isVisible = true;
    }
    hideCollar() {
        if (this.collarMesh) this.collarMesh.isVisible = false;
    }
    setAllFours(isAllFours) {
        // Simple pose: rotate body or lower height
        if (isAllFours) {
            this.character.mesh.rotation.x = Math.PI/2;
            this.character.mesh.position.y = 0.7; // lower to ground
        } else {
            this.character.mesh.rotation.x = 0;
            this.character.mesh.position.y = 1.1;
        }
    }
}