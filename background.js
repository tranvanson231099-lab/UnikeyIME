/**
 * Unikey IME Background Script - v7 (Stable Multi-Engine)
 *
 * This version fixes a critical state management bug from v6 that caused the
 * composition state to not update correctly, making both Telex and VNI fail.
 * The logic is now restored to a stable model where every valid key press
 * correctly updates the composition.
 */

importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";
let currentTypingStyle = 'Telex'; // Default typing style

// --- Settings Management ---

function loadTypingStyle() {
    chrome.storage.sync.get('typingStyle', (data) => {
        currentTypingStyle = data.typingStyle || 'Telex';
    });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.typingStyle) {
        currentTypingStyle = changes.typingStyle.newValue || 'Telex';
    }
});

// --- Core IME Handlers ---

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

// --- Key Event Logic (Corrected) ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') return false;

    const key = keyData.key;

    // Handle non-printable keys first
    if (key === 'Escape' || key === 'Delete') {
        if (composition) {
            cancelComposition();
            return true; // We handled the key
        }
        return false; // No composition, let the browser handle it
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
        if (!composition) return false; // Let system handle backspace on empty composition
        const newComposition = processKeyEvent('backspace', composition, currentTypingStyle);
        update(newComposition);
        return true;
    }

    // Handle printable characters: This is the corrected logic.
    // Any single character that is not a control character will be processed.
    if (key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newComposition = processKeyEvent(key, composition, currentTypingStyle);
        update(newComposition);
        return true; // We always handle printable keys to maintain state
    }

    // Let the system handle anything else (Arrow keys, Tab, etc.)
    return false;
});

// Initialize settings on startup
loadTypingStyle();
