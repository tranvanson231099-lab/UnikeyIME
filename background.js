importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";

// --- Core Handlers ---

chrome.input.ime.onFocus.addListener(ctx => { contextID = ctx.contextID; });
chrome.input.ime.onBlur.addListener(() => { contextID = 0; });

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

// --- Key Event Logic ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') return false;

    const key = keyData.key;

    if (key === 'Enter') {
        if (!composition) return false; // Let system handle if no composition
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
        // Let the engine handle backspace
        const newComposition = processKeyEvent('backspace', composition);
        update(newComposition);
        return true;
    }

    // For printable characters
    if (key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newComposition = processKeyEvent(key, composition);
        update(newComposition);
        return true;
    }

    return false; // Let the system handle other keys
});
