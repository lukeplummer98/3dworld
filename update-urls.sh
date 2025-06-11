#!/bin/bash
# update-urls.sh - Update URLs in config files and documentation

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Updating URLs in configuration files...${NC}"

# Get current ngrok tunnel URLs
echo -e "${BLUE}Fetching current ngrok tunnel URLs...${NC}"
WEB_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https:[^"]*' | grep -o 'https:[^"]*' | grep -v '8081' | head -1)
WS_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https:[^"]*' | grep -o 'https:[^"]*' | grep '8081' | head -1)

if [ -z "$WEB_URL" ] || [ -z "$WS_URL" ]; then
    echo -e "Error: Could not determine ngrok URLs. Is ngrok running?"
    exit 1
fi

# Convert HTTPS to WSS for WebSocket URL
WS_URL_SECURE=${WS_URL/https/wss}

echo -e "Web URL: ${GREEN}$WEB_URL${NC}"
echo -e "WebSocket URL: ${GREEN}$WS_URL_SECURE${NC}"

# Update config-external.js
echo -e "\n${BLUE}Updating config-external.js...${NC}"
sed -i '' "s|'wss://[^']*'|'$WS_URL_SECURE'|g" js/config-external.js
echo -e "${GREEN}✓${NC} Updated WebSocket URL in config-external.js"

# Update FRIEND_INSTRUCTIONS.md
echo -e "\n${BLUE}Updating FRIEND_INSTRUCTIONS.md...${NC}"
sed -i '' "s|https://[^/]*/external.html|$WEB_URL/external.html|g" FRIEND_INSTRUCTIONS.md
sed -i '' "s|https://[^/]*/test-paths.html|$WEB_URL/test-paths.html|g" FRIEND_INSTRUCTIONS.md
echo -e "${GREEN}✓${NC} Updated URLs in FRIEND_INSTRUCTIONS.md"

# Update test-paths.html
if [ -f test-paths.html ]; then
    echo -e "\n${BLUE}Updating test-paths.html...${NC}"
    sed -i '' "s|wss://[^']*'|$WS_URL_SECURE'|g" test-paths.html
    echo -e "${GREEN}✓${NC} Updated WebSocket URL in test-paths.html"
fi

echo -e "\n${GREEN}All URLs have been updated!${NC}"
echo -e "Your friend should use: ${GREEN}$WEB_URL/external.html${NC}"
