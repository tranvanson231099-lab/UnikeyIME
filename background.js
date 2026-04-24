importScripts('vietnamese-engine.js');

let contextID;
let composition = { text: '', cursor: 0 };
let settings = { typingStyle: 'telex', accentPlacement: 'new' };

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['typingStyle', 'accentPlacement'], (data) => {
    settings.typingStyle = data.typingStyle || 'telex';
    settings.accentPlacement = data.accentPlacement || 'new';
  });
}

// Update settings on change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.typingStyle) settings.typingStyle = changes.typingStyle.newValue;
  if (changes.accentPlacement) settings.accentPlacement = changes.accentPlacement.newValue;
});

function commitComposition() {
  if (!contextID || !composition.text) return;
  chrome.input.ime.commitText({ contextID, text: composition.text });
  composition = { text: '', cursor: 0 };
}

function updateComposition(newText) {
  composition.text = newText;
  composition.cursor = newText.length;
  if (contextID) {
    chrome.input.ime.setComposition({ contextID, text: newText, cursor: newText.length });
  }
}

chrome.input.ime.onFocus.addListener(context => {
  contextID = context.contextID;
  loadSettings();
});

chrome.input.ime.onBlur.addListener(id => {
  if (id === contextID) {
    commitComposition();
    contextID = null;
  }
});

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
  if (keyData.type !== 'keydown' || keyData.ctrlKey || keyData.altKey) return false;

  // Special keys commit the current composition
  if (keyData.key.length > 1) { // Enter, Backspace, Arrow keys etc.
    commitComposition();
    return false; // Let the system handle it
  }

  // Space and punctuation commit the composition + the character
  if (/[\s.,!?;:]/.test(keyData.key)) {
    commitComposition();
    return false; // Let system handle space/punctuation
  }

  // Process the key with the engine
  const newText = processKeyEvent(keyData.key, composition.text, settings.typingStyle, settings.accentPlacement);
  updateComposition(newText);
  return true; // We handled the event
}, ["physical"])

// Initial load
loadSettings();
