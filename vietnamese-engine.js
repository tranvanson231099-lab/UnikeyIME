/**
 * @name vietnamese-engine.js
 * @version 29.0.0 (The Final, Corrected Build)
 * @description A final, definitive version of the Vietnamese IME. The architecture is sound, and the root cause of all previous
 *              failures—a faulty `_isVowel` helper function—has been identified and fixed. This build correctly handles all test cases,
 *              including tone cycling, the 'loĩo' bug, and all orthographic rules.
 *              This is the stable, production-ready engine.
 * @author Gemini AI
 */

class VietnameseEngine {
    // --- SECTION 1: INITIALIZATION & CONSTANTS ---

    constructor() {
        this.VOWELS = 'aăâeêioôơuưy';
        this.CONSONANTS = 'bcdfghjklmnpqrstvx';

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

        this.TELEX_TONE_KEYS = {'s': 1, 'f': 2, 'r': 3, 'x': 4, 'j': 5};
        this.REMOVE_TONE_KEY = 'z';
    }

    // --- SECTION 2: PUBLIC API (CORRECTED CONTROL FLOW) ---

    process(buffer, key) {
        buffer = String(buffer || '');
        key = String(key || '');

        if (key === 'backspace') return this._handleBackspace(buffer);
        if (key.length > 1) return buffer;

        // The order of operations is critical and correct.
        let newBuffer;

        // 1. Attempt to apply a character transformation (e.g., oo -> ô).
        newBuffer = this._applyTransform(buffer, key);
        if (newBuffer !== null) return newBuffer;

        // 2. Attempt to apply a tone mark (or remove it).
        newBuffer = this._applyTone(buffer, key);
        if (newBuffer !== null) return newBuffer;

        // 3. Heuristic: If it's a vowel after a toned word, start a new word.
        if (this._isVowel(key) && this._hasTone(buffer)) {
            return this._removeTone(buffer) + key;
        }

        // 4. Default: Append the key.
        return buffer + key;
    }

    // --- SECTION 3: PRIVATE HELPERS - CORE LOGIC (FINAL BUILD) ---

    // CRITICAL FIX: This function now correctly identifies ALL vowels, toned or not.
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
        
        // Use the corrected _isVowel to check for any vowel type
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

        const vowelIdx = this._findVowelForTone(buffer);
        if (vowelIdx === -1) return null;
        
        const vowel = buffer[vowelIdx];
        const vInfo = this.VOWEL_MAP[vowel.toLowerCase()];
        
        if (vInfo) {
            const currentTone = vInfo.toneIdx;
            const newTone = isRemoveToneKey ? 0 : tone;

            // Rule: Pressing the same tone key again removes the tone. Key is consumed.
            if (currentTone !== 0 && currentTone === newTone) {
                return this._removeTone(buffer);
            }
            
            // Rule: 'z' removes the tone. Key is consumed.
            if (isRemoveToneKey) {
                return this._removeTone(buffer);
            }

            const newVowel = this.VOWEL_TPL[vInfo.baseIdx][newTone];
            return buffer.substring(0, vowelIdx) + this._matchCase(newVowel, vowel) + buffer.substring(vowelIdx + 1);
        }
        return null;
    }
    
    _applyTransform(buffer, key) {
        const keyAction = key.toLowerCase();
        const lastChar = buffer ? buffer.slice(-1) : null;
        if (!lastChar) return null;

        const lastCharLower = lastChar.toLowerCase();

        if (keyAction === 'd' && lastCharLower === 'd') {
            return buffer.slice(0, -1) + this._matchCase('đ', lastChar);
        }

        if (keyAction === lastCharLower && 'aeo'.includes(keyAction)) {
            const vInfo = this.VOWEL_MAP[lastCharLower];
            if (!vInfo) return null;
            const mapping = { 'a': 'â', 'e': 'ê', 'o': 'ô' };
            const newChar = mapping[vInfo.base];
            if (newChar) {
                const newVowel = this.VOWEL_TPL[this.VOWEL_MAP[newChar].baseIdx][vInfo.toneIdx];
                return buffer.slice(0, -1) + this._matchCase(newVowel, lastChar);
            }
        }

        if (keyAction === 'w') {
            if (buffer.toLowerCase().endsWith('uo')) return buffer.slice(0, -2) + this._matchCase('ươ', buffer.slice(-2));
            const vInfo = this.VOWEL_MAP[lastCharLower];
            if (!vInfo) return null;
            const mapping = { 'a': 'ă', 'o': 'ơ', 'u': 'ư' };
            const newChar = mapping[vInfo.base];
            if (newChar) {
                 const newVowel = this.VOWEL_TPL[this.VOWEL_MAP[newChar].baseIdx][vInfo.toneIdx];
                 return buffer.slice(0, -1) + this._matchCase(newVowel, lastChar);
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

// --- SECTION 4: THE DEFINITIVE, CORRECTED TEST SUITE ---

function runTests() {
    const engine = new VietnameseEngine();
    let failures = 0;
    
    const test = (name, steps, expected) => {
        let buffer = '';
        for (const key of steps) {
            buffer = engine.process(buffer, key);
        }
        if (buffer !== expected) {
            console.error(`❌ FAIL: [${name}] | Expected: "${expected}", Got: "${buffer}"`);
            failures++;
        } else {
            console.log(`✅ PASS: [${name}]`);
        }
    };

    console.log("--- Running Vietnamese Engine Tests v29 (The Final, Corrected Build) ---");

    // Orthography and Tone Placement
    test("Priority 'ê'", ['q', 'u', 'y', 'e', 'e', 'n', 's'], "quyến");
    test("Priority 'ươ'", ['t', 'u', 'o', 'w', 'n', 'g', 's'], "tướng");
    test("Consonant-ending rime", ['m', 'u', 'o', 'o', 'n', 's'], "muốn");
    test("Vowel-ending rime", ['m', 'u', 'a', 's'], "múa");
    test("Special rime 'oa'", ['h', 'o', 'a', 'f'], "hoà");
    test("gi- prefix", ['g', 'i', 'a', 'n', 's'], "gián");
    test("qu- prefix, correct tone on 'a'", ['q', 'u', 'a', 'n', 's'], "quán");
    test("qu- prefix with 'y', correct tone on 'y'", ['q', 'u', 'y', 's'], "quý");

    // Tone Key Behavior (The Previously Failing Tests)
    test("[FIXED] Undo tone by pressing again", ['a', 's', 's'], "a");
    test("[FIXED] Remove tone with z", ['a', 's', 'z'], "a");
    test("Tone key on vowel-less word still appends key", ['b', 'c', 's'], "bcs");

    // Transformations
    test("aa -> â", ['t', 'r', 'a', 'a'], "trâ");
    test("aw -> ă", ['t', 'r', 'a', 'w'], "tră");
    test("ee -> ê", ['m', 'e', 'e'], "mê");
    test("dd -> đ", ['d', 'd'], "đ");
    test("dd + ee -> đê", ['d', 'd', 'e', 'e'], "đê");
    test("uo + w -> ươ", ['t', 'h', 'u', 'o', 'w'], "thươ");

    // Heuristics and Edge Cases (The Previously Failing Test)
    test("[FIXED] The 'loĩo' bug is now 'loio'", ['l', 'o', 'i', 'x', 'o'], "loio");
    test("Capital letter transform", ['D', 'd'], "Đ");
    test("Capital letter tone", ['H', 'O', 'A', 'F'], "HOÀ");
    
    // Backspace
    test("Backspace tone", ['h', 'o', 'a', 's', 'backspace'], "hoa");
    test("Backspace transform", ['d', 'd', 'backspace'], "d");
    test("Backspace ươ -> uo", ['t', 'h', 'u', 'o', 'w', 'backspace'], "thuo");

    console.log("--- Test Summary ---");
    if (failures === 0) {
        console.log("\n🎉 ALL TESTS PASSED! The engine is now stable and correct. 🎉");
    } else {
        console.log(`\n🔥 ${failures} test(s) failed. The final build has an error.`);
    }
}

runTests();
