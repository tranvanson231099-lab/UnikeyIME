/**
 * Unikey IME Background Script - v5 (Rock-Solid Stability)
 *
 * This version maintains the simple, predictable state management from v4,
 * which is crucial for preventing race conditions and bugs like the "jumping text"
 * issue reported during corrections. The logic ensures that committing text (e.g., with Spacebar)
 * is a clean, atomic operation.
 */

importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";

// --- Core Handlers ---

chrome.input.ime.onFocus.addListener(ctx => {
    contextID = ctx.contextID;
    composition = ""; // Always start fresh on focus
});

chrome.input.ime.onBlur.addListener(() => {
    if (composition && contextID) {
        commit(composition); // Commit any leftover text when focus is lost
    }
    contextID = 0;
    composition = "";
});

// Commits text and RESETS the composition. This is the key to stability.
function commit(text) {
    if (contextID) {
        // The core action: send the final text to the input field.
        chrome.input.ime.commitText({ contextID: contextID, text: text });
    }
    // Crucially, reset the composition state immediately after committing.
    composition = "";
}

// Updates the text currently being composed (the text that is underlined).
function update(text) {
    composition = text;
    if (contextID) {
        chrome.input.ime.setComposition({ contextID: contextID, text: text, cursor: text.length });
    }
}

// A dedicated function to cancel the current composition.
function cancelComposition() {
    if (composition) {
        composition = "";
        update(""); // Visibly clear the underlined text.
    }
}

// --- Key Event Logic ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') return false;

    const key = keyData.key;

    // Escape/Delete: Cancel composition if active, otherwise let system handle it.
    if (key === 'Escape' || key === 'Delete') {
        if (composition) {
            cancelComposition();
            return true; // We've handled this key.
        }
        return false; // Let system handle the key (e.g., deleting text).
    }

    if (key === 'Enter') {
        if (!composition) return false; 
        commit(composition);
        return true;
    }

    if (keyData.code === 'Space') {
        if (!composition) return false;
        // The commit function handles the text insertion and state reset.
        commit(composition + ' ');
        return true;
    }

    if (key === 'Backspace') {
        if (!composition) return false; // Let system handle if no composition.
        const newComposition = processKeyEvent('backspace', composition);
        update(newComposition);
        return true;
    }

    // Handle all other printable characters.
    if (key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newComposition = processKeyEvent(key, composition);
        update(newComposition);
        return true;
    }

    return false; // Let the system handle all other keys.
});
