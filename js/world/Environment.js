// Environment.js - Creates the game world environment
export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.collisionObjects = [];
        this.shadowGenerator = null;
    }

    async create() {
        this.createGround();
        this.createTownSquare();
        this.createStoreBuilding();
        this.createDecorations();
        return this.collisionObjects;
    }
    
    setShadowGenerator(shadowGenerator) {
        this.shadowGenerator = shadowGenerator;
    }
    
    createGround() {
        const ground = BABYLON.MeshBuilder.CreateGround('ground', {
            width: 200,
            height: 200,
            subdivisions: 32
        }, this.scene);
        
        ground.position.y = -0.5;
        
        const grassMaterial = new BABYLON.StandardMaterial('grassMat', this.scene);
        grassMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.3);
        grassMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        ground.material = grassMaterial;
        ground.receiveShadows = true;
    }
    
    createTownSquare() {
        // Plaza floor
        const plaza = BABYLON.MeshBuilder.CreateBox('plaza', {
            width: 40,
            height: 0.5,
            depth: 40
        }, this.scene);
        plaza.position.y = 0.25;
        
        const plazaMat = new BABYLON.StandardMaterial('plazaMat', this.scene);
        plazaMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        plaza.material = plazaMat;
        
        this.collisionObjects.push({
            mesh: plaza,
            type: 'elevatedGround',
            minX: plaza.position.x - 20,
            maxX: plaza.position.x + 20,
            minZ: plaza.position.z - 20,
            maxZ: plaza.position.z + 20,
            height: 0.5
        });
        
        // Fountain
        const fountain = BABYLON.MeshBuilder.CreateCylinder('fountain', {
            diameter: 8,
            height: 0.5
        }, this.scene);
        fountain.position.y = 0.5;
        
        const fountainMat = new BABYLON.StandardMaterial('fountainMat', this.scene);
        fountainMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.7);
        fountain.material = fountainMat;
        
        this.collisionObjects.push({
            mesh: fountain,
            type: 'cylinder',
            x: fountain.position.x,
            z: fountain.position.z,
            radius: 4,
            height: fountain.position.y + 0.25
        });
        
        // Water effect
        const water = BABYLON.MeshBuilder.CreateDisc('water', {
            radius: 3.5
        }, this.scene);
        water.rotation.x = Math.PI / 2;
        water.position.y = 0.8;
        
        const waterMat = new BABYLON.StandardMaterial('waterMat', this.scene);
        waterMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.8);
        waterMat.alpha = 0.8;
        water.material = waterMat;
    }
    
    createStoreBuilding() {
        // Main building
        const store = BABYLON.MeshBuilder.CreateBox('store', {
            width: 20,
            height: 15,
            depth: 15
        }, this.scene);
        store.position = new BABYLON.Vector3(30, 7.5, 0);
        
        const storeMat = new BABYLON.StandardMaterial('storeMat', this.scene);
        storeMat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.7);
        store.material = storeMat;
        
        this.collisionObjects.push({
            mesh: store,
            type: 'box',
            minX: store.position.x - 10,
            maxX: store.position.x + 10,
            minZ: store.position.z - 7.5,
            maxZ: store.position.z + 7.5,
            height: 15
        });
        
        // Store sign
        const sign = BABYLON.MeshBuilder.CreateBox('storeSign', {
            width: 15,
            height: 3,
            depth: 0.5
        }, this.scene);
        sign.position = new BABYLON.Vector3(30, 12, -7.8);
        
        const signMat = new BABYLON.StandardMaterial('signMat', this.scene);
        signMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
        signMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0);
        sign.material = signMat;
        
        // Windows
        for (let i = 0; i < 3; i++) {
            const window = BABYLON.MeshBuilder.CreateBox('window' + i, {
                width: 3,
                height: 3,
                depth: 0.1
            }, this.scene);
            window.position = new BABYLON.Vector3(25 + i * 5, 8, -7.6);
            
            const windowMat = new BABYLON.StandardMaterial('windowMat' + i, this.scene);
            windowMat.diffuseColor = new BABYLON.Color3(0.5, 0.7, 1);
            windowMat.alpha = 0.7;
            window.material = windowMat;
        }
        
        // Door
        const door = BABYLON.MeshBuilder.CreateBox('door', {
            width: 4,
            height: 6,
            depth: 0.5
        }, this.scene);
        door.position = new BABYLON.Vector3(30, 3, -7.5);
        
        const doorMat = new BABYLON.StandardMaterial('doorMat', this.scene);
        doorMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
        door.material = doorMat;
        
        // Make door interactive
        door.isPickable = true;
        door.actionManager = new BABYLON.ActionManager(this.scene);
        door.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    if (window.game) {
                        window.game.toggleStore();
                    }
                }
            )
        );
    }
    
    createDecorations() {
        // Trees
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 50 + Math.random() * 30;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            this.createTree(x, z);
        }
        
        // Benches
        for (let i = 0; i < 4; i++) {
            const bench = BABYLON.MeshBuilder.CreateBox('bench' + i, {
                width: 4,
                height: 1,
                depth: 1.5
            }, this.scene);
            
            const angle = (i / 4) * Math.PI * 2;
            bench.position = new BABYLON.Vector3(
                Math.cos(angle) * 15,
                0.5,
                Math.sin(angle) * 15
            );
            bench.rotation.y = angle;
            
            const benchMat = new BABYLON.StandardMaterial('benchMat' + i, this.scene);
            benchMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.2);
            bench.material = benchMat;
            
            this.collisionObjects.push({
                mesh: bench,
                type: 'box',
                minX: bench.position.x - 2,
                maxX: bench.position.x + 2,
                minZ: bench.position.z - 0.75,
                maxZ: bench.position.z + 0.75,
                height: 1
            });
        }
        
        // Lamp posts
        for (let i = 0; i < 6; i++) {
            const lampPost = BABYLON.MeshBuilder.CreateCylinder('lampPost' + i, {
                diameter: 0.5,
                height: 8
            }, this.scene);
            
            const angle = (i / 6) * Math.PI * 2;
            lampPost.position = new BABYLON.Vector3(
                Math.cos(angle) * 25,
                4,
                Math.sin(angle) * 25
            );
            
            const lampMat = new BABYLON.StandardMaterial('lampMat' + i, this.scene);
            lampMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            lampPost.material = lampMat;
            
            this.collisionObjects.push({
                mesh: lampPost,
                type: 'cylinder',
                x: lampPost.position.x,
                z: lampPost.position.z,
                radius: 0.3,
                height: 8
            });
            
            // Lamp light
            const lamp = BABYLON.MeshBuilder.CreateSphere('lamp' + i, {
                diameter: 1.5
            }, this.scene);
            lamp.position = lampPost.position.clone();
            lamp.position.y = 8;
            
            const lampLightMat = new BABYLON.StandardMaterial('lampLightMat' + i, this.scene);
            lampLightMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.7);
            lamp.material = lampLightMat;
            
            // Point light
            const pointLight = new BABYLON.PointLight('lampLight' + i, lamp.position, this.scene);
            pointLight.intensity = 0.5;
            pointLight.range = 15;
            pointLight.diffuse = new BABYLON.Color3(1, 0.9, 0.7);
        }
    }
    
    createTree(x, z) {
        // Trunk
        const trunk = BABYLON.MeshBuilder.CreateCylinder('trunk', {
            diameter: 1,
            height: 4
        }, this.scene);
        trunk.position = new BABYLON.Vector3(x, 2, z);
        
        const trunkMat = new BABYLON.StandardMaterial('trunkMat', this.scene);
        trunkMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        trunk.material = trunkMat;
        
        this.collisionObjects.push({
            mesh: trunk,
            type: 'cylinder',
            x: x,
            z: z,
            radius: 0.6,
            height: 4
        });
        
        // Leaves
        const leaves = BABYLON.MeshBuilder.CreateSphere('leaves', {
            diameter: 6
        }, this.scene);
        leaves.position = new BABYLON.Vector3(x, 5, z);
        leaves.scaling = new BABYLON.Vector3(1, 0.8, 1);
        
        const leavesMat = new BABYLON.StandardMaterial('leavesMat', this.scene);
        leavesMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
        leaves.material = leavesMat;
        
        // Add shadow casting
        if (this.shadowGenerator) {
            this.shadowGenerator.addShadowCaster(trunk);
            this.shadowGenerator.addShadowCaster(leaves);
        }
    }
}