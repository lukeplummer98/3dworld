# Multiplayer Setup Instructions

## For the Host

1. **Start the WebSocket server**:
   ```
   node server.js
   ```
   This will start the WebSocket server on port 8081 for real-time multiplayer communication.

2. **Start the CORS-enabled HTTP server**:
   ```
   node server-web.js
   ```
   This serves the game files locally on port 8000 with proper CORS headers.
   
   (Alternative: If node server has issues, you can use Python: `python3 -m http.server 8000`)

3. **Start ngrok tunnels**:
   ```
   ngrok start --all --config=ngrok.yml
   ```
   This creates secure tunnels for both the WebSocket server and HTTP server.

4. **Get ngrok URLs**:
   After starting ngrok, run this command to get the tunnel URLs:
   ```
   curl http://localhost:4040/api/tunnels
   ```
   Look for:
   - The WebSocket tunnel URL (with "name":"websocket")
   - The Web tunnel URL (with "name":"web")

5. **Update config-external.js**:
   - Open `js/config-external.js`
   - Update the `WS_URL` value with the WebSocket tunnel URL (e.g., `wss://95d4-82-33-86-26.ngrok-free.app`)
   - Make sure to use `wss://` protocol instead of `https://`

6. **Share the Web URL with friends**:
   - Share the Web tunnel URL with friends (e.g., `https://1e16-82-33-86-26.ngrok-free.app/external.html`)
   - They should append `/external.html` to the URL when accessing it

## For External Players

1. Open the link provided by the host in your web browser (it should end with `/external.html`)

2. You should see the game load and automatically connect to the multiplayer server

3. Note: If you see a loading screen but the game doesn't start, make sure the host has all servers running correctly

## Troubleshooting

- **Connection issues**: Make sure the ngrok tunnels are running and the WebSocket URL in `config-external.js` is correct
- **Game not starting**: Check that both the WebSocket server and HTTP server are running on the host's computer
- **Can't see other players**: 
  - Check the browser console for connection messages (press F12 to open)
  - Make sure all players are using the latest URLs
  - Try refreshing your browser
  - The host should check server.js console for incoming connections
- **Player names/avatars not visible**:
  - Try moving around to trigger position updates
  - Check server.js console to verify player data is being sent
- **ngrok errors**: If ngrok shows "session limit reached", make sure all previous ngrok processes are terminated before starting new tunnels

## Current URLs (as of June 10, 2025)

- WebSocket Server URL: wss://828a-82-33-86-26.ngrok-free.app
- Web Server URL: https://c653-82-33-86-26.ngrok-free.app
- External players should use: https://c653-82-33-86-26.ngrok-free.app/external.html
