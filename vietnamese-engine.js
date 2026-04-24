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
VOWEL_TPL.forEach((a, i) =>
    a.forEach((c, t) => (VOWEL_MAP[c] = { base: i, tone: t }))
);

const TONE_TELEX = { s:1, f:2, r:3, x:4, j:5 };
const TONE_VNI = { "1":1, "2":2, "3":3, "4":4, "5":5 };

const VOWELS = "aăâeêioôơuưy";

/* =========================
   CORE: FIND SYLLABLE VOWEL (LABAN STYLE)
========================= */
function pickToneVowel(word) {
    const w = word.toLowerCase();

    let v = [];
    for (let i = 0; i < w.length; i++) {
        if (VOWELS.includes(w[i])) v.push(i);
    }

    if (!v.length) return -1;

    // ưu tiên ê
    for (let i of v) {
        if (w[i] === "ê") return i;
    }

    // FIX: ươ → luôn đặt vào ơ
    for (let i = 0; i < w.length - 1; i++) {
        if (w[i] === "u" && w[i + 1] === "ơ") {
            return i + 1;
        }
    }

    // rule cluster cuối
    const last = v[v.length - 1];
    const prev = v[v.length - 2];

    if (!prev) return last;

    const cluster = w[prev] + w[last];
    if (["oa","oe","uy","ue","uê"].includes(cluster)) return last;

    return prev;
}

/* =========================
   APPLY TONE (LABAN CORE)
========================= */
function applyTone(word, toneMap) {
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
    const idx = pickToneVowel(clean);

    if (idx === -1) return word;

    const ch = clean[idx];
    const info = VOWEL_MAP[ch.toLowerCase()];
    if (!info) return word;

    const out = VOWEL_TPL[info.base][tone];

    return (
        clean.slice(0, idx) +
        (ch === ch.toLowerCase() ? out : out.toUpperCase()) +
        clean.slice(idx + 1)
    );
}

/* =========================
   TELEX RULES (LABAN STYLE ORDERED)
========================= */
function applyTelex(word) {

    // 1. dd → đ
    word = word.replace(/dd/g, "đ");

    // 2. vowel modify (order matters!)
    word = word
        .replace(/aw/g, "ă")
        .replace(/aa/g, "â")
        .replace(/ow/g, "ơ")
        .replace(/oo/g, "ô")
        .replace(/uw/g, "ư")
        .replace(/ee/g, "ê");

    // 3. tone AFTER transforms (CRITICAL LIKE LABAN)
    return applyTone(word, TONE_TELEX);
}

/* =========================
   VNI RULES
========================= */
function applyVni(word) {
    const map = {
        dd:"đ", a7:"â", a8:"ă",
        e7:"ê", o7:"ô", o8:"ơ", u8:"ư"
    };

    word = word.replace(/dd|a7|a8|e7|o7|o8|u8/g, m => map[m]);

    return applyTone(word, TONE_VNI);
}

/* =========================
   BACKSPACE (LABAN STYLE SAFE)
========================= */
function backspace(word) {
    return word ? word.slice(0, -1) : "";
}

/* =========================
   MAIN ENTRY (IMPORTANT)
========================= */
function processKeyEvent(key, word, style) {

    const k = key.toLowerCase();

    // BACKSPACE
    if (k === "backspace") {
        return backspace(word);
    }

    // LABAN STYLE: ALWAYS append first, then reprocess
    const newWord = word + key;

    if (style === "Telex") {
        return applyTelex(newWord);
    }

    return applyVni(newWord);
}const VOWEL_TPL = [
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
VOWEL_TPL.forEach((a, i) =>
    a.forEach((c, t) => (VOWEL_MAP[c] = { base: i, tone: t }))
);

const TONE_TELEX = { s:1, f:2, r:3, x:4, j:5 };
const TONE_VNI = { "1":1, "2":2, "3":3, "4":4, "5":5 };

const VOWELS = "aăâeêioôơuưy";

/* =========================
   CORE: FIND SYLLABLE VOWEL (LABAN STYLE)
========================= */
function pickToneVowel(word) {
    const w = word.toLowerCase();

    let v = [];
    for (let i = 0; i < w.length; i++) {
        if (VOWELS.includes(w[i])) v.push(i);
    }

    if (!v.length) return -1;

    // ưu tiên ê
    for (let i of v) {
        if (w[i] === "ê") return i;
    }

    // FIX: ươ → luôn đặt vào ơ
    for (let i = 0; i < w.length - 1; i++) {
        if (w[i] === "u" && w[i + 1] === "ơ") {
            return i + 1;
        }
    }

    // rule cluster cuối
    const last = v[v.length - 1];
    const prev = v[v.length - 2];

    if (!prev) return last;

    const cluster = w[prev] + w[last];
    if (["oa","oe","uy","ue","uê"].includes(cluster)) return last;

    return prev;
}

/* =========================
   APPLY TONE (LABAN CORE)
========================= */
function applyTone(word, toneMap) {
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
    const idx = pickToneVowel(clean);

    if (idx === -1) return word;

    const ch = clean[idx];
    const info = VOWEL_MAP[ch.toLowerCase()];
    if (!info) return word;

    const out = VOWEL_TPL[info.base][tone];

    return (
        clean.slice(0, idx) +
        (ch === ch.toLowerCase() ? out : out.toUpperCase()) +
        clean.slice(idx + 1)
    );
}

/* =========================
   TELEX RULES (LABAN STYLE ORDERED)
========================= */
function applyTelex(word) {

    // 1. dd → đ
    word = word.replace(/dd/g, "đ");

    // 2. vowel modify (order matters!)
    word = word
        .replace(/aw/g, "ă")
        .replace(/aa/g, "â")
        .replace(/ow/g, "ơ")
        .replace(/oo/g, "ô")
        .replace(/uw/g, "ư")
        .replace(/ee/g, "ê");

    // 3. tone AFTER transforms (CRITICAL LIKE LABAN)
    return applyTone(word, TONE_TELEX);
}

/* =========================
   VNI RULES
========================= */
function applyVni(word) {
    const map = {
        dd:"đ", a7:"â", a8:"ă",
        e7:"ê", o7:"ô", o8:"ơ", u8:"ư"
    };

    word = word.replace(/dd|a7|a8|e7|o7|o8|u8/g, m => map[m]);

    return applyTone(word, TONE_VNI);
}

/* =========================
   BACKSPACE (LABAN STYLE SAFE)
========================= */
function backspace(word) {
    return word ? word.slice(0, -1) : "";
}

/* =========================
   MAIN ENTRY (IMPORTANT)
========================= */
function processKeyEvent(key, word, style) {

    const k = key.toLowerCase();

    // BACKSPACE
    if (k === "backspace") {
        return backspace(word);
    }

    // LABAN STYLE: ALWAYS append first, then reprocess
    const newWord = word + key;

    if (style === "Telex") {
        return applyTelex(newWord);
    }

    return applyVni(newWord);
}