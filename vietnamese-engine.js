/**
 * Vietnamese Telex Input Method Engine - Final Version
 * 
 * This engine is built from scratch with a robust, rule-based hierarchy to correctly handle complex cases.
 * It prioritizes tone modification, followed by character modification, ensuring predictable behavior.
 */

// --- DATA STRUCTURES ---

// Defines all Vietnamese vowel forms, grouped by base vowel for easy manipulation.
const VOWEL_TPL = [
    ["a", "á", "à", "ả", "ã", "ạ"], // 0
    ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"], // 1
    ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"], // 2
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"], // 3
    ["ê", "ế", "ề", "ể", "ễ", "ệ"], // 4
    ["i", "í", "ì", "ỉ", "ĩ", "ị"], // 5
    ["o", "ó", "ò", "ỏ", "õ", "ọ"], // 6
    ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"], // 7
    ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"], // 8
    ["u", "ú", "ù", "ủ", "ũ", "ụ"], // 9
    ["ư", "ứ", "ừ", "ử", "ữ", "ự"], // 10
    ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"]  // 11
];
const TONE_KEYS = ['', 's', 'f', 'r', 'x', 'j'];

// A pre-built map for fast lookups. Maps any vowel character (e.g., 'ằ') 
// to its properties { baseIdx: 1, toneIdx: 2 }.
const VOWEL_MAP = {};
VOWEL_TPL.forEach((baseArr, baseIdx) => {
    baseArr.forEach((vowel, toneIdx) => {
        VOWEL_MAP[vowel] = { baseIdx, toneIdx };
    });
});

// --- LOGIC HELPERS ---

/**
 * Finds the correct vowel in a word to place a tone on, using Vietnamese orthography heuristics.
 */
function findVowelForTone(word) {
    let lastVowelIdx = -1;
    for (let i = word.length - 1; i >= 0; i--) {
        const char = word[i].toLowerCase();
        if (VOWEL_MAP[char]) {
            if (lastVowelIdx === -1) lastVowelIdx = i;
            const vowelInfo = VOWEL_MAP[char];
            // Prioritize 'ê' and 'ơ' as they almost always carry the tone.
            if (vowelInfo.baseIdx === 4 || vowelInfo.baseIdx === 8) return i;
        }
    }
    return lastVowelIdx;
}

// --- CORE EVENT PROCESSOR ---

function processKeyEvent(key, word) {
    if (key === 'backspace') {
        return word.length > 0 ? word.slice(0, -1) : "";
    }

    const lowerKey = key.toLowerCase();
    const lastChar = word.slice(-1);

    // RULE 1: TONE MODIFICATION (s, f, r, x, j, z)
    // This is the highest priority rule. It adds, changes, or removes tones.
    const toneKeyIndex = TONE_KEYS.indexOf(lowerKey);
    if (toneKeyIndex !== -1 || lowerKey === 'z') {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                // New tone is 'none' (index 0) if 'z' is pressed or the same tone key is pressed again.
                const newToneIndex = (lowerKey === 'z' || vowelInfo.toneIdx === toneKeyIndex) ? 0 : toneKeyIndex;
                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][newToneIndex];
                const isUpper = vowel === vowel.toUpperCase();
                return word.substring(0, vowelIdx) + (isUpper ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIdx + 1);
            }
        }
    }

    // RULE 2: CHARACTER MODIFICATION (w, aa, dd, etc.)
    // This rule is applied only if the key is NOT a tone key.

    // Handle 'w' key for (a,o,u) -> (ă,ơ,ư)
    if (lowerKey === 'w') {
        const lastVowelIdx = findVowelForTone(word);
        if (lastVowelIdx !== -1) {
            const lastVowel = word[lastVowelIdx].toLowerCase();
            const lastVowelInfo = VOWEL_MAP[lastVowel];

            // Case `chua` + `w` -> `chưa`. Check for `ua` not preceded by `q`.
            if (lastVowelInfo.baseIdx === 0 && lastVowelIdx > 0 && VOWEL_MAP[word[lastVowelIdx-1].toLowerCase()]?.baseIdx === 9) {
                 if (lastVowelIdx > 1 && word[lastVowelIdx-2].toLowerCase() === 'q') {
                     // Case `qua`+`w` -> `quă`. Fall through to default 'a' rule.
                 } else {
                    const uVowel = word[lastVowelIdx-1];
                    const uVowelInfo = VOWEL_MAP[uVowel.toLowerCase()];
                    const newVowel = VOWEL_TPL[10][uVowelInfo.toneIdx]; // 10 is 'ư'
                    const isUpper = uVowel === uVowel.toUpperCase();
                    return word.substring(0, lastVowelIdx-1) + (isUpper ? newVowel.toUpperCase() : newVowel) + word.substring(lastVowelIdx);
                 }
            }

            // Default `w` rule for a, o, u.
            let newBaseIdx = -1;
            if (lastVowelInfo.baseIdx === 0) newBaseIdx = 1;      // a -> ă
            else if (lastVowelInfo.baseIdx === 6) newBaseIdx = 8; // o -> ơ
            else if (lastVowelInfo.baseIdx === 9) newBaseIdx = 10;// u -> ư

            if (newBaseIdx !== -1) {
                const newVowel = VOWEL_TPL[newBaseIdx][lastVowelInfo.toneIdx];
                const isUpper = word[lastVowelIdx] === word[lastVowelIdx].toUpperCase();
                return word.substring(0, lastVowelIdx) + (isUpper ? newVowel.toUpperCase() : newVowel) + word.substring(lastVowelIdx + 1);
            }
        }
    }

    // Handle doubled characters for (a,e,o,d) -> (â,ê,ô,đ) with toggling.
    if (lowerKey === lastChar.toLowerCase()) {
        const vowelInfo = VOWEL_MAP[lastChar.toLowerCase()];
        if (vowelInfo) {
            const baseIdx = vowelInfo.baseIdx;
            let newBaseIdx = -1;
            // Toggling pairs
            if (baseIdx === 0) newBaseIdx = 2; else if (baseIdx === 2) newBaseIdx = 0; // a <-> â
            else if (baseIdx === 3) newBaseIdx = 4; else if (baseIdx === 4) newBaseIdx = 3; // e <-> ê
            else if (baseIdx === 6) newBaseIdx = 7; else if (baseIdx === 7) newBaseIdx = 6; // o <-> ô

            if (newBaseIdx !== -1) {
                const newVowel = VOWEL_TPL[newBaseIdx][vowelInfo.toneIdx];
                return word.slice(0, -1) + (lastChar === lastChar.toUpperCase() ? newVowel.toUpperCase() : newVowel);
            }
        } else if (lowerKey === 'd') {
            // Toggle d <-> đ
            return word.slice(0, -1) + (lastChar === 'd' ? 'đ' : (lastChar === 'D' ? 'D' : 'd'));
        }
    }

    // RULE 3: DEFAULT APPEND
    // If no rules matched, just append the character.
    return word + key;
}
