
const VOWEL_TPL = [
    ["a", "á", "à", "ả", "ã", "ạ"],
    ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"],
    ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"],
    ["ê", "ế", "ề", "ể", "ễ", "ệ"],
    ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    ["o", "ó", "ò", "ỏ", "õ", "ọ"],
    ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"],
    ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    ["u", "ú", "ù", "ủ", "ũ", "ụ"],
    ["ư", "ứ", "ừ", "ử", "ữ", "ự"],
    ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"]
];

const VOWEL_MAP = {};
VOWEL_TPL.forEach((arr, i) =>
    arr.forEach((c, t) => {
        VOWEL_MAP[c] = { baseIdx: i, toneIdx: t };
    })
);

const TELEX_TONE = { s:1, f:2, r:3, x:4, j:5 };
const VNI_TONE = { "1":1, "2":2, "3":3, "4":4, "5":5 };

const ALL_VOWELS = "aăâeêioôơuưy";

/* =========================
   IME CORE (STATE MACHINE)
========================= */
class VietIME {
    constructor(style = "Telex") {
        this.style = style;
        this.buffer = "";
    }

    setStyle(style) {
        this.style = style;
    }

    reset() {
        this.buffer = "";
    }

    input(key) {
        const k = key.toLowerCase();

        // ================= BACKSPACE =================
        if (k === "backspace") {
            this.buffer = this.buffer.slice(0, -1);
            return this.render();
        }

        this.buffer += key;
        return this.render();
    }

    /* =========================
       RENDER (SOURCE OF TRUTH)
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

        // dd -> đ
        word = word.replace(/dd/g, "đ");

        // aa ee oo (toggle safe)
        word = word
            .replace(/aa/g, "â")
            .replace(/âa/g, "a")
            .replace(/ee/g, "ê")
            .replace(/êe/g, "e")
            .replace(/oo/g, "ô")
            .replace(/ôo/g, "o");

        // w transforms
        word = word
            .replace(/aw/g, "ă")
            .replace(/ăw/g, "a")
            .replace(/ow/g, "ơ")
            .replace(/ơw/g, "o")
            .replace(/uw/g, "ư")
            .replace(/ưw/g, "u");

        // tone last (IMPORTANT FIX)
        word = this.applyTone(word, TELEX_TONE);

        return word;
    }

    /* =========================
       VNI ENGINE
    ========================= */
    applyVNI(word) {

        const map = {
            dd: "đ",
            a7: "â",
            a8: "ă",
            e7: "ê",
            o7: "ô",
            o8: "ơ",
            u8: "ư"
        };

        word = word.replace(/dd|a7|a8|e7|o7|o8|u8/g, m => map[m]);

        word = this.applyTone(word, VNI_TONE);

        return word;
    }

    /* =========================
       TONE ENGINE (UNIKEY STYLE)
    ========================= */
    applyTone(word, toneMap) {

        let tone = 0;
        let tonePos = -1;

        for (let i = word.length - 1; i >= 0; i--) {
            const c = word[i].toLowerCase();
            if (toneMap[c] !== undefined) {
                tone = toneMap[c];
                tonePos = i;
                break;
            }
        }

        if (tonePos === -1) return word;

        const clean = word.slice(0, tonePos);

        const idx = this.findToneVowel(clean);
        if (idx === -1) return word;

        const ch = clean[idx];
        const info = VOWEL_MAP[ch.toLowerCase()];
        if (!info) return word;

        const newChar = VOWEL_TPL[info.baseIdx][tone];

        return (
            clean.slice(0, idx) +
            (ch === ch.toLowerCase() ? newChar : newChar.toUpperCase()) +
            clean.slice(idx + 1)
        );
    }

    /* =========================
       FIXED VOWEL SELECTION
    ========================= */
    findToneVowel(word) {
        const w = word.toLowerCase();

        let vowels = [];
        for (let i = 0; i < w.length; i++) {
            if (ALL_VOWELS.includes(w[i])) {
                vowels.push({ char: w[i], index: i });
            }
        }

        if (!vowels.length) return -1;

        // ưu tiên ê
        const e = vowels.find(v => v.char === "ê");
        if (e) return e.index;

        // FIX: detect "ươ" chuẩn
        for (let i = 0; i < w.length - 1; i++) {
            if (w[i] === "u" && w[i + 1] === "ơ") {
                return i + 1;
            }
        }

        let main = [...vowels];

        if ((w.startsWith("qu") || w.startsWith("gi")) && main.length > 1) {
            main.shift();
        }

        if (main.length === 1) return main[0].index;

        const last = main[main.length - 1];
        const prev = main[main.length - 2];

        const lastIsVowel = ALL_VOWELS.includes(w[w.length - 1]);
        if (!lastIsVowel) return last.index;

        const cluster = prev.char + last.char;

        if (["oa", "oe", "uy", "ue", "uê"].includes(cluster)) {
            return last.index;
        }

        return prev.index;
    }
}