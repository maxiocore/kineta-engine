/**
 * English rendering layer for the Arabic-first UI.
 * When the active language is English, Arabic UI strings rendered anywhere in the
 * document (pages, dialogs, toasts, portals) are swapped for their English
 * equivalents from a single dictionary, and `dir="rtl"` containers are flipped to LTR.
 * Original text is kept so switching back to Arabic restores it.
 */
type Pattern = { re: RegExp; en: string };

const AR = /[\u0600-\u06FF]/;
const ATTRS = ["placeholder", "title", "aria-label"] as const;

let dict: Map<string, string> | null = null;
let patterns: Pattern[] = [];
let observer: MutationObserver | null = null;
const originalText = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Record<string, string>>();
const flippedDir = new WeakSet<Element>();
const touchedTexts = new Set<Text>();
const touchedEls = new Set<Element>();

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PH = /\$\{[^}]*\}|\{[^}]*\}/g;

async function load() {
  if (dict) return;
  const data: Record<string, string> = (await import("./en-dictionary.json")).default as Record<string, string>;
  dict = new Map();
  patterns = [];
  for (const [ar, en] of Object.entries(data)) {
    if (PH.test(ar)) {
      PH.lastIndex = 0;
      const parts = ar.split(PH).map(escapeRe);
      const re = new RegExp("^" + parts.join("(.+?)") + "$");
      patterns.push({ re, en });
    } else {
      dict.set(ar, en);
    }
    PH.lastIndex = 0;
  }
}

function translate(raw: string): string | null {
  if (!dict || !AR.test(raw)) return null;
  const n = norm(raw);
  const hit = dict.get(n);
  if (hit) return raw.replace(n, hit) === raw ? hit : withSpaces(raw, hit);
  for (const p of patterns) {
    const m = n.match(p.re);
    if (m) {
      let i = 1;
      return withSpaces(raw, p.en.replace(PH, () => m[i++] ?? ""));
    }
  }
  return null;
}

function withSpaces(raw: string, en: string) {
  const lead = raw.match(/^\s*/)?.[0] ?? "";
  const trail = raw.match(/\s*$/)?.[0] ?? "";
  return lead + en + trail;
}

function processText(node: Text) {
  const v = node.nodeValue ?? "";
  if (!AR.test(v)) return;
  const en = translate(v);
  if (en != null && en !== v) {
    if (!originalText.has(node)) originalText.set(node, v);
    touchedTexts.add(node);
    node.nodeValue = en;
  }
}

function processEl(el: Element) {
  if (el.getAttribute("dir") === "rtl") {
    el.setAttribute("dir", "ltr");
    flippedDir.add(el);
    touchedEls.add(el);
  }
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && AR.test(v)) {
      const en = translate(v);
      if (en) {
        const rec = originalAttr.get(el) ?? {};
        if (!(a in rec)) rec[a] = v;
        originalAttr.set(el, rec);
        touchedEls.add(el);
        el.setAttribute(a, en);
      }
    }
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return processText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (el.closest("[data-no-translate]")) return;
  processEl(el);
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const p = n.parentElement;
      if (p && p.tagName !== "SCRIPT" && p.tagName !== "STYLE" && !p.closest("[data-no-translate]")) processText(n as Text);
    } else processEl(n as Element);
    n = tw.nextNode();
  }
}

export async function enableEnglish() {
  await load();
  walk(document.body);
  if (observer) return;
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") processText(m.target as Text);
      else if (m.type === "attributes") processEl(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["dir", ...ATTRS],
  });
}

export function disableEnglish() {
  observer?.disconnect();
  observer = null;
  touchedTexts.forEach((n) => {
    const o = n && originalText.get(n);
    if (n && o != null) n.nodeValue = o;
  });
  touchedEls.forEach((el) => {
    if (!el) return;
    if (flippedDir.has(el)) el.setAttribute("dir", "rtl");
    const rec = originalAttr.get(el);
    if (rec) for (const [a, v] of Object.entries(rec)) el.setAttribute(a, v);
  });
  touchedTexts.clear();
  touchedEls.clear();
}
