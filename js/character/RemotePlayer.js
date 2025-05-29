// RemotePlayer.js - Manages remote player characters
import { CharacterBuilder } from './CharacterBuilder.js';

export class RemotePlayer {
    constructor(id, scene, playerData) {
        this.id = id;
        this.scene = scene;
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
        
        // Emote system
        this.currentEmote = null;
        this.emoteSymbol = null;
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
        
        const texture = new BABYLON.DynamicTexture(
            'nameTexture' + this.id,
            { width: 256, height: 64 },
            this.scene
        );
        texture.hasAlpha = true;
        
        const ctx = texture.getContext();
        ctx.clearRect(0, 0, 256, 64);
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText('Player ' + this.id, 128, 32);
        texture.update();
        
        nameMat.diffuseTexture = texture;
        nameTag.material = nameMat;
        
        this.nameTag = nameTag;
    }
    
    updatePosition(x, y, z) {
        this.targetPosition = new BABYLON.Vector3(x, y, z);
        
        // Check if moving
        const distance = BABYLON.Vector3.Distance(this.character.position, this.targetPosition);
        this.isMoving = distance > 0.1;
        
        // Update rotation to face movement direction
        if (this.isMoving) {
            const direction = this.targetPosition.subtract(this.character.position);
            if (direction.length() > 0.1) {
                const targetYaw = Math.atan2(direction.x, direction.z);
                this.character.rotation.y = BABYLON.Scalar.LerpAngle(
                    this.character.rotation.y,
                    targetYaw,
                    0.15
                );
            }
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
        if (this.character) {
            this.character.dispose();
        }
        if (this.nameTag) {
            this.nameTag.dispose();
        }
        if (this.emoteSymbol) {
            this.emoteSymbol.dispose();
        }
    }
}