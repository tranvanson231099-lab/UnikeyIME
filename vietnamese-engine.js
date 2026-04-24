
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

const TELEX_TONE_KEYS = ["", "s", "f", "r", "x", "j"];
const VNI_TONE_KEYS = ["", "1", "2", "3", "4", "5"];

const ALL_VOWELS = "aăâeêioôơuưy";

/* =========================
   BACKSPACE SAFE (NO CORRUPTION)
========================= */
function applyBackspace(word) {
    return word ? word.slice(0, -1) : "";
}

/* =========================
   FIND TONE POSITION (UNIKEY RULE FIXED)
========================= */
function findVowelForTone(word) {
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

    // ✅ FIX: detect "ươ" đúng cách (REAL STRING SCAN)
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

/* =========================
   MAIN ENGINE
========================= */
function processKeyEvent(key, word, style) {

    if (key === "backspace") {
        return applyBackspace(word);
    }

    const k = key.toLowerCase();
    const toneKeys = style === "VNI" ? VNI_TONE_KEYS : TELEX_TONE_KEYS;

    const isTelexZ = style === "Telex" && k === "z";
    const toneIndex = isTelexZ ? 0 : toneKeys.indexOf(k);

    /* =========================
       1. TONE HANDLING (NO BUG)
    ========================= */
    if (toneIndex !== -1 || isTelexZ) {
        const idx = findVowelForTone(word);

        if (idx !== -1) {
            const ch = word[idx];
            const info = VOWEL_MAP[ch.toLowerCase()];

            if (info) {
                const newTone = isTelexZ ? 0 : toneIndex;

                // remove tone if same pressed again
                if (info.toneIdx === toneIndex && toneIndex > 0) {
                    const base = VOWEL_TPL[info.baseIdx][0];

                    return (
                        word.substring(0, idx) +
                        (ch === ch.toLowerCase() ? base : base.toUpperCase()) +
                        word.substring(idx + 1)
                    );
                }

                const newVowel = VOWEL_TPL[info.baseIdx][newTone];

                return (
                    word.substring(0, idx) +
                    (ch === ch.toLowerCase()
                        ? newVowel
                        : newVowel.toUpperCase()) +
                    word.substring(idx + 1)
                );
            }
        }

        if (style === "VNI" && toneIndex !== -1) {
            return word;
        }
    }

    /* =========================
       2. TELEX TRANSFORM
    ========================= */
    const last = word.slice(-1);

    if (style === "Telex") {

        // dd -> đ
        if (last.toLowerCase() === "d" && k === "d") {
            return word.slice(0, -1) + (last === "d" ? "đ" : "Đ");
        }

        // aa ee oo
        if (last.toLowerCase() === k && "aeo".includes(k)) {
            const info = VOWEL_MAP[last.toLowerCase()];
            if (info) {
                const map = { 0: 2, 2: 0, 3: 4, 4: 3, 6: 7, 7: 6 };

                const base = map[info.baseIdx];
                if (base !== undefined) {
                    const v = VOWEL_TPL[base][info.toneIdx];

                    return word.slice(0, -1) + v;
                }
            }
        }

        // w transform (aw ow uw)
        if (k === "w") {
            const idx = findVowelForTone(word);
            if (idx !== -1) {
                const info = VOWEL_MAP[word[idx].toLowerCase()];
                if (info) {
                    const map = { 0: 1, 1: 0, 6: 8, 8: 6, 9: 10, 10: 9 };

                    const base = map[info.baseIdx];
                    if (base !== undefined) {
                        const v = VOWEL_TPL[base][info.toneIdx];

                        return (
                            word.substring(0, idx) +
                            v +
                            word.substring(idx + 1)
                        );
                    }
                }
            }
        }
    }

    /* =========================
       3. VNI TRANSFORM
    ========================= */
    if (style === "VNI") {
        const map = {
            d: { "9": "đ" },
            D: { "9": "Đ" },
            a: { "8": "ă", "7": "â" },
            A: { "8": "Ă", "7": "Â" },
            e: { "7": "ê" },
            E: { "7": "Ê" },
            o: { "8": "ơ", "7": "ô" },
            O: { "8": "Ơ", "7": "Ô" },
            u: { "8": "ư" },
            U: { "8": "Ư" }
        };

        if (map[last] && map[last][k]) {
            return word.slice(0, -1) + map[last][k];
        }
    }

    /* =========================
       DEFAULT SAFE APPEND
    ========================= */
    return word + key;
}