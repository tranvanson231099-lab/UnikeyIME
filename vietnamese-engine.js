/**
 * @name vietnamese-engine.js
 * @version 42.0.0 (Tone Correction Fix)
 * @description This version fixes a critical bug where changing a word's tone was not possible if the word ended with a
 *              superfluous tone character (e.g., trying to change 'hoans' to 'hoàn'). The engine now correctly strips the
 *              old tone character before applying the new one.
 * @author Gemini AI
 */

class VietnameseEngine {
    // --- SECTION 1: INITIALIZATION & CONSTANTS ---

    constructor() {
        this.VOWEL_TPL = [
            ['a', 'á', 'à', 'ả', 'ã', 'ạ'], ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'], ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
            ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'], ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'], ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
            ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'], ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'], ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
            ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'], ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'], ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ']
        ];
        
        this.VOWEL_MAP = {};
        this.VOWEL_TPL.forEach((baseArr, baseIdx) => baseArr.forEach((vowel, toneIdx) => {
            this.VOWEL_MAP[vowel] = { base: baseArr[0], baseIdx, toneIdx };
        }));

        this.CONSONANTS = 'bcdfghjklmnpqrstvx';
        this.TELEX_TONE_KEYS = {'s': 1, 'f': 2, 'r': 3, 'x': 4, 'j': 5};
        this.REMOVE_TONE_KEY = 'z';

        this.errorCorrectionDict = {
            'loio': 'lôi', 'loixo': 'lỗi', 'vanw': 'văn', 'sonw': 'sơn',
            'duocw': 'được', 'dduocw': 'được'
        };

        this.process = this.process.bind(this);
    }

    // --- SECTION 2: PUBLIC API & CORRECTION LOGIC ---

    _checkErrorCorrection(buffer) {
        const corrected = this.errorCorrectionDict[buffer.toLowerCase()];
        return corrected ? this._matchCase(corrected, buffer) : buffer;
    }

    process(buffer, key) {
        buffer = String(buffer || '');
        key = String(key || '');

        if (key === 'backspace') return this._handleBackspace(buffer);
        if (key.length > 1) return buffer;

        const potentialSequence = buffer + key;
        const sequenceCorrection = this.errorCorrectionDict[potentialSequence.toLowerCase()];
        if (sequenceCorrection) {
            return this._matchCase(sequenceCorrection, potentialSequence);
        }

        let newBuffer;

        newBuffer = this._applyTransform(buffer, key);
        if (newBuffer !== null) return this._checkErrorCorrection(newBuffer);

        newBuffer = this._applyTone(buffer, key);
        if (newBuffer !== null) return this._checkErrorCorrection(newBuffer);

        if (this._isVowel(key) && this._hasTone(buffer)) {
            newBuffer = this._removeTone(buffer) + key;
            return this._checkErrorCorrection(newBuffer);
        }

        newBuffer = buffer + key;
        return this._checkErrorCorrection(newBuffer);
    }

    // --- SECTION 3: PRIVATE HELPERS - CORE LOGIC ---

    _isVowel(char) {
        return this.VOWEL_MAP[char.toLowerCase()] !== undefined;
    }

    _matchCase(char, toMatch) {
        const firstCharOfMatch = toMatch.length > 0 ? toMatch[0] : '';
        const isUpperCase = firstCharOfMatch.toLowerCase() !== firstCharOfMatch;
        return isUpperCase ? char.toUpperCase() : char.toLowerCase();
    }

    _handleBackspace(buffer) {
        if (!buffer) return '';
        const lastChar = buffer.slice(-1);
        
        if (this._isVowel(lastChar)) {
            const vInfo = this.VOWEL_MAP[lastChar.toLowerCase()];
            if (vInfo && vInfo.toneIdx !== 0) {
                const baseVowel = this.VOWEL_TPL[vInfo.baseIdx][0];
                return buffer.slice(0, -1) + this._matchCase(baseVowel, lastChar);
            }
        }
        
        const reverseMap = {'đ':'d','â':'a','ă':'a','ê':'e','ô':'o','ơ':'o','ư':'u'};
        const original = reverseMap[lastChar.toLowerCase()];
        if (original) {
            if (buffer.toLowerCase().endsWith('ươ')) return buffer.slice(0, -2) + this._matchCase('uo', buffer.slice(-2));
            return buffer.slice(0, -1) + this._matchCase(original, lastChar);
        }

        return buffer.slice(0, -1);
    }

    _applyTone(buffer, key) {
        const keyAction = key.toLowerCase();
        const tone = this.TELEX_TONE_KEYS[keyAction];
        const isRemoveToneKey = keyAction === this.REMOVE_TONE_KEY;

        if (tone === undefined && !isRemoveToneKey) return null;

        let workBuffer = buffer;
        const lastChar = workBuffer.length > 0 ? workBuffer.slice(-1).toLowerCase() : null;

        // CRITICAL FIX: If the new key is a tone key and the buffer ends in a (now literal) tone key,
        // strip the last character from the buffer before processing. E.g., 'hoans' + 'f' -> work on 'hoan'.
        if (lastChar && (this.TELEX_TONE_KEYS[lastChar] || lastChar === this.REMOVE_TONE_KEY)) {
             workBuffer = workBuffer.slice(0, -1);
        }

        let vowelIdx = this._findVowelForTone(workBuffer);
        if (vowelIdx === -1) return null;

        // Special case to form 'ê' before applying tone
        let vowel = workBuffer[vowelIdx];
        if (vowel.toLowerCase() === 'e') {
            const prevChar = vowelIdx > 0 ? workBuffer[vowelIdx - 1].toLowerCase() : null;
            const uyenIndex = workBuffer.toLowerCase().lastIndexOf('uy');
            if (prevChar === 'i' || (prevChar === 'y' && uyenIndex !== -1 && uyenIndex === vowelIdx - 2)) {
                workBuffer = workBuffer.substring(0, vowelIdx) + this._matchCase('ê', vowel) + workBuffer.substring(vowelIdx + 1);
                vowel = workBuffer[vowelIdx];
            }
        }

        const vInfo = this.VOWEL_MAP[vowel.toLowerCase()];
        if (!vInfo) return null;

        const currentTone = vInfo.toneIdx;
        const newTone = isRemoveToneKey ? 0 : tone;

        // Handle typing the same tone key twice to remove tone and append the character
        if (currentTone !== 0 && currentTone === newTone) {
            return this._removeTone(buffer) + key; // Use original buffer here
        }
        
        // Handle removing tone with 'z' or applying a new tone
        if (isRemoveToneKey) {
            return this._removeTone(workBuffer);
        }

        const newVowel = this.VOWEL_TPL[vInfo.baseIdx][newTone];
        return workBuffer.substring(0, vowelIdx) + this._matchCase(newVowel, vowel) + workBuffer.substring(vowelIdx + 1);
    }
    
    _applyTransform(buffer, key) {
        const keyAction = key.toLowerCase();

        if (keyAction === 'd' && buffer.slice(-1).toLowerCase() === 'd') {
            return buffer.slice(0, -1) + this._matchCase('đ', buffer.slice(-1));
        }

        const lastChar = buffer ? buffer.slice(-1) : null;
        if (!lastChar) return null;
        const lastVowelInfo = this.VOWEL_MAP[lastChar.toLowerCase()];

        if (lastVowelInfo && keyAction === lastVowelInfo.base && 'aeo'.includes(keyAction)) {
            const mapping = { 'a': 'â', 'e': 'ê', 'o': 'ô' };
            const newChar = mapping[lastVowelInfo.base];
            if (newChar) {
                const newVowel = this.VOWEL_TPL[this.VOWEL_MAP[newChar].baseIdx][lastVowelInfo.toneIdx];
                return buffer.slice(0, -1) + this._matchCase(newVowel, lastChar);
            }
        }

        if (keyAction === 'w') {
            const uoIndex = buffer.toLowerCase().lastIndexOf('uo');
            if (uoIndex !== -1) {
                const remaining = buffer.substring(uoIndex + 2);
                if (!this._getVowels(remaining).length) {
                    const originalUo = buffer.substring(uoIndex, uoIndex + 2);
                    return buffer.substring(0, uoIndex) + this._matchCase('ươ', originalUo) + remaining;
                }
            }

            for (let i = buffer.length - 1; i >= 0; i--) {
                const char = buffer[i];
                const vInfo = this.VOWEL_MAP[char.toLowerCase()];
                if (vInfo) {
                    const baseVowel = vInfo.base;
                    const mapping = { 'a': 'ă', 'o': 'ơ', 'u': 'ư' };
                    const newCharBase = mapping[baseVowel];

                    if (newCharBase) {
                        const newVowelInfo = this.VOWEL_MAP[newCharBase];
                        const newVowelWithTone = this.VOWEL_TPL[newVowelInfo.baseIdx][vInfo.toneIdx];
                        return buffer.substring(0, i) + this._matchCase(newVowelWithTone, char) + buffer.substring(i + 1);
                    }
                    
                    break;
                }
            }
        }

        return null;
    }

    _findVowelForTone(word) {
        if (!word) return -1;
        const vowels = this._getVowels(word);
        if (vowels.length === 0) return -1;

        const lowerWord = word.toLowerCase();
        
        const uoVowelIndex = lowerWord.lastIndexOf('ươ');
        if (uoVowelIndex !== -1) return uoVowelIndex + 1; 

        const eHatIndex = lowerWord.lastIndexOf('ê');
        if (eHatIndex !== -1) return eHatIndex;

        let mainVowels = vowels;
        if ((lowerWord.startsWith('gi') || lowerWord.startsWith('qu')) && vowels.length > 1) {
            mainVowels = vowels.slice(1);
        }
        if (mainVowels.length === 0) return vowels[0].index;

        const vowelString = mainVowels.map(v => this.VOWEL_MAP[v.char.toLowerCase()].base).join('');
        if (['oa', 'oe', 'uy', 'ue'].includes(vowelString)) {
            return mainVowels.length > 1 ? mainVowels[1].index : mainVowels[0].index;
        }
        
        const lastCharIsConsonant = this.CONSONANTS.includes(lowerWord.slice(-1));
        if (mainVowels.length >= 2) {
            if (lastCharIsConsonant) return mainVowels[mainVowels.length - 1].index;
            return mainVowels[mainVowels.length - 2].index;
        }

        return mainVowels[0].index;
    }

    _getVowels(word) {
        const vowelsInWord = [];
        for (let i = 0; i < word.length; i++) {
            if (this._isVowel(word[i])) {
                vowelsInWord.push({ char: word[i], index: i });
            }
        }
        return vowelsInWord;
    }

    _hasTone(word) {
        return this._getVowels(word).some(v => (this.VOWEL_MAP[v.char.toLowerCase()]?.toneIdx || 0) !== 0);
    }
    
    _removeTone(word) {
        return word.split('').map(char => {
            const vInfo = this.VOWEL_MAP[char.toLowerCase()];
            if (vInfo && vInfo.toneIdx !== 0) {
                const baseVowel = this.VOWEL_TPL[vInfo.baseIdx][0];
                return this._matchCase(baseVowel, char);
            }
            return char;
        }).join('');
    }
}
