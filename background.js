importScripts('vietnamese-engine.js');

let contextID = 0;
let composition = "";
// Keep track of the last fully composed word to allow for reactivation.
let lastCommittedWord = "";

// --- Core Handlers ---

chrome.input.ime.onFocus.addListener(ctx => {
    contextID = ctx.contextID;
    composition = "";
    lastCommittedWord = ""; // Reset state on focus
});

chrome.input.ime.onBlur.addListener(() => {
    // When the text field loses focus, commit any pending composition.
    if (composition && contextID) {
        chrome.input.ime.commitText({ contextID: contextID, text: composition });
    }
    contextID = 0;
    composition = "";
    lastCommittedWord = "";
});

function commit(text) {
    if (!contextID) return;
    chrome.input.ime.commitText({ contextID: contextID, text: text });

    const trimmedText = text.trim();
    // If we are committing a word followed by a space, it becomes the new 'lastCommittedWord'.
    if (text.endsWith(' ') && trimmedText) {
        lastCommittedWord = trimmedText;
    } else {
        lastCommittedWord = ""; // Reset if not a word (e.g., just enter)
    }
    composition = ""; // Always reset composition after a commit
}

function update(text) {
    composition = text;
    if (contextID) {
        chrome.input.ime.setComposition({ contextID: contextID, text: text, cursor: text.length });
    }
}

// --- Key Event Logic ---

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
    if (keyData.type !== 'keydown' || !contextID) {
        return false; // We only handle keydown events in a focused context.
    }

    const key = keyData.key;

    // Handle Enter: Commit whatever is in the composition.
    if (key === 'Enter') {
        if (!composition) return false; // Let system handle enter on empty composition
        commit(composition);
        return true;
    }

    // Handle Space: Commit the current word and add a space.
    if (keyData.code === 'Space') {
        if (!composition) return false; // Let system handle space on empty composition
        commit(composition + ' ');
        return true;
    }

    // Handle Backspace: This is where the new reactivation logic lives.
    if (key === 'Backspace') {
        if (composition) {
            // If we are already composing, just backspace within the composition.
            const newComposition = processKeyEvent('backspace', composition);
            update(newComposition);
            return true;
        } else {
            // **NEW**: If composition is empty and a 'last word' exists, reactivate it.
            // This happens when the user backspaces on the trailing space of a word.
            if (lastCommittedWord) {
                // Asynchronously delete the character before the cursor (the space).
                chrome.input.ime.deleteSurroundingText({ contextID: contextID, offset: -1, length: 1 }, () => {
                    // After deletion, reactivate the last word by putting it back into composition.
                    update(lastCommittedWord);
                    lastCommittedWord = ""; // Clear last word to prevent re-triggering.
                });
                return true; // We've handled the backspace.
            }
            return false; // No composition and no last word, let system handle backspace.
        }
    }

    // Handle all other printable characters for composition.
    if (key.length === 1 && !keyData.ctrlKey && !keyData.altKey) {
        const newComposition = processKeyEvent(key, composition);
        update(newComposition);
        return true;
    }

    return false; // Let the system handle any other unhandled keys.
});
