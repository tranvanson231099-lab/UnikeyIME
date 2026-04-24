
const VOWELS = "aăâeêiyoôơuưAĂÂEÊIYOÔƠUƯ";

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

const CHAR_MAP = {
  'a': { 's': 'á', 'f': 'à', 'r': 'ả', 'x': 'ã', 'j': 'ạ' },
  'ă': { 's': 'ắ', 'f': 'ằ', 'r': 'ẳ', 'x': 'ẵ', 'j': 'ặ' },
  'â': { 's': 'ấ', 'f': 'ầ', 'r': 'ẩ', 'x': 'ẫ', 'j': 'ậ' },
  'e': { 's': 'é', 'f': 'è', 'r': 'ẻ', 'x': 'ẽ', 'j': 'ẹ' },
  'ê': { 's': 'ế', 'f': 'ề', 'r': 'ể', 'x': 'ễ', 'j': 'ệ' },
  'i': { 's': 'í', 'f': 'ì', 'r': 'ỉ', 'x': 'ĩ', 'j': 'ị' },
  'o': { 's': 'ó', 'f': 'ò', 'r': 'ỏ', 'x': 'õ', 'j': 'ọ' },
  'ô': { 's': 'ố', 'f': 'ồ', 'r': 'ổ', 'x': 'ỗ', 'j': 'ộ' },
  'ơ': { 's': 'ớ', 'f': 'ờ', 'r': 'ở', 'x': 'ỡ', 'j': 'ợ' },
  'u': { 's': 'ú', 'f': 'ù', 'r': 'ủ', 'x': 'ũ', 'j': 'ụ' },
  'ư': { 's': 'ứ', 'f': 'ừ', 'r': 'ử', 'x': 'ữ', 'j': 'ự' },
  'y': { 's': 'ý', 'f': 'ỳ', 'r': 'ỷ', 'x': 'ỹ', 'j': 'ỵ' },
};

const DECOMPOSED_MAP = {
    'á':'a','à':'a','ả':'a','ã':'a','ạ':'a', 'Á':'A','À':'A','Ả':'A','Ã':'A','Ạ':'A',
    'ắ':'ă','ằ':'ă','ẳ':'ă','ẵ':'ă','ặ':'ă', 'Ắ':'Ă','Ằ':'Ă','Ẳ':'Ă','Ẵ':'Ă','Ặ':'Ă',
    'ấ':'â','ầ':'â','ẩ':'â','ẫ':'â','ậ':'â', 'Ấ':'Â','Ầ':'Â','Ẩ':'Â','Ẫ':'Â','Ậ':'Â',
    'é':'e','è':'e','ẻ':'e','ẽ':'e','ẹ':'e', 'É':'E','È':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E',
    'ế':'ê','ề':'ê','ể':'ê','ễ':'ê','ệ':'ê', 'Ế':'Ê','Ề':'Ê','Ể':'Ê','Ễ':'Ê','Ệ':'Ê',
    'í':'i','ì':'i','ỉ':'i','ĩ':'i','ị':'i', 'Í':'I','Ì':'I','Ỉ':'I','Ĩ':'I','Ị':'I',
    'ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o', 'Ó':'O','Ò':'O','Ỏ':'O','Õ':'O','Ọ':'O',
    'ố':'ô','ồ':'ô','ổ':'ô','ỗ':'ô','ộ':'ô', 'Ố':'Ô','Ồ':'Ô','Ổ':'Ô','Ỗ':'Ô','Ộ':'Ô',
    'ớ':'ơ','ờ':'ơ','ở':'ơ','ỡ':'ơ','ợ':'ơ', 'Ớ':'Ơ','Ờ':'Ơ','Ở':'Ơ','Ỡ':'Ơ','Ợ':'Ơ',
    'ú':'u','ù':'u','ủ':'u','ũ':'u','ụ':'u', 'Ú':'U','Ù':'U','Ủ':'U','Ũ':'U','Ụ':'U',
    'ứ':'ư','ừ':'ư','ử':'ư','ữ':'ư','ự':'ư', 'Ứ':'Ư','Ừ':'Ư','Ử':'Ư','Ữ':'Ư','Ự':'Ư',
    'ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y', 'Ý':'Y','Ỳ':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y',
    'đ':'d', 'Đ':'D'
};

function getBaseChar(char) {
    return DECOMPOSED_MAP[char] || char;
}

function isVowel(char) {
  return VOWELS.includes(char);
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
                doubleVowelIndex = i - 1;
            }
        }
    }

    if (accentRule === 'old') {
        const specialEndings = ["òa", "òe", "úy", "úyt"];
        for (const ending of specialEndings) {
            if (word.toLowerCase().endsWith(ending)) {
                return word.toLowerCase().lastIndexOf(ending[1]);
            }
        }
    }

    if (word.toLowerCase().endsWith("qu") && lastVowelIndex > word.toLowerCase().indexOf("qu")) {
        return lastVowelIndex;
    }

    if (doubleVowelIndex !== -1) {
        // For double vowels, the tone goes on the second vowel
        const pair = word.substring(doubleVowelIndex, doubleVowelIndex + 2).toLowerCase();
        if (pair === 'oa' || pair === 'oe' || pair === 'uy') {
             // with no final consonant, tone on the first vowel
             if (lastVowelIndex === doubleVowelIndex + 1 && lastVowelIndex === word.length - 1) {
                 return doubleVowelIndex;
             }
        }
        return doubleVowelIndex + 1;
    }

    return lastVowelIndex;
}

function processKeyEvent(key, word, method = 'telex', accentRule = 'new') {
  let newWord = word;
  let toneKey = '';

  // 1. Determine the operation: add tone, change character, or append
  if (method === 'telex') {
    if (TONES[key.toLowerCase()]) {
      toneKey = key.toLowerCase();
    } else {
      const lastChar = word.slice(-1);
      if (TELEX[lastChar.toLowerCase()] && TELEX[lastChar.toLowerCase()][key.toLowerCase()]) {
          const newChar = TELEX[lastChar.toLowerCase()][key.toLowerCase()];
          newWord = word.slice(0, -1) + (lastChar === lastChar.toUpperCase() ? newChar.toUpperCase() : newChar);
      } else {
        newWord += key;
      }
    }
  } else if (method === 'vni') {
    if (VNI_TONES[key]) {
      toneKey = VNI_TONES[key];
    } else if (/[6-9]/.test(key)) {
        const lastChar = word.slice(-1);
        if (VNI[lastChar.toLowerCase()] && VNI[lastChar.toLowerCase()][key]) {
          const newChar = VNI[lastChar.toLowerCase()][key];
          newWord = word.slice(0, -1) + (lastChar === lastChar.toUpperCase() ? newChar.toUpperCase() : newChar);
        } else {
          newWord += key; // Append number if it doesn't form a valid char
        }
    } else {
      newWord += key;
    }
  }

  // 2. Apply tone if found
  if (toneKey) {
    const vowelIndex = findVowel(newWord, accentRule);
    if (vowelIndex !== -1) {
      const charToTransform = newWord[vowelIndex];
      const baseChar = getBaseChar(charToTransform);
      
      if (CHAR_MAP[baseChar.toLowerCase()] && CHAR_MAP[baseChar.toLowerCase()][toneKey]) {
        const newChar = CHAR_MAP[baseChar.toLowerCase()][toneKey];
        const finalChar = (baseChar === baseChar.toUpperCase()) ? newChar.toUpperCase() : newChar;
        newWord = newWord.substring(0, vowelIndex) + finalChar + newWord.substring(vowelIndex + 1);
      }
    }
  }

  return newWord;
}
