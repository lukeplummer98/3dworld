#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Ngrok Tunnel Diagnostics${NC}"
echo "Checking ngrok status and connectivity..."
echo

# Check if ngrok process is running
ngrok_process=$(pgrep -f ngrok)
if [ -n "$ngrok_process" ]; then
    echo -e "${GREEN}✓${NC} Ngrok is running (PID: $ngrok_process)"
else
    echo -e "${RED}✗${NC} Ngrok is not running!"
    echo "  Run: ngrok start --all --config=ngrok.yml"
    exit 1
fi

# Get list of active tunnels from ngrok API
echo -e "\n${BLUE}Checking active ngrok tunnels...${NC}"
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o '[^"]*$' | while read -r line ; do
    echo -e "${GREEN}✓${NC} Active tunnel: $line"
done

# Test the connectivity to our JS files through ngrok
echo -e "\n${BLUE}Testing connectivity to critical files through ngrok...${NC}"

# Extract the web tunnel URL
WEB_TUNNEL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o '[^"]*$' | grep -v 8081 | head -1)

if [ -z "$WEB_TUNNEL" ]; then
    echo -e "${RED}✗${NC} Could not determine web tunnel URL! Is ngrok running?"
    exit 1
fi

# Test critical files
declare -a files=(
    "js/systems/CollisionManager.js"
    "js/systems/EmoteManager.js"
    "js/network/NetworkManager.js"
    "js/character/CharacterBuilder.js"
    "js/VirtualWorldGame.js"
    "js/config-external.js"
)

for file in "${files[@]}"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_TUNNEL/$file")
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} $file: Accessible (HTTP $CODE)"
    else
        echo -e "${RED}✗${NC} $file: NOT accessible (HTTP $CODE) - Check file path and permissions"
        # Try to diagnose the issue
        if [ "$CODE" = "404" ]; then
            echo "   File not found - Check path: $file"
        elif [ "$CODE" = "503" ]; then
            echo "   Service Unavailable - Ngrok may be having issues or rate limited"
        elif [ "$CODE" = "403" ]; then
            echo "   Forbidden - Check file permissions"
        fi
    fi
done

echo -e "\n${BLUE}Path Check:${NC}"
echo "Your JS files appear to be in these locations:"
find . -type f -name "*.js" | grep -E "CollisionManager|EmoteManager" | sort

echo -e "\n${YELLOW}Recommendations:${NC}"
echo "1. Ensure ngrok is properly configured and running"
echo "2. Restart ngrok: ngrok start --all --config=ngrok.yml" 
echo "3. Check if your file paths match the actual structure in the project"
echo "4. Make sure HTTP server is running on the correct port"
