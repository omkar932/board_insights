# Verification Steps for Sanketa Extension

Follow these steps to confirm everything is working correctly.

## 1. Reload the Extension (Crucial!)

Since we updated `manifest.json` and `content.js`, Chrome needs to reload the extension.

1.  Open Chrome and go to **`chrome://extensions/`**
2.  Find **"Sanketa - Educational Analytics"**
3.  Click the **circular reload icon ↻** (bottom right of the card)
4.  Make sure the toggle is **ON** (blue)
5.  If you see any "Errors" button, click it and "Clear all"

## 2. Check the Background Worker

1.  Click the blue link **"service worker"** on the extension card
2.  A DevTools window will open.
3.  Click the **Console** tab.
4.  You should see:
    - `Sanketa background service worker loaded`
    - `WASM module loaded successfully`
      _(If you see "Failed to load WASM module", expand the error object to see the real reason - usually CSP or path issues)_

## 3. Run the Mock Server

You already have this running, but just in case:
Open a terminal in the `board insights` folder and run:

```bash
python3 -m http.server 8000
```

## 4. Test the Mock Page

1.  Open this URL in Chrome: **[http://localhost:8000/mock-blackboard.html](http://localhost:8000/mock-blackboard.html)**
2.  Refresh the page (**Cmd+R** or **F5**)
3.  Wait a second...
4.  Look for a **Floating Purple Button** in the bottom-right corner! 🟣
5.  **Click it!** A sidebar should slide in.

## 5. Verify Analytics

In the sidebar, you should see:

- **"Extracting gradebook data..."**
- Then **"Insights Ready"** ✅
- Data like:
  - 🚨 Early Intervention: High Risk: ...
  - 📚 Chapter Difficulty: ...
  - ✅ Assessment Quality: Reliability ...

## Troubleshooting

- **No Purple Button?**
  - Check the Console on the local page (`Right Click > Inspect > Console`)
  - Look for "Sanketa content script loaded"
  - Look for "Gradebook page detected!"

- **Extension Error?**
  - Go back to `chrome://extensions/` and check for errors.
