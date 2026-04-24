/**
 * Unikey IME Background Script - v9 (Stable Release)
 *
 * This version works in tandem with the rewritten engine (v10) to ensure maximum
 * stability. The key event listener is simplified and made more robust to prevent
 * the race conditions and state corruption that caused the IME to freeze. It now
 * reliably handles every key press, passing it to the stable engine.
 */

importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";
let currentTypingStyle = 'Telex'; // Default to Telex

// --- Settings Management ---

function loadTypingStyle() {
    try {
        chrome.storage.sync.get('typingStyle', (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error loading typing style:", chrome.runtime.lastError.message);
                currentTypingStyle = 'Telex';
                return;
            }
            currentTypingStyle = data.typingStyle || 'Telex';
        });
    } catch (e) {
        console.error("Exception in loadTypingStyle:", e);
        currentTypingStyle = 'Telex';
    }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.typingStyle) {
        currentTypingStyle = changes.typingStyle.newValue || 'Telex';
    }
});

// --- Core IME Handlers (Stable) ---

chrome.input.ime.onFocus.addListener(ctx => {
    contextID = ctx.contextID;
    composition = ""; // Always start fresh
});

chrome.input.ime.onBlur.addListener(() => {
    if (composition && contextID) {
        commit(composition); // Commit any leftover text
    }
    contextID = 0;
    composition = "";
});

function commit(text) {
    if (contextID) {
        chrome.input.ime.commitText({ contextID: contextID, text: text });
    }
    composition = ""; // Reset state immediately after commit
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
        update(""); // Clear the composition visually
    }
}

// --- Key Event Logic (Simplified and Stabilized) ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') return false; // Only process keydown events

    const key = keyData.key;

    if (key === 'Escape') {
        if (composition) {
            cancelComposition();
            return true; // Key was handled
        }
        return false; // Let browser handle it
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

    if (key === 'Backspace') {
        if (!composition) return false;
        const newComposition = processKeyEvent(key, composition, currentTypingStyle);
        update(newComposition);
        return true;
    }

    // The most critical part: handle all single, printable characters.
    if (key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newComposition = processKeyEvent(key, composition, currentTypingStyle);
        update(newComposition);
        return true; // We *always* handle printable keys to maintain state.
    }

    // Let the browser handle any other key (e.g., arrow keys, function keys).
    return false;
});

// Load settings on startup
loadTypingStyle();
