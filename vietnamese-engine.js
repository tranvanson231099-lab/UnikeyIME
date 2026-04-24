/**
 * @name vietnamese-engine.js
 * @version 15.0.0 (Definitive Laban Key Simulation)
 * @description A complete from-scratch rewrite of the Vietnamese IME engine based on the official
 *              orthography rules to perfectly simulate the behavior of professional keyboards like Laban Key.
 * @author Gemini AI
 */

// --- SECTION 1: CORE CONSTANTS AND DEFINITIONS ---

const VOWELS = 'aăâeêioôơuưy';
const CONSONANTS = 'bcdfghjklmnpqrstvx';

const VOWEL_TPL = [
    ['a', 'á', 'à', 'ả', 'ã', 'ạ'], ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'], ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
    ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'], ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'], ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
    ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'], ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'], ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'], ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'], ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ']
];

// A reverse-lookup map for quick vowel analysis (e.g., VOWEL_MAP['ệ'] -> { baseIdx: 4, toneIdx: 5 })
const VOWEL_MAP = {};
VOWEL_TPL.forEach((baseArr, baseIdx) => baseArr.forEach((vowel, toneIdx) => VOWEL_MAP[vowel] = { baseIdx, toneIdx }));

const TELEX_TONE_KEYS = {'s': 1, 'f': 2, 'r': 3, 'x': 4, 'j': 5};
const VNI_TONE_KEYS   = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5};
const REMOVE_TONE_KEY = 'z'; // Telex only

// --- SECTION 2: UTILITY FUNCTIONS (THE TOOLKIT) ---

/** Extracts vowels and their indices from a word. */
const getVowels = (word) => {
    const vowelsInWord = [];
    for (let i = 0; i < word.length; i++) {
        if (VOWELS.includes(word[i].toLowerCase())) {
            vowelsInWord.push({ char: word[i], index: i });
        }
    }
    return vowelsInWord;
};

/** Checks if a word contains any tone mark. */
const hasTone = (word) => getVowels(word).some(v => (VOWEL_MAP[v.char.toLowerCase()]?.toneIdx || 0) !== 0);

/** Removes all tone marks from a word. */
const removeTone = (word) => {
    return word.split('').map(char => {
        const vowelInfo = VOWEL_MAP[char.toLowerCase()];
        if (vowelInfo && vowelInfo.toneIdx !== 0) {
            const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
            return char.toLowerCase() === char ? baseVowel : baseVowel.toUpperCase();
        }
        return char;
    }).join('');
};

// --- SECTION 3: CORE LOGIC - ACCENT PLACEMENT (RULE-BASED) ---

/**
 * Implements the official accent placement rules (Chuẩn Bộ Giáo dục) to find the correct vowel for the tone mark.
 * @param {string} word The word to be analyzed.
 * @returns {number} The index of the vowel to place the tone on, or -1 if not found.
 */
function findVowelForTone(word) {
    const vowels = getVowels(word);
    if (vowels.length === 0) return -1;

    const lowerWord = word.toLowerCase();
    let mainVowels = vowels;

    // Handle prefixes 'qu-' and 'gi-' by excluding them from vowel analysis.
    if ((lowerWord.startsWith('gi') || lowerWord.startsWith('qu')) && vowels.length > 1) {
        mainVowels = vowels.slice(1);
    }

    const vowelString = mainVowels.map(v => v.char.toLowerCase()).join('');
    const lastCharIsConsonant = CONSONANTS.includes(lowerWord.slice(-1));

    // Rule: Prioritize 'ê' and 'ơ' (in 'ươ'). They always get the tone.
    const eHatIndex = vowelString.indexOf('ê');
    if (eHatIndex !== -1) return mainVowels[eHatIndex].index;
    const uoIndex = vowelString.indexOf('ươ');
    if (uoIndex !== -1) return mainVowels[uoIndex + 1].index; // Place on 'ơ'

    // Rule (Special Cases): For 'oa', 'oe', 'uy', 'ue', tone goes on the second vowel.
    if (['oa', 'oe', 'uy', 'ue'].includes(vowelString)) {
        return mainVowels[1].index;
    }

    // Rule (Nguyên âm đôi + Phụ âm cuối): Tone on the second vowel (e.g., 'muốn', 'tuyến').
    if (mainVowels.length >= 2 && lastCharIsConsonant) {
        return mainVowels[mainVowels.length - 1].index;
    }
    
    // Rule (Nguyên âm đôi, không có phụ âm cuối): Tone on the first vowel (e.g., 'múa', 'lửa').
    if (mainVowels.length >= 2 && !lastCharIsConsonant) {
        return mainVowels[mainVowels.length - 2].index;
    }

    // Rule (1 nguyên âm) & Fallback: Tone on the only/last vowel.
    return mainVowels[mainVowels.length - 1].index;
}

// --- SECTION 4: THE STATE MACHINE - MAIN EVENT PROCESSOR ---

function processKeyEvent(key, buffer, style) {
    // --- STEP 0: HANDLE BACKSPACE (INTELLIGENT UNDO) ---
    if (key === 'backspace') {
        if (!buffer) return '';
        const lastChar = buffer.slice(-1);
        const lastCharLower = lastChar.toLowerCase();

        // Undo tone mark
        const vowelInfo = VOWEL_MAP[lastCharLower];
        if (vowelInfo && vowelInfo.toneIdx !== 0) {
            const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
            return buffer.slice(0, -1) + (lastChar === lastCharLower ? baseVowel : baseVowel.toUpperCase());
        }

        // Undo transformation (e.g., 'đ' -> 'd', 'â' -> 'a')
        const reverseMap = {'đ':'d', 'â':'a', 'ă':'a', 'ê':'e', 'ô':'o', 'ơ':'o', 'ư':'u'};
        if (reverseMap[lastCharLower]) {
            const original = reverseMap[lastCharLower];
            return buffer.slice(0, -1) + (lastChar === lastCharLower ? original : original.toUpperCase());
        }

        // Default: just delete the last character
        return buffer.slice(0, -1);
    }
    
    // Ignore multi-character keys except backspace
    if (key.length > 1) return buffer;

    const keyAction = key.toLowerCase();

    // --- STEP 1: LABAN KEY HEURISTIC (PREVENT INVALID WORDS LIKE 'loĩo') ---
    // If the buffer already has a tone and the user types a vowel, remove the tone first.
    if (VOWELS.includes(keyAction) && hasTone(buffer)) {
        buffer = removeTone(buffer);
    }

    // --- STEP 2: TONE MARKING ---
    const toneKeys = style === 'VNI' ? VNI_TONE_KEYS : TELEX_TONE_KEYS;
    if (toneKeys[keyAction] || (style === 'Telex' && keyAction === REMOVE_TONE_KEY)) {
        const vowelIdx = findVowelForTone(buffer);
        if (vowelIdx !== -1) {
            const vowel = buffer[vowelIdx];
            const vInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vInfo) {
                const newTone = (keyAction === REMOVE_TONE_KEY) ? 0 : toneKeys[keyAction];
                // If pressing the same tone key again, remove tone (and append for Telex)
                if (vInfo.toneIdx === newTone) {
                    const wordWithoutTone = removeTone(buffer);
                    return style === 'Telex' ? wordWithoutTone + key : wordWithoutTone;
                }
                const newVowel = VOWEL_TPL[vInfo.baseIdx][newTone];
                return buffer.substring(0, vowelIdx) + (vowel === vowel.toLowerCase() ? newVowel : newVowel.toUpperCase()) + buffer.substring(vowelIdx + 1);
            }
        }
        if (style === 'VNI') return buffer; // Don't append VNI numbers if they can't be applied
    }

    // --- STEP 3: CHARACTER TRANSFORMATION (TELEX ONLY) ---
    if (style === 'Telex') {
        const lastChar = buffer.slice(-1);
        if (lastChar) {
            // Handle 'w' for ă, ơ, ư and the special 'ươ' case
            if (keyAction === 'w') {
                if (buffer.toLowerCase().endsWith('uo')) { return buffer.slice(0, -2) + 'ươ'; }
                const lastVowelIdx = findVowelForTone(buffer);
                if (lastVowelIdx !== -1) {
                    const vInfo = VOWEL_MAP[buffer[lastVowelIdx].toLowerCase()];
                    const mapping = {0:1, 1:0, 6:8, 8:6, 9:10, 10:9}; // a<>ă, o<>ơ, u<>ư
                    const newBase = mapping[vInfo.baseIdx];
                    if (newBase !== undefined) {
                        const newVowel = VOWEL_TPL[newBase][vInfo.toneIdx];
                        return buffer.substring(0, lastVowelIdx) + newVowel + buffer.substring(lastVowelIdx + 1);
                    }
                }
            }
            // Handle d + d -> đ
            if (lastChar.toLowerCase() === 'd' && keyAction === 'd') {
                return buffer.slice(0, -1) + (lastChar === 'd' ? 'đ' : 'Đ');
            }
            // Handle aa -> â, ee -> ê, oo -> ô
            if (lastChar.toLowerCase() === keyAction && 'aeo'.includes(keyAction)) {
                const vInfo = VOWEL_MAP[lastChar.toLowerCase()];
                const mapping = {0:2, 3:4, 6:7}; // a->â, e->ê, o->ô
                if (mapping[vInfo.baseIdx] !== undefined) {
                    const newVowel = VOWEL_TPL[mapping[vInfo.baseIdx]][vInfo.toneIdx];
                    return buffer.slice(0, -1) + (lastChar === lastChar.toLowerCase() ? newVowel : newVowel.toUpperCase());
                }
            }
        }
    }
    
    // --- STEP 4: DEFAULT APPEND ---
    // If no other rule matched, simply append the character.
    return buffer + key;
}
