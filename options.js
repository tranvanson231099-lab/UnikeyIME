document.addEventListener('DOMContentLoaded', () => {
  const mainSettingsForm = document.forms.mainSettings;
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');

  // Load settings and update the form
  function loadSettings() {
    chrome.storage.sync.get([
      'typingStyle',
      'accentPlacement'
    ], (data) => {
      mainSettingsForm.elements['typing-style'].value = data.typingStyle || 'Telex';
      mainSettingsForm.elements['accent-placement'].value = data.accentPlacement || 'new';
    });
  }

  // Save settings when the button is clicked
  function saveSettings(event) {
    event.preventDefault(); // Prevent form from submitting
    const typingStyle = mainSettingsForm.elements['typing-style'].value;
    const accentPlacement = mainSettingsForm.elements['accent-placement'].value;

    chrome.storage.sync.set({
      typingStyle,
      accentPlacement
    }, () => {
      // Display a success message and clear it after a few seconds
      statusMessage.textContent = 'Đã lưu cài đặt!';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  }

  loadSettings();
  saveButton.addEventListener('click', saveSettings);

  // Link to manage extensions
  document.getElementById('console-link').addEventListener('click', (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions' });
  });
});
