#!/bin/bash
# quick-restart.sh - Script to quickly restart all multiplayer services

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Quick Restart of All Multiplayer Services${NC}"

# Kill existing processes
echo -e "Stopping existing services..."
pgrep -f "node server.js" | xargs kill -9 2>/dev/null
pgrep -f "node server-web.js" | xargs kill -9 2>/dev/null
pgrep -f "python.*http.server" | xargs kill -9 2>/dev/null
pgrep -f "ngrok" | xargs kill -9 2>/dev/null
sleep 2

# Start WebSocket server
echo -e "Starting WebSocket server..."
node server.js > ws-server.log 2>&1 &
sleep 1

# Try starting CORS-enabled web server first
echo -e "Starting CORS-enabled web server..."
node server-web.js > web-server.log 2>&1 &
sleep 1

# Start ngrok
echo -e "Starting ngrok tunnels..."
ngrok start --all --config=ngrok.yml > ngrok.log 2>&1 &
sleep 5

# Get ngrok URLs
echo -e "\n${GREEN}Ngrok Tunnel URLs:${NC}"
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o '[^"]*$'

echo -e "\nAll services restarted!"
echo -e "Open ${GREEN}http://localhost:8000${NC} for local access"
echo -e "\nCheck these log files if you encounter issues:"
echo -e "WebSocket server log: ${YELLOW}ws-server.log${NC}"
echo -e "Web server log: ${YELLOW}web-server.log${NC}"
echo -e "Ngrok log: ${YELLOW}ngrok.log${NC}"
