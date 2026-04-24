class VietInputEngine {
    constructor(style = "Telex") {
        this.style = style;
        this.buffer = ""; // raw input (quan trọng nhất)
    }

    setStyle(style) {
        this.style = style;
    }

    reset() {
        this.buffer = "";
    }

    input(key) {
        const k = key.toLowerCase();

        if (k === "backspace") {
            this.buffer = this.buffer.slice(0, -1);
            return this.render();
        }

        this.buffer += key;
        return this.render();
    }

    /* =========================
       RENDER ENGINE (CORE)
    ========================= */
    render() {
        let word = this.buffer;

        if (!word) return "";

        if (this.style === "Telex") {
            word = this.applyTelex(word);
        } else {
            word = this.applyVNI(word);
        }

        return word;
    }

    /* =========================
       TELEX ENGINE
    ========================= */
    applyTelex(word) {
        // 1. dd -> đ
        word = word.replace(/dd/gi, (m) =>
            m === "dd" ? "đ" : "Đ"
        );

        // 2. aa ee oo
        word = this.toggleDoubleVowel(word);

        // 3. w transform
        word = this.applyW(word);

        // 4. tone marks
        word = this.applyTone(word, "telex");

        return word;
    }

    /* =========================
       VNI ENGINE
    ========================= */
    applyVNI(word) {
        word = this.applyVniTransform(word);
        word = this.applyTone(word, "vni");
        return word;
    }

    /* =========================
       TONE ENGINE (CORE UNIKEY LOGIC)
    ========================= */
    applyTone(word, mode) {
        const toneMapTelex = {
            s: 1,
            f: 2,
            r: 3,
            x: 4,
            j: 5
        };

        const toneMapVni = {
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5
        };

        const toneMap = mode === "telex" ? toneMapTelex : toneMapVni;

        let tone = 0;
        let toneKey = null;

        for (let i = word.length - 1; i >= 0; i--) {
            const c = word[i].toLowerCase();
            if (toneMap[c] !== undefined) {
                tone = toneMap[c];
                toneKey = i;
                break;
            }
        }

        if (!toneKey) return word;

        const clean = word.slice(0, toneKey);

        const vowelIndex = this.findToneVowel(clean);
        if (vowelIndex === -1) return word;

        const ch = clean[vowelIndex];
        const info = VOWEL_MAP[ch.toLowerCase()];
        if (!info) return word;

        const newChar = VOWEL_TPL[info.baseIdx][tone];

        return (
            clean.slice(0, vowelIndex) +
            (ch === ch.toLowerCase() ? newChar : newChar.toUpperCase()) +
            clean.slice(vowelIndex + 1)
        );
    }

    /* =========================
       FIND TONE POSITION (UNIKEY RULE)
    ========================= */
    findToneVowel(word) {
        const w = word.toLowerCase();
        const vowels = [];

        for (let i = 0; i < w.length; i++) {
            if (ALL_VOWELS.includes(w[i])) {
                vowels.push({ char: w[i], index: i });
            }
        }

        if (!vowels.length) return -1;

        if (w.includes("ươ")) {
            return w.indexOf("ơ");
        }

        const e = vowels.find(v => v.char === "ê");
        if (e) return e.index;

        return vowels[vowels.length - 1].index;
    }

    /* =========================
       TELEX TRANSFORM HELPERS
    ========================= */
    toggleDoubleVowel(word) {
        const map = {
            aa: "â",
            aâ: "a",
            ee: "ê",
            eê: "e",
            oo: "ô",
            oô: "o"
        };

        return word.replace(/aa|aâ|ee|eê|oo|oô/gi, (m) => {
            const lower = m.toLowerCase();
            const r = map[lower];
            return m[0] === m[0].toUpperCase()
                ? r.toUpperCase()
                : r;
        });
    }

    applyW(word) {
        const map = {
            aw: "ă",
            aă: "a",
            ow: "ơ",
            oơ: "o",
            uw: "ư",
            uư: "u"
        };

        return word.replace(/aw|aă|ow|oơ|uw|uư/gi, (m) => {
            const lower = m.toLowerCase();
            const r = map[lower];
            return m[0] === m[0].toUpperCase()
                ? r.toUpperCase()
                : r;
        });
    }

    applyVniTransform(word) {
        const map = {
            dd: "đ",
            a8: "ă",
            a7: "â",
            e7: "ê",
            o7: "ô",
            o8: "ơ",
            u8: "ư"
        };

        return word.replace(/dd|a8|a7|e7|o7|o8|u8/gi, (m) => {
            const lower = m.toLowerCase();
            const r = map[lower];
            return m[0] === m[0].toUpperCase()
                ? r.toUpperCase()
                : r;
        });
    }
}