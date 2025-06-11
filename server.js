// server.js - WebSocket server for Virtual World multiplayer game
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create WebSocket server on port 8081
const wss = new WebSocket.Server({ port: 8081 });

// Store connected clients and player data
const clients = new Set();
const playerData = new Map();

console.log('WebSocket server starting...');

// Handle new connections
wss.on('connection', (ws) => {
    // Generate unique ID for this client
    ws.id = uuidv4();
    clients.add(ws);
    
    console.log(`New client connected: ${ws.id}`);
    console.log(`Current clients: ${Array.from(clients).map(c => c.id).join(', ')}`);
    
    // Create default player data
    playerData.set(ws.id, {
        id: ws.id,
        name: `Player ${ws.id.substring(0, 5)}`,
        x: 0,
        y: 1.1, // Player spawn height
        z: 0,
        rotationY: 0,
        topId: 'default-blue'
    });
    
    // Send initialization message with ID and existing players
    const initMessage = {
        type: 'init',
        id: ws.id,
        players: Array.from(playerData.entries()).map(([id, data]) => data)
    };
    ws.send(JSON.stringify(initMessage));
    
    // Broadcast join message to other clients
    const joinMessage = JSON.stringify({
        type: 'join',
        player: playerData.get(ws.id)
    });
    
    for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(joinMessage);
        }
    }
    
    // Debug: Log all player data after join
    console.log('All player data after join:', Array.from(playerData.values()));
    
    // Handle messages from this client
    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            // Debug: Log all incoming messages
            console.log(`Received message from ${ws.id}:`, parsedMessage);
            // Update player data based on message type
            if (parsedMessage.type === 'move') {
                const playerInfo = playerData.get(ws.id);
                if (playerInfo) {
                    playerInfo.x = parsedMessage.x;
                    playerInfo.y = parsedMessage.y;
                    playerInfo.z = parsedMessage.z;
                    playerInfo.rotationY = parsedMessage.rotationY || 0;
                    playerInfo.topId = parsedMessage.topId || playerInfo.topId;
                    // Debug: Log updated player info
                    console.log(`Updated player ${ws.id}:`, playerInfo);
                }
                // Broadcast move to all other clients
                const moveMessage = JSON.stringify({
                    type: 'move',
                    id: ws.id,
                    x: parsedMessage.x,
                    y: parsedMessage.y,
                    z: parsedMessage.z,
                    rotationY: parsedMessage.rotationY || 0,
                    topId: parsedMessage.topId || playerInfo.topId
                });
                for (const client of clients) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(moveMessage);
                    }
                }
            } else if (parsedMessage.type === 'debug') {
                // Handle debug commands
                if (parsedMessage.command === 'listConnections') {
                    const connectionInfo = {
                        type: 'debug',
                        command: 'connectionInfo',
                        totalConnections: clients.size,
                        playerCount: playerData.size,
                        players: Array.from(playerData.values()).map(p => ({
                            id: p.id,
                            name: p.name || `Player ${p.id.substring(0, 5)}`,
                            x: p.x,
                            y: p.y,
                            z: p.z
                        }))
                    };
                    ws.send(JSON.stringify(connectionInfo));
                    console.log('Debug connection info sent:', connectionInfo);
                }
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
        clients.delete(ws);
        playerData.delete(ws.id);
        console.log(`Client disconnected: ${ws.id}`);
        console.log(`Current clients: ${Array.from(clients).map(c => c.id).join(', ')}`);
        // Broadcast leave message
        const leaveMessage = JSON.stringify({
            type: 'leave',
            id: ws.id
        });
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(leaveMessage);
            }
        }
        // Debug: Log all player data after leave
        console.log('All player data after leave:', Array.from(playerData.values()));
    });
});

console.log('WebSocket server is running on port 8081');

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    wss.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
