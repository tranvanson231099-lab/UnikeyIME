importScripts('vietnamese-engine.js');

const engineID = "unikey_ime";
let contextID;
let currentWord = '';
let typingMethod = 'telex'; // Default typing method
let accentPlacement = 'new'; // Default accent placement

// Load the user's preferred settings from storage
function loadSettings() {
    chrome.storage.sync.get(['typingStyle', 'accentPlacement'], (data) => {
        if (data.typingStyle) {
            typingMethod = data.typingStyle.toLowerCase();
        }
        if (data.accentPlacement) {
            accentPlacement = data.accentPlacement;
        }
    });
}

// Listen for changes in user settings
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.typingStyle) {
        typingMethod = changes.typingStyle.newValue.toLowerCase();
    }
    if (changes.accentPlacement) {
        accentPlacement = changes.accentPlacement.newValue;
    }
});

chrome.input.ime.onFocus.addListener((context) => {
  contextID = context.contextID;
});

chrome.input.ime.onBlur.addListener(() => {
  if (currentWord) {
    chrome.input.ime.commitText({
      contextID: contextID,
      text: currentWord
    });
  }
  currentWord = '';
  contextID = 0;
});

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
  if (keyData.type === 'keydown' && !keyData.ctrlKey && !keyData.altKey) {
    if (keyData.key.length > 1) {
      if (currentWord) {
        chrome.input.ime.commitText({
          contextID: contextID,
          text: currentWord
        });
        currentWord = '';
      }
      return false;
    }

    if (/[\s.,!?;:]/.test(keyData.key)) {
      if (currentWord) {
        chrome.input.ime.commitText({
          contextID: contextID,
          text: currentWord + keyData.key
        });
        currentWord = '';
      } else {
        chrome.input.ime.commitText({
          contextID: contextID,
          text: keyData.key
        });
      }
      return true;
    }

    const newWord = processKeyEvent(keyData.key, currentWord, typingMethod, accentPlacement);

    if (newWord !== currentWord) {
      chrome.input.ime.setComposition({
        contextID: contextID,
        text: newWord,
        cursor: newWord.length
      });
      currentWord = newWord;
    } else {
        chrome.input.ime.commitText({
            contextID: contextID,
            text: currentWord + keyData.key
        });
        currentWord = '';
    }
    return true;
  }

  return false;
});

// Load settings when the extension starts
loadSettings();
