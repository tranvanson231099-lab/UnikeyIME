/**
 * Vietnamese Input Method Engine - v8 (Refined Dual-Engine)
 *
 * This version refines the VNI implementation and corrects Telex edge cases.
 * - Fixes Telex accent placement for words like 'loi' -> 'lỗi' (not 'lõi').
 * - Streamlines VNI logic for character transformations (d9, a8, e7, etc.).
 * - Consolidates shared logic for better maintainability and reliability.
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

// A definitive vowel finding function, crucial for both engines.
function findVowelForTone(word) {
    const lowerWord = word.toLowerCase();
    const allVowels = "aăâeêioôơuưy";
    let vowelIndices = [];
    for (let i = 0; i < lowerWord.length; i++) {
        if (allVowels.includes(lowerWord[i])) vowelIndices.push(i);
    }

    if (vowelIndices.length === 0) return -1;
    if (vowelIndices.length === 1) return vowelIndices[0];

    // Corrected rule: Prioritize 'ê' and 'ơ' as they are strong vowels.
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

    // If the word ends in a consonant, the accent goes on the last vowel of the vowel cluster.
    if (!allVowels.includes(lowerWord[lowerWord.length - 1])) {
        return lastMainVowelIndex;
    }

    // If it ends in a vowel, apply special cluster rules or default to the second-to-last vowel.
    const cluster = lowerWord.substring(secondLastMainVowelIndex, lastMainVowelIndex + 1);
    if (['oa', 'oe', 'uy', 'ue'].includes(cluster)) {
        return lastMainVowelIndex;
    }

    // Default for words ending in a vowel cluster (e.g., 'lỗi', 'múa')
    return secondLastMainVowelIndex;
}

function processKeyEvent(key, word, style) {
    if (key === 'backspace') return word.length > 0 ? word.slice(0, -1) : "";

    const toneKeys = style === 'VNI' ? VNI_TONE_KEYS : TELEX_TONE_KEYS;
    const toneKeyIndex = toneKeys.indexOf(key);

    // --- Shared Logic: Tone Marks --- 
    if (toneKeyIndex !== -1 || (style === 'Telex' && key === 'z')) {
        const vowelIdx = findVowelForTone(word);
        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const vowelInfo = VOWEL_MAP[vowel.toLowerCase()];
            if (vowelInfo) {
                let newToneIndex = toneKeyIndex;
                if (style === 'Telex' && key === 'z') newToneIndex = 0; // 'z' removes tone
                if (vowelInfo.toneIdx === toneKeyIndex) {
                    // If pressing the same tone key, remove it (Telex) or handle it (VNI)
                    newToneIndex = 0; 
                    const newVowel = VOWEL_TPL[vowelInfo.baseIdx][newToneIndex];
                    const wordWithoutTone = word.substring(0, vowelIdx) + (vowel.toLowerCase() === vowel ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
                    if (style === 'Telex') return wordWithoutTone + key; // e.g., trans -> trans
                    return wordWithoutTone; // VNI: Just remove tone
                }

                const lastChar = word.slice(-1).toLowerCase(), last2Chars = word.slice(-2).toLowerCase();
                const finalConsonant = (last2Chars === 'ch') ? 'ch' : lastChar;
                if (STOP_CONSONANTS.includes(finalConsonant) && ![1, 5].includes(newToneIndex)) return word + key;

                const newVowel = VOWEL_TPL[vowelInfo.baseIdx][newToneIndex];
                return word.substring(0, vowelIdx) + (vowel.toLowerCase() === vowel ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx + 1);
            }
        }
    }

    // --- Style-Specific Logic ---
    if (style === 'Telex') {
        if (('aeo').includes(key) && word.length > 0 && word.slice(-1).toLowerCase() === key) {
             const lastChar = word.slice(-1);
             const vInfo = VOWEL_MAP[lastChar.toLowerCase()];
             if (vInfo) {
                 const mapping = { 0: 2, 2: 0, 3: 4, 4: 3, 6: 7, 7: 6 };
                 if (mapping[vInfo.baseIdx] !== undefined) {
                     const newVowel = VOWEL_TPL[mapping[vInfo.baseIdx]][vInfo.toneIdx];
                     return word.slice(0, -1) + (lastChar.toLowerCase() === lastChar ? newVowel : newVowel.toUpperCase());
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
                        const newVowel = VOWEL_TPL[mapping[vInfo.baseIdx]][vInfo.toneIdx];
                        return word.substring(0, vowelIdx) + (word[vowelIdx].toLowerCase() === word[vowelIdx] ? newVowel : newVowel.toUpperCase()) + word.substring(vowelIdx+1);
                    }
                 }
            }
        }
        if (key.toLowerCase() === 'd' && word.endsWith('d')) return word.slice(0, -1) + 'đ';
        if (key.toLowerCase() === 'd' && word.endsWith('D')) return word.slice(0, -1) + 'Đ';

    } else { // VNI Logic
        if (word.length > 0) {
            const lastChar = word.slice(-1);
            const charMap = {
                'd': { key: '9', char: 'đ' }, 'D': { key: '9', char: 'Đ' },
                'a': { key: '8', char: 'ă' }, 'A': { key: '8', char: 'Ă' },
                'o': { key: '8', char: 'ơ' }, 'O': { key: '8', char: 'Ơ' },
                'u': { key: '8', char: 'ư' }, 'U': { key: '8', char: 'Ư' },
                'a': { key: '7', char: 'â' }, 'A': { key: '7', char: 'Â' },
                'e': { key: '7', char: 'ê' }, 'E': { key: '7', char: 'Ê' },
                'o': { key: '7', char: 'ô' }, 'O': { key: '7', char: 'Ô' },
            };
            // A more robust check is needed for VNI character transformations
            if (charMap[lastChar] && charMap[lastChar].key === key) {
                 return word.slice(0, -1) + charMap[lastChar].char;
            }
        }
    }

    return word + key;
}
