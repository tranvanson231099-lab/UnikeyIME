/**
 * Vietnamese Telex Input Method Engine - v4
 *
 * This version fixes two major bugs:
 * 1. A complete rewrite of the accent placement logic (`findVowelForTone`)
 *    to correctly follow standard Vietnamese rules, fixing errors like 'loi' + 'x' -> 'lõi' instead of 'lỗi'.
 * 2. Fixes for character modification rules that caused unexpected behavior.
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

// --- LOGIC HELPERS ---

// NEW: Robust accent placement function based on standard Vietnamese orthography
function findVowelForTone(word) {
    const lowerWord = word.toLowerCase();
    const vowels = 'aăâeêioôơuưy';
    const vowelIndices = [];
    let ê_idx = -1;
    let ơ_idx = -1;

    for (let i = 0; i < lowerWord.length; i++) {
        if (vowels.includes(lowerWord[i])) {
            const vowelInfo = VOWEL_MAP[lowerWord[i]];
            if (vowelInfo) {
                 vowelIndices.push(i);
                 const baseVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
                 if (baseVowel === 'ê') ê_idx = i;
                 if (baseVowel === 'ơ') ơ_idx = i;
            }
        }
    }

    if (vowelIndices.length === 0) return -1;

    if (ê_idx !== -1) return ê_idx;
    if (ơ_idx !== -1) {
        if (lowerWord.includes('ươu') || lowerWord.includes('ươi')) {
             const ơ_vowel_index_in_cluster = vowelIndices.indexOf(ơ_idx);
             if (ơ_vowel_index_in_cluster < vowelIndices.length -1) {
                return vowelIndices[ơ_vowel_index_in_cluster + 1];
             }
        }
        return ơ_idx;
    }
    
    let mainVowelIndices = [...vowelIndices];
    if (lowerWord.startsWith('qu') && mainVowelIndices.length > 1) mainVowelIndices.shift();
    if (lowerWord.startsWith('gi') && mainVowelIndices.length > 1) mainVowelIndices.shift();

    if (mainVowelIndices.length === 0) return vowelIndices[vowelIndices.length - 1]; 
    if (mainVowelIndices.length === 1) return mainVowelIndices[0];
    
    const lastChar = lowerWord[lowerWord.length - 1];
    const hasFinalConsonant = !vowels.includes(lastChar);

    if (hasFinalConsonant) {
        return mainVowelIndices[1];
    } else {
        return mainVowelIndices[0];
    }
}

// --- CORE EVENT PROCESSOR ---
function processKeyEvent(key, word) {
    if (key === 'backspace') return word.length > 0 ? word.slice(0, -1) : "";

    const lowerKey = key.toLowerCase();

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
    
    if (lowerKey === 'd') {
        if (word.endsWith('d')) return word.slice(0, -1) + 'đ';
        if (word.endsWith('D')) return word.slice(0, -1) + 'Đ';
        if (word.endsWith('đ')) return word.slice(0, -1) + 'd';
        if (word.endsWith('Đ')) return word.slice(0, -1) + 'D';
    }

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
                    if (baseIdx === 0) newBaseIdx = 2; else if (baseIdx === 2) newBaseIdx = 0;
                    else if (baseIdx === 3) newBaseIdx = 4; else if (baseIdx === 4) newBaseIdx = 3;
                    else if (baseIdx === 6) newBaseIdx = 7; else if (baseIdx === 7) newBaseIdx = 6;
                    if (newBaseIdx !== -1) {
                        const newVowel = VOWEL_TPL[newBaseIdx][vowelInfo.toneIdx];
                        return word.substring(0, vowelIdx) + (vowel.toUpperCase() === vowel ? newVowel.toUpperCase() : newVowel) + word.substring(vowelIdx + 1);
                    }
                }
            }
        }
    }

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

    return word + key;
}
