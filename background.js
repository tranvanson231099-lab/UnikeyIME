/**
 * Unikey IME Background Script - v3 (Stable)
 *
 * This version removes the experimental "last word reactivation" feature
 * to restore the standard, reliable behavior of the Backspace and Delete keys.
 * The logic is now simpler and more predictable.
 */

importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";

// --- Core Handlers ---

// Fired when a text input field is focused.
chrome.input.ime.onFocus.addListener(ctx => {
    contextID = ctx.contextID;
    composition = ""; // Reset composition on focus
});

// Fired when a text input field loses focus.
chrome.input.ime.onBlur.addListener(() => {
    // Commit any pending composition when focus is lost.
    if (composition && contextID) {
        chrome.input.ime.commitText({ contextID: contextID, text: composition });
    }
    contextID = 0;
    composition = "";
});

// Commits the given text to the active text field.
function commit(text) {
    if (contextID) {
        chrome.input.ime.commitText({ contextID: contextID, text: text });
    }
    composition = ""; // Reset composition after every commit.
}

// Updates the text currently being composed.
function update(text) {
    composition = text;
    if (contextID) {
        chrome.input.ime.setComposition({ contextID: contextID, text: text, cursor: text.length });
    }
}

// --- Key Event Logic ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    // Only handle keydown events.
    if (keyData.type !== 'keydown') return false;

    const key = keyData.key;

    // Enter key: Commit the current composition if it exists.
    if (key === 'Enter') {
        if (!composition) return false; // Let the system handle Enter if there's nothing to commit.
        commit(composition); 
        return true;
    }

    // Space key: Commit the current composition and add a space.
    if (keyData.code === 'Space') {
        if (!composition) return false; // Let the system handle Space if there's nothing to commit.
        commit(composition + ' ');
        return true;
    }

    // Backspace key: This is the simplified, corrected logic.
    if (key === 'Backspace') {
        if (!composition) {
            // If there is no active composition, do nothing.
            // Let the system handle the backspace (deleting the character before the cursor).
            return false; 
        }
        // If there is a composition, let the engine handle the backspace.
        const newComposition = processKeyEvent('backspace', composition);
        update(newComposition);
        return true;
    }

    // All other printable characters are processed by the engine.
    if (key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newComposition = processKeyEvent(key, composition);
        update(newComposition);
        return true;
    }

    // Let the system handle all other keys (Arrow keys, Delete, Tab, etc.)
    return false; 
});
