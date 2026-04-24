importScripts('vietnamese-engine.js');

let contextID = null;
let compositionText = '';
let settings = { typingStyle: 'telex', accentPlacement: 'new' };

function loadSettings() {
  chrome.storage.sync.get(['typingStyle', 'accentPlacement'], (data) => {
    settings.typingStyle = data.typingStyle || 'telex';
    settings.accentPlacement = data.accentPlacement || 'new';
  });
}

function updateComposition(text) {
  compositionText = text;
  if (contextID) {
    chrome.input.ime.setComposition({ contextID, text, cursor: text.length });
  }
}

function commitText(text) {
  if (contextID) {
    chrome.input.ime.commitText({ contextID, text });
  }
  updateComposition('');
}

chrome.input.ime.onFocus.addListener(context => { contextID = context.contextID; loadSettings(); });
chrome.input.ime.onBlur.addListener(() => { if (compositionText) commitText(compositionText); contextID = null; });
chrome.storage.onChanged.addListener(loadSettings);

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
  if (keyData.type !== 'keydown' || keyData.ctrlKey || keyData.altKey) return false;

  if (keyData.key.length > 1) {
    if (compositionText) commitText(compositionText);
    return false;
  }

  if (/[\s.,!?;:]/.test(keyData.key)) {
    if (compositionText) commitText(compositionText + keyData.key);
    else chrome.input.ime.commitText({ contextID, text: keyData.key });
    return true;
  }

  const newText = processKeyEvent(keyData.key, compositionText, settings.typingStyle, settings.accentPlacement);
  
  if (newText === compositionText + keyData.key) { // If engine did not transform, commit current and start new
      if(compositionText) commitText(compositionText);
      updateComposition(keyData.key);
  } else {
      updateComposition(newText);
  }

  return true;
});

loadSettings();
