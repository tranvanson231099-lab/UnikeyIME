function processKeyEvent(key, word) {
  // A simple test engine. It only handles 'aa' -> 'â'.
  const lowerKey = key.toLowerCase();

  if (word.length > 0) {
    const lastChar = word.slice(-1);
    if (lastChar.toLowerCase() === 'a' && lowerKey === 'a') {
      const isUpper = lastChar === 'A';
      return word.slice(0, -1) + (isUpper ? 'Â' : 'â');
    }
  }
  
  // For any other key, just append it.
  return word + key;
}
