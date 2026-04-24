importScripts('vietnamese-engine.js');

let contextID = null;
let composition = { text: '' };
let settings = { typingStyle: 'telex', accentPlacement: 'new' };

// Load settings from chrome.storage
function loadSettings() {
  chrome.storage.sync.get(['typingStyle', 'accentPlacement'], (data) => {
    settings.typingStyle = data.typingStyle || 'telex';
    settings.accentPlacement = data.accentPlacement || 'new';
  });
}

function commit(text) {
  if (contextID) {
    chrome.input.ime.commitText({ contextID, text });
  }
  composition.text = ''; // Reset composition
}

function updateComposition(text) {
  composition.text = text;
  if (contextID) {
    chrome.input.ime.setComposition({ contextID, text, cursor: text.length });
  }
}

// --- Event Listeners ---
chrome.input.ime.onFocus.addListener(context => { contextID = context.contextID; loadSettings(); });
chrome.input.ime.onBlur.addListener(() => { if (composition.text) commit(composition.text); contextID = null; });
chrome.storage.onChanged.addListener(loadSettings);

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
  if (keyData.type !== 'keydown' || keyData.ctrlKey || keyData.altKey) {
    return false;
  }

  // Commit on special keys and reset
  if (keyData.key.length > 1) { // Enter, Backspace, etc.
    if (composition.text) {
        commit(composition.text);
    }
    return false; // Let system handle it
  }

  // Commit on space/punctuation
  if (/[\s.,!?;:]/.test(keyData.key)) {
    if (composition.text) {
      commit(composition.text + keyData.key);
      return true;
    }
    return false; // No composition, let system handle it
  }
  
  // All other keys are processed
  const newText = processKeyEvent(keyData.key, composition.text, settings.typingStyle);
  updateComposition(newText);
  return true;
});

loadSettings();
