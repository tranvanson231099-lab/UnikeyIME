/**
 * Unikey IME Background Script - v10 (Definitive, Stable Release)
 *
 * This script is the stable partner to the rewritten engine (v11). Its role is simplified to the extreme
 * to guarantee stability: it does nothing but pass key events to the engine and manage the composition.
 * All complex logic is now exclusively in `vietnamese-engine.js` to prevent any possible conflicts
 * or state corruption at the background level. This two-part fix (engine + background) is the definitive
 * solution to the freezing and incorrect transformation bugs.
 */

importScripts('vietnamese-engine.js');

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

// --- Key Event Logic (Reliable and Simplified) ---

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

    // Pass 'backspace' and all printable characters to the engine.
    // The engine now has all the logic.
    if (key === 'Backspace' || (key.length === 1 && !keyData.ctrlKey && !keyData.altKey)) {
        if (key === 'Backspace' && !composition) return false; // Let browser handle backspace on empty input
        
        const newComposition = processKeyEvent(key, composition, currentTypingStyle);
        update(newComposition);
        return true; // We handled the key.
    }

    return false; // Let browser handle other keys (arrows, etc.)
});

// Initial load of settings
loadTypingStyle();
