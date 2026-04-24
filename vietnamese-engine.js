/**
 * Vietnamese Telex Input Method Engine - Final Robust Version
 *
 * This version contains a completely rewritten logic for character modification to fix fundamental flaws
 * related to the 'd' <-> 'đ' toggle and context-aware vowel modification (e.g., 'tràn' + 'a' -> 'trần').
 */

// --- DATA STRUCTURES (Unchanged) ---
const VOWEL_TPL = [
    ["a", "á", "à", "ả", "ã", "ạ"], ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"], ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"], ["ê", "ế", "ề", "ể", "ễ", "ệ"], ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    ["o", "ó", "ò", "ỏ", "õ", "ọ"], ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"], ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    ["u", "ú", "ù", "ủ", "ũ", "ụ"], ["ư", "ứ", "ừ", "ử", "ữ", "ự"], ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"]
];
const TONE_KEYS = ['', 's', 'f', 'r', 'x', 'j'];
const VOWEL_MAP = {};
VOWEL_TPL.forEach((baseArr, baseIdx) => baseArr.forEach((vowel, toneIdx) => VOWEL_MAP[vowel] = { baseIdx, toneIdx }));

// --- LOGIC HELPERS (Unchanged) ---
function findVowelForTone(word) {
    let lastVowelIdx = -1;
    for (let i = word.length - 1; i >= 0; i--) {
        const char = word[i].toLowerCase();
        if (VOWEL_MAP[char]) {
            if (lastVowelIdx === -1) lastVowelIdx = i;
            const vowelInfo = VOWEL_MAP[char];
            if (vowelInfo.baseIdx === 4 || vowelInfo.baseIdx === 8) return i;
        }
    }
    return lastVowelIdx;
}

// --- CORE EVENT PROCESSOR ---
function processKeyEvent(key, word) {
    if (key === 'backspace') return word.length > 0 ? word.slice(0, -1) : "";

    const lowerKey = key.toLowerCase();

    // RULE 1: TONE MODIFICATION (Highest priority, unchanged)
    const toneKeyIndex = TONE_KEYS.indexOf(lowerKey);
    if (toneKeyIndex !== -1 || lowerKey === 'z') {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                const newToneIndex = (lowerKey === 'z' || vowelInfo.toneIdx === toneKeyIndex) ? 0 : toneKeyIndex;
                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][newToneIndex];
                return word.substring(0, vowelIdx) + (vowel.toUpperCase() === vowel ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIdx + 1);
            }
        }
    }

    // RULE 2: CHARACTER MODIFICATION (Rewritten for robustness)

    // NEW: Robust 'd' <-> 'đ' toggle logic
    if (lowerKey === 'd') {
        if (word.endsWith('d')) return word.slice(0, -1) + 'đ';
        if (word.endsWith('D')) return word.slice(0, -1) + 'Đ';
        if (word.endsWith('đ')) return word.slice(0, -1) + 'd';
        if (word.endsWith('Đ')) return word.slice(0, -1) + 'D';
    }

    // NEW: Context-aware vowel modification logic
    if ('aeo'.includes(lowerKey)) {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
                if (lowerKey === baseVowel) {
                    let newBaseIdx = -1;
                    const baseIdx = vowelInfo.baseIdx;
                    if (baseIdx === 0) newBaseIdx = 2; else if (baseIdx === 2) newBaseIdx = 0; // a <-> â
                    else if (baseIdx === 3) newBaseIdx = 4; else if (baseIdx === 4) newBaseIdx = 3; // e <-> ê
                    else if (baseIdx === 6) newBaseIdx = 7; else if (baseIdx === 7) newBaseIdx = 6; // o <-> ô

                    if (newBaseIdx !== -1) {
                        const newVowel = VOWEL_TPL[newBaseIdx][vowelInfo.toneIdx];
                        return word.substring(0, vowelIdx) + (vowel.toUpperCase() === vowel ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIdx + 1);
                    }
                }
            }
        }
    }

    // 'w' rule (Unchanged, placed after specific toggles)
    if (lowerKey === 'w') {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx].toLowerCase(); const vInfo = VOWEL_MAP[vowel];
            if (vInfo && vInfo.baseIdx === 0 && vowelIdx > 0 && VOWEL_MAP[word[vowelIdx - 1].toLowerCase()]?.baseIdx === 9 && !(vowelIdx > 1 && word[vowelIdx - 2].toLowerCase() === 'q')) {
                const uVowel = word[vowelIdx - 1]; const uVowelInfo = VOWEL_MAP[uVowel.toLowerCase()];
                const newVowel = VOWEL_TPL[10][uVowelInfo.toneIdx];
                return word.substring(0, vowelIdx - 1) + (uVowel.toUpperCase() === uVowel ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIdx);
            }
            let newBaseIdx = -1;
            if (vInfo.baseIdx === 0) newBaseIdx = 1; else if (vInfo.baseIdx === 6) newBaseIdx = 8; else if (vInfo.baseIdx === 9) newBaseIdx = 10;
            if (newBaseIdx !== -1) {
                const newVowel = VOWEL_TPL[newBaseIdx][vInfo.toneIdx];
                return word.substring(0, vowelIdx) + (word[vowelIdx].toUpperCase() === word[vowelIdx] ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIdx + 1);
            }
        }
    }

    // RULE 3: DEFAULT APPEND
    return word + key;
}
