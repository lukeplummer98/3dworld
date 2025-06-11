// Debug utilities for multiplayer issues

/**
 * Displays diagnostic information about remote players in the console
 * Call from browser console: diagnosePlayers()
 */
function diagnosePlayers() {
    if (!window.game) {
        console.error("Game instance not found in window object");
        return;
    }
    
    console.group("Multiplayer Diagnostics");
    
    // Check network connection
    if (window.game.networkManager) {
        console.log("Network Status:", 
            window.game.networkManager.connected ? "Connected" : "Disconnected");
        console.log("Connection URL:", window.game.networkManager.url);
        console.log("Player ID:", window.game.networkManager.id);
        console.log("Offline Mode:", window.game.networkManager.offlineMode);
    } else {
        console.error("Network manager not found");
    }
    
    // Count players
    const playerCount = window.game.players ? window.game.players.size : 0;
    console.log("Remote Players:", playerCount);
    
    // Log player details
    if (window.game.players && playerCount > 0) {
        console.group("Player Details");
        window.game.players.forEach((player, id) => {
            console.group(`Player ${id}`);
            if (player) {
                console.log("Name:", player.playerName);
                console.log("Position:", player.character ? 
                    formatVector(player.character.position) : "No position");
                console.log("Character Visible:", player.character ? 
                    player.character.isVisible : "No character");
                console.log("Top ID:", player.topId);
                console.log("Character Parts:", getCharacterParts(player.character));
                fixPlayerVisibility(player);
            } else {
                console.log("Player object is null or undefined");
            }
            console.groupEnd();
        });
        console.groupEnd();
    } else {
        console.log("No remote players found");
    }
    
    console.groupEnd();
    return "Diagnostics complete. Check console for results.";
}

/**
 * Format a vector for nice console output
 */
function formatVector(vector) {
    if (!vector) return "undefined";
    return `x:${vector.x.toFixed(2)}, y:${vector.y.toFixed(2)}, z:${vector.z.toFixed(2)}`;
}

/**
 * Get character parts info
 */
function getCharacterParts(character) {
    if (!character) return "No character";
    
    return {
        "head": character.head ? "present" : "missing",
        "body": character.body ? "present" : "missing",
        "leftArm": character.leftArm ? "present" : "missing",
        "rightArm": character.rightArm ? "present" : "missing",
        "leftLeg": character.leftLeg ? "present" : "missing",
        "rightLeg": character.rightLeg ? "present" : "missing"
    };
}

/**
 * Try to fix player visibility issues
 */
function fixPlayerVisibility(player) {
    if (!player || !player.character) return "No player or character to fix";
    
    // Force visibility
    player.character.visibility = 1;
    player.character.isVisible = true;
    
    // Apply to all children
    if (player.character.getChildMeshes) {
        const children = player.character.getChildMeshes();
        children.forEach(mesh => {
            mesh.visibility = 1;
            mesh.isVisible = true;
        });
        console.log(`Fixed visibility for ${children.length} child meshes`);
    }
    
    // Fix name tag
    if (player.nameTag) {
        player.nameTag.visibility = 1;
        player.nameTag.isVisible = true;
        player.nameTag.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    }
    
    return "Attempted to fix visibility";
}

/**
 * Force an update of player positions
 */
function forcePlayerUpdate() {
    if (!window.game || !window.game.players) {
        console.error("Game or players not found");
        return;
    }
    
    window.game.players.forEach((player, id) => {
        if (player && player.character) {
            // Slightly move player to trigger updates
            const pos = player.character.position.clone();
            pos.y += 0.1;
            player.updatePosition(pos.x, pos.y, pos.z);
            console.log(`Forced update for player ${id}`);
        }
    });
    
    return "Forced player updates";
}

/**
 * List all active connections from server perspective
 */
function checkServerConnections() {
    if (!window.game || !window.game.networkManager) {
        console.error("Game or network manager not found");
        return;
    }
    
    // Send a special command to server requesting connection info
    window.game.networkManager.send({
        type: 'debug',
        command: 'listConnections'
    });
    
    return "Requested server connection info";
}

/**
 * Test camera zoom functionality
 * @param {number} amount - Amount to zoom (positive = zoom out, negative = zoom in)
 */
function testZoom(amount = 1) {
    if (!window.game) {
        console.error("Game instance not found in window object");
        return;
    }
    
    window.game.zoomCamera(amount);
    return `Zoomed camera to distance: ${window.game.cameraDistance.toFixed(1)}`;
}

// Make functions available globally
window.diagnosePlayers = diagnosePlayers;
window.fixPlayerVisibility = fixPlayerVisibility;
window.forcePlayerUpdate = forcePlayerUpdate;
window.checkServerConnections = checkServerConnections;
window.testZoom = testZoom;

console.log("Multiplayer debug functions loaded. Use diagnosePlayers() to diagnose issues.");
console.log("To test zoom: testZoom(1) to zoom out, testZoom(-1) to zoom in");
