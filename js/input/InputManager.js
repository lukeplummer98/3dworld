// InputManager.js - Handles all input methods (keyboard, touch, gamepad)
export class InputManager {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.player = null;
        
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 35;
        
        // For pinch zoom
        this.touchStartDistance = 0;
        this.isPinching = false;
        
        this.setupKeyboard();
        this.setupMobileControls();
        this.setupActionButtons();
        this.setupZoomControls(); // Add zoom controls
        // this.setupGamepad(); // Uncomment if gamepad support needed
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    setupKeyboard() {
        // Ensure canvas can receive focus
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
        
        // Keyboard events
        const handleKeyDown = (evt) => {
            evt.preventDefault();
            if (!this.player) return;
            
            switch (evt.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    this.keys.forward = true;
                    this.player.moveForward = true;
                    break;
                case 'arrowdown':
                case 's':
                    this.keys.backward = true;
                    this.player.moveBackward = true;
                    break;
                case 'arrowleft':
                case 'a':
                    this.keys.left = true;
                    this.player.moveLeft = true;
                    break;
                case 'arrowright':
                case 'd':
                    this.keys.right = true;
                    this.player.moveRight = true;
                    break;
                case ' ':
                    this.player.jump();
                    break;
                case 'e':
                    this.player.interact();
                    break;
                case 'c':
                    // Toggle Creative Mode
                    if (this.game && this.game.toggleCreativeMode) {
                        this.game.toggleCreativeMode();
                    }
                    break;
            }
        };
        
        const handleKeyUp = (evt) => {
            evt.preventDefault();
            if (!this.player) return;
            
            switch (evt.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    this.keys.forward = false;
                    this.player.moveForward = false;
                    break;
                case 'arrowdown':
                case 's':
                    this.keys.backward = false;
                    this.player.moveBackward = false;
                    break;
                case 'arrowleft':
                case 'a':
                    this.keys.left = false;
                    this.player.moveLeft = false;
                    break;
                case 'arrowright':
                case 'd':
                    this.keys.right = false;
                    this.player.moveRight = false;
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        this.canvas.addEventListener('keydown', handleKeyDown);
        this.canvas.addEventListener('keyup', handleKeyUp);
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const joystickKnob = document.getElementById('joystickKnob');
        
        if (!joystick || !joystickKnob) return;
        
        const updateJoystickCenter = () => {
            const rect = joystick.getBoundingClientRect();
            this.joystickCenter.x = rect.left + rect.width / 2;
            this.joystickCenter.y = rect.top + rect.height / 2;
        };
        
        const handleStart = (e) => {
            e.preventDefault();
            this.joystickActive = true;
            updateJoystickCenter();
            joystick.style.opacity = '1';
        };
        
        const handleMove = (e) => {
            if (!this.joystickActive || !this.player) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - this.joystickCenter.x;
            const deltaY = touch.clientY - this.joystickCenter.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            const constrainedDistance = Math.min(distance, this.joystickRadius);
            const angle = Math.atan2(deltaY, deltaX);
            
            const knobX = Math.cos(angle) * constrainedDistance;
            const knobY = Math.sin(angle) * constrainedDistance;
            
            joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
            
            const moveX = knobX / this.joystickRadius;
            const moveY = knobY / this.joystickRadius;
            
            this.player.moveForward = moveY < -0.3;
            this.player.moveBackward = moveY > 0.3;
            this.player.moveLeft = moveX < -0.3;
            this.player.moveRight = moveX > 0.3;
        };
        
        const handleEnd = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            this.joystickActive = false;
            joystick.style.opacity = '0.8';
            
            joystickKnob.style.transform = 'translate(-50%, -50%)';
            
            if (this.player) {
                this.player.moveForward = false;
                this.player.moveBackward = false;
                this.player.moveLeft = false;
                this.player.moveRight = false;
            }
        };
        
        // Touch events
        joystick.addEventListener('touchstart', handleStart, { passive: false });
        joystick.addEventListener('touchmove', handleMove, { passive: false });
        joystick.addEventListener('touchend', handleEnd, { passive: false });
        joystick.addEventListener('touchcancel', handleEnd, { passive: false });
        
        // Mouse events for testing
        joystick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        updateJoystickCenter();
        window.addEventListener('resize', updateJoystickCenter);
    }
    
    setupActionButtons() {
        // Jump button
        document.getElementById('jumpBtn').addEventListener('click', () => {
            if (this.player) this.player.jump();
        });
        
        // Interact button
        document.getElementById('interactBtn').addEventListener('click', () => {
            if (this.player) this.player.interact();
        });
        
        // Emote button
        document.getElementById('emoteBtn').addEventListener('click', () => {
            this.game.toggleEmoteWheel();
        });
        
        // Inventory button
        document.getElementById('inventoryBtn').addEventListener('click', () => {
            this.game.toggleInventory();
        });
        
        // Map button
        document.getElementById('mapBtn').addEventListener('click', () => {
            this.game.toggleMap();
        });
        
        // Emote wheel options
        document.querySelectorAll('.emote-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const emote = e.currentTarget.getAttribute('data-emote');
                if (emote) {
                    this.game.playEmote(emote);
                }
            });
        });
        
        // Inventory close button
        document.getElementById('inventoryCloseBtn').addEventListener('click', () => {
            this.game.toggleInventory();
        });
        
        // Chat input
        const chatInput = document.getElementById('chatInput');
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                this.game.sendChatMessage(chatInput.value.trim());
                chatInput.value = '';
            }
        });
    }

    /**
     * Sets up zoom controls for both mouse wheel and touch pinch
     */
    setupZoomControls() {
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            if (!this.game) return;
            
            // Determine zoom direction based on wheel direction
            const delta = event.deltaY * 0.01; // Normalize the delta
            this.game.zoomCamera(delta);
        });
        
        // Touch pinch zoom (for mobile)
        this.canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length === 2) {
                this.isPinching = true;
                
                // Calculate initial distance between the two touch points
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                this.touchStartDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (event) => {
            if (this.isPinching && event.touches.length === 2) {
                event.preventDefault();
                
                // Calculate the current distance
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                // Calculate the pinch delta
                const delta = (this.touchStartDistance - currentDistance) * 0.01;
                this.game.zoomCamera(delta);
                
                // Update reference distance
                this.touchStartDistance = currentDistance;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (event) => {
            if (event.touches.length < 2) {
                this.isPinching = false;
            }
        }, { passive: true });
    }

    setupGamepad() {
        window.addEventListener('gamepadconnected', (evt) => {
            console.log('Gamepad connected:', evt.gamepad);
            this.gamepad = evt.gamepad;
        });
        
        window.addEventListener('gamepaddisconnected', (evt) => {
            console.log('Gamepad disconnected:', evt.gamepad);
            this.gamepad = null;
        });
    }
    
    updateGamepad() {
        if (!this.gamepad || !this.player) return;
        
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepad.index];
        
        if (gp) {
            // Left stick for movement
            const deadzone = 0.2;
            const leftX = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
            const leftY = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
            
            this.player.moveForward = leftY < -deadzone;
            this.player.moveBackward = leftY > deadzone;
            this.player.moveLeft = leftX < -deadzone;
            this.player.moveRight = leftX > deadzone;
            
            // A button for jump
            if (gp.buttons[0].pressed) {
                this.player.jump();
            }
            
            // X button for interact
            if (gp.buttons[2].pressed) {
                this.player.interact();
            }
        }
    }
    
    update() {
        if (this.gamepad) {
            this.updateGamepad();
        }
    }
}