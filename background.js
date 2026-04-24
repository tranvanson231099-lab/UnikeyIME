/**
 * Unikey IME Background Script - v6 (Multi-Engine Support)
 *
 * This version introduces multi-engine capability. It now does the following:
 * 1. Loads the user-defined typing style (Telex or VNI) from `chrome.storage`.
 * 2. Listens for changes to the settings and updates the typing style on the fly.
 * 3. Passes the current typing style to the vietnamese-engine for processing.
 */

importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";
let currentTypingStyle = 'Telex'; // Default typing style

// --- Settings Management ---

// Load the typing style from storage when the script starts
function loadTypingStyle() {
    chrome.storage.sync.get('typingStyle', (data) => {
        currentTypingStyle = data.typingStyle || 'Telex';
    });
}

// Listen for changes in settings (e.g., from the options page)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.typingStyle) {
        currentTypingStyle = changes.typingStyle.newValue || 'Telex';
    }
});

// --- Core Handlers (Unchanged) ---

chrome.input.ime.onFocus.addListener(ctx => {
    contextID = ctx.contextID;
    composition = "";
});

chrome.input.ime.onBlur.addListener(() => {
    if (composition && contextID) {
        commit(composition);
    }
    contextID = 0;
    composition = "";
});

function commit(text) {
    if (contextID) {
        chrome.input.ime.commitText({ contextID: contextID, text: text });
    }
    composition = "";
}

function update(text) {
    composition = text;
    if (contextID) {
        chrome.input.ime.setComposition({ contextID: contextID, text: text, cursor: text.length });
    }
}

function cancelComposition() {
    if (composition) {
        composition = "";
        update("");
    }
}

// --- Key Event Logic ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') return false;

    const key = keyData.key;

    if (key === 'Escape' || key === 'Delete') {
        if (composition) {
            cancelComposition();
            return true;
        }
        return false;
    }

    if (key === 'Enter') {
        if (!composition) return false;
        commit(composition);
        return true;
    }

    if (keyData.code === 'Space') {
        if (!composition) return false;
        commit(composition + ' ');
        return true;
    }
    
    // Pass the key and the *current typing style* to the engine
    const newComposition = processKeyEvent(key, composition, currentTypingStyle);
    
    // If the engine returns a different result, update the composition.
    // If it returns the same, it means the key was not handled, so we let the system handle it.
    if (newComposition !== composition + key) {
        update(newComposition);
        return true;
    }

    // The engine did not handle the key, let the browser do its thing.
    // This is important for keys like Backspace when the composition is empty.
    return false;
});

// Initialize settings on startup
loadTypingStyle();
