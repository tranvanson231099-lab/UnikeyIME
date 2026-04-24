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
VOWEL_TPL.forEach((baseArr, baseIdx) =>
    baseArr.forEach((vowel, toneIdx) => {
        VOWEL_MAP[vowel] = { baseIdx, toneIdx };
    })
);

const TELEX_TONE_KEYS = ["", "s", "f", "r", "x", "j"];
const VNI_TONE_KEYS = ["", "1", "2", "3", "4", "5"];

const allVowels = "aăâeêioôơuưy";

/* =========================
   FIND VOWEL FOR TONE
========================= */
function findVowelForTone(word) {
    const w = word.toLowerCase();

    let vowels = [];
    for (let i = 0; i < w.length; i++) {
        if (allVowels.includes(w[i])) {
            vowels.push({ char: w[i], index: i });
        }
    }

    if (!vowels.length) return -1;

    // ưu tiên ê
    const eIndex = vowels.find(v => v.char === "ê");
    if (eIndex) return eIndex.index;

    // FIX: handle "ươ" đúng cách
    if (w.includes("ươ")) {
        const index = w.indexOf("ơ");
        if (index !== -1) return index;
    }

    let main = [...vowels];

    if ((w.startsWith("qu") || w.startsWith("gi")) && main.length > 1) {
        main.shift();
    }

    if (main.length === 1) return main[0].index;

    const last = main[main.length - 1];
    const prev = main[main.length - 2];

    const lastIsVowel = allVowels.includes(w[w.length - 1]);
    if (!lastIsVowel) return last.index;

    const cluster = prev.char + last.char;
    if (["oa", "oe", "uy", "ue", "uê"].includes(cluster)) {
        return last.index;
    }

    return prev.index;
}

/* =========================
   MAIN PROCESS KEY
========================= */
function processKeyEvent(key, word, style) {
    if (key === "backspace") {
        return word.slice(0, -1);
    }

    const k = key.toLowerCase();
    const toneKeys = style === "VNI" ? VNI_TONE_KEYS : TELEX_TONE_KEYS;

    const isTelexZ = style === "Telex" && k === "z";
    const toneIndex = isTelexZ ? 0 : toneKeys.indexOf(k);

    /* =====================
       1. TONE HANDLING
    ===================== */
    if (toneIndex !== -1 || isTelexZ) {
        const vowelIdx = findVowelForTone(word);

        if (vowelIdx !== -1) {
            const vowel = word[vowelIdx];
            const info = VOWEL_MAP[vowel.toLowerCase()];

            if (info) {
                const newTone = isTelexZ ? 0 : toneIndex;

                // remove tone if same tone pressed again
                if (info.toneIdx === toneIndex && toneIndex > 0) {
                    const base = VOWEL_TPL[info.baseIdx][0];
                    const replaced =
                        word.substring(0, vowelIdx) +
                        (vowel === vowel.toLowerCase() ? base : base.toUpperCase()) +
                        word.substring(vowelIdx + 1);

                    return style === "Telex" ? replaced + key : replaced;
                }

                const newVowel = VOWEL_TPL[info.baseIdx][newTone];
                return (
                    word.substring(0, vowelIdx) +
                    (vowel === vowel.toLowerCase()
                        ? newVowel
                        : newVowel.toUpperCase()) +
                    word.substring(vowelIdx + 1)
                );
            }
        }

        if (style === "VNI" && toneIndex !== -1) return word;
    }

    /* =====================
       2. TRANSFORMATIONS
    ===================== */
    const last = word.slice(-1);

    if (style === "Telex") {
        // aa ee oo
        if (last.toLowerCase() === k && "aeo".includes(k)) {
            const info = VOWEL_MAP[last.toLowerCase()];
            if (info) {
                const map = { 0: 2, 2: 0, 3: 4, 4: 3, 6: 7, 7: 6 };
                const newBase = map[info.baseIdx];

                if (newBase !== undefined) {
                    const v = VOWEL_TPL[newBase][info.toneIdx];
                    return word.slice(0, -1) + (last === last.toLowerCase() ? v : v.toUpperCase());
                }
            }
        }

        // aw ow uw
        if (k === "w") {
            const idx = findVowelForTone(word);
            if (idx !== -1) {
                const info = VOWEL_MAP[word[idx].toLowerCase()];
                if (info) {
                    const map = { 0: 1, 1: 0, 6: 8, 8: 6, 9: 10, 10: 9 };
                    const newBase = map[info.baseIdx];

                    if (newBase !== undefined) {
                        const v = VOWEL_TPL[newBase][info.toneIdx];
                        return (
                            word.substring(0, idx) +
                            v +
                            word.substring(idx + 1)
                        );
                    }
                }
            }
        }

        // dd -> đ
        if (last.toLowerCase() === "d" && k === "d") {
            return word.slice(0, -1) + (last === "d" ? "đ" : "Đ");
        }
    }

    /* =====================
       VNI
    ===================== */
    if (style === "VNI") {
        const vniMap = {
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

        if (vniMap[last] && vniMap[last][k]) {
            return word.slice(0, -1) + vniMap[last][k];
        }
    }

    /* =====================
       DEFAULT
    ===================== */
    return word + key;
}