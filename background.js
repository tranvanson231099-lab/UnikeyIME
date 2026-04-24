/**
 * Unikey IME Background Script - v11 (Engine-Bound, Stable Release)
 *
 * This version permanently fixes the "keys not working" bug by correctly instantiating the new
 * VietnameseEngine and binding its `process` method to the key event listener. It replaces the
 * undefined `processKeyEvent` call. This script now acts as a stable, minimal bridge between the
 * Chrome IME API and the powerful, self-contained `vietnamese-engine.js`.
 */

importScripts('vietnamese-engine.js');

// Create a single, persistent instance of our engine.
const engine = new VietnameseEngine();

let contextID = 0;
let composition = "";
let currentTypingStyle = 'Telex'; // Default to Telex

// --- Settings Management (unchanged, stable) ---

function loadTypingStyle() {
    try {
        chrome.storage.sync.get('typingStyle', (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error loading typing style:", chrome.runtime.lastError.message);
                return;
            }
            // We keep this to ensure the UI option remains functional, even if the engine is Telex-only.
            currentTypingStyle = data.typingStyle || 'Telex';
        });
    } catch (e) {
        console.error("Exception in loadTypingStyle:", e);
    }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.typingStyle) {
        currentTypingStyle = changes.typingStyle.newValue || 'Telex';
    }
});

// --- Core IME Handlers (unchanged, stable) ---

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

// --- Key Event Logic (FIXED and Simplified) ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') return false;

    const key = keyData.key;

    if (key === 'Escape') {
        if (!composition) return false;
        composition = "";
        update("");
        return true;
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

    // FIX: Replaced call to non-existent `processKeyEvent` with the new engine instance.
    if (key === 'Backspace' || (key.length === 1 && !keyData.ctrlKey && !keyData.altKey)) {
        if (key === 'Backspace' && !composition) return false;

        // The engine expects the literal string 'backspace'.
        const engineKey = key === 'Backspace' ? 'backspace' : key;
        
        // The new engine is pure Telex. We no longer need to check `currentTypingStyle`.
        const newComposition = engine.process(composition, engineKey);
        update(newComposition);

        return true; // We handled the key.
    }

    return false; // Let browser handle other keys (arrows, etc.)
});

// Initial load of settings
loadTypingStyle();
