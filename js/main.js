// main.js - Entry point for the Virtual World game
import { VirtualWorldGame } from './VirtualWorldGame.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    const game = new VirtualWorldGame();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    console.log('Virtual World Game initialized');
});