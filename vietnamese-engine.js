const VOWELS = "aăâeêiyoôơuưAĂÂEÊIYOÔƠUƯ";
const CHAR_TO_BASE = {
  'á':'a','à':'a','ả':'a','ã':'a','ạ':'a','ắ':'ă','ằ':'ă','ẳ':'ă','ẵ':'ă','ặ':'ă','ấ':'â','ầ':'â','ẩ':'â','ẫ':'â','ậ':'â','é':'e','è':'e','ẻ':'e','ẽ':'e','ẹ':'e','ế':'ê','ề':'ê','ể':'ê','ễ':'ê','ệ':'ê','í':'i','ì':'i','ỉ':'i','ĩ':'i','ị':'i','ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o','ố':'ô','ồ':'ô','ổ':'ô','ỗ':'ô','ộ':'ô','ớ':'ơ','ờ':'ơ','ở':'ơ','ỡ':'ơ','ợ':'ơ','ú':'u','ù':'u','ủ':'u','ũ':'u','ụ':'u','ứ':'ư','ừ':'ư','ử':'ư','ữ':'ư','ự':'ư','ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y','đ':'d',
  'Á':'A','À':'A','Ả':'A','Ã':'A','Ạ':'A','Ắ':'Ă','Ằ':'Ă','Ẳ':'Ă','Ẵ':'Ă','Ặ':'Ă','Ấ':'Â','Ầ':'Â','Ẩ':'Â','Ẫ':'Â','Ậ':'Â','É':'E','È':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E','Ế':'Ê','Ề':'Ê','Ể':'Ê','Ễ':'Ê','Ệ':'Ê','Í':'I','Ì':'I','Ỉ':'I','Ĩ':'I','Ị':'I','Ó':'O','Ò':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ố':'Ô','Ồ':'Ô','Ổ':'Ô','Ỗ':'Ô','Ộ':'Ô','Ớ':'Ơ','Ờ':'Ơ','Ở':'Ơ','Ỡ':'Ơ','Ợ':'Ơ','Ú':'U','Ù':'U','Ủ':'U','Ũ':'U','Ụ':'U','Ứ':'Ư','Ừ':'Ư','Ử':'Ư','Ữ':'Ư','Ự':'Ư','Ý':'Y','Ỳ':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y','Đ':'D'
};
const BASE_TO_CHAR = {
  'a': {'s':'á','f':'à','r':'ả','x':'ã','j':'ạ'},'ă': {'s':'ắ','f':'ằ','r':'ẳ','x':'ẵ','j':'ặ'},'â': {'s':'ấ','f':'ầ','r':'ẩ','x':'ẫ','j':'ậ'},'e': {'s':'é','f':'è','r':'ẻ','x':'ẽ','j':'ẹ'},'ê': {'s':'ế','f':'ề','r':'ể','x':'ễ','j':'ệ'},'i': {'s':'í','f':'ì','r':'ỉ','x':'ĩ','j':'ị'},'o': {'s':'ó','f':'ò','r':'ỏ','x':'õ','j':'ọ'},'ô': {'s':'ố','f':'ồ','r':'ổ','x':'ỗ','j':'ộ'},'ơ': {'s':'ớ','f':'ờ','r':'ở','x':'ỡ','j':'ợ'},'u': {'s':'ú','f':'ù','r':'ủ','x':'ũ','j':'ụ'},'ư': {'s':'ứ','f':'ừ','r':'ử','x':'ữ','j':'ự'},'y': {'s':'ý','f':'ỳ','r':'ỷ','x':'ỹ','j':'ỵ'}
};

const TELEX_TRANSFORM = { 'aa': 'â', 'ee': 'ê', 'oo': 'ô', 'dd': 'đ', 'aw': 'ă', 'ow': 'ơ', 'uw': 'ư' };
const TELEX_TONES = { 's':'sắc', 'f':'huyền', 'r':'hỏi', 'x':'ngã', 'j':'nặng', 'z':'reset' };
const VNI_TRANSFORM = {'a8':'ă','a6':'â','d9':'đ','e6':'ê','o6':'ô','o7':'ơ','u7':'ư'};
const VNI_TONES = { '1':'sắc', '2':'huyền', '3':'hỏi', '4':'ngã', '5':'nặng', '0':'reset' };

function getBaseChar(c) {
    const base = CHAR_TO_BASE[c];
    return base ? base : c;
}

function findVowelToApplyTone(word) {
    let lastVowelIndex = -1;
    for (let i = word.length - 1; i >= 0; i--) {
        if (VOWELS.includes(word[i])) {
            lastVowelIndex = i;
            break;
        }
    }
    return lastVowelIndex;
}

function processKeyEvent(key, word, method = 'telex') {
    const lowerKey = key.toLowerCase();

    // STEP 1: Character Transformation (aa -> â, sonw -> sơn)
    const transform_map = method === 'telex' ? TELEX_TRANSFORM : VNI_TRANSFORM;
    if (word.length > 0) {
        const lastChar = getBaseChar(word.slice(-1)).toLowerCase();
        const combo = lastChar + lowerKey;
        if (transform_map[combo]) {
            const newChar = transform_map[combo];
            const isUpper = word.slice(-1) === word.slice(-1).toUpperCase();
            return word.slice(0, -1) + (isUpper ? newChar.toUpperCase() : newChar);
        }
    }
    
    if (method === 'telex' && lowerKey === 'w') {
        for (let i = word.length - 1; i >= 0; i--) {
            const char = getBaseChar(word[i]).toLowerCase();
            if (char === 'a' || char === 'o' || char === 'u') {
                const newChar = (char === 'a') ? 'ă' : (char === 'o') ? 'ơ' : 'ư';
                const isUpper = word[i] === word[i].toUpperCase();
                return word.substring(0, i) + (isUpper ? newChar.toUpperCase() : newChar) + word.substring(i + 1);
            }
        }
    }

    // STEP 2: Tone Application
    const tone_map = method === 'telex' ? TELEX_TONES : VNI_TONES;
    const toneName = tone_map[lowerKey];
    if (toneName) {
        const vowelPos = findVowelToApplyTone(word);
        if (vowelPos === -1) return word + key;

        const charToTransform = word[vowelPos];
        const baseChar = getBaseChar(charToTransform);
        const toneKeyForMap = Object.keys(TELEX_TONES).find(k => TELEX_TONES[k] === toneName);

        if (toneName === 'reset' || (BASE_TO_CHAR[baseChar.toLowerCase()] && BASE_TO_CHAR[baseChar.toLowerCase()][toneKeyForMap] === charToTransform.toLowerCase())) {
            return word.substring(0, vowelPos) + (charToTransform === baseChar.toUpperCase() ? baseChar.toUpperCase() : baseChar) + word.substring(vowelPos + 1);
        }

        if (BASE_TO_CHAR[baseChar.toLowerCase()] && BASE_TO_CHAR[baseChar.toLowerCase()][toneKeyForMap]) {
            const newChar = BASE_TO_CHAR[baseChar.toLowerCase()][toneKeyForMap];
            const finalChar = charToTransform === charToTransform.toUpperCase() ? newChar.toUpperCase() : newChar;
            return word.substring(0, vowelPos) + finalChar + word.substring(vowelPos + 1);
        }
    }
    
    return word + key;
}
