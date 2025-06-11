#!/bin/bash
# test-external-paths.sh - Test if all required files are accessible through ngrok

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing External Access to Game Files${NC}"

# Get current ngrok web tunnel URL
WEB_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https:[^"]*' | grep -o 'https:[^"]*' | grep -v '8081' | head -1)

if [ -z "$WEB_URL" ]; then
    echo -e "${RED}Error: Could not determine ngrok web URL. Is ngrok running?${NC}"
    exit 1
fi

echo -e "Using ngrok URL: ${GREEN}$WEB_URL${NC}\n"

# Files to test
declare -a files=(
    "js/physics/CollisionManager.js"
    "js/systems/EmoteManager.js"
    "js/network/NetworkManager.js"
    "js/character/CharacterBuilder.js"
    "js/VirtualWorldGame.js"
    "js/config-external.js"
    "external.html"
    "index.html"
    "styles/main.css"
)

# Test each file
echo -e "${BLUE}Testing accessibility of required files:${NC}"
for file in "${files[@]}"; do
    # Construct full URL
    url="$WEB_URL/$file"
    
    # Test URL
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓${NC} $file: Accessible (HTTP 200)"
    else
        echo -e "${RED}✗${NC} $file: Not accessible (HTTP $response)"
        
        # Suggest fix for 404
        if [ "$response" == "404" ]; then
            echo "  File not found. Check if '$file' exists in your project."
        elif [ "$response" == "403" ]; then
            echo "  Access forbidden. Check file permissions."
        elif [ "$response" == "426" ]; then
            echo "  HTTP 426: Upgrade Required. This could be an ngrok protocol issue."
        fi
    fi
done

echo -e "\n${YELLOW}Test Results Summary${NC}"
successes=$(echo "$output" | grep -c "✓")
failures=$(echo "$output" | grep -c "✗")
total=${#files[@]}

echo -e "Accessible files: ${GREEN}$successes${NC}/${total}"
echo -e "Inaccessible files: ${RED}$failures${NC}/${total}"

if [ $failures -gt 0 ]; then
    echo -e "\n${YELLOW}Recommendations:${NC}"
    echo "1. Check that all files exist in the correct locations"
    echo "2. Run 'quick-restart.sh' to restart all services"
    echo "3. Try refreshing the ngrok tunnels"
    echo "4. Ensure your web server is running and serving files from the correct directory"
else
    echo -e "\n${GREEN}All files are accessible!${NC} Your friend should be able to connect and play."
fi
