importScripts('vietnamese-engine.js');

let contextID = 0;
let compositionText = "";

chrome.input.ime.onFocus.addListener((context) => {
    contextID = context.contextID;
});

chrome.input.ime.onBlur.addListener((context) => {
    if (contextID === context.contextID && compositionText) {
        chrome.input.ime.commitText({ contextID: contextID, text: compositionText });
    }
    compositionText = "";
    contextID = 0;
});

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown') {
        return false;
    }

    // On space or enter, commit the text and let the system handle the key.
    if (keyData.code === 'Space' || keyData.code === 'Enter') {
        if (compositionText) {
            chrome.input.ime.commitText({ contextID: contextID, text: compositionText });
            compositionText = "";
        }
        return false; 
    }

    // On backspace
    if (keyData.code === 'Backspace') {
        if (compositionText) {
            compositionText = compositionText.slice(0, -1);
            chrome.input.ime.setComposition({ contextID: contextID, text: compositionText, cursor: compositionText.length });
            return true; // We handled it.
        }
        return false; // Let system handle it.
    }

    // For single, printable characters.
    if (keyData.key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newText = processKeyEvent(keyData.key, compositionText);
        
        // If the engine changed the text, update the composition.
        if (newText !== (compositionText + keyData.key)) {
            chrome.input.ime.setComposition({ contextID: contextID, text: newText, cursor: newText.length });
            compositionText = newText;
        } else {
            // Otherwise, commit the old text and start a new composition.
            if (compositionText) {
                chrome.input.ime.commitText({ contextID: contextID, text: compositionText });
            }
            compositionText = keyData.key;
            chrome.input.ime.setComposition({ contextID: contextID, text: compositionText, cursor: 1 });
        }
        return true;
    }
    
    return false;
});
