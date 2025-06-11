#!/bin/bash
# restart-mp.sh - Restart all multiplayer services

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Multiplayer Services Restart =====${NC}"

# Kill any existing servers
echo -e "${BLUE}Stopping existing services...${NC}"

# Find and kill WebSocket server
ws_pid=$(pgrep -f "node server.js")
if [ -n "$ws_pid" ]; then
    echo "Stopping WebSocket server (PID: $ws_pid)..."
    kill $ws_pid
fi

# Find and kill Web server
http_pid=$(pgrep -f "node server-web.js")
if [ -n "$http_pid" ]; then
    echo "Stopping Web server (PID: $http_pid)..."
    kill $http_pid
fi
python_pid=$(pgrep -f "python3 -m http.server")
if [ -n "$python_pid" ]; then
    echo "Stopping Python HTTP server (PID: $python_pid)..."
    kill $python_pid
fi

# Determine if ngrok needs restart
ngrok_pid=$(pgrep -f "ngrok")
if [ -n "$ngrok_pid" ]; then
    echo "Stopping ngrok (PID: $ngrok_pid)..."
    kill $ngrok_pid
fi

echo "Waiting for ports to be released..."
sleep 2

# Start WebSocket server
echo -e "\n${BLUE}Starting WebSocket server...${NC}"
node server.js > ws-server.log 2>&1 &
ws_pid=$!
echo "WebSocket server started with PID: $ws_pid"

# Start Web server
echo -e "\n${BLUE}Starting Web server...${NC}"
node server-web.js > web-server.log 2>&1 &
web_pid=$!
echo "Web server started with PID: $web_pid"

# Start ngrok
echo -e "\n${BLUE}Starting ngrok tunnels...${NC}"
ngrok start --all --config=ngrok.yml > ngrok.log 2>&1 &
ngrok_pid=$!
echo "Ngrok started with PID: $ngrok_pid"

echo -e "${GREEN}Services started! Checking status in 5 seconds...${NC}"
sleep 5

# Check services
echo -e "\n${BLUE}Checking service status:${NC}"
if kill -0 $ws_pid 2>/dev/null; then
    echo -e "${GREEN}✓${NC} WebSocket server is running"
else
    echo -e "${RED}✗${NC} WebSocket server failed to start! Check ws-server.log"
fi

if kill -0 $web_pid 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Web server is running"
else
    echo -e "${RED}✗${NC} Web server failed to start! Check web-server.log"
fi

if kill -0 $ngrok_pid 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Ngrok is running"
    
    # Extract the ngrok URLs
    sleep 2  # Give ngrok time to establish connections and API
    echo -e "\n${BLUE}Ngrok tunnel URLs:${NC}"
    
    # Try to get URLs from ngrok API
    if command -v curl &> /dev/null; then
        curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o '[^"]*$' | while read -r line ; do
            if [[ $line == *"8081"* ]] || [[ $line == *"ws"* ]]; then
                echo -e "${GREEN}WebSocket:${NC} $line"
                
                # Update config-external.js with WebSocket URL
                if [[ $line == wss://* ]]; then
                    # Replace the WS_URL in config-external.js
                    sed -i '' -E "s#(WS_URL: ')[^']+'#\1$line'#g" js/config-external.js
                    echo -e "${GREEN}✓${NC} Updated config-external.js with WebSocket URL"
                fi
            else
                echo -e "${GREEN}Web:${NC} $line"
                
                # Update FRIEND_INSTRUCTIONS.md with Web URL
                web_url="$line/external.html"
                sed -i '' -E "s#(https://)[^/]+(/external.html)#\1$(echo $line | sed 's#https://##')\2#g" FRIEND_INSTRUCTIONS.md
                echo -e "${GREEN}✓${NC} Updated FRIEND_INSTRUCTIONS.md with Web URL"
            fi
        done
    else
        echo -e "${YELLOW}curl not found. Can't automatically extract ngrok URLs.${NC}"
        echo "Check the ngrok dashboard at http://localhost:4040/"
    fi
else
    echo -e "${RED}✗${NC} Ngrok failed to start! Check ngrok.log"
fi

echo -e "\n${YELLOW}Done! Log files:${NC}"
echo "- WebSocket server: ws-server.log"
echo "- Web server: web-server.log" 
echo "- Ngrok: ngrok.log"

echo -e "\n${GREEN}Your multiplayer game should now be accessible to external players!${NC}"
