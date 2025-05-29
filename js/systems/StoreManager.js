// StoreManager.js - Handles the in-game store system
import { STORE_ITEMS } from '../config.js';
import { CharacterBuilder } from '../character/CharacterBuilder.js';

export class StoreManager {
    constructor(game) {
        this.game = game;
        this.storeItems = STORE_ITEMS;
        this.selectedItem = null;
        this.ownedItems = new Set(['default-blue']);
        this.currency = 1000;
        
        this.previewScene = null;
        this.previewEngine = null;
        this.previewCamera = null;
        this.previewCharacter = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Store toggle
        document.getElementById('storeBtn').addEventListener('click', () => {
            this.toggleStore();
        });
        
        document.getElementById('storeCloseBtn').addEventListener('click', () => {
            this.toggleStore();
        });
        
        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.filterStore(category);
            });
        });
        
        // Buy button
        document.getElementById('buyButton').addEventListener('click', () => {
            if (this.selectedItem) {
                if (this.ownedItems.has(this.selectedItem.id)) {
                    this.equipItem(this.selectedItem);
                } else {
                    this.buyItem(this.selectedItem);
                }
            }
        });
    }
    
    setupPreviewScene() {
        const previewCanvas = document.getElementById('previewCanvas');
        if (!previewCanvas) return;
        
        this.previewEngine = new BABYLON.Engine(previewCanvas, true);
        this.previewScene = new BABYLON.Scene(this.previewEngine);
        this.previewScene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        // Camera
        this.previewCamera = new BABYLON.ArcRotateCamera(
            'previewCamera',
            Math.PI / 4,
            Math.PI / 3,
            8,
            new BABYLON.Vector3(0, 1, 0),
            this.previewScene
        );
        this.previewScene.activeCamera = this.previewCamera;
        
        // Lighting
        const hemiLight = new BABYLON.HemisphericLight(
            'previewHemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.previewScene
        );
        hemiLight.intensity = 0.8;
        
        const dirLight = new BABYLON.DirectionalLight(
            'previewDirLight',
            new BABYLON.Vector3(-1, -1, -1),
            this.previewScene
        );
        dirLight.intensity = 0.5;
        
        // Create preview character
        this.createPreviewCharacter();
        
        // Start render loop
        this.previewEngine.runRenderLoop(() => {
            this.previewScene.render();
            this.updatePreviewRotation();
        });
    }
    
    createPreviewCharacter() {
        if (!this.previewScene) return;
        
        this.previewCharacter = CharacterBuilder.createCharacter(
            this.previewScene,
            'previewCharacter',
            new BABYLON.Vector3(0, 0, 0)
        );
        
        CharacterBuilder.applyMaterials(
            this.previewCharacter,
            this.previewScene,
            'default-blue'
        );
    }
    
    updatePreviewRotation() {
        if (this.previewCharacter) {
            this.previewCharacter.rotation.y += 0.01;
        }
    }
    
    toggleStore() {
        const panel = document.getElementById('storePanel');
        const isOpening = panel.style.display === 'none' || panel.style.display === '';
        panel.style.display = isOpening ? 'block' : 'none';
        
        if (isOpening) {
            if (!this.previewScene) {
                this.setupPreviewScene();
            }
            this.populateStoreItems();
            this.filterStore('all');
            this.selectedItem = null;
            document.getElementById('selectedItemInfo').style.display = 'none';
            
            if (this.previewEngine) {
                this.previewEngine.resize();
            }
        }
    }
    
    populateStoreItems() {
        const container = document.getElementById('storeItems');
        container.innerHTML = '';
        
        this.storeItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `store-item ${item.category}`;
            itemElement.setAttribute('data-item-id', item.id);
            
            const isOwned = this.ownedItems.has(item.id);
            const statusText = isOwned ? 'OWNED' : `${item.price} 💰`;
            
            itemElement.innerHTML = `
                <div class="item-preview">
                    <div class="color-swatch" style="background-color: ${item.color}"></div>
                </div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${statusText}</div>
            `;
            
            if (isOwned) {
                itemElement.style.opacity = '0.7';
                itemElement.style.background = 'rgba(0, 255, 0, 0.1)';
            }
            
            itemElement.addEventListener('click', () => this.selectStoreItem(item));
            container.appendChild(itemElement);
        });
    }
    
    selectStoreItem(item) {
        document.querySelectorAll('.store-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
        if (itemElement) {
            itemElement.classList.add('selected');
        }
        
        this.selectedItem = item;
        this.updateItemPreview(item);
        this.updateSelectedItemInfo(item);
    }
    
    updateItemPreview(item) {
        if (!this.previewCharacter || item.type !== 'shirt') return;
        
        CharacterBuilder.applyMaterials(
            this.previewCharacter,
            this.previewScene,
            item.id
        );
    }
    
    updateSelectedItemInfo(item) {
        const infoContainer = document.getElementById('selectedItemInfo');
        const nameElement = document.getElementById('selectedItemName');
        const priceElement = document.getElementById('selectedItemPrice');
        const buyButton = document.getElementById('buyButton');
        
        nameElement.textContent = item.name;
        
        const isOwned = this.ownedItems.has(item.id);
        
        if (isOwned) {
            priceElement.textContent = 'OWNED';
            priceElement.style.color = '#44ff44';
            buyButton.textContent = 'Equip';
            buyButton.disabled = false;
        } else {
            priceElement.textContent = `${item.price} 💰`;
            priceElement.style.color = 'gold';
            
            if (this.currency >= item.price) {
                buyButton.textContent = 'Buy Now';
                buyButton.disabled = false;
            } else {
                buyButton.textContent = 'Not Enough Coins';
                buyButton.disabled = true;
            }
        }
        
        infoContainer.style.display = 'block';
    }
    
    buyItem(item) {
        if (this.currency >= item.price && !this.ownedItems.has(item.id)) {
            this.currency -= item.price;
            this.ownedItems.add(item.id);
            
            document.getElementById('currencyAmount').textContent = this.currency;
            
            this.populateStoreItems();
            this.updateSelectedItemInfo(item);
            this.equipItem(item);
            
            console.log(`Purchased ${item.name} for ${item.price} coins!`);
        }
    }
    
    equipItem(item) {
        if (this.ownedItems.has(item.id)) {
            // Apply to main character
            this.game.applyItemToCharacter(this.game.player, item);
            
            // Update preview
            if (this.previewCharacter) {
                CharacterBuilder.applyMaterials(
                    this.previewCharacter,
                    this.previewScene,
                    item.id
                );
            }
            
            console.log(`Equipped ${item.name}!`);
        }
    }
    
    filterStore(category) {
        const items = document.querySelectorAll('.store-item');
        items.forEach(item => {
            if (category === 'all' || item.classList.contains(category)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            }
        });
    }
    
    getCurrency() {
        return this.currency;
    }
    
    addCurrency(amount) {
        this.currency += amount;
        document.getElementById('currencyAmount').textContent = this.currency;
    }
    
    update() {
        // Update logic if needed
    }
}