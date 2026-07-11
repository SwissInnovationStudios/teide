/* Teide marketing site — static i18n (own mechanism; the app's src/ i18n does NOT
   apply here). German is the inline default: with no JS the page stays readable in
   German, and the German dictionary (de.json) mirrors that inline text 1:1.

   Wiring on elements:
     data-i18n="key"                  → textContent
     data-i18n-html="key"             → innerHTML (for strings with <a>/<strong>/<br>)
     data-i18n-attr="attr:key;attr:key" → one or more attributes (title, content, alt, aria-label…)

   Language resolution: ?lang=xx  →  localStorage  →  navigator.language  →  'de'. */
(() => {
  'use strict';

  const LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl'];
  const DEFAULT = 'de';
  const STORE_KEY = 'teide-web-lang';
  // Cache-bust token — bump on every website change AND keep it in sync with the
  // ?v= on the css/js <link>/<script> tags in the four HTML pages. Prevents a
  // browser from pairing fresh HTML with a stale cached stylesheet/script/dict.
  const ASSET_VER = '20260711';
  // 2-letter language codes shown as chips. NOT emoji flags — Windows Chrome/Edge
  // have no flag glyphs and would fall back to bare "DE"/"GB" letters.
  const CODES = { de: 'DE', en: 'EN', es: 'ES', fr: 'FR', it: 'IT', nl: 'NL', pl: 'PL' };
  const NAMES = { de: 'Deutsch', en: 'English', es: 'Español', fr: 'Français', it: 'Italiano', nl: 'Nederlands', pl: 'Polski' };
  // i18n/ sits next to this script (js/) — one level up from js/.
  const base = new URL('../i18n/', document.currentScript ? document.currentScript.src : location.href);

  const dicts = {};   // lang → { key: value }  (cached after first fetch)
  let current = DEFAULT;

  const norm = (raw) => {
    if (!raw) return null;
    const l = String(raw).toLowerCase().slice(0, 2);
    return LANGS.includes(l) ? l : null;
  };

  function pickInitial() {
    const q = norm(new URLSearchParams(location.search).get('lang'));
    if (q) return q;
    try {
      const s = norm(localStorage.getItem(STORE_KEY));
      if (s) return s;
    } catch (_) { /* private mode */ }
    const navs = [navigator.language, ...(navigator.languages || [])];
    for (const n of navs) {
      const m = norm(n);
      if (m) return m;
    }
    return DEFAULT;
  }

  function apply(dict) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = dict[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = dict[el.getAttribute('data-i18n-html')];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
        const idx = pair.indexOf(':');
        if (idx < 0) return;
        const attr = pair.slice(0, idx).trim();
        const v = dict[pair.slice(idx + 1).trim()];
        if (attr && v != null) el.setAttribute(attr, v);
      });
    });
  }

  function load(lang) {
    if (dicts[lang]) return Promise.resolve(dicts[lang]);
    return fetch(new URL(lang + '.json?v=' + ASSET_VER, base))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((d) => (dicts[lang] = d));
  }

  function syncSelectorUI() {
    document.querySelectorAll('[data-lang-current-code]').forEach((el) => (el.textContent = CODES[current]));
    document.querySelectorAll('.lang-menu button[data-lang]').forEach((btn) =>
      btn.setAttribute('aria-selected', String(btn.getAttribute('data-lang') === current))
    );
  }

  function setLanguage(lang, persist) {
    lang = norm(lang) || DEFAULT;
    const go = (dict) => {
      current = lang;
      apply(dict);
      document.documentElement.lang = lang;
      syncSelectorUI();
      if (persist) {
        try { localStorage.setItem(STORE_KEY, lang); } catch (_) { /* ignore */ }
      }
    };
    // German baseline is already inline — apply de.json if present, else leave inline.
    return load(lang).then(go).catch(() => {
      if (lang === DEFAULT) { go({}); }   // inline German stays; just sync UI/state
    });
  }

  /* ---- Header language selector ---------------------------------------- */
  function buildSelector(root) {
    const menu = root.querySelector('.lang-menu');
    const btn = root.querySelector('.lang-btn');
    if (!menu || !btn) return;

    menu.innerHTML = LANGS.map((l) =>
      `<li><button type="button" role="option" data-lang="${l}" aria-selected="false">` +
      `<span class="lang-chip">${CODES[l]}</span><span>${NAMES[l]}</span></button></li>`
    ).join('');

    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    const open = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden ? open() : close();
    });
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('button[data-lang]');
      if (!item) return;
      setLanguage(item.getAttribute('data-lang'), true);
      close();
    });
    document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  function boot() {
    document.querySelectorAll('[data-lang-select]').forEach(buildSelector);
    setLanguage(pickInitial(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
