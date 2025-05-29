// NetworkManager.js - Handles all multiplayer networking
export class NetworkManager {
    constructor(url, game) {
        this.url = url;
        this.game = game;
        this.ws = null;
        this.id = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.lastUpdate = Date.now();
        this.updateInterval = 50; // Send updates every 50ms
        this.connect();
    }

    connect() {
        try {
            console.log('Attempting to connect to WebSocket:', this.url);
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected successfully');
                this.connected = true;
                this.reconnectAttempts = 0;
                // Request initialization
                this.send({ type: 'init' });
            };
            
            this.ws.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                    return;
                }
                
                this.handleMessage(data);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.connected = false;
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'init':
                this.handleInit(data);
                break;
            case 'join':
                this.handlePlayerJoin(data);
                break;
            case 'leave':
                this.handlePlayerLeave(data);
                break;
            case 'move':
                this.handlePlayerMove(data);
                break;
            case 'emote':
                this.handlePlayerEmote(data);
                break;
            case 'chat':
                this.handleChat(data);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    handleInit(data) {
        this.id = data.id;
        console.log('Initialized with ID:', this.id);
        
        // Add all existing players
        if (data.players && Array.isArray(data.players)) {
            data.players.forEach((playerData) => {
                if (playerData.id !== this.id) {
                    this.game.addRemotePlayer(playerData);
                }
            });
        }
    }

    handlePlayerJoin(data) {
        if (data.player && data.player.id !== this.id) {
            console.log('Player joined:', data.player.id);
            this.game.addRemotePlayer(data.player);
        }
    }

    handlePlayerLeave(data) {
        if (data.id) {
            console.log('Player left:', data.id);
            this.game.removeRemotePlayer(data.id);
        }
    }

    handlePlayerMove(data) {
        if (data.id && data.id !== this.id) {
            this.game.updateRemotePlayer(data);
        }
    }

    handlePlayerEmote(data) {
        if (data.id && data.id !== this.id && data.emote) {
            this.game.playRemoteEmote(data.id, data.emote);
        }
    }

    handleChat(data) {
        if (data.message) {
            this.game.addChatMessage(data.id, data.message);
        }
    }

    send(data) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    sendMove(x, y, z, topId = null, emote = null) {
        // Throttle movement updates
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = now;
        
        this.send({
            type: 'move',
            x: x,
            y: y,
            z: z,
            topId: topId,
            emote: emote
        });
    }

    sendEmote(emote) {
        this.send({
            type: 'emote',
            emote: emote
        });
    }

    sendChat(message) {
        this.send({
            type: 'chat',
            message: message
        });
    }

    update() {
        // Can be used for ping/pong or other periodic updates
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}