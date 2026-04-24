/**
 * Vietnamese Telex Input Method Engine - v6 (Feature-Rich & Stable)
 *
 * This version introduces key features and robust error handling:
 * 1. Adds support for toggling accents with repeated vowels (aa <> â, ee <> ê, oo <> ô).
 * 2. Smartly handles tone keys: pressing a tone key on a word with that tone will remove the tone
 *    and append the key as a character (e.g., 'trán' + 's' -> 'trans').
 * 3. Enforces orthographic rules for tones on words ending with stop consonants (c, ch, p, t).
 */

const VOWEL_TPL = [
    ["a", "á", "à", "ả", "ã", "ạ"], ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"], ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"], ["ê", "ế", "ề", "ể", "ễ", "ệ"], ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    ["o", "ó", "ò", "ỏ", "õ", "ọ"], ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"], ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    ["u", "ú", "ù", "ủ", "ũ", "ụ"], ["ư", "ứ", "ừ", "ử", "ữ", "ự"], ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"]
];
const TONE_KEYS = ['', 's', 'f', 'r', 'x', 'j'];
const VOWEL_MAP = {};
VOWEL_TPL.forEach((baseArr, baseIdx) => baseArr.forEach((vowel, toneIdx) => VOWEL_MAP[vowel] = { baseIdx, toneIdx }));

function findVowelForTone(word) {
    const lowerWord = word.toLowerCase();
    const allVowels = "aăâeêioôơuưy";
    let vowelIndices = [];
    for (let i = 0; i < lowerWord.length; i++) {
        if (allVowels.includes(lowerWord[i])) {
            vowelIndices.push(i);
        }
    }

    if (vowelIndices.length === 0) return -1;
    if (vowelIndices.length === 1) return vowelIndices[0];

    const e_hat_index = lowerWord.indexOf('ê');
    if (e_hat_index !== -1) return e_hat_index;
    const o_hook_index = lowerWord.indexOf('ơ');
    if (o_hook_index !== -1) {
        if (lowerWord.includes('ươu') || lowerWord.includes('ươi')) return o_hook_index + 1;
        return o_hook_index;
    }

    let mainVowelIndices = [...vowelIndices];
    if (lowerWord.startsWith("qu") || lowerWord.startsWith("gi")) {
        if (mainVowelIndices.length > 1) mainVowelIndices.shift();
    }

    if (mainVowelIndices.length === 1) return mainVowelIndices[0];
    const lastMainVowelIndex = mainVowelIndices[mainVowelIndices.length - 1];
    const secondLastMainVowelIndex = mainVowelIndices[mainVowelIndices.length - 2];

    if (!allVowels.includes(lowerWord[lowerWord.length - 1])) {
        return lastMainVowelIndex;
    }

    const cluster = lowerWord.substring(secondLastMainVowelIndex, lastMainVowelIndex + 1);
    if (['oa', 'oe', 'uy', 'ue'].includes(cluster)) {
        return lastMainVowelIndex;
    }

    return secondLastMainVowelIndex;
}

function processKeyEvent(key, word) {
    if (key === 'backspace') return word.length > 0 ? word.slice(0, -1) : "";

    const lowerKey = key.toLowerCase();

    // Feature: aa -> â, ee -> ê, oo -> ô (and toggle back)
    if (('aeo').includes(lowerKey) && word.length > 0) {
        const lastChar = word[word.length - 1];
        const lastCharLower = lastChar.toLowerCase();
        if (lastCharLower === lowerKey) {
            const vowelInfo = VOWEL_MAP[lastCharLower];
            if (vowelInfo && [0, 2, 3, 4, 6, 7].includes(vowelInfo.baseIdx)) {
                const mapping = { 0: 2, 2: 0, 3: 4, 4: 3, 6: 7, 7: 6 }; // a<>â, e<>ê, o<>ô
                const newBaseIdx = mapping[vowelInfo.baseIdx];
                const newVowel = VOWEL_TPL[newBaseIdx][vowelInfo.toneIdx];
                return word.slice(0, -1) + (lastChar === lastCharLower ? newVowel : newVowel.toUpperCase());
            }
        }
    }

    // Feature: Tone key handling (apply, remove, or reject)
    const toneKeyIndex = TONE_KEYS.indexOf(lowerKey);
    if (toneKeyIndex !== -1) {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                // Smart tone removal: If pressing the same tone key, remove tone and append key
                if (vowelInfo.toneIdx === toneKeyIndex) {
                    const newVowel = VOWEL_TPL[vowelInfo.baseIdx][0]; // Vowel with no tone
                    const wordWithoutTone = word.substring(0, vowelIdx) + (vowel === vowel.toLowerCase() ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
                    return wordWithoutTone + key; // Append the key (e.g., s, f)
                }

                // Rule: Check for invalid tones on words ending with c, ch, p, t
                const lastChar = word.length > 0 ? word.slice(-1).toLowerCase() : '';
                const last2Chars = word.length > 1 ? word.slice(-2).toLowerCase() : '';
                const finalConsonant = (last2Chars === 'ch') ? 'ch' : lastChar;
                if (['c', 'p', 't', 'ch'].includes(finalConsonant)) {
                    if (toneKeyIndex !== 1 /*sắc*/ && toneKeyIndex !== 5 /*nặng*/) {
                        return word + key; // Reject tone, append key
                    }
                }

                // Apply new tone
                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][toneKeyIndex];
                return word.substring(0, vowelIdx) + (vowel === vowel.toLowerCase() ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
            }
        }
    }

    // Tone removal with 'z'
    if (lowerKey === 'z') {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo && vowelInfo.toneIdx !== 0) {
                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][0];
                return word.substring(0, vowelIdx) + (vowel === vowel.toLowerCase() ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
            }
        }
    }

    // Other transformations (d -> đ, w -> ă/ơ/ư)
    if (lowerKey === 'd' && word.endsWith('d')) return word.slice(0, -1) + 'đ';
    if (lowerKey === 'd' && word.endsWith('D')) return word.slice(0, -1) + 'Đ';

    if (lowerKey === 'w') {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx].toLowerCase();
            const vInfo = VOWEL_MAP[vowel];
            if (vInfo) {
                const mapping = { 0: 1, 6: 8, 9: 10 }; // a->ă, o->ơ, u->ư
                if (mapping[vInfo.baseIdx] !== undefined) {
                     const newBaseIdx = mapping[vInfo.baseIdx];
                     const newVowel = VOWEL_TPL[newBaseIdx][vInfo.toneIdx];
                     return word.substring(0, vowelIdx) + (word[vowelIdx] === word[vowelIdx].toLowerCase() ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
                }
            }
        }
    }

    return word + key;
}
