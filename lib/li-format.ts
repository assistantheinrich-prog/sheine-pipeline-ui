// LinkedIn doesn't render markdown. The Typefully trick: substitute Unicode
// math-letter ranges so bold / italic show up as styled glyphs in any LinkedIn
// post, comment, or article. Source: Unicode Mathematical Alphanumeric Symbols.

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);
const a = "a".charCodeAt(0);
const z = "z".charCodeAt(0);
const ZERO = "0".charCodeAt(0);

function shiftLetter(ch: string, upperBase: number, lowerBase: number): string {
  const c = ch.charCodeAt(0);
  if (c >= A && c <= Z) return String.fromCodePoint(upperBase + (c - A));
  if (c >= a && c <= z) return String.fromCodePoint(lowerBase + (c - a));
  return ch;
}

function shiftDigit(ch: string, base: number): string {
  const c = ch.charCodeAt(0);
  if (c >= ZERO && c <= ZERO + 9) return String.fromCodePoint(base + (c - ZERO));
  return ch;
}

// Bold sans-serif: 𝗔–𝗭 𝗮–𝘇 𝟬–𝟵
export function toBold(text: string): string {
  return [...text]
    .map((ch) => {
      const u = shiftLetter(ch, 0x1d5d4, 0x1d5ee);
      if (u !== ch) return u;
      return shiftDigit(ch, 0x1d7ec);
    })
    .join("");
}

// Italic sans-serif: 𝘈–𝘡 𝘢–𝘻
export function toItalic(text: string): string {
  return [...text]
    .map((ch) => shiftLetter(ch, 0x1d608, 0x1d622))
    .join("");
}

// Bold-italic sans-serif: 𝘼–𝙕 𝙖–𝙯
export function toBoldItalic(text: string): string {
  return [...text]
    .map((ch) => shiftLetter(ch, 0x1d63c, 0x1d656))
    .join("");
}

// Reverse: detect any of the styled ranges and map back to ASCII.
export function toPlain(text: string): string {
  return [...text]
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      // Bold sans-serif
      if (cp >= 0x1d5d4 && cp <= 0x1d5ed) return String.fromCharCode(A + (cp - 0x1d5d4));
      if (cp >= 0x1d5ee && cp <= 0x1d607) return String.fromCharCode(a + (cp - 0x1d5ee));
      if (cp >= 0x1d7ec && cp <= 0x1d7f5) return String.fromCharCode(ZERO + (cp - 0x1d7ec));
      // Italic sans-serif
      if (cp >= 0x1d608 && cp <= 0x1d621) return String.fromCharCode(A + (cp - 0x1d608));
      if (cp >= 0x1d622 && cp <= 0x1d63b) return String.fromCharCode(a + (cp - 0x1d622));
      // Bold italic sans-serif
      if (cp >= 0x1d63c && cp <= 0x1d655) return String.fromCharCode(A + (cp - 0x1d63c));
      if (cp >= 0x1d656 && cp <= 0x1d66f) return String.fromCharCode(a + (cp - 0x1d656));
      return ch;
    })
    .join("");
}

// Strip leading list markers — •, -, *, →, |, "1." style — so re-applying a
// list transform is idempotent. Sebastian's voice rules ban → and | as bullets,
// so we strip them defensively even though we never emit them.
const LIST_MARKER_RE = /^\s*(?:[•\-*→|—]|\d+\.)\s+/;

// Convert each non-empty line in `lines` to a • bullet.
export function toBulletList(lines: string[]): string[] {
  return lines.map((ln) => {
    if (!ln.trim()) return ln;
    return "• " + ln.replace(LIST_MARKER_RE, "");
  });
}

// Re-number non-empty lines starting at 1. Empty lines preserved as-is.
export function toNumberedList(lines: string[]): string[] {
  let n = 0;
  return lines.map((ln) => {
    if (!ln.trim()) return ln;
    n += 1;
    return `${n}. ` + ln.replace(LIST_MARKER_RE, "");
  });
}

// Strip common markdown syntax so the text pastes cleanly into LinkedIn.
// Italic regexes are intentionally simple and may over-match in pathological
// cases; that's an acceptable trade for a paste-ready output.
export function stripMarkdown(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*(?:[-*_]\s*){3,}\s*$/gm, "")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/___([^_]+)___/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/(^|[^_\w])_([^_\n]+)_(?!_)/g, "$1$2")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, "($1)")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

// Apply a transform to the substring [start, end) of `full`. Returns the new
// full string + new selection bounds (which may have shifted because Unicode
// glyphs are surrogate pairs).
export function applyTransform(
  full: string,
  start: number,
  end: number,
  fn: (s: string) => string
): { value: string; selStart: number; selEnd: number } {
  const before = full.slice(0, start);
  const sel = full.slice(start, end);
  const after = full.slice(end);
  const transformed = fn(sel);
  const value = before + transformed + after;
  return { value, selStart: start, selEnd: start + transformed.length };
}
