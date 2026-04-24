const engineID = "unikey_ime";

chrome.input.ime.onFocus.addListener((context) => {
  // TODO: Add logic to handle when a text field is focused
});

chrome.input.ime.onBlur.addListener((contextID) => {
  // TODO: Add logic to handle when a text field loses focus
});

chrome.input.ime.onKeyEvent.addListener((engineID, keyData) => {
  // TODO: This is where we will process keystrokes
  // for now, just return false to indicate we haven't handled the event
  return false;
});
