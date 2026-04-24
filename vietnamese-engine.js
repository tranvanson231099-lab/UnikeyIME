/**
 * @name vietnamese-engine.js
 * @version 38.0.0 (Production Ready)
 * @description A clean, stable, and fully verified Vietnamese IME using the Telex method. This production-ready version
 *              has all test code removed.
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
    }

    // --- SECTION 2: PUBLIC API ---

    process(buffer, key) {
        buffer = String(buffer || '');
        key = String(key || '');

        if (key === 'backspace') return this._handleBackspace(buffer);
        if (key.length > 1) return buffer;

        let newBuffer;

        newBuffer = this._applyTransform(buffer, key);
        if (newBuffer !== null) return newBuffer;

        newBuffer = this._applyTone(buffer, key);
        if (newBuffer !== null) return newBuffer;

        if (this._isVowel(key) && this._hasTone(buffer)) {
            return this._removeTone(buffer) + key;
        }

        return buffer + key;
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

        let vowelIdx = this._findVowelForTone(buffer);
        if (vowelIdx === -1) return null;
        
        let tempBuffer = buffer;
        let vowel = tempBuffer[vowelIdx];

        if (vowel.toLowerCase() === 'e') {
            const prevChar = vowelIdx > 0 ? tempBuffer[vowelIdx - 1].toLowerCase() : null;
            const uyenIndex = tempBuffer.toLowerCase().lastIndexOf('uy');
            
            if (prevChar === 'i' || (prevChar === 'y' && uyenIndex !== -1 && uyenIndex === vowelIdx - 2)) {
                tempBuffer = tempBuffer.substring(0, vowelIdx) + this._matchCase('ê', vowel) + tempBuffer.substring(vowelIdx + 1);
                vowel = tempBuffer[vowelIdx];
            }
        }

        const vInfo = this.VOWEL_MAP[vowel.toLowerCase()];
        
        if (vInfo) {
            const currentTone = vInfo.toneIdx;
            const newTone = isRemoveToneKey ? 0 : tone;

            if (currentTone !== 0 && currentTone === newTone) {
                return this._removeTone(buffer) + key;
            }
            
            if (isRemoveToneKey) {
                return this._removeTone(buffer);
            }

            const newVowel = this.VOWEL_TPL[vInfo.baseIdx][newTone];
            return tempBuffer.substring(0, vowelIdx) + this._matchCase(newVowel, vowel) + tempBuffer.substring(vowelIdx + 1);
        }
        return null;
    }
    
    _applyTransform(buffer, key) {
        const keyAction = key.toLowerCase();
        const lastChar = buffer ? buffer.slice(-1) : null;
        if (!lastChar) return null;

        const lastVowelInfo = this.VOWEL_MAP[lastChar.toLowerCase()];

        if (keyAction === 'd' && lastChar.toLowerCase() === 'd') {
            return buffer.slice(0, -1) + this._matchCase('đ', lastChar);
        }

        if (lastVowelInfo && keyAction === lastVowelInfo.base && 'aeo'.includes(keyAction)) {
            const mapping = { 'a': 'â', 'e': 'ê', 'o': 'ô' };
            const newChar = mapping[lastVowelInfo.base];
            if (newChar) {
                const newVowel = this.VOWEL_TPL[this.VOWEL_MAP[newChar].baseIdx][lastVowelInfo.toneIdx];
                return buffer.slice(0, -1) + this._matchCase(newVowel, lastChar);
            }
        }

        if (keyAction === 'w') {
            if (buffer.toLowerCase().endsWith('uo')) {
                return buffer.slice(0, -2) + this._matchCase('ươ', buffer.slice(-2));
            }
            if (lastVowelInfo) {
                const mapping = { 'a': 'ă', 'o': 'ơ', 'u': 'ư' };
                const newChar = mapping[lastVowelInfo.base];
                if (newChar) {
                     const newVowel = this.VOWEL_TPL[this.VOWEL_MAP[newChar].baseIdx][lastVowelInfo.toneIdx];
                     return buffer.slice(0, -1) + this._matchCase(newVowel, lastChar);
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
        
        const eHatIndex = lowerWord.lastIndexOf('ê');
        if (eHatIndex !== -1) return eHatIndex;
        const uoVowelIndex = lowerWord.lastIndexOf('ươ');
        if (uoVowelIndex !== -1) return uoVowelIndex + 1;

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
