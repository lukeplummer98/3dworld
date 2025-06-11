#!/bin/bash
# Multiplayer Test Script

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Multiplayer Test Script${NC}"
echo "This script will help diagnose multiplayer issues"
echo

# Check if processes are running
echo -e "${YELLOW}Checking running processes...${NC}"

# Check WebSocket server
ws_pid=$(pgrep -f "node server.js")
ws_port_8081=$(lsof -i :8081 -sTCP:LISTEN | grep -v "^COMMAND")

if [ -n "$ws_pid" ]; then
    echo -e "${GREEN}✓${NC} WebSocket server is running (PID: $ws_pid)"
elif [ -n "$ws_port_8081" ]; then
    ws_pid=$(echo "$ws_port_8081" | awk '{print $2}' | head -1)
    echo -e "${GREEN}✓${NC} WebSocket server is running on port 8081 (PID: $ws_pid)"
else
    echo -e "${RED}✗${NC} WebSocket server is NOT running!"
    echo "  Run: node server.js"
fi

# Check HTTP server
http_port_8000=$(lsof -i :8000 -sTCP:LISTEN | grep -v "^COMMAND")
http_port_9000=$(lsof -i :9000 -sTCP:LISTEN | grep -v "^COMMAND")

if [ -n "$http_port_8000" ]; then
    http_pid=$(echo "$http_port_8000" | awk '{print $2}' | head -1)
    echo -e "${GREEN}✓${NC} HTTP server is running on port 8000 (PID: $http_pid)"
elif [ -n "$http_port_9000" ]; then
    http_pid=$(echo "$http_port_9000" | awk '{print $2}' | head -1)
    echo -e "${GREEN}✓${NC} HTTP server is running on port 9000 (PID: $http_pid)"
else
    echo -e "${RED}✗${NC} HTTP server is NOT running!"
    echo "  Run: python3 -m http.server 8000 or 9000"
fi

# Check ngrok
ngrok_pid=$(pgrep -f "ngrok")
if [ -n "$ngrok_pid" ]; then
    echo -e "${GREEN}✓${NC} ngrok is running (PID: $ngrok_pid)"
    
    # Try to get ngrok tunnels
    echo
    echo -e "${YELLOW}Getting ngrok tunnel URLs...${NC}"
    tunnels=$(curl -s http://localhost:4040/api/tunnels)
    
    if [ -n "$tunnels" ]; then
        ws_url=$(echo "$tunnels" | grep -o 'https://[^"]*' | grep -i "websocket" | head -1)
        web_url=$(echo "$tunnels" | grep -o 'https://[^"]*' | grep -i "web" | head -1)
        
        if [ -n "$ws_url" ]; then
            echo -e "${GREEN}✓${NC} WebSocket URL: $ws_url"
        else
            echo -e "${RED}✗${NC} WebSocket URL not found!"
        fi
        
        if [ -n "$web_url" ]; then
            echo -e "${GREEN}✓${NC} Web URL: $web_url"
            echo -e "  External players should use: ${web_url}/external.html"
        else
            echo -e "${RED}✗${NC} Web URL not found!"
        fi
        
        # Check config file
        echo
        echo -e "${YELLOW}Checking config-external.js...${NC}"
        config=$(cat js/config-external.js)
        config_ws_url=$(echo "$config" | grep -o "WS_URL: 'wss://[^']*'" | head -1)
        
        if [ -n "$config_ws_url" ]; then
            echo -e "${GREEN}✓${NC} Found WebSocket URL in config: $config_ws_url"
            
            # Compare with current URL
            current_ws_url="WS_URL: 'wss://$(echo $ws_url | sed -e 's/https:\/\///')"
            if [[ $config_ws_url == *$current_ws_url* ]]; then
                echo -e "${GREEN}✓${NC} Config URL is up-to-date"
            else
                echo -e "${RED}✗${NC} Config URL is outdated!"
                echo "  Update js/config-external.js with: WS_URL: 'wss://$(echo $ws_url | sed -e 's/https:\/\///')"
            fi
        else
            echo -e "${RED}✗${NC} Could not find WebSocket URL in config!"
        fi
    else
        echo -e "${RED}✗${NC} Could not get ngrok tunnels. Make sure ngrok is running correctly."
    fi
else
    echo -e "${RED}✗${NC} ngrok is NOT running!"
    echo "  Run: ngrok start --all --config=ngrok.yml"
fi

echo
echo -e "${YELLOW}Debug Instructions:${NC}"
echo "1. Open the browser console (F12) on both local and external browsers"
echo "2. Type 'diagnosePlayers()' in the console to see debug information"
echo "3. Type 'forcePlayerUpdate()' to try to fix visibility issues"
echo "4. Type 'checkServerConnections()' to see all connected clients"

echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Make sure both local and external players can connect"
echo "2. Move around to generate position updates"
echo "3. Check the server console output for activity"
echo "4. If players are still invisible, try refreshing both browsers"
