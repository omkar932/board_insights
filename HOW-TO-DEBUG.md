# How to Check Service Worker Console

## Step-by-Step Instructions:

1. **Open Chrome Extensions Page**
   - Type in address bar: `chrome://extensions/`
   - Press Enter

2. **Find Sanketa Extension**
   - Look for "Sanketa - Educational Analytics" in the list
   - Make sure it's enabled (toggle is blue/on)

3. **Open Service Worker Console**
   - Under the extension card, you'll see text that says:
     ```
     Inspect views: service worker
     ```
   - Click the blue link that says **"service worker"**
   - A new DevTools window will open

4. **Check the Console Tab**
   - In the DevTools window, click the **Console** tab (if not already selected)
   - You should see logs like:
     ```
     Sanketa background service worker loaded
     🔄 Starting WASM module load...
     📦 WASM JS URL: ./wasm/analytics_wasm.js
     📦 WASM Binary URL: chrome-extension://...
     ```

5. **Copy ALL the Console Output**
   - Select all text in the console (Cmd+A)
   - Copy it (Cmd+C)
   - Paste it to me

## What I'm Looking For:

The console should show either:

- ✅ Success messages with green checkmarks
- ❌ Error messages with red X marks and detailed error info

The error details will tell us exactly why WASM isn't loading.

## If You Don't See "service worker" Link:

The service worker might not be running. Try:

1. Reload the extension (click the reload icon ↻)
2. Refresh your mock page at `http://localhost:8000/mock-blackboard.html`
3. The "service worker" link should appear
4. Click it immediately to see the logs
