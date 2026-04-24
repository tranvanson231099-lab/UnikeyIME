const VOWELS = "aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ";

const CHAR_RULES = {
  'a': {'a': 'â', 'w': 'ă'},
  'e': {'e': 'ê'},
  'o': {'o': 'ô', 'w': 'ơ'},
  'd': {'d': 'đ'},
  'u': {'w': 'ư'}
};

const TONE_RULES = {
  's': 'sắc', 'f': 'huyền', 'r': 'hỏi', 'x': 'ngã', 'j': 'nặng',
};

const TONE_CHARS = Object.keys(TONE_RULES);
const REVERSE_TONE_MAPPING = {};
const VOWEL_TONES = {
    'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'], 'ă': ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'], 'â': ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
    'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'], 'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'], 'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
    'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'], 'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'], 'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'], 'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'], 'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ']
};

// Pre-build a reverse map for fast tone removal
Object.keys(VOWEL_TONES).forEach(base => {
    VOWEL_TONES[base].forEach((toned, index) => {
        REVERSE_TONE_MAPPING[toned] = { base: base, toneIndex: index };
    });
});

function getVowelForToning(word) {
    let lastVowelIndex = -1;
    for (let i = word.length - 1; i >= 0; i--) {
        if (VOWELS.includes(word[i].toLowerCase())) {
            lastVowelIndex = i;
            break;
        }
    }
    return lastVowelIndex;
}

function processKeyEvent(key, word) {
    if (key === 'backspace') {
        return word.length > 0 ? word.slice(0, -1) : "";
    }

    const lowerKey = key.toLowerCase();

    // 1. Try to add a tone
    if (TONE_RULES[lowerKey]) {
        const toneName = TONE_RULES[lowerKey];
        const toneIndex = ['', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'].indexOf(toneName, 1); // 1-based index
        const vowelIndex = getVowelForToning(word);

        if (vowelIndex !== -1) {
            const vowel = word[vowelIndex];
            const mapping = REVERSE_TONE_MAPPING[vowel.toLowerCase()];
            if (mapping) {
                const newVowel = VOWEL_TONES[mapping.base][toneIndex];
                const isUpper = vowel === vowel.toUpperCase();
                return word.substring(0, vowelIndex) + (isUpper ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIndex + 1);
            }
        }
    }

    // 2. Try to change a character (e.g., oo -> ô, ow -> ơ)
    if (word.length > 0) {
        const lastChar = word.slice(-1);
        const rule = CHAR_RULES[lastChar.toLowerCase()];
        if (rule && rule[lowerKey]) {
            const newChar = rule[lowerKey];
            const isUpper = lastChar === lastChar.toUpperCase();
            return word.slice(0, -1) + (isUpper ? newChar.toUpperCase() : newChar);
        }
    }

    // 3. If adding a tone key to a non-vowel word, it might be the start of a new word
    if (TONE_CHARS.includes(lowerKey)) {
        return word + key;
    }

    // 4. If nothing else matches, just append the character
    return word + key;
}
