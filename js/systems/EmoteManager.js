// EmoteManager.js - Handles all emote animations and symbols
import { CONFIG, EMOTE_MAP } from '../config.js';

export class EmoteManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEmotes = new Map();
    }
    
    playEmoteForCharacter(character, emote) {
        // Clear any existing emote
        this.stopEmoteForCharacter(character);
        
        // Create emote symbol
        const symbol = this.createEmoteSymbol(character, emote);
        
        // Start animation
        this.startEmoteAnimation(character, emote);
        
        // Store active emote
        this.activeEmotes.set(character, {
            emote: emote,
            symbol: symbol,
            startTime: performance.now()
        });
        
        // Auto-stop after duration
        setTimeout(() => {
            this.stopEmoteForCharacter(character);
        }, CONFIG.EMOTE_DURATION);
    }
    
    createEmoteSymbol(character, emote) {
        const emoji = EMOTE_MAP[emote] || '😊';
        
        // Create plane for emoji
        const symbolPlane = BABYLON.MeshBuilder.CreatePlane(
            'emoteSymbol',
            { size: 1.5 },
            this.scene
        );
        symbolPlane.position = new BABYLON.Vector3(0, 4.5, 0);
        symbolPlane.parent = character;
        symbolPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Create dynamic texture
        const dynamicTexture = new BABYLON.DynamicTexture(
            'emoteTexture',
            { width: 256, height: 256 },
            this.scene
        );
        dynamicTexture.hasAlpha = true;
        
        // Draw emoji
        const ctx = dynamicTexture.getContext();
        ctx.clearRect(0, 0, 256, 256);
        ctx.font = '180px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 128, 128);
        dynamicTexture.update();
        
        // Create material
        const symbolMaterial = new BABYLON.StandardMaterial('emoteMaterial', this.scene);
        symbolMaterial.diffuseTexture = dynamicTexture;
        symbolMaterial.disableLighting = true;
        symbolMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        symbolPlane.material = symbolMaterial;
        
        // Animate appearance
        this.animateSymbolAppearance(symbolPlane);
        
        return symbolPlane;
    }
    
    animateSymbolAppearance(symbol) {
        // Start small and scale up
        symbol.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
        
        BABYLON.Animation.CreateAndStartAnimation(
            'emoteScale',
            symbol,
            'scaling',
            30,
            15,
            new BABYLON.Vector3(0.1, 0.1, 0.1),
            new BABYLON.Vector3(1, 1, 1),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Add floating animation
        setTimeout(() => {
            if (symbol && !symbol.isDisposed()) {
                const baseY = symbol.position.y;
                const floatAnimation = () => {
                    if (!symbol.isDisposed()) {
                        const time = performance.now() * 0.003;
                        symbol.position.y = baseY + Math.sin(time) * 0.2;
                        requestAnimationFrame(floatAnimation);
                    }
                };
                floatAnimation();
            }
        }, 500);
    }
    
    startEmoteAnimation(character, emote) {
        const leftArm = character.leftArm;
        const rightArm = character.rightArm;
        const head = character.head;
        const leftLeg = character.leftLeg;
        const rightLeg = character.rightLeg;
        
        switch(emote) {
            case 'wave':
                this.animateWave(rightArm);
                break;
            case 'dance':
                this.animateDance(leftArm, rightArm, leftLeg, rightLeg);
                break;
            case 'thumbsup':
                this.animateThumbsUp(rightArm);
                break;
            case 'thinking':
                this.animateThinking(rightArm, head);
                break;
            case 'heart':
                this.animateHeart(leftArm, rightArm);
                break;
            case 'laugh':
                this.animateLaugh(head, leftArm, rightArm);
                break;
            case 'cry':
                this.animateCry(head, leftArm, rightArm);
                break;
            case 'angry':
                this.animateAngry(leftArm, rightArm);
                break;
        }
    }
    
    animateWave(rightArm) {
        if (!rightArm) return;
        
        BABYLON.Animation.CreateAndStartAnimation(
            'waveArm',
            rightArm,
            'rotation.z',
            30,
            90,
            0,
            Math.PI * 2,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        BABYLON.Animation.CreateAndStartAnimation(
            'waveArmX',
            rightArm,
            'rotation.x',
            30,
            60,
            0,
            -Math.PI / 3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
    }
    
    animateDance(leftArm, rightArm, leftLeg, rightLeg) {
        if (leftArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'danceLeftArm',
                leftArm,
                'rotation.z',
                30,
                90,
                0,
                Math.PI / 2,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
        
        if (rightArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'danceRightArm',
                rightArm,
                'rotation.z',
                30,
                90,
                0,
                -Math.PI / 2,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
        
        if (leftLeg) {
            BABYLON.Animation.CreateAndStartAnimation(
                'danceLeftLeg',
                leftLeg,
                'rotation.x',
                30,
                45,
                0,
                Math.PI / 6,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
        
        if (rightLeg) {
            BABYLON.Animation.CreateAndStartAnimation(
                'danceRightLeg',
                rightLeg,
                'rotation.x',
                30,
                45,
                0,
                -Math.PI / 6,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
    }
    
    animateThumbsUp(rightArm) {
        if (!rightArm) return;
        
        BABYLON.Animation.CreateAndStartAnimation(
            'thumbsUpArm',
            rightArm,
            'rotation',
            30,
            60,
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, Math.PI / 2, -Math.PI / 2),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    }
    
    animateThinking(rightArm, head) {
        if (rightArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'thinkingArm',
                rightArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-Math.PI / 2, 0, Math.PI / 4),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
        
        if (head) {
            BABYLON.Animation.CreateAndStartAnimation(
                'thinkingHead',
                head,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(0, Math.PI / 8, Math.PI / 16),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
    }
    
    animateHeart(leftArm, rightArm) {
        if (leftArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'heartLeftArm',
                leftArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-Math.PI / 3, 0, Math.PI / 4),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
        
        if (rightArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'heartRightArm',
                rightArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-Math.PI / 3, 0, -Math.PI / 4),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
    }
    
    animateLaugh(head, leftArm, rightArm) {
        if (head) {
            BABYLON.Animation.CreateAndStartAnimation(
                'laughHead',
                head,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-Math.PI / 8, 0, 0),
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
        
        if (leftArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'laughLeftArm',
                leftArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(0, 0, Math.PI / 6),
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
        
        if (rightArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'laughRightArm',
                rightArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(0, 0, -Math.PI / 6),
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
    }
    
    animateCry(head, leftArm, rightArm) {
        if (head) {
            BABYLON.Animation.CreateAndStartAnimation(
                'cryHead',
                head,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(Math.PI / 8, 0, 0),
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
        }
        
        if (leftArm && rightArm) {
            // Hands to face animation
            BABYLON.Animation.CreateAndStartAnimation(
                'cryLeftArm',
                leftArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-Math.PI / 2, 0, Math.PI / 6),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            
            BABYLON.Animation.CreateAndStartAnimation(
                'cryRightArm',
                rightArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-Math.PI / 2, 0, -Math.PI / 6),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
    }
    
    animateAngry(leftArm, rightArm) {
        if (leftArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'angryLeftArm',
                leftArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(Math.PI / 6, 0, -Math.PI / 4),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
        
        if (rightArm) {
            BABYLON.Animation.CreateAndStartAnimation(
                'angryRightArm',
                rightArm,
                'rotation',
                30,
                60,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(Math.PI / 6, 0, Math.PI / 4),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
    }
    
    stopEmoteForCharacter(character) {
        const emoteData = this.activeEmotes.get(character);
        if (emoteData) {
            // Dispose symbol
            if (emoteData.symbol && !emoteData.symbol.isDisposed()) {
                emoteData.symbol.dispose();
            }
            
            // Reset character pose
            this.resetCharacterPose(character);
            
            // Remove from active emotes
            this.activeEmotes.delete(character);
        }
    }
    
    resetCharacterPose(character) {
        const resetRotation = new BABYLON.Vector3(0, 0, 0);
        
        if (character.leftArm) character.leftArm.rotation = resetRotation.clone();
        if (character.rightArm) character.rightArm.rotation = resetRotation.clone();
        if (character.head) character.head.rotation = resetRotation.clone();
        if (character.leftLeg) character.leftLeg.rotation = resetRotation.clone();
        if (character.rightLeg) character.rightLeg.rotation = resetRotation.clone();
    }
    
    update() {
        // Update floating animations for active emotes
        this.activeEmotes.forEach((emoteData, character) => {
            if (emoteData.symbol && !emoteData.symbol.isDisposed()) {
                const time = performance.now() * 0.003;
                const baseY = 4.5;
                const floatAmount = Math.sin(time) * 0.2;
                emoteData.symbol.position.y = baseY + floatAmount;
            }
        });
    }
}