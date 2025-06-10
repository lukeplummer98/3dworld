// Environment.js - Creates the game world environment
export class Environment {
    constructor(scene, useEditorScene = false) {
        this.scene = scene;
        this.collisionObjects = [];
        this.shadowGenerator = null;
        this.useEditorScene = useEditorScene; // Flag to use Babylon.js Editor scene
        this.editorSceneMeshes = []; // Store loaded meshes for cleanup/tracking
        this.spawnPoint = null; // Store the spawn point information
    }

    async create() {
        console.log(`Creating environment (useEditorScene: ${this.useEditorScene})`);
        if (this.useEditorScene) {
            // Load Babylon.js Editor scene
            return await this.loadEditorScene();
        } else {
            // Original environment creation code
            console.log("Creating original environment components...");
            
            // Clear any existing meshes to avoid duplicates
            const meshesToRemove = [];
            this.scene.meshes.forEach(mesh => {
                if (mesh.name !== 'camera') {  // Don't remove the camera
                    meshesToRemove.push(mesh);
                }
            });
            
            // Safely remove meshes
            meshesToRemove.forEach(mesh => {
                if (!mesh.isDisposed()) {
                    mesh.dispose();
                }
            });
            
            // Create new environment
            this.createGround();
            this.createTownSquare();
            this.createStoreBuilding();
            this.createDecorations();
            
            // Make sure to set up skybox and fog for original environment too
            this.setupEnvironmentFog();  // This now checks for and creates skybox if needed
            
            console.log(`Created original environment with ${this.collisionObjects.length} collision objects`);
            return this.collisionObjects;
        }
    }
    
    setShadowGenerator(shadowGenerator) {
        this.shadowGenerator = shadowGenerator;
    }
    
    // New method to load a scene from Babylon.js Editor
    async loadEditorScene() {
        console.log("Loading Babylon.js Editor scene...");

        try {
            // The path to the scene file (relative to the index.html)
            const sceneFilePath = "/scene/example.babylon";
            
            // Use SceneLoader to load the scene
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", sceneFilePath, this.scene);
            
            console.log("Scene loaded successfully:", result);
            this.editorSceneMeshes = result.meshes;
            
            // Add shadow casters if a shadow generator is available
            if (this.shadowGenerator) {
                for (const mesh of this.editorSceneMeshes) {
                    // Skip invisible meshes or specific items you don't want to cast shadows
                    if (mesh.id !== "skyBox" && mesh.visibility > 0) {
                        this.shadowGenerator.addShadowCaster(mesh);
                    }
                }
            }
            
            // Create collision objects for the loaded meshes
            this.setupCollisionsForLoadedMeshes();
            
            // Check for special objects in the loaded scene
            this.processSpecialObjects();
            
            // Configure the camera based on the imported scene
            this.configureCameraFromScene(window.game.camera);
            
            // Set up the skybox and fog for the environment
            this.setupEnvironmentFog();
            
            return this.collisionObjects;
        } catch (error) {
            console.error("Failed to load Babylon.js Editor scene:", error);
            
            // Fallback to the original environment if loading fails
            console.log("Falling back to original environment...");
            this.collisionObjects = [];
            this.createGround();
            this.createTownSquare();
            this.createStoreBuilding();
            this.createDecorations();
            return this.collisionObjects;
        }
    }
    
    // Create a skybox for the scene
    createSkybox() {
        // Create a skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000.0}, this.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", this.scene);
        skyboxMaterial.backFaceCulling = false;
        
        // Use environment texture for reflection
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/country.env", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        
        // Don't light the skybox
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        
        skybox.material = skyboxMaterial;
        
        // Make sure the skybox is rendered behind everything else
        skybox.infiniteDistance = true;
        
        return skybox;
    }
    
    // Check if the scene needs a skybox and create one if needed
    setupEnvironmentFog() {
        console.log(`Setting up environment fog and skybox for ${this.useEditorScene ? 'editor scene' : 'original environment'}`);
        
        // If we're in editor scene mode, check if we need to add our own skybox
        if (this.useEditorScene) {
            // Check if the scene already has a skybox
            const existingSkybox = this.editorSceneMeshes.find(mesh => 
                mesh.name.toLowerCase().includes('skybox') || 
                mesh.name.toLowerCase().includes('sky'));
            
            if (!existingSkybox) {
                console.log("Creating skybox for editor scene");
                this.createSkybox();
            }
            
            // Set the fog to match
            this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
            this.scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.95);
            this.scene.fogDensity = 0.001;
        } else {
            // Original environment - also create skybox if not already present
            const existingSkybox = this.scene.meshes.find(mesh => 
                mesh.name.toLowerCase().includes('skybox') || 
                mesh.name.toLowerCase().includes('sky'));
            
            if (!existingSkybox) {
                console.log("Creating skybox for original environment");
                this.createSkybox();
            }
            
            // Original environment fog settings
            this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
            this.scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.95);
            this.scene.fogStart = 20;
            this.scene.fogEnd = 100;
        }
    }
    
    // Helper method to set up collision objects for the loaded scene meshes
    setupCollisionsForLoadedMeshes() {
        for (const mesh of this.editorSceneMeshes) {
            // Skip parent nodes that don't have geometry
            if (!mesh.getIndices()) continue;
            
            // Skip invisible meshes
            if (!mesh.isVisible) continue;
            
            // Get the bounding box in world coordinates
            const boundingInfo = mesh.getBoundingInfo();
            const min = boundingInfo.boundingBox.minimumWorld;
            const max = boundingInfo.boundingBox.maximumWorld;
            
            // Determine the type of collision object based on mesh shape or name
            // This is a simplification - you might need more sophisticated detection
            const name = mesh.name.toLowerCase();
            
            if (name.includes("ground") || name.includes("floor") || name.includes("terrain")) {
                this.collisionObjects.push({
                    mesh: mesh,
                    type: 'elevatedGround',
                    minX: min.x,
                    maxX: max.x,
                    minZ: min.z,
                    maxZ: max.z,
                    height: max.y
                });
            } 
            else if (name.includes("cylinder") || name.includes("column") || name.includes("tree")) {
                const center = BABYLON.Vector3.Center(min, max);
                const radiusX = (max.x - min.x) / 2;
                const radiusZ = (max.z - min.z) / 2;
                const radius = Math.max(radiusX, radiusZ);
                
                this.collisionObjects.push({
                    mesh: mesh,
                    type: 'cylinder',
                    x: center.x,
                    z: center.z,
                    radius: radius,
                    height: max.y - min.y
                });
            }
            else {
                // Default to box collision
                this.collisionObjects.push({
                    mesh: mesh,
                    type: 'box',
                    minX: min.x,
                    maxX: max.x,
                    minZ: min.z,
                    maxZ: max.z,
                    height: max.y - min.y
                });
            }
        }
    }
    
    // Check for special objects in the loaded scene
    processSpecialObjects() {
        if (!this.editorSceneMeshes || this.editorSceneMeshes.length === 0) return;
        
        for (const mesh of this.editorSceneMeshes) {
            const name = mesh.name.toLowerCase();
            
            // Handle spawn points
            if (name.includes('spawn') || name.includes('playerstart')) {
                this.defineSpawnPoint(mesh);
            }
            
            // Handle interactive objects
            if (name.includes('interactive') || name.includes('button') || name.includes('trigger')) {
                this.makeInteractive(mesh);
            }
        }
    }
    
    // Define a spawn point for the player
    defineSpawnPoint(mesh) {
        console.log("Found spawn point:", mesh.name);
        
        // Store the spawn point information
        this.spawnPoint = {
            position: mesh.position.clone(),
            rotation: mesh.rotation ? mesh.rotation.clone() : new BABYLON.Vector3(0, 0, 0)
        };
        
        // Make it visible but semi-transparent for debugging
        const material = new BABYLON.StandardMaterial("spawnPointMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0, 1, 0);
        material.alpha = 0.3;
        mesh.material = material;
        mesh.isVisible = true;
    }
    
    // Make an object interactive
    makeInteractive(mesh) {
        console.log("Making object interactive:", mesh.name);
        
        // Make it pickable
        mesh.isPickable = true;
        
        // Highlight on hover
        const originalMaterial = mesh.material ? mesh.material.clone() : new BABYLON.StandardMaterial("interactiveMat", this.scene);
        const highlightMaterial = originalMaterial.clone();
        highlightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
        
        mesh.actionManager = new BABYLON.ActionManager(this.scene);
        
        // Hover effects
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                () => {
                    mesh.material = highlightMaterial;
                }
            )
        );
        
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                () => {
                    mesh.material = originalMaterial;
                }
            )
        );
        
        // Click action
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    console.log("Interacted with:", mesh.name);
                    // Here you can define specific actions based on object name
                    if (window.game) {
                        // Call generic interaction handler
                        if (window.game.handleInteraction) {
                            window.game.handleInteraction(mesh.name);
                        }
                    }
                }
            )
        );
    }
    
    // Get the spawn point if one was defined in the scene
    getSpawnPoint() {
        return this.spawnPoint || null;
    }
    
    createGround() {
        console.log("Creating original ground...");
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
        
        // Add shadow casting if shadow generator exists
        if (this.shadowGenerator) {
            console.log("Adding ground as shadow receiver");
            ground.receiveShadows = true;
        }
        
        // Add to collision objects for physics
        this.collisionObjects.push({
            mesh: ground,
            type: 'ground',
            height: -0.5
        });
        
        console.log("Ground created successfully");
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
    
    // Set up the game camera using the camera settings from the imported scene
    configureCameraFromScene(gameCamera) {
        // Check if we have any cameras in the imported scene
        const sceneCameras = this.scene.cameras.filter(camera => 
            camera !== gameCamera && camera.metadata && camera.metadata.editorCamera);
        
        if (sceneCameras.length > 0) {
            console.log('Found editor scene cameras:', sceneCameras.length);
            // Use the first camera as a reference
            const editorCamera = sceneCameras[0];
            
            // Apply editor camera properties to game camera
            if (gameCamera) {
                console.log('Configuring game camera from editor camera');
                
                // Copy camera settings that make sense for our game
                gameCamera.fov = editorCamera.fov;
                gameCamera.minZ = editorCamera.minZ;
                gameCamera.maxZ = editorCamera.maxZ;
                
                // We don't copy position/rotation as those will be controlled by player
                
                // Copy any custom parameters that might be in the metadata
                if (editorCamera.metadata) {
                    gameCamera.metadata = gameCamera.metadata || {};
                    gameCamera.metadata.editorSettings = editorCamera.metadata;
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    // Dispose of current environment objects
    dispose() {
        console.log("Disposing environment objects...");
        
        // Clean up editor scene meshes if they exist
        if (this.editorSceneMeshes && this.editorSceneMeshes.length > 0) {
            console.log("Disposing Editor Scene meshes...");
            // Don't dispose the root node or the scene itself
            for (let i = 1; i < this.editorSceneMeshes.length; i++) {
                try {
                    const mesh = this.editorSceneMeshes[i];
                    if (mesh && !mesh.isDisposed()) {
                        mesh.dispose();
                    }
                } catch (e) {
                    console.error("Error disposing mesh:", e);
                }
            }
            this.editorSceneMeshes = [];
        }
        
        // Also clean up original environment objects
        // Find and dispose meshes created by the original environment
        const meshesToDispose = [];
        this.scene.meshes.forEach(mesh => {
            // Identify original environment meshes by their names
            if (mesh.name === 'ground' || 
                mesh.name === 'plaza' || 
                mesh.name.includes('building') || 
                mesh.name.includes('decoration') ||
                mesh.name === 'skyBox') {
                meshesToDispose.push(mesh);
            }
        });
        
        // Dispose identified meshes
        meshesToDispose.forEach(mesh => {
            try {
                if (mesh && !mesh.isDisposed()) {
                    console.log(`Disposing original environment mesh: ${mesh.name}`);
                    mesh.dispose();
                }
            } catch (e) {
                console.error(`Error disposing mesh ${mesh.name}:`, e);
            }
        });
        
        // Clear collision objects array
        this.collisionObjects = [];
    }

}