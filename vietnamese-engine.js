/**
 * Vietnamese Input Method Engine - v7 (Dual-Engine: Telex & VNI)
 *
 * This is the final, complete engine. It now supports both Telex and VNI typing styles.
 * - The main function `processKeyEvent` now takes a `style` parameter ('Telex' or 'VNI').
 * - It uses a shared `findVowelForTone` function for accurate accent placement for both styles.
 * - Code is organized to handle Telex and VNI rules separately for clarity and maintainability.
 */

const VOWEL_TPL = [
    ["a", "á", "à", "ả", "ã", "ạ"], ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"], ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"], ["ê", "ế", "ề", "ể", "ễ", "ệ"], ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    ["o", "ó", "ò", "ỏ", "õ", "ọ"], ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"], ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    ["u", "ú", "ù", "ủ", "ũ", "ụ"], ["ư", "ứ", "ừ", "ử", "ữ", "ự"], ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"]
];

const VOWEL_MAP = {};
VOWEL_TPL.forEach((baseArr, baseIdx) => baseArr.forEach((vowel, toneIdx) => VOWEL_MAP[vowel] = { baseIdx, toneIdx }));

const TELEX_TONE_KEYS = ['', 's', 'f', 'r', 'x', 'j'];
const VNI_TONE_KEYS = ['', '1', '2', '3', '4', '5'];
const STOP_CONSONANTS = ['c', 'p', 't', 'ch'];

// This accent placement function is shared by both Telex and VNI.
function findVowelForTone(word) {
    const lowerWord = word.toLowerCase();
    const allVowels = "aăâeêioôơuưy";
    let vowelIndices = [];
    for (let i = 0; i < lowerWord.length; i++) {
        if (allVowels.includes(lowerWord[i])) vowelIndices.push(i);
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
    if ((lowerWord.startsWith("qu") || lowerWord.startsWith("gi")) && mainVowelIndices.length > 1) {
        mainVowelIndices.shift();
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

// The main processing function, now with a 'style' parameter.
function processKeyEvent(key, word, style) {
    if (key === 'backspace') return word.length > 0 ? word.slice(0, -1) : "";

    // --- Shared Logic: Tone Application and Removal ---
    const toneKeys = style === 'VNI' ? VNI_TONE_KEYS : TELEX_TONE_KEYS;
    const toneKeyIndex = toneKeys.indexOf(key);

    if (toneKeyIndex !== -1 || (style === 'Telex' && key === 'z')) {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                 // Smart tone removal for both styles
                if (vowelInfo.toneIdx === toneKeyIndex || (style === 'Telex' && key === 'z')) {
                    const newToneIndex = (key === 'z' || (style === 'VNI' && key === '0')) ? 0 : vowelInfo.toneIdx; // VNI '0' to remove tone
                    const newVowel = VOWEL_TPL[vowelInfo.baseIdx][newToneIndex];
                    const wordWithoutTone = word.substring(0, vowelIdx) + (vowel.toLowerCase() === vowel ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
                    // Only append key if it's not a tone key (e.g., 's' in 'trans')
                    if (vowelInfo.toneIdx === toneKeyIndex && style === 'Telex') return wordWithoutTone + key;
                    return wordWithoutTone;
                }
                // Check for invalid tones
                const lastChar = word.slice(-1).toLowerCase();
                const last2Chars = word.slice(-2).toLowerCase();
                const finalConsonant = (last2Chars === 'ch') ? 'ch' : lastChar;
                if (STOP_CONSONANTS.includes(finalConsonant) && ![1, 5].includes(toneKeyIndex)) {
                    return word + key;
                }
                // Apply new tone
                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][toneKeyIndex];
                return word.substring(0, vowelIdx) + (vowel.toLowerCase() === vowel ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
            }
        }
    }

    // --- Style-Specific Logic ---
    if (style === 'Telex') {
        // Telex-specific rules (aa -> â, etc.)
        if (('aeo').includes(key) && word.length > 0) {
            const lastChar = word[word.length - 1];
            if (lastChar.toLowerCase() === key) {
                const vowelInfo = VOWEL_MAP[lastChar.toLowerCase()];
                if (vowelInfo) {
                    const mapping = { 0: 2, 2: 0, 3: 4, 4: 3, 6: 7, 7: 6 };
                    if (mapping[vowelInfo.baseIdx] !== undefined) {
                         const newBaseIdx = mapping[vowelInfo.baseIdx];
                         const newVowel = VOWEL_TPL[newBaseIdx][vowelInfo.toneIdx];
                         return word.slice(0, -1) + (lastChar === lastChar.toLowerCase() ? newVowel : newVowel.toUpperCase());
                    }
                }
            }
        }
        if (key === 'w') {
            const vowelIdx = findVowelForTone(word);
            if (vowelIdx !== -1) {
                 const vowel = word[vowelIdx].toLowerCase();
                 const vInfo = VOWEL_MAP[vowel];
                 if (vInfo) {
                    const mapping = { 0: 1, 6: 8, 9: 10 };
                    if (mapping[vInfo.baseIdx] !== undefined) {
                         const newBaseIdx = mapping[vInfo.baseIdx];
                         const newVowel = VOWEL_TPL[newBaseIdx][vInfo.toneIdx];
                         return word.substring(0, vowelIdx) + (word[vowelIdx] === word[vowelIdx].toLowerCase() ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
                    }
                 }
            }
        }
    } else { // VNI
        // VNI-specific rules (d9 -> đ, etc.)
        if (key === '9') return word.slice(0, -1) + (word.slice(-1) === 'd' ? 'đ' : (word.slice(-1) === 'D' ? 'Đ' : word.slice(-1)+'9'));
        if (key === '8') {
            const lastChar = word.slice(-1).toLowerCase();
            if (lastChar === 'a') return word.slice(0, -1) + (word.slice(-1) === 'a' ? 'ă' : 'Ă');
            if (lastChar === 'o') return word.slice(0, -1) + (word.slice(-1) === 'o' ? 'ơ' : 'Ơ');
            if (lastChar === 'u') return word.slice(0, -1) + (word.slice(-1) === 'u' ? 'ư' : 'Ư');
        }
        if (key === '7') {
            const lastChar = word.slice(-1).toLowerCase();
            if (lastChar === 'a') return word.slice(0, -1) + (word.slice(-1) === 'a' ? 'â' : 'Â');
            if (lastChar === 'e') return word.slice(0, -1) + (word.slice(-1) === 'e' ? 'ê' : 'Ê');
            if (lastChar === 'o') return word.slice(0, -1) + (word.slice(-1) === 'o' ? 'ô' : 'Ô');
        }
    }

    if (key === 'd' && style === 'Telex' && word.endsWith('d')) return word.slice(0, -1) + 'đ';
    if (key === 'd' && style === 'Telex' && word.endsWith('D')) return word.slice(0, -1) + 'Đ';

    // If no rule matched, just append the key.
    return word + key;
}
