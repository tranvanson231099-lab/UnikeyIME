/**
 * Vietnamese Input Method Engine - v13 (Laban Key Inspired Logic)
 *
 * This version is a major refactoring to mimic the intelligent behavior of professional keyboards like Laban Key.
 * The core philosophy is to prioritize valid Vietnamese syllables and prevent the creation of nonsensical words.
 *
 * KEY IMPROVEMENTS:
 * 1.  **Invalid Word Prevention (The "loĩo" fix):** The engine now follows a critical heuristic: if appending a
 *     vowel to a word that already has a tone mark would create an invalid syllable (e.g., 'loĩ' + 'o'),
 *     it automatically removes the tone from the base word *before* appending the new vowel (i.e., 'loi' + 'o' -> 'loio').
 *     This is the core principle of Laban Key and eliminates a whole class of typing errors.
 * 2.  **Robust Transformation & Tone Logic:** The order of operations is now stricter, evaluating tone keys,
 *     transformation keys, and appends in a clear, prioritized sequence, preventing rule conflicts.
 * 3.  **Intelligent Backspace Maintained:** The stateless "undo" functionality from v12 is preserved and refined,
 *     allowing for natural correction of tones and character transformations.
 * 4.  **Refined 'w' Key Logic:** The fix for "duoc" -> "dươc" from v12 is integrated into the new, robust engine.
 */

var VOWEL_TPL = [
    ["a", "á", "à", "ả", "ã", "ạ"], ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"], ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"], ["ê", "ế", "ề", "ể", "ễ", "ệ"], ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    ["o", "ó", "ò", "ỏ", "õ", "ọ"], ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"], ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    ["u", "ú", "ù", "ủ", "ũ", "ụ"], ["ư", "ứ", "ừ", "ử", "ữ", "ự"], ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"]
];
var VOWEL_MAP = {};
VOWEL_TPL.forEach((baseArr, baseIdx) => baseArr.forEach((vowel, toneIdx) => VOWEL_MAP[vowel] = { baseIdx, toneIdx }));

var TELEX_TONE_KEYS = ['', 's', 'f', 'r', 'x', 'j'];
var VNI_TONE_KEYS = ['', '1', '2', '3', '4', '5'];

// Helper to check if a word contains a tone mark
function hasTone(word) {
    return word.split('').some(char => {
        const vowelInfo = VOWEL_MAP[char.toLowerCase()];
        return vowelInfo && vowelInfo.toneIdx !== 0;
    });
}

// Helper to remove all tone marks from a word
function removeTone(word) {
    let result = '';
    for (const char of word) {
        const lowerChar = char.toLowerCase();
        const vowelInfo = VOWEL_MAP[lowerChar];
        if (vowelInfo && vowelInfo.toneIdx !== 0) {
            const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
            result += (char === lowerChar) ? baseVowel : baseVowel.toUpperCase();
        } else {
            result += char;
        }
    }
    return result;
}

function findVowelForTone(word) {
    const lowerWord = word.toLowerCase();
    const allVowels = "aăâeêioôơuưy";
    let vowels = [];
    for (let i = 0; i < lowerWord.length; i++) {
        if (allVowels.includes(lowerWord[i])) {
            vowels.push({ char: lowerWord[i], index: i });
        }
    }

    if (vowels.length === 0) return -1;

    // Prioritize 'ươ' digraph
    const uoIndex = lowerWord.lastIndexOf('ươ');
    if (uoIndex !== -1) {
        // Special case: if followed by 'u' or 'i', target the next vowel (ơ)
        if (lowerWord[uoIndex + 2] === 'u' || lowerWord[uoIndex + 2] === 'i') {
            return uoIndex + 1;
        }
        return uoIndex + 1; // Target 'ơ' in 'ươ'
    }

    // Prioritize 'ê' and 'ô'
    const eHatIndex = lowerWord.lastIndexOf('ê');
    if (eHatIndex !== -1) return eHatIndex;
    const oHatIndex = lowerWord.lastIndexOf('ô');
    if (oHatIndex !== -1) return oHatIndex;
    
    // Default to the second-to-last vowel in a cluster at the end of the word
    const lastCharIsVowel = allVowels.includes(lowerWord.slice(-1));
    if (lastCharIsVowel && vowels.length > 1) {
        const secondLastVowel = vowels[vowels.length - 2];
         // But if it's a 'oa, oe, uy, ue' cluster, target the last vowel
        const cluster = secondLastVowel.char + vowels[vowels.length - 1].char;
        if (['oa', 'oe', 'uy', 'ue'].includes(cluster)) {
             return vowels[vowels.length-1].index;
        }
        return secondLastVowel.index;
    }

    // Otherwise, target the last vowel found
    return vowels[vowels.length - 1].index;
}

function processKeyEvent(key, word, style) {
    // Block invalid multi-character keys except backspace
    if (key.length > 1 && key !== 'backspace') {
        return word;
    }

    if (key === 'backspace') {
        if (!word) return "";
        // Reuse the robust stateless backspace logic
        const lastChar = word.slice(-1).toLowerCase();
        const vowelInfo = VOWEL_MAP[lastChar];
        if (vowelInfo && vowelInfo.toneIdx !== 0) {
            const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
            return word.slice(0, -1) + (word.slice(-1) === lastChar ? baseVowel : baseVowel.toUpperCase());
        }
        const reverseTransform = { 'â': 'a', 'ă': 'a', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u', 'đ': 'd' };
        if (reverseTransform[lastChar]) {
            const original = reverseTransform[lastChar];
            return word.slice(0, -1) + (word.slice(-1) === lastChar ? original : original.toUpperCase());
        }
        return word.slice(0, -1);
    }

    const keyAction = key.toLowerCase();
    const toneKeys = style === 'VNI' ? VNI_TONE_KEYS : TELEX_TONE_KEYS;
    const toneKeyIndex = toneKeys.indexOf(keyAction);

    // --- 1. TONE MARKING ---
    if (toneKeyIndex !== -1 || (style === 'Telex' && keyAction === 'z')) {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                const newTone = (style === 'Telex' && keyAction === 'z') ? 0 : toneKeyIndex;
                if (vowelInfo.toneIdx === newTone && newTone !== 0) { // Pressing same tone key
                    const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
                    const wordWithoutTone = word.substring(0, vowelIdx) + (vowel.toLowerCase() === vowel ? baseVowel : baseVowel.toUpperCase()) + word.substring(vowelIdx + 1);
                    return style === 'Telex' ? wordWithoutTone + key : wordWithoutTone; // Append key for telex
                }
                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][newTone];
                return word.substring(0, vowelIdx) + (vowel.toLowerCase() === vowel ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
            }
        }
        if (style === 'VNI' && toneKeyIndex !== -1) return word; // Don't append VNI tone numbers
    }

    // --- 2. CHARACTER TRANSFORMATION ---
    if (style === 'Telex') {
        const lastChar = word.slice(-1);
        if (lastChar) {
            if (keyAction === 'w') {
                // 'uo' + 'w' -> 'ươ'
                if (word.toLowerCase().endsWith('uo')) {
                    const tone = VOWEL_MAP[word.slice(-1).toLowerCase()].toneIdx;
                    return word.slice(0, -2) + 'ươ'.split('').map((c, i) => VOWEL_TPL[VOWEL_MAP[c].baseIdx][i === 1 ? tone : 0]).join('');
                }
                // a/o/u + w -> ă/ơ/ư
                const lastVowelIdx = findVowelForTone(word);
                if (lastVowelIdx !== -1) {
                    const vowelInfo = VOWEL_MAP[word[lastVowelIdx].toLowerCase()];
                    const mapping = {0: 1, 1: 0, 6: 8, 8: 6, 9: 10, 10: 9}; // a<>ă, o<>ơ, u<>ư
                    const newBase = mapping[vowelInfo.baseIdx];
                    if (newBase !== undefined) {
                        const newVowel = VOWEL_TPL[newBase][vowelInfo.toneIdx];
                        return word.substring(0, lastVowelIdx) + newVowel + word.substring(lastVowelIdx + 1);
                    }
                }
            }
            // d + d -> đ
            if (lastChar.toLowerCase() === 'd' && keyAction === 'd') return word.slice(0, -1) + (lastChar === 'd' ? 'đ' : 'Đ');
            // a/e/o + a/e/o -> â/ê/ô
            if (lastChar.toLowerCase() === keyAction && 'aeo'.includes(keyAction)) {
                const vInfo = VOWEL_MAP[lastChar.toLowerCase()];
                const mapping = {0: 2, 3: 4, 6: 7}; // a->â, e->ê, o->ô
                const newBase = mapping[vInfo.baseIdx];
                if (newBase !== undefined) {
                    const newVowel = VOWEL_TPL[newBase][vInfo.toneIdx];
                    return word.slice(0, -1) + (lastChar === lastChar.toLowerCase() ? newVowel : newVowel.toUpperCase());
                }
            }
        }
    }

    // --- 3. DEFAULT APPEND (with Laban Key Heuristic) ---
    const isVowelKey = "aăâeêioôơuưy".includes(keyAction);
    if (isVowelKey && hasTone(word)) {
        return removeTone(word) + key;
    }

    return word + key;
}
