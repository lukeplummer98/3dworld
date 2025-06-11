# How to Join the Game

Follow these simple steps to join the multiplayer game:

1. **Open this URL in your web browser**:
   https://a645-82-33-86-26.ngrok-free.app/external.html
   
   (Note: This URL might change each time your friend restarts ngrok. Ask them for the current URL.)

2. **Game Controls**:
   - Move: WASD or Arrow Keys
   - Jump: Spacebar
   - Interact: E key
   - Zoom: Mouse wheel or pinch gesture (on mobile)
   - Emotes: Click the 😊 button

3. **If you encounter any issues**:
   - Try refreshing the browser
   - Make sure you allow the site to run JavaScript
   - Open the browser console (F12) and check for any error messages
   - If you see 503 or 426 errors:
     - This could be an issue with file paths. Try opening the test page:
       https://a645-82-33-86-26.ngrok-free.app/test-paths.html
     - Ask your friend to run the quick-restart.sh script to restart multiplayer servers
   - If stuck on "Loading Virtual World..." screen:
     - In the browser console (F12), type `checkResourceLoading()` to diagnose resource loading issues
     - Tell your friend to check their ngrok tunnels and server setup
   - If players are invisible, try typing `forcePlayerUpdate()` in the browser console
   - Make sure your browser allows WebSockets (wss://) connections
   - Try using Chrome or Firefox, which tend to work best with WebGL games

Enjoy the game!
