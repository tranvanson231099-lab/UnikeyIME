const VOWELS = "aăâeêiyoôơuưAĂÂEÊIYOÔƠUƯ";
const CHAR_TO_BASE = {
  'á':'a','à':'a','ả':'a','ã':'a','ạ':'a','ắ':'ă','ằ':'ă','ẳ':'ă','ẵ':'ă','ặ':'ă','ấ':'â','ầ':'â','ẩ':'â','ẫ':'â','ậ':'â','é':'e','è':'e','ẻ':'e','ẽ':'e','ẹ':'e','ế':'ê','ề':'ê','ể':'ê','ễ':'ê','ệ':'ê','í':'i','ì':'i','ỉ':'i','ĩ':'i','ị':'i','ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o','ố':'ô','ồ':'ô','ổ':'ô','ỗ':'ô','ộ':'ô','ớ':'ơ','ờ':'ơ','ở':'ơ','ỡ':'ơ','ợ':'ơ','ú':'u','ù':'u','ủ':'u','ũ':'u','ụ':'u','ứ':'ư','ừ':'ư','ử':'ư','ữ':'ư','ự':'ư','ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y','đ':'d',
  'Á':'A','À':'A','Ả':'A','Ã':'A','Ạ':'A','Ắ':'Ă','Ằ':'Ă','Ẳ':'Ă','Ẵ':'Ă','Ặ':'Ă','Ấ':'Â','Ầ':'Â','Ẩ':'Â','Ẫ':'Â','Ậ':'Â','É':'E','È':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E','Ế':'Ê','Ề':'Ê','Ể':'Ê','Ễ':'Ê','Ệ':'Ê','Í':'I','Ì':'I','Ỉ':'I','Ĩ':'I','Ị':'I','Ó':'O','Ò':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ố':'Ô','Ồ':'Ô','Ổ':'Ô','Ỗ':'Ô','Ộ':'Ô','Ớ':'Ơ','Ờ':'Ơ','Ở':'Ơ','Ỡ':'Ơ','Ợ':'Ơ','Ú':'U','Ù':'U','Ủ':'U','Ũ':'U','Ụ':'U','Ứ':'Ư','Ừ':'Ư','Ử':'Ư','Ữ':'Ư','Ự':'Ư','Ý':'Y','Ỳ':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y','Đ':'D'
};
const BASE_TO_CHAR = {
  'a': {'s':'á','f':'à','r':'ả','x':'ã','j':'ạ'},'ă': {'s':'ắ','f':'ằ','r':'ẳ','x':'ẵ','j':'ặ'},'â': {'s':'ấ','f':'ầ','r':'ẩ','x':'ẫ','j':'ậ'},'e': {'s':'é','f':'è','r':'ẻ','x':'ẽ','j':'ẹ'},'ê': {'s':'ế','f':'ề','r':'ể','x':'ễ','j':'ệ'},'i': {'s':'í','f':'ì','r':'ỉ','x':'ĩ','j':'ị'},'o': {'s':'ó','f':'ò','r':'ỏ','x':'õ','j':'ọ'},'ô': {'s':'ố','f':'ồ','r':'ổ','x':'ỗ','j':'ộ'},'ơ': {'s':'ớ','f':'ờ','r':'ở','x':'ỡ','j':'ợ'},'u': {'s':'ú','f':'ù','r':'ủ','x':'ũ','j':'ụ'},'ư': {'s':'ứ','f':'ừ','r':'ử','x':'ữ','j':'ự'},'y': {'s':'ý','f':'ỳ','r':'ỷ','x':'ỹ','j':'ỵ'}
};
const TELEX_MAP = { 'aa': 'â', 'ee': 'ê', 'oo': 'ô', 'dd': 'đ', 'aw': 'ă', 'ow': 'ơ', 'uw': 'ư' };
const TONE_KEYS = { 's':1, 'f':2, 'r':3, 'x':4, 'j':5, 'z':0 };
const VNI_TONES = {'1':1, '2':2, '3':3, '4':4, '5':5, '0':0 };

function getBaseChar(c) { return CHAR_TO_BASE[c] || c; }

function findVowelForTone(word) {
    const VOWEL_REGEX = /[aăâeêiyoôơuư]/i;
    let lastVowelIndex = -1;
    let secondToLastVowelIndex = -1;

    for (let i = word.length - 1; i >= 0; i--) {
        if (VOWEL_REGEX.test(word[i])) {
            if (lastVowelIndex === -1) lastVowelIndex = i;
            else {
                secondToLastVowelIndex = i;
                break;
            }
        }
    }

    if (lastVowelIndex === -1) return -1;

    // Rule: nguyên âm đôi + phụ âm cuối -> dấu ở nguyên âm thứ hai (tuyến, muốn)
    if (secondToLastVowelIndex !== -1 && lastVowelIndex < word.length - 1) {
        return lastVowelIndex;
    }

    // Rule: nguyên âm đôi không có phụ âm cuối -> dấu ở nguyên âm thứ nhất (múa, của)
    const pair = word.substring(secondToLastVowelIndex, lastVowelIndex + 1).toLowerCase();
    if (secondToLastVowelIndex !== -1 && (pair === 'oa' || pair === 'oe' || pair === 'uy')) {
        return secondToLastVowelIndex;
    }
    
    return lastVowelIndex;
}

function processKeyEvent(key, word, method = 'telex', accentRule = 'new') {
    const lowerKey = key.toLowerCase();

    // 1. Handle TELEX character transformation
    if (method === 'telex') {
        const lastChar = word.slice(-1).toLowerCase();
        const combo = lastChar + lowerKey;
        if (TELEX_MAP[combo]) {
            const newChar = TELEX_MAP[combo];
            const isUpper = word.slice(-1) === word.slice(-1).toUpperCase();
            return word.slice(0, -1) + (isUpper ? newChar.toUpperCase() : newChar);
        }
        if (lowerKey === 'w') {
            for (let i = word.length - 1; i >= 0; i--) {
                const char = word[i];
                if (getBaseChar(char).toLowerCase() === 'a') return word.slice(0, i) + (char === 'A' ? 'Ă' : 'ă') + word.slice(i+1);
                if (getBaseChar(char).toLowerCase() === 'o') return word.slice(0, i) + (char === 'O' ? 'Ơ' : 'ơ') + word.slice(i+1);
                if (getBaseChar(char).toLowerCase() === 'u') return word.slice(0, i) + (char === 'U' ? 'Ư' : 'ư') + word.slice(i+1);
            }
        }
    }

    // 2. Handle Tones
    const toneKey = (method === 'telex') ? Object.keys(TONE_KEYS).find(k => k === lowerKey) : Object.keys(VNI_TONES).find(k => k === lowerKey);
    if (toneKey) {
        const vowelPos = findVowelForTone(word);
        if (vowelPos === -1) return word + key;

        const charToTransform = word[vowelPos];
        const baseChar = getBaseChar(charToTransform);
        const toneName = (method === 'telex') ? toneKey : Object.keys(TONE_KEYS)[VNI_TONES[toneKey]];

        // Remove tone if key is 'z'/'0' or same tone is applied again
        if (toneName === 'z' || (BASE_TO_CHAR[baseChar.toLowerCase()] && BASE_TO_CHAR[baseChar.toLowerCase()][toneName] === charToTransform.toLowerCase())) {
            return word.substring(0, vowelPos) + baseChar + word.substring(vowelPos + 1);
        }

        // Apply new tone
        const newCharObject = BASE_TO_CHAR[baseChar.toLowerCase()];
        if (newCharObject && newCharObject[toneName]) {
            const newChar = newCharObject[toneName];
            return word.substring(0, vowelPos) + (charToTransform === baseChar.toUpperCase() ? newChar.toUpperCase() : newChar) + word.substring(vowelPos + 1);
        }
    }

    // 3. No rules matched, append character
    return word + key;
}
