// main-external.js - Entry point for external players via ngrok
import { VirtualWorldGame } from './VirtualWorldGame.js';
import { CONFIG as EXTERNAL_CONFIG } from './config-external.js';

// Override default config with external config
// This needs to happen before the VirtualWorldGame is instantiated
window.CONFIG = EXTERNAL_CONFIG;
console.log('Using external configuration for multiplayer via ngrok');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance with external config
    const game = new VirtualWorldGame();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    // Add connection status indicator to UI
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connection-status';
    connectionStatus.innerHTML = '⚠️ Connecting to server...';
    connectionStatus.style.position = 'fixed';
    connectionStatus.style.bottom = '10px';
    connectionStatus.style.right = '10px';
    connectionStatus.style.backgroundColor = 'rgba(0,0,0,0.7)';
    connectionStatus.style.color = '#ffcc00';
    connectionStatus.style.padding = '8px';
    connectionStatus.style.borderRadius = '4px';
    connectionStatus.style.zIndex = '1000';
    document.body.appendChild(connectionStatus);
    
    // Create global helper function for players
    window.forcePlayerUpdate = () => {
        try {
            if (window.game && window.game.networkManager) {
                console.log('Forcing player update...');
                // Send a position update to the server
                window.game.networkManager.sendPlayerUpdate();
                // Request a fresh player list
                window.game.networkManager.requestPlayerList();
                return 'Player update initiated. Check for other players now.';
            } else {
                return 'Game or network manager not initialized yet.';
            }
        } catch (e) {
            console.error('Error in forcePlayerUpdate:', e);
            return 'Error: ' + e.message;
        }
    };
    
    // Monitor connection status
    if (game.networkManager) {
        const checkConnectionStatus = setInterval(() => {
            if (!game.networkManager) return;
            
            if (game.networkManager.connected) {
                connectionStatus.innerHTML = '✅ Connected to server';
                connectionStatus.style.color = '#00ff00';
                // Stop checking once connected
                clearInterval(checkConnectionStatus);
                
                // Hide after 5 seconds
                setTimeout(() => {
                    connectionStatus.style.opacity = '0';
                    connectionStatus.style.transition = 'opacity 1s';
                }, 5000);
            } else if (game.networkManager.reconnectAttempts > 3) {
                connectionStatus.innerHTML = '❌ Connection failed';
                connectionStatus.style.color = '#ff0000';
            }
        }, 1000);
    }
    
    console.log('Virtual World Game initialized (External)');
});
