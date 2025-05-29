// Game Configuration
export const CONFIG = {
    API_URL: 'https://api.example.com', // Replace with your API
    WS_URL: (function() {
        // Use window.location to dynamically build the WebSocket URL
        let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let host = window.location.hostname;
        let port = window.location.port || '8081';
        // If running on default HTTP/HTTPS port, use 8081 for WS
        if (port === '' || port === '80' || port === '443') port = '8081';
        return protocol + '//' + host + ':' + port;
    })(),
    MOVEMENT_SPEED: 0.1,
    JUMP_FORCE: 0.2,
    CAMERA_DISTANCE: 10,
    MOBILE_THRESHOLD: 768,
    EMOTE_DURATION: 3000,
    GRAVITY: 0.006,
    PLAYER_SPEED: 0.08,
    PLAYER_HEIGHT: 1.1,
    GROUND_LEVEL: 0.6,
    WORLD_BOUNDS: 95
};

// Store items catalog
export const STORE_ITEMS = [
    {
        id: 'red-top',
        name: 'Red Top',
        category: 'clothes',
        price: 50,
        color: '#ff4444',
        type: 'shirt',
        description: 'Classic red shirt'
    },
    {
        id: 'green-top',
        name: 'Green Top',
        category: 'clothes',
        price: 75,
        color: '#44ff44',
        type: 'shirt',
        description: 'Fresh green shirt'
    },
    {
        id: 'purple-top',
        name: 'Purple Top',
        category: 'clothes',
        price: 100,
        color: '#8844ff',
        type: 'shirt',
        description: 'Royal purple shirt'
    },
    {
        id: 'orange-top',
        name: 'Orange Top',
        category: 'clothes',
        price: 60,
        color: '#ff8844',
        type: 'shirt',
        description: 'Vibrant orange shirt'
    },
    {
        id: 'pink-top',
        name: 'Pink Top',
        category: 'clothes',
        price: 80,
        color: '#ff44aa',
        type: 'shirt',
        description: 'Stylish pink shirt'
    },
    {
        id: 'cyan-top',
        name: 'Cyan Top',
        category: 'clothes',
        price: 90,
        color: '#44ffff',
        type: 'shirt',
        description: 'Cool cyan shirt'
    },
    {
        id: 'yellow-top',
        name: 'Yellow Top',
        category: 'clothes',
        price: 65,
        color: '#ffff44',
        type: 'shirt',
        description: 'Bright yellow shirt'
    },
    {
        id: 'black-top',
        name: 'Black Top',
        category: 'clothes',
        price: 120,
        color: '#222222',
        type: 'shirt',
        description: 'Sleek black shirt'
    },
    {
        id: 'white-top',
        name: 'White Top',
        category: 'clothes',
        price: 45,
        color: '#ffffff',
        type: 'shirt',
        description: 'Clean white shirt'
    }
];

// Emote mappings
export const EMOTE_MAP = {
    'wave': '👋',
    'laugh': '😂',
    'dance': '🕺',
    'heart': '❤️',
    'cry': '😢',
    'angry': '😠',
    'thumbsup': '👍',
    'thinking': '🤔'
};