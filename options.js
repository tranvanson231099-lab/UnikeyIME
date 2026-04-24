const form = document.querySelector('form');

form.addEventListener('change', (event) => {
  const typingStyle = event.target.value;
  chrome.storage.sync.set({ typingStyle });
});

chrome.storage.sync.get('typingStyle', (data) => {
  const typingStyle = data.typingStyle || 'Telex'; // Default to Telex
  const radio = form.querySelector(`input[value="${typingStyle}"]`);
  if (radio) {
    radio.checked = true;
  }
});