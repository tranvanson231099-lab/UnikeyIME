
const VOWELS = "aăâeêiyoôơuưAĂÂEÊIYOÔƠUƯ";
const CHAR_MAP = {
  'a': { s: 'á', f: 'à', r: 'ả', x: 'ã', j: 'ạ' }, 'ă': { s: 'ắ', f: 'ằ', r: 'ẳ', x: 'ẵ', j: 'ặ' },
  'â': { s: 'ấ', f: 'ầ', r: 'ẩ', x: 'ẫ', j: 'ậ' }, 'e': { s: 'é', f: 'è', r: 'ẻ', x: 'ẽ', j: 'ẹ' },
  'ê': { s: 'ế', f: 'ề', r: 'ể', x: 'ễ', j: 'ệ' }, 'i': { s: 'í', f: 'ì', r: 'ỉ', x: 'ĩ', j: 'ị' },
  'o': { s: 'ó', f: 'ò', r: 'ỏ', x: 'õ', j: 'ọ' }, 'ô': { s: 'ố', f: 'ồ', r: 'ổ', x: 'ỗ', j: 'ộ' },
  'ơ': { s: 'ớ', f: 'ờ', r: 'ở', x: 'ỡ', j: 'ợ' }, 'u': { s: 'ú', f: 'ù', r: 'ủ', x: 'ũ', j: 'ụ' },
  'ư': { s: 'ứ', f: 'ừ', r: 'ử', x: 'ữ', j: 'ự' }, 'y': { s: 'ý', f: 'ỳ', r: 'ỷ', x: 'ỹ', j: 'ỵ' }
};
const DECOMPOSED_MAP = {
  'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a', 'ắ': 'ă', 'ằ': 'ă', 'ẳ': 'ă', 'ẵ': 'ă', 'ặ': 'ă',
  'ấ': 'â', 'ầ': 'â', 'ẩ': 'â', 'ẫ': 'â', 'ậ': 'â', 'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ế': 'ê', 'ề': 'ê', 'ể': 'ê', 'ễ': 'ê', 'ệ': 'ê', 'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o', 'ố': 'ô', 'ồ': 'ô', 'ổ': 'ô', 'ỗ': 'ô', 'ộ': 'ô',
  'ớ': 'ơ', 'ờ': 'ơ', 'ở': 'ơ', 'ỡ': 'ơ', 'ợ': 'ơ', 'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ứ': 'ư', 'ừ': 'ư', 'ử': 'ư', 'ữ': 'ư', 'ự': 'ư', 'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  'đ': 'd', 'Đ': 'D'
};

const TELEX_TRANSFORM = { 'a': 'ă', 'â': 'a', 'e': 'ê', 'o': 'ô', 'ơ': 'o', 'u': 'ư', 'ư': 'u', 'đ': 'd' };
const TELEX_COMBINE = { 'aw': 'ă', 'aa': 'â', 'ee': 'ê', 'oo': 'ô', 'ow': 'ơ', 'uw': 'ư', 'dd': 'đ' };
const TONES_MAP = {
  s: 'sắc', f: 'huyền', r: 'hỏi', x: 'ngã', j: 'nặng', z: 'reset',
  '1': 'sắc', '2': 'huyền', '3': 'hỏi', '4': 'ngã', '5': 'nặng', '0': 'reset'
};

function getBaseChar(c) {
  const lower = c.toLowerCase();
  const base = DECOMPOSED_MAP[lower] || lower;
  return c === lower ? base : base.toUpperCase();
}

function findVowelForTone(word, accentRule = 'new') {
  let mainVowelPos = -1;
  const vowels = [];
  for (let i = 0; i < word.length; i++) {
    if ('aăâeêioôơuưyAĂÂEÊIOÔƠUƯ'.includes(word[i])) vowels.push(i);
  }
  if (vowels.length === 0) return -1;

  const lastVowelPos = vowels[vowels.length - 1];
  const lastChar = word[word.length - 1].toLowerCase();

  if (accentRule === 'old' && word.match(/(òa|òe|úy)$/)) {
    mainVowelPos = vowels[vowels.length - 2];
  } else if (vowels.length >= 2 && word.substring(vowels[vowels.length - 2], vowels[vowels.length - 1] + 1).toLowerCase().match(/^(oa|oe|uy|ua|ue)$/)) {
    if ('ia, ua, ya'.includes(word.substring(vowels[vowels.length-2], vowels[vowels.length-1]).toLowerCase()+'a')){
         mainVowelPos = vowels[vowels.length-1];
    } else if (lastVowelPos === word.length - 1) {
      mainVowelPos = vowels[vowels.length - 2];
    } else {
      mainVowelPos = lastVowelPos;
    }
  } else if (word.toLowerCase().includes("qu") && vowels.length > 1 && vowels[0] <= word.toLowerCase().indexOf('u')) {
      mainVowelPos = vowels[1];
  } else {
    mainVowelPos = lastVowelPos;
  }
  return mainVowelPos;
}

function processKeyEvent(key, word, method = 'telex', accentRule = 'new') {
  const lowerKey = key.toLowerCase();
  const tone = TONES_MAP[lowerKey];

  // 1. Handle tone keys
  if (tone) {
    let newWord = word;
    // Find existing tone to check for tone removal/change
    let existingTonePos = -1;
    for (let i = 0; i < word.length; i++) {
      if (DECOMPOSED_MAP[word[i].toLowerCase()]) {
        existingTonePos = i;
        break;
      }
    }

    if (tone === 'reset') {
      return existingTonePos !== -1 ? word.substring(0, existingTonePos) + getBaseChar(word[existingTonePos]) + word.substring(existingTonePos + 1) : word;
    }

    const vowelPos = findVowelForTone(word, accentRule);
    if (vowelPos === -1) return word + key;

    const charToTransform = word[vowelPos];
    const baseChar = getBaseChar(charToTransform);

    // If user types same tone key again, remove the tone
    if (charToTransform.toLowerCase() !== baseChar && CHAR_MAP[baseChar.toLowerCase()] && CHAR_MAP[baseChar.toLowerCase()][lowerKey] === charToTransform.toLowerCase()) {
      return word.substring(0, vowelPos) + baseChar + word.substring(vowelPos + 1);
    }
    
    // Apply new tone
    if (CHAR_MAP[baseChar.toLowerCase()]) {
      const newChar = CHAR_MAP[baseChar.toLowerCase()][lowerKey];
      if (newChar) {
          const finalChar = charToTransform === charToTransform.toUpperCase() ? newChar.toUpperCase() : newChar;
          return word.substring(0, vowelPos) + finalChar + word.substring(vowelPos + 1);
      }
    }
    return word + key;
  }

  // 2. Handle character transformations (dd, oo, aw, etc.)
  if (method === 'telex') {
    const lastChar = getBaseChar(word.slice(-1)).toLowerCase();
    const combination = lastChar + lowerKey;
    if (TELEX_COMBINE[combination]) {
      const isLastCharUpper = word.slice(-1) === word.slice(-1).toUpperCase();
      const newChar = TELEX_COMBINE[combination];
      return word.slice(0, -1) + (isLastCharUpper ? newChar.toUpperCase() : newChar);
    }
  }

  // 3. Fallback: Append key
  return word + key;
}

