const mainSettingsForm = document.forms.mainSettings;
const controlPanelForm = document.querySelector('.settings-group legend:first-of-type').parentElement;

// Load settings and update the form
function loadSettings() {
  chrome.storage.sync.get([
    'typingStyle',
    'smartTyping',
    'vietnameseEnabled',
    'accentPlacement'
  ], (data) => {
    // Main settings
    mainSettingsForm.elements['typing-style'].value = data.typingStyle || 'Telex';
    mainSettingsForm.elements['smart-typing'].checked = data.smartTyping || false;
    mainSettingsForm.elements['accent-placement'].value = data.accentPlacement || 'new';

    // Control panel
    controlPanelForm.querySelector('input[name="enabled"]').checked = data.vietnameseEnabled === undefined ? true : data.vietnameseEnabled;
  });
}

// Save settings when the form changes
function saveSettings() {
  const typingStyle = mainSettingsForm.elements['typing-style'].value;
  const smartTyping = mainSettingsForm.elements['smart-typing'].checked;
  const accentPlacement = mainSettingsForm.elements['accent-placement'].value;
  const vietnameseEnabled = controlPanelForm.querySelector('input[name="enabled"]').checked;

  chrome.storage.sync.set({
    typingStyle,
    smartTyping,
    accentPlacement,
    vietnameseEnabled
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadSettings);
mainSettingsForm.addEventListener('change', saveSettings);
controlPanelForm.addEventListener('change', saveSettings);

document.getElementById('console-link').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions' });
});
