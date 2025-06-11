// CreativeMode.js - Implements admin/creative mode for placing and managing objects
export class CreativeMode {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isEnabled = false;
        this.selectedObject = null;
        this.placedObjects = [];
        this.gizmo = null;
        this.gizmoManager = null;
        this.fileInput = null;
        this.gridSize = 0.5; // Default grid size for snapping
        this.isSnappingEnabled = true;
        
        // Initialize the system
        this._setupUI();
        this._setupInputHandling();
    }
    
    /**
     * Enable or disable creative mode
     * @param {boolean} value - Whether creative mode is active
     */
    setEnabled(value) {
        this.isEnabled = value;
        
        // Show/hide creative mode UI
        const panel = document.getElementById('creativeModePanel');
        if (panel) {
            panel.style.display = value ? 'block' : 'none';
        }
        
        // Show/hide creative mode button
        const button = document.getElementById('creativeModeBtn');
        if (button) {
            button.classList.toggle('active', value);
        }
        
        // Setup or dispose gizmo manager
        if (value) {
            this._setupGizmoManager();
            
            // Show notification
            this._showNotification('Creative Mode activated! Press "C" to exit');
        } else {
            this._disposeGizmoManager();
            this.deselectObject();
            
            // Show notification
            this._showNotification('Creative Mode deactivated');
        }
    }
    
    /**
     * Toggle creative mode on/off
     */
    toggle() {
        this.setEnabled(!this.isEnabled);
    }
    
    /**
     * Saves the current placed objects to localStorage
     */
    saveObjects() {
        const objectsData = this.placedObjects.map(obj => ({
            id: obj.id,
            name: obj.name,
            path: obj.path,
            position: {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z
            },
            rotation: {
                x: obj.rotation.x,
                y: obj.rotation.y,
                z: obj.rotation.z
            },
            scaling: {
                x: obj.scaling.x,
                y: obj.scaling.y,
                z: obj.scaling.z
            }
        }));
        
        localStorage.setItem('creativeMode_objects', JSON.stringify(objectsData));
        this._showNotification(`Saved ${objectsData.length} objects to localStorage`);
    }
    
    /**
     * Loads placed objects from localStorage
     */
    async loadObjects() {
        try {
            const savedData = localStorage.getItem('creativeMode_objects');
            if (!savedData) {
                this._showNotification('No saved objects found');
                return;
            }
            
            const objectsData = JSON.parse(savedData);
            this._showNotification(`Loading ${objectsData.length} objects...`);
            
            // Clear existing objects
            this.clearObjects();
            
            // Load each object
            for (const data of objectsData) {
                await this._loadModel(data.path).then(model => {
                    if (model) {
                        model.name = data.name;
                        model.id = data.id;
                        model.position = new BABYLON.Vector3(data.position.x, data.position.y, data.position.z);
                        model.rotation = new BABYLON.Vector3(data.rotation.x, data.rotation.y, data.rotation.z);
                        model.scaling = new BABYLON.Vector3(data.scaling.x, data.scaling.y, data.scaling.z);
                        
                        // Add metadata
                        model.metadata = model.metadata || {};
                        model.metadata.userPlaced = true;
                        model.metadata.creativeMode = true;
                        
                        // Make the model pickable
                        this._makePickable(model);
                        
                        // Add to placed objects
                        this.placedObjects.push(model);
                    }
                });
            }
            
            this._showNotification(`Loaded ${objectsData.length} objects successfully`);
        } catch (error) {
            console.error('Error loading objects:', error);
            this._showNotification('Error loading objects');
        }
    }
    
    /**
     * Removes all placed objects
     */
    clearObjects() {
        this.placedObjects.forEach(obj => {
            if (obj && !obj.isDisposed()) {
                obj.dispose();
            }
        });
        this.placedObjects = [];
        this._showNotification('All placed objects cleared');
    }
    
    /**
     * Toggle snap to grid feature
     */
    toggleSnapping() {
        this.isSnappingEnabled = !this.isSnappingEnabled;
        if (this.gizmoManager) {
            this.gizmoManager.positionGizmoEnabled = true;
            this.gizmoManager.positionGizmo.snapDistance = this.isSnappingEnabled ? this.gridSize : 0;
        }
        this._showNotification(`Grid snapping ${this.isSnappingEnabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Select an object to edit with gizmo
     * @param {BABYLON.Mesh} object - The object to select
     */
    selectObject(object) {
        if (!object) return;
        
        this.deselectObject();
        this.selectedObject = object;
        
        if (this.gizmoManager) {
            this.gizmoManager.attachToMesh(object);
            
            // Highlight the selected object
            const originalMaterial = object.material ? object.material.clone() : new BABYLON.StandardMaterial("selectedMat", this.scene);
            object._originalMaterial = originalMaterial;
            
            const highlightMaterial = originalMaterial.clone();
            highlightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
            object.material = highlightMaterial;
        }
    }
    
    /**
     * Deselect the currently selected object
     */
    deselectObject() {
        if (this.selectedObject) {
            // Restore original material if it exists
            if (this.selectedObject._originalMaterial) {
                this.selectedObject.material = this.selectedObject._originalMaterial;
                this.selectedObject._originalMaterial = null;
            }
            
            this.selectedObject = null;
            
            if (this.gizmoManager) {
                this.gizmoManager.attachToMesh(null);
            }
        }
    }
    
    /**
     * Handle file upload and model loading
     */
    handleFileUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.glb,.gltf';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            // Create a blob URL for the file
            const blobUrl = URL.createObjectURL(file);
            
            try {
                // Show loading notification
                this._showNotification(`Loading ${file.name}...`);
                
                // Load the model
                const result = await BABYLON.SceneLoader.ImportMeshAsync("", blobUrl, "", this.scene);
                
                // Get the root mesh
                const rootMesh = result.meshes[0];
                
                // Position in front of camera
                const forwardDirection = this.camera.getForwardRay().direction;
                const position = this.camera.position.add(forwardDirection.scale(5));
                
                // Apply grid snapping if enabled
                if (this.isSnappingEnabled) {
                    position.x = Math.round(position.x / this.gridSize) * this.gridSize;
                    position.y = Math.round(position.y / this.gridSize) * this.gridSize;
                    position.z = Math.round(position.z / this.gridSize) * this.gridSize;
                }
                
                rootMesh.position = position;
                
                // Add metadata for identification
                rootMesh.metadata = rootMesh.metadata || {};
                rootMesh.metadata.userPlaced = true;
                rootMesh.metadata.creativeMode = true;
                rootMesh.metadata.fileName = file.name;
                rootMesh.id = `userPlaced_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                rootMesh.path = blobUrl; // Store the URL for saving/loading
                
                // Make the model pickable
                this._makePickable(rootMesh);
                
                // Add to placed objects
                this.placedObjects.push(rootMesh);
                
                // Select the newly placed object
                this.selectObject(rootMesh);
                
                // Show success notification
                this._showNotification(`Loaded ${file.name}`);
            } catch (error) {
                console.error('Error loading model:', error);
                this._showNotification(`Error loading ${file.name}`);
            }
            
            // Clean up the input
            document.body.removeChild(fileInput);
        });
        
        // Trigger the file input dialog
        fileInput.click();
    }
    
    /**
     * Delete the currently selected object
     */
    deleteSelectedObject() {
        if (this.selectedObject) {
            const index = this.placedObjects.indexOf(this.selectedObject);
            if (index !== -1) {
                this.placedObjects.splice(index, 1);
            }
            
            this.selectedObject.dispose();
            this.selectedObject = null;
            
            if (this.gizmoManager) {
                this.gizmoManager.attachToMesh(null);
            }
            
            this._showNotification('Object deleted');
        }
    }
    
    /**
     * Set up the Creative Mode UI elements
     * @private
     */
    _setupUI() {
        // Create the Creative Mode panel
        const panel = document.createElement('div');
        panel.id = 'creativeModePanel';
        panel.className = 'creative-mode-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div class="creative-mode-header">
                <span>Creative Mode</span>
                <button class="close-btn" id="creativeModeCloseBtn">✕</button>
            </div>
            <div class="creative-mode-content">
                <button id="uploadModelBtn" class="creative-btn">Upload Model (.glb)</button>
                <button id="saveObjectsBtn" class="creative-btn">Save Objects</button>
                <button id="loadObjectsBtn" class="creative-btn">Load Saved Objects</button>
                <button id="clearObjectsBtn" class="creative-btn">Clear All Objects</button>
                <button id="toggleSnappingBtn" class="creative-btn">Toggle Grid Snapping</button>
                <button id="deleteObjectBtn" class="creative-btn">Delete Selected Object</button>
                <div class="creative-help">
                    <p>Press 'C' to toggle Creative Mode</p>
                    <p>Click on objects to select</p>
                    <p>Use gizmo to position objects</p>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Style the panel
        const style = document.createElement('style');
        style.textContent = `
            .creative-mode-panel {
                position: fixed;
                top: 50px;
                right: 20px;
                width: 250px;
                background-color: rgba(0, 0, 0, 0.7);
                border: 1px solid #444;
                border-radius: 5px;
                color: white;
                z-index: 1000;
            }
            .creative-mode-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #444;
            }
            .creative-mode-content {
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .creative-btn {
                padding: 8px;
                background-color: #2a2a2a;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .creative-btn:hover {
                background-color: #444;
            }
            .creative-help {
                margin-top: 10px;
                font-size: 0.8em;
                color: #ccc;
            }
            .close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
            }
            #creativeModeBtn {
                background-color: #555;
            }
            #creativeModeBtn.active {
                background-color: #f55;
            }
        `;
        document.head.appendChild(style);
        
        // Create the Creative Mode toggle button in the top bar
        const topButtonsContainer = document.querySelector('.action-buttons-top');
        if (topButtonsContainer) {
            const creativeBtn = document.createElement('button');
            creativeBtn.id = 'creativeModeBtn';
            creativeBtn.className = 'action-btn';
            creativeBtn.textContent = '🔧';
            creativeBtn.title = 'Toggle Creative Mode (C)';
            topButtonsContainer.appendChild(creativeBtn);
            
            // Add click event
            creativeBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // Add events to buttons in the panel
        document.getElementById('creativeModeCloseBtn').addEventListener('click', () => {
            this.setEnabled(false);
        });
        
        document.getElementById('uploadModelBtn').addEventListener('click', () => {
            this.handleFileUpload();
        });
        
        document.getElementById('saveObjectsBtn').addEventListener('click', () => {
            this.saveObjects();
        });
        
        document.getElementById('loadObjectsBtn').addEventListener('click', () => {
            this.loadObjects();
        });
        
        document.getElementById('clearObjectsBtn').addEventListener('click', () => {
            this.clearObjects();
        });
        
        document.getElementById('toggleSnappingBtn').addEventListener('click', () => {
            this.toggleSnapping();
        });
        
        document.getElementById('deleteObjectBtn').addEventListener('click', () => {
            this.deleteSelectedObject();
        });
    }
    
    /**
     * Set up keyboard and pointer input handling
     * @private
     */
    _setupInputHandling() {
        // Keyboard handling for creative mode toggle
        const keyHandler = (event) => {
            // Check if 'C' is pressed 
            if (event.key === 'c' || event.key === 'C') {
                this.toggle();
            }
            
            // Check for delete key when an object is selected
            if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedObject && this.isEnabled) {
                this.deleteSelectedObject();
            }
            
            // Check for escape key to deselect
            if (event.key === 'Escape' && this.selectedObject && this.isEnabled) {
                this.deselectObject();
            }
        };
        
        document.addEventListener('keydown', keyHandler);
    }
    
    /**
     * Set up the gizmo manager for object manipulation
     * @private
     */
    _setupGizmoManager() {
        // Dispose existing gizmo manager if it exists
        this._disposeGizmoManager();
        
        // Create gizmo manager
        this.gizmoManager = new BABYLON.GizmoManager(this.scene);
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.rotationGizmoEnabled = true;
        this.gizmoManager.scaleGizmoEnabled = true;
        this.gizmoManager.attachToMesh(null);
        
        // Set up snapping if enabled
        if (this.isSnappingEnabled) {
            this.gizmoManager.positionGizmo.snapDistance = this.gridSize;
            this.gizmoManager.rotationGizmo.snapDistance = Math.PI / 12; // 15 degrees
        }
    }
    
    /**
     * Dispose the gizmo manager
     * @private
     */
    _disposeGizmoManager() {
        if (this.gizmoManager) {
            this.gizmoManager.dispose();
            this.gizmoManager = null;
        }
    }
    
    /**
     * Make a mesh pickable for selection in creative mode
     * @param {BABYLON.Mesh} mesh - The mesh to make pickable
     * @private
     */
    _makePickable(mesh) {
        if (!mesh) return;
        
        // Make sure the mesh is pickable
        mesh.isPickable = true;
        
        // Create action manager if it doesn't exist
        if (!mesh.actionManager) {
            mesh.actionManager = new BABYLON.ActionManager(this.scene);
        }
        
        // Add pick action
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    // Only handle selection in creative mode
                    if (this.isEnabled) {
                        this.selectObject(mesh);
                    }
                }
            )
        );
    }
    
    /**
     * Load a model from a path
     * @param {string} path - Path to the model
     * @returns {Promise<BABYLON.Mesh>} - The loaded model
     * @private
     */
    async _loadModel(path) {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", path, "", this.scene);
            return result.meshes[0];
        } catch (error) {
            console.error('Error loading model:', error);
            return null;
        }
    }
    
    /**
     * Show a notification to the user
     * @param {string} message - The message to display
     * @private
     */
    _showNotification(message) {
        // Create or get notification element
        let notification = document.getElementById('creativeNotification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'creativeNotification';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1001';
            notification.style.transition = 'opacity 0.5s';
            document.body.appendChild(notification);
        }
        
        // Update and show the notification
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Hide after a short delay
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }
}
