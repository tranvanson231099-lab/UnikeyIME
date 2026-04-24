const VOWELS = "aăâeêiyoôơuưAĂÂEÊIYOÔƠUƯ";
const CHAR_TO_BASE = {
  'á':'a','à':'a','ả':'a','ã':'a','ạ':'a','ắ':'ă','ằ':'ă','ẳ':'ă','ẵ':'ă','ặ':'ă','ấ':'â','ầ':'â','ẩ':'â','ẫ':'â','ậ':'â','é':'e','è':'e','ẻ':'e','ẽ':'e','ẹ':'e','ế':'ê','ề':'ê','ể':'ê','ễ':'ê','ệ':'ê','í':'i','ì':'i','ỉ':'i','ĩ':'i','ị':'i','ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o','ố':'ô','ồ':'ô','ổ':'ô','ỗ':'ô','ộ':'ô','ớ':'ơ','ờ':'ơ','ở':'ơ','ỡ':'ơ','ợ':'ơ','ú':'u','ù':'u','ủ':'u','ũ':'u','ụ':'u','ứ':'ư','ừ':'ư','ử':'ư','ữ':'ư','ự':'ư','ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y','đ':'d',
  'Á':'A','À':'A','Ả':'A','Ã':'A','Ạ':'A','Ắ':'Ă','Ằ':'Ă','Ẳ':'Ă','Ẵ':'Ă','Ặ':'Ă','Ấ':'Â','Ầ':'Â','Ẩ':'Â','Ẫ':'Â','Ậ':'Â','É':'E','È':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E','Ế':'Ê','Ề':'Ê','Ể':'Ê','Ễ':'Ê','Ệ':'Ê','Í':'I','Ì':'I','Ỉ':'I','Ĩ':'I','Ị':'I','Ó':'O','Ò':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ố':'Ô','Ồ':'Ô','Ổ':'Ô','Ỗ':'Ô','Ộ':'Ô','Ớ':'Ơ','Ờ':'Ơ','Ở':'Ơ','Ỡ':'Ơ','Ợ':'Ơ','Ú':'U','Ù':'U','Ủ':'U','Ũ':'U','Ụ':'U','Ứ':'Ư','Ừ':'Ư','Ử':'Ư','Ữ':'Ư','Ự':'Ư','Ý':'Y','Ỳ':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y','Đ':'D'
};
const BASE_TO_CHAR = {
  'a': {'s':'á','f':'à','r':'ả','x':'ã','j':'ạ'},'ă': {'s':'ắ','f':'ằ','r':'ẳ','x':'ẵ','j':'ặ'},'â': {'s':'ấ','f':'ầ','r':'ẩ','x':'ẫ','j':'ậ'},'e': {'s':'é','f':'è','r':'ẻ','x':'ẽ','j':'ẹ'},'ê': {'s':'ế','f':'ề','r':'ể','x':'ễ','j':'ệ'},'i': {'s':'í','f':'ì','r':'ỉ','x':'ĩ','j':'ị'},'o': {'s':'ó','f':'ò','r':'ỏ','x':'õ','j':'ọ'},'ô': {'s':'ố','f':'ồ','r':'ổ','x':'ỗ','j':'ộ'},'ơ': {'s':'ớ','f':'ờ','r':'ở','x':'ỡ','j':'ợ'},'u': {'s':'ú','f':'ù','r':'ủ','x':'ũ','j':'ụ'},'ư': {'s':'ứ','f':'ừ','r':'ử','x':'ữ','j':'ự'},'y': {'s':'ý','f':'ỳ','r':'ỷ','x':'ỹ','j':'ỵ'}
};
const TELEX_TRANSFORM = { 'aw': 'ă', 'aa': 'â', 'dd': 'đ', 'ee': 'ê', 'oo': 'ô', 'ow': 'ơ', 'uw': 'ư' };
const VNI_TRANSFORM = {'a8':'ă','a6':'â','d9':'đ','e6':'ê','o6':'ô','o7':'ơ','u7':'ư'};
const TONES = {'s':1, 'f':2, 'r':3, 'x':4, 'j':5, 'z':0, '1':1, '2':2, '3':3, '4':4, '5':5, '0':0};

function getBaseChar(c) { return CHAR_TO_BASE[c] || c; }

function findVowel(word) {
    for (let i = word.length - 1; i >= 0; i--) {
        if (VOWELS.includes(word[i])) return i;
    }
    return -1;
}

function processKeyEvent(key, word, method = 'telex', accentRule = 'new') {
    const lowerKey = key.toLowerCase();
    
    // Rule 1: Tone mark or character transformation
    if (TONES[lowerKey] !== undefined || (method === 'telex' && 'wade'.includes(lowerKey)) || (method === 'vni' && '6789'.includes(lowerKey))) {
        let lastVowelPos = findVowel(word);
        if (lastVowelPos === -1) return word + key;

        // 1a. Handle Tones
        if (TONES[lowerKey] !== undefined) {
            const tone = Object.keys(TONES).find(k => TONES[k] === TONES[lowerKey] && (method === 'telex' ? !/[0-9]/.test(k) : /[0-9]/.test(k)));
            const charToTransform = word[lastVowelPos];
            const baseChar = getBaseChar(charToTransform);

            // Remove tone if same key is pressed or with z/0
            if (TONES[lowerKey] === 0 || (BASE_TO_CHAR[baseChar.toLowerCase()] && BASE_TO_CHAR[baseChar.toLowerCase()][tone] === charToTransform.toLowerCase())) {
                return word.substring(0, lastVowelPos) + baseChar + word.substring(lastVowelPos + 1);
            }
            
            // Apply tone
            const newCharObject = BASE_TO_CHAR[baseChar.toLowerCase()];
            if (newCharObject && newCharObject[tone]) {
                const newChar = newCharObject[tone];
                return word.substring(0, lastVowelPos) + (charToTransform === baseChar.toUpperCase() ? newChar.toUpperCase() : newChar) + word.substring(lastVowelPos + 1);
            }
        }

        // 1b. Handle Character Transformation (sonw -> sơn)
        const baseVowel = getBaseChar(word[lastVowelPos]).toLowerCase();
        const combo = baseVowel + lowerKey;
        const transformRules = method === 'telex' ? TELEX_TRANSFORM : VNI_TRANSFORM;

        if (transformRules[combo]) {
            const newChar = transformRules[combo];
            const isUpper = word[lastVowelPos] === word[lastVowelPos].toUpperCase();
            return word.substring(0, lastVowelPos) + (isUpper ? newChar.toUpperCase() : newChar) + word.substring(lastVowelPos + 1);
        }
    }

    // Rule 2: No match, just append the character
    return word + key;
}
