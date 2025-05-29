// CharacterBuilder.js - Handles character creation and customization
export class CharacterBuilder {
    static createCharacter(scene, name = 'character', position = null) {
        const character = new BABYLON.TransformNode(name, scene);
        
        if (position) {
            character.position = position;
        } else {
            character.position = new BABYLON.Vector3(0, 1.1, 0);
        }
        
        // Character body
        const body = BABYLON.MeshBuilder.CreateBox(name + 'Body', {
            height: 2.2,
            width: 1.2,
            depth: 0.7
        }, scene);
        body.parent = character;
        body.position = new BABYLON.Vector3(0, 1.1, 0);
        
        // Head
        const head = BABYLON.MeshBuilder.CreateBox(name + 'Head', {
            size: 0.9
        }, scene);
        head.parent = body;
        head.position = new BABYLON.Vector3(0, 1.65, 0);
        
        // Left Arm
        const leftArm = BABYLON.MeshBuilder.CreateBox(name + 'LeftArm', {
            height: 1.4,
            width: 0.4,
            depth: 0.4
        }, scene);
        leftArm.parent = body;
        leftArm.position = new BABYLON.Vector3(-0.9, 0.4, 0);
        
        // Left Hand
        const leftHand = BABYLON.MeshBuilder.CreateBox(name + 'LeftHand', {
            size: 0.3
        }, scene);
        leftHand.parent = leftArm;
        leftHand.position = new BABYLON.Vector3(0, -0.85, 0);
        
        // Right Arm
        const rightArm = BABYLON.MeshBuilder.CreateBox(name + 'RightArm', {
            height: 1.4,
            width: 0.4,
            depth: 0.4
        }, scene);
        rightArm.parent = body;
        rightArm.position = new BABYLON.Vector3(0.9, 0.4, 0);
        
        // Right Hand
        const rightHand = BABYLON.MeshBuilder.CreateBox(name + 'RightHand', {
            size: 0.3
        }, scene);
        rightHand.parent = rightArm;
        rightHand.position = new BABYLON.Vector3(0, -0.85, 0);
        
        // Left Leg
        const leftLeg = BABYLON.MeshBuilder.CreateBox(name + 'LeftLeg', {
            height: 1.3,
            width: 0.45,
            depth: 0.45
        }, scene);
        leftLeg.parent = body;
        leftLeg.position = new BABYLON.Vector3(-0.35, -1.75, 0);
        
        // Left Foot
        const leftFoot = BABYLON.MeshBuilder.CreateBox(name + 'LeftFoot', {
            width: 0.45,
            height: 0.2,
            depth: 0.7
        }, scene);
        leftFoot.parent = leftLeg;
        leftFoot.position = new BABYLON.Vector3(0, -0.75, 0.15);
        
        // Right Leg
        const rightLeg = BABYLON.MeshBuilder.CreateBox(name + 'RightLeg', {
            height: 1.3,
            width: 0.45,
            depth: 0.45
        }, scene);
        rightLeg.parent = body;
        rightLeg.position = new BABYLON.Vector3(0.35, -1.75, 0);
        
        // Right Foot
        const rightFoot = BABYLON.MeshBuilder.CreateBox(name + 'RightFoot', {
            width: 0.45,
            height: 0.2,
            depth: 0.7
        }, scene);
        rightFoot.parent = rightLeg;
        rightFoot.position = new BABYLON.Vector3(0, -0.75, 0.15);
        
        // Store references for easy access
        character.body = body;
        character.head = head;
        character.leftArm = leftArm;
        character.rightArm = rightArm;
        character.leftLeg = leftLeg;
        character.rightLeg = rightLeg;
        
        return character;
    }
    
    static applyMaterials(character, scene, topId = 'default-blue') {
        // Body material (shirt)
        const bodyMat = new BABYLON.StandardMaterial(character.name + 'BodyMat', scene);
        bodyMat.diffuseColor = this.getTopColorById(topId);
        character.body.material = bodyMat;
        
        // Head and arms material (skin)
        const skinMat = new BABYLON.StandardMaterial(character.name + 'SkinMat', scene);
        skinMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.6);
        character.head.material = skinMat;
        character.leftArm.material = skinMat;
        character.rightArm.material = skinMat;
        
        // Find hands and apply skin material
        const leftHand = character.leftArm.getChildren()[0];
        const rightHand = character.rightArm.getChildren()[0];
        if (leftHand) leftHand.material = skinMat;
        if (rightHand) rightHand.material = skinMat;
        
        // Legs material (pants)
        const legMat = new BABYLON.StandardMaterial(character.name + 'LegMat', scene);
        legMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        character.leftLeg.material = legMat;
        character.rightLeg.material = legMat;
        
        // Find feet and apply leg material
        const leftFoot = character.leftLeg.getChildren()[0];
        const rightFoot = character.rightLeg.getChildren()[0];
        if (leftFoot) leftFoot.material = legMat;
        if (rightFoot) rightFoot.material = legMat;
    }
    
    static getTopColorById(topId) {
        const colors = {
            'default-blue': new BABYLON.Color3(0.2, 0.4, 0.8),
            'red-top': new BABYLON.Color3(0.8, 0.2, 0.2),
            'green-top': new BABYLON.Color3(0.2, 0.8, 0.2),
            'yellow-top': new BABYLON.Color3(0.9, 0.9, 0.2),
            'orange-top': new BABYLON.Color3(1, 0.5, 0.2),
            'pink-top': new BABYLON.Color3(1, 0.3, 0.7),
            'cyan-top': new BABYLON.Color3(0.2, 1, 1),
            'black-top': new BABYLON.Color3(0.1, 0.1, 0.1),
            'white-top': new BABYLON.Color3(0.9, 0.9, 0.9),
            'purple-top': new BABYLON.Color3(0.5, 0.2, 0.8)
        };
        return colors[topId] || colors['default-blue'];
    }
    
    static hexToColor3(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return new BABYLON.Color3(r, g, b);
    }
}