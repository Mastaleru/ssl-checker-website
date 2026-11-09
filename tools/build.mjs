// Writes every page of the site, in every language, from one template:
//   node tools/build.mjs
// Texts: i18n/<language>.json for the pages, i18n/policy/<language>.html for the body
// of the privacy policy. English lives at the root, every other language in a folder
// named after its lowercase tag (/ro/, /pt-br/). No dependencies: Node 18 or newer.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://sslchecker.plusprivacy.com';
const GITHUB = 'https://github.com/Mastaleru/ssl-checker';
const NOTARY_GUIDE = `${GITHUB}/tree/main/notary`;
const STORE = 'https://chromewebstore.google.com/detail/ssl-checker/nbanpljakngdndmmekhogfliinegiapb';

// The order of the language menus: by each language's own name, Latin script first.
// Only languages with an i18n file are built.
const ORDER = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt-BR', 'ro', 'tr', 'uk', 'ja', 'ko', 'zh-CN'];
const available = readdirSync(path.join(ROOT, 'i18n'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.slice(0, -'.json'.length));
const LANGUAGES = [...ORDER.filter((tag) => available.includes(tag)), ...available.filter((tag) => !ORDER.includes(tag))];
// The privacy policy was written in English and Romanian; the other languages are
// translations, and their pages say that the English text applies.
const ORIGINAL = new Set(['en', 'ro']);

const T = Object.fromEntries(
  LANGUAGES.map((tag) => [tag, JSON.parse(readFileSync(path.join(ROOT, 'i18n', `${tag}.json`), 'utf8'))]),
);
const POLICY = Object.fromEntries(
  LANGUAGES.map((tag) => [tag, readFileSync(path.join(ROOT, 'i18n', 'policy', `${tag}.html`), 'utf8').trim()]),
);

const folder = (tag) => (tag === 'en' ? '' : `${tag.toLowerCase()}/`);
const KINDS = { home: '', policy: 'privacy/' };
const pathOf = (tag, kind) => `/${folder(tag)}${KINDS[kind]}`;
const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** The store listing in the page's language. */
const storeUrl = (tag) => (tag === 'en' ? STORE : `${STORE}?hl=${tag}`);

/** A link from one page of the site to another, relative so that the site works anywhere. */
function link(fromPath, toPath) {
  const from = fromPath.split('/').filter(Boolean);
  const to = toPath.split('/').filter(Boolean);
  let common = 0;
  while (common < from.length && from[common] === to[common]) common++;
  return '../'.repeat(from.length - common) + to.slice(common).map((part) => `${part}/`).join('') || './';
}

// The fingerprints of the store images' certificates, drawn as the extension draws them.
const GENUINE = 'E50196C1126C1E17218D1D9B0BB7FC0D72A1D660C8B76BFDDC91B5A487ED0FE4';
const INTERCEPTED = 'F4CDACB7D7D29155987EA67F36CB2E30EB0394D3C33ABCCB539D3CBF08201580';
const heights = (fingerprint) =>
  Array.from({ length: 32 }, (_, i) => 3 + Math.round((parseInt(fingerprint.slice(i * 2, i * 2 + 2), 16) / 255) * 17));
const short = (fingerprint) => `${fingerprint.slice(0, 4)} ${fingerprint.slice(4, 8)}`;

function bars(fingerprint, morphTo) {
  const to = morphTo && heights(morphTo);
  const rects = heights(fingerprint).map((h, i) =>
    to
      ? `<rect x="${i * 5}" y="0" width="3" height="20" rx="0.8" style="--i: ${i}; --a: ${+(h / 20).toFixed(2)}; --b: ${+(to[i] / 20).toFixed(2)}" />`
      : `<rect x="${i * 5}" y="${20 - h}" width="3" height="${h}" rx="0.8" />`,
  );
  return `<svg class="bars" viewBox="0 0 158 20" width="316" height="40" aria-hidden="true">${rects.join('')}</svg>`;
}

const SHIELD =
  '<path d="M12 2.6 19.4 5.4v6.1c0 4.5-3.1 8.2-7.4 9.8-4.3-1.6-7.4-5.3-7.4-9.8V5.4L12 2.6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />';
const SHIELD_OK = `<svg class="shield is-good" viewBox="0 0 24 24" aria-hidden="true">${SHIELD}<path d="m8.7 12 2.3 2.3 4.4-4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
const SHIELD_BAD = `<svg class="shield is-bad" viewBox="0 0 24 24" aria-hidden="true">${SHIELD}<path d="m9.6 9.4 4.8 4.8m0-4.8-4.8 4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>`;
const GLOBE =
  '<svg class="globe" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3Z" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>';

/** The page in the visitor's language: see "Languages" in README.md. */
function languageScript() {
  const tags = JSON.stringify(LANGUAGES.map((tag) => tag.toLowerCase()));
  return `<script>
      // An English page sends a visitor whose browser prefers another of the site's
      // languages to that language; a language picked in the menu wins from then on.
      (function () {
        var html = document.documentElement;
        var languages = ${tags};
        var page = html.lang.toLowerCase();
        var url = new URL(location.href);
        var choice = (url.searchParams.get('lang') || '').toLowerCase();
        function match(tag) {
          var base = tag.split('-')[0];
          if (languages.indexOf(tag) >= 0) return tag;
          if (base === 'zh') return /-(hant|tw|hk|mo)(-|$)/.test(tag) || languages.indexOf('zh-cn') < 0 ? null : 'zh-cn';
          if (base === 'pt') return languages.indexOf('pt-br') >= 0 ? 'pt-br' : null;
          return languages.indexOf(base) >= 0 ? base : null;
        }
        try {
          if (languages.indexOf(choice) >= 0) {
            localStorage.setItem('lang', choice);
          } else {
            choice = localStorage.getItem('lang');
          }
        } catch (e) {}
        if (languages.indexOf(choice) < 0) choice = null;
        if (!choice && page === 'en') {
          var tags = navigator.languages || [navigator.language || ''];
          for (var i = 0; i < tags.length && !choice; i++) choice = match(String(tags[i]).toLowerCase());
        }
        if (choice && choice !== page) {
          var target = html.dataset.root + (choice === 'en' ? '' : choice + '/') + html.dataset.page;
          location.replace(new URL(target, location.href).href + location.hash);
        } else if (url.searchParams.has('lang')) {
          url.searchParams.delete('lang');
          history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
      })();
      // The language menu closes like other menus: on a click outside it, or on Escape.
      document.addEventListener('click', function (event) {
        var menu = document.querySelector('.lang-menu[open]');
        if (menu && !menu.contains(event.target)) menu.open = false;
      });
      document.addEventListener('keydown', function (event) {
        var menu = document.querySelector('.lang-menu[open]');
        if (menu && event.key === 'Escape') {
          menu.open = false;
          menu.querySelector('summary').focus();
        }
      });
    </script>`;
}

function head(tag, kind, title, description) {
  const t = T[tag];
  const here = pathOf(tag, kind);
  const root = link(here, '/').replace(/^\.\/$/, '');
  const alternates = LANGUAGES.map(
    (other) => `    <link rel="alternate" hreflang="${other}" href="${ORIGIN}${pathOf(other, kind)}" />`,
  ).join('\n');
  return `<!doctype html>
<html lang="${tag}" data-root="${root}" data-page="${KINDS[kind]}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="canonical" href="${ORIGIN}${here}" />
${alternates}
    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathOf('en', kind)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SSL Checker" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${ORIGIN}${here}" />
    <meta property="og:image" content="${ORIGIN}/img/og-${tag.toLowerCase()}.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${t.locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#f5f7fa" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0f1726" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/png" href="${root}icon.png" />
    <link rel="preload" href="${root}fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="${root}style.css" />
    ${languageScript()}
  </head>`;
}

function languageLinks(tag, kind, indent) {
  const here = pathOf(tag, kind);
  return LANGUAGES.map((other) => {
    const current = other === tag ? ' aria-current="page"' : '';
    const href = `${link(here, pathOf(other, kind))}?lang=${other.toLowerCase()}`;
    return `${indent}<li><a href="${href}" hreflang="${other}" lang="${other}"${current}>${T[other].name}</a></li>`;
  }).join('\n');
}

function header(tag, kind) {
  const t = T[tag];
  const here = pathOf(tag, kind);
  const home = link(here, pathOf(tag, 'home'));
  const anchor = kind === 'home' ? '' : home;
  const root = link(here, '/').replace(/^\.\/$/, '');
  return `  <body>
    <a class="skip" href="#main">${t.skip}</a>
    <header class="site-head wrap">
      <a class="brand" href="${home}"><img src="${root}icon.png" width="32" height="32" alt="" />SSL Checker</a>
      <nav class="site-nav" aria-label="${escape(t.nav_label)}">
        <a class="optional" href="${anchor}#interception">${t.nav_how}</a>
        <a class="optional" href="${anchor}#privacy">${t.nav_privacy}</a>
        <a class="optional" href="${GITHUB}">${t.nav_source}</a>
        <details class="lang-menu">
          <summary aria-label="${escape(`${t.language_label}: ${t.name}`)}">${GLOBE}<span>${t.name}</span></summary>
          <ul style="--rows: ${Math.ceil(LANGUAGES.length / 2)}">
${languageLinks(tag, kind, '            ')}
          </ul>
        </details>
      </nav>
    </header>`;
}

function footer(tag, kind) {
  const t = T[tag];
  const here = pathOf(tag, kind);
  const root = link(here, '/').replace(/^\.\/$/, '');
  return `    <footer class="site-foot">
      <div class="foot-grid wrap">
        <div class="foot-brand">
          <img src="${root}icon.png" width="32" height="32" alt="" />
          <div>
            <strong>SSL Checker</strong>
            <p>${t.tagline}</p>
          </div>
        </div>
        <ul class="foot-links">
          <li><a href="${storeUrl(tag)}">Chrome Web Store</a></li>
          <li><a href="${link(here, pathOf(tag, 'policy'))}">${t.privacy_policy}</a></li>
          <li><a href="${GITHUB}">${t.source_code}</a></li>
          <li><a href="${NOTARY_GUIDE}">${t.run_notary}</a></li>
          <li><a href="mailto:mastaleru.rafael@gmail.com">${t.contact}</a></li>
          <li><a href="https://www.linkedin.com/in/mastaleru/">LinkedIn</a></li>
        </ul>
        <ul class="foot-languages" aria-label="${escape(t.language_label)}">
${languageLinks(tag, kind, '          ')}
        </ul>
        <p class="copy">© 2026 Rafael Mastaleru</p>
      </div>
    </footer>
  </body>
</html>
`;
}

function shot(tag, root, image, alt, wide = false) {
  const [width, height] = wide ? [480, 675] : [400, 600];
  const dir = `${root}img/${tag.toLowerCase()}`;
  return `<figure class="shot${wide ? ' wide' : ''}">
          <picture>
            <source srcset="${dir}/${image}-dark.webp" media="(prefers-color-scheme: dark)" />
            <img src="${dir}/${image}-light.webp" width="${width}" height="${height}" alt="${escape(alt)}" loading="lazy" decoding="async" />
          </picture>
        </figure>`;
}

function home(tag) {
  const t = T[tag];
  const here = pathOf(tag, 'home');
  const root = link(here, '/').replace(/^\.\/$/, '');
  const policy = link(here, pathOf(tag, 'policy'));
  const notary = (name, meta) => `<li class="witness">
              <span class="who">${name}</span>
              <span class="chip"><span class="is-good">${t.identical}</span><span class="is-bad">${t.different}</span></span>
              <span class="print">${bars(GENUINE)}<span class="hex">${short(GENUINE)}</span></span>
              <span class="meta">${meta}</span>
            </li>`;
  const checks = t.privacy_items.map((item) => `            <li>${item}</li>`).join('\n');
  const body = `
    <main id="main">
      <section class="hero wrap" aria-labelledby="title">
        <div>
          <h1 id="title">${t.h1}</h1>
          <p class="lead">${t.lead}</p>
          <div class="actions">
            <a class="button primary" href="${storeUrl(tag)}">${t.store_button}</a>
            <a class="button" href="${GITHUB}">${t.view_source}</a>
          </div>
          <p class="note">${t.free_note}</p>
        </div>
        <figure class="compare" aria-labelledby="compare-caption">
          <div class="network" role="radiogroup" aria-labelledby="network-label">
            <span id="network-label">${t.network_label}</span>
            <span class="seg">
              <label><input type="radio" name="network" value="ordinary" checked />${t.ordinary}</label>
              <label><input type="radio" name="network" value="inspected" />${t.inspected}</label>
            </span>
          </div>
          <div class="verdict">
            ${SHIELD_OK}${SHIELD_BAD}
            <div>
              <p class="verdict-title"><span class="is-good">${t.ok_title}</span><span class="is-bad">${t.bad_title}</span></p>
              <p class="verdict-body"><span class="is-good">${t.ok_body}</span><span class="is-bad">${t.bad_body}</span></p>
            </div>
          </div>
          <ul class="witnesses">
            <li class="witness you">
              <span class="who">${t.you}</span>
              <span class="print">${bars(GENUINE, INTERCEPTED)}<span class="hex"><span class="is-good">${short(GENUINE)}</span><span class="is-bad">${short(INTERCEPTED)}</span></span></span>
            </li>
            ${notary('PlusPrivacy', t.signed)}
            ${notary('Virginia', 'Ashburn, US')}
          </ul>
          <figcaption id="compare-caption">${t.caption}</figcaption>
        </figure>
      </section>

      <section class="feature wrap" id="details" aria-labelledby="details-title">
        <div>
          <h2 id="details-title">${t.details_h2}</h2>
          ${t.details_body}
        </div>
        ${shot(tag, root, 'details', t.details_alt)}
      </section>

      <section class="feature wrap" id="interception" aria-labelledby="interception-title">
        <div>
          <h2 id="interception-title">${t.intercept_h2}</h2>
          ${t.intercept_body}
        </div>
        ${shot(tag, root, 'intercepted', t.intercept_alt)}
      </section>

      <section class="feature wrap" id="signed" aria-labelledby="signed-title">
        <div>
          <h2 id="signed-title">${t.signed_h2}</h2>
          ${t.signed_body}
        </div>
        ${shot(tag, root, 'confirmed', t.signed_alt)}
      </section>

      <section class="feature wrap" id="debugger" aria-labelledby="debugger-title">
        <div>
          <h2 id="debugger-title">${t.debugger_h2}</h2>
          ${t.debugger_body}
        </div>
        ${shot(tag, root, 'options', t.options_alt, true)}
      </section>

      <section class="privacy wrap" id="privacy" aria-labelledby="privacy-title">
        <div>
          <h2 id="privacy-title">${t.privacy_h2}</h2>
          <ul class="checks">
${checks}
          </ul>
          <p><a href="${policy}">${t.read_policy}</a></p>
        </div>
        <figure class="request">
          <figcaption>${t.request_caption}</figcaption>
          <pre><code>POST /v1/cert
Content-Type: application/json

{
  "host": "www.example.com",
  "port": 443,
  "nonce": "Xq3MpTb0vR9kLs2eWn5yZA"
}</code></pre>
        </figure>
      </section>
    </main>

`;
  return `${head(tag, 'home', t.title, t.description)}\n${header(tag, 'home')}${body}${footer(tag, 'home')}`;
}

function policy(tag) {
  const t = T[tag];
  const note = ORIGINAL.has(tag) ? '' : `\n      <p class="translation-note">${t.policy_note}</p>`;
  const paragraphs = POLICY[tag]
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `      ${line.trim()}`)
    .join('\n');
  const body = `
    <main id="main" class="prose wrap">
      <h1>${t.policy_title}</h1>
      <p class="updated">${t.updated}</p>${note}
${paragraphs}
    </main>

`;
  return `${head(tag, 'policy', t.policy_page_title, t.policy_description)}\n${header(tag, 'policy')}${body}${footer(tag, 'policy')}`;
}

/**
 * Romanian joins words with hyphens (debugger-ul, site-urilor): no line breaks there.
 * Only text between tags changes, outside script, style, pre and title.
 */
function keepHyphenatedWordsWhole(page) {
  return page
    .split(/(<(script|style|pre|title)\b[\s\S]*?<\/\2>)/)
    .filter((part, i) => i % 3 !== 2)
    .map((block) =>
      /^<(script|style|pre|title)\b/.test(block)
        ? block
        : block
            .split(/(<[^>]+>)/)
            .map((part) =>
              part.startsWith('<')
                ? part
                : part.replace(/[\p{L}\p{N}.]+(?:-[\p{L}\p{N}]+)+/gu, (word) => `<span class="nowrap">${word}</span>`),
            )
            .join(''),
    )
    .join('');
}

/** The link preview page: one panel per language, picked with ?lang=. */
function ogPage() {
  const rows = (t) =>
    [
      [t.you, null, null],
      ['PlusPrivacy', t.identical, t.signed],
      ['Virginia', t.identical, 'Ashburn, US'],
    ]
      .map(
        ([who, chip, meta]) =>
          `<li class="witness"><span class="who">${who}</span>${chip ? `<span class="chip">${chip}</span>` : ''}<span class="print">${bars(GENUINE)}<span class="hex">${short(GENUINE)}</span></span>${meta ? `<span class="meta">${meta}</span>` : ''}</li>`,
      )
      .join('');
  const panels = LANGUAGES.map((tag) => {
    const t = T[tag];
    return `    <div class="og" lang="${tag}" data-lang="${tag.toLowerCase()}">
      <div class="og-text">
        <p class="og-brand"><img src="../icon.png" width="56" height="56" alt="" />SSL Checker</p>
        <h1>${t.h1}</h1>
        <p class="og-tag">${t.tagline}</p>
      </div>
      <figure class="compare">
        <div class="verdict">${SHIELD_OK.replace(' is-good', '')}<div><p class="verdict-title">${t.ok_title}</p></div></div>
        <ul class="witnesses">${rows(t)}</ul>
      </figure>
    </div>`;
  }).join('\n');
  return `<!doctype html>
<!-- The link previews, img/og-<language>.png: this page at 1200x630 in the light color scheme,
     one language at a time (?lang=en, ?lang=pt-br). Written by tools/build.mjs; the images are
     rendered with the screenshots, see "Images" in README.md. -->
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>SSL Checker link preview</title>
    <link rel="stylesheet" href="../style.css" />
    <style>
      html, body { width: 1200px; height: 630px; margin: 0; overflow: hidden; color-scheme: light; }
      .og { display: none; box-sizing: border-box; width: 1200px; height: 630px; padding: 0 72px 0 80px;
            grid-template-columns: minmax(0, 1fr) 470px; align-items: center; gap: 64px; }
      .og.shown { display: grid; }
      .og-brand { display: flex; align-items: center; gap: 14px; margin: 0 0 30px; font-size: 30px; font-weight: 740; }
      .og h1 { margin: 0 0 22px; font-size: 54px; line-height: 1.05; font-weight: 760; letter-spacing: -0.02em; overflow-wrap: break-word; }
      .og:is(:lang(ja), :lang(ko), :lang(zh)) h1 { font-size: 50px; line-height: 1.25; letter-spacing: 0; }
      .og-tag { margin: 0; color: var(--ink-2); font-size: 24px; }
      .og .compare { box-shadow: 16px 16px 0 var(--block); }
    </style>
  </head>
  <body>
${panels}
    <script>
      var lang = (new URLSearchParams(location.search).get('lang') || 'en').toLowerCase();
      var panel = document.querySelector('.og[data-lang="' + lang + '"]') || document.querySelector('.og[data-lang="en"]');
      panel.classList.add('shown');
      document.documentElement.lang = panel.lang;
      // A long title gets smaller until the text fits the image.
      document.fonts.ready.then(function () {
        var title = panel.querySelector('h1');
        var text = panel.querySelector('.og-text');
        for (var size = 52; text.offsetHeight > 540 && size >= 36; size -= 2) {
          title.style.fontSize = size + 'px';
        }
      });
    </script>
  </body>
</html>
`;
}

for (const tag of LANGUAGES) {
  for (const [kind, render] of [
    ['home', home],
    ['policy', policy],
  ]) {
    let page = render(tag);
    if (tag === 'ro') page = keepHyphenatedWordsWhole(page);
    const file = path.join(ROOT, ...pathOf(tag, kind).split('/').filter(Boolean), 'index.html');
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, page);
  }
}
writeFileSync(path.join(ROOT, 'tools', 'og.html'), ogPage());
console.log(`${LANGUAGES.length} languages: ${LANGUAGES.join(', ')}`);
