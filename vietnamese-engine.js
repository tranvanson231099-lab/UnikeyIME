
const VOWELS = "aăâeêiyoôơuư";

const TONES = {
  's': 'sắc', 'f': 'huyền', 'r': 'hỏi', 'x': 'ngã', 'j': 'nặng'
};

const TELEX = {
  'a': { 'a': 'â', 'w': 'ă' },
  'e': { 'e': 'ê' },
  'o': { 'o': 'ô', 'w': 'ơ' },
  'u': { 'w': 'ư' },
  'd': { 'd': 'đ' },
};

const VNI = {
  'a': { '6': 'â', '8': 'ă' },
  'e': { '6': 'ê' },
  'o': { '6': 'ô', '7': 'ơ' },
  'u': { '7': 'ư' },
  'd': { '9': 'đ' },
};

const VNI_TONES = {
  '1': 's', '2': 'f', '3': 'r', '4': 'x', '5': 'j'
};

const OLD_RULE_VOWELS = ["òa", "òe", "úy", "úyt"];

function isVowel(char) {
  return VOWELS.includes(char.toLowerCase());
}

function findVowel(word, accentRule = 'new') {
    let lastVowelIndex = -1;
    let doubleVowelIndex = -1;

    for (let i = word.length - 1; i >= 0; i--) {
        if (isVowel(word[i])) {
            if (lastVowelIndex === -1) {
                lastVowelIndex = i;
            }
            if (i > 0 && isVowel(word[i-1])) {
                // Check for double vowels like "oa", "oe", etc.
                doubleVowelIndex = i -1;
            }
        }
    }

    if (accentRule === 'old') {
        for (const ending of OLD_RULE_VOWELS) {
            if (word.endsWith(ending)) {
                return word.lastIndexOf(ending[1]);
            }
        }
    }

    if (word.endsWith("qu") && lastVowelIndex > word.indexOf("qu")) {
        return lastVowelIndex;
    }

    if (doubleVowelIndex !== -1) {
        // For double vowels, the tone goes on the second vowel
        // except for the exceptions handled by the old rule.
        return doubleVowelIndex + 1;
    }

    return lastVowelIndex;
}

function processKeyEvent(key, word, method = 'telex', accentRule = 'new') {
  let newWord = word;
  let tone = '';

  if (method === 'telex') {
    if (TELEX[key.toLowerCase()]) {
      const lastChar = word.slice(-1).toLowerCase();
      if (TELEX[lastChar] && TELEX[lastChar][key.toLowerCase()]) {
        newWord = word.slice(0, -1) + TELEX[lastChar][key.toLowerCase()];
      } else {
        newWord += key;
      }
    } else if (TONES[key.toLowerCase()]) {
      tone = TONES[key.toLowerCase()];
    } else {
      newWord += key;
    }
  } else if (method === 'vni') {
    if (VNI_TONES[key]) {
      tone = TONES[VNI_TONES[key]];
    } else if (/[6-9]/.test(key)) {
        const lastChar = word.slice(-1).toLowerCase();
        if (VNI[lastChar] && VNI[lastChar][key]) {
          newWord = word.slice(0, -1) + VNI[lastChar][key];
        } else {
          newWord += key;
        }
    } else {
      newWord += key;
    }
  }

  if (tone) {
    const vowelIndex = findVowel(newWord, accentRule);
    if (vowelIndex !== -1) {
      newWord += `[${tone.trim()}]`;
    }
  }

  return newWord;
}
