# SSL Checker website

The site at <https://sslchecker.plusprivacy.com>: the product page of the [SSL Checker](https://github.com/Mastaleru/ssl-checker) extension and its privacy policy, which the Chrome Web Store listing links to, in the extension's 14 languages.

| Page           | English                                     | Other languages                                                       |
| -------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Product page   | https://sslchecker.plusprivacy.com/         | `/<language>/`, for example https://sslchecker.plusprivacy.com/de/    |
| Privacy policy | https://sslchecker.plusprivacy.com/privacy/ | `/<language>/privacy/`, for example https://sslchecker.plusprivacy.com/ro/privacy/ |

`<language>` is the language's tag in lowercase: `de`, `es`, `fr`, `it`, `ja`, `ko`, `nl`, `pl`, `pt-br`, `ro`, `tr`, `uk`, `zh-cn`.

Plain HTML, one stylesheet and no JavaScript beyond the language choice: the fingerprint comparison at the top of the product page works with CSS alone. Links are relative, so the site also works from a local server: `python -m http.server` in this folder, then <http://localhost:8000/>.

Nothing is loaded from other servers and there are no analytics: the fonts (Atkinson Hyperlegible Next and Mono, the extension's own, under the SIL Open Font License in `fonts/`) are served from here. Chinese, Japanese and Korean use the visitor's system fonts.

## Texts and languages

The pages are generated, so do not edit the `index.html` files: change the texts, then run

```bash
node tools/build.mjs
```

(Node.js 18 or newer, no dependencies). It writes every page in every language, and `tools/og.html`.

- `i18n/<language>.json`: the texts of the pages, one file per language, named with the language's BCP 47 tag (`en`, `pt-BR`, `zh-CN`). Some values hold HTML. `name` is the language's own name, shown in the language menus.
- `i18n/policy/<language>.html`: the body of the privacy policy, one paragraph per line.
- `tools/build.mjs`: the layout of the pages, the same for every language.

English and Romanian are the originals. The other languages are translations of the English texts, and their privacy policy pages say that the English text is the one that applies (`policy_note`). To add a language, add its two files and run the build; `ORDER` in `tools/build.mjs` sets its place in the menus. In Romanian, the build keeps words joined by a hyphen (`debugger-ul`, `site-ul`) on one line.

Which language a visitor sees: an English page sends a visitor whose browser prefers another of the site's languages to that language. The browser's languages are tried in order; Portuguese goes to Brazilian Portuguese, and Chinese to Simplified Chinese, except Traditional Chinese (Taiwan, Hong Kong, Macau), which stays on English. The language menu in the header and the language list in the footer link with `?lang=<language>`, which records the visitor's choice in the browser, and that choice wins from then on. Without such a choice, a page in another language never sends a visitor elsewhere, so that search engines can read every language.

## Images

- `img/<language>/`: screenshots of the real extension, in WebP, light and dark (the page picks the one that matches the visitor's color scheme).
- `img/og-<language>.png`: the preview shown when a page is shared (LinkedIn, Slack and the like), 1200×630, made from `tools/og.html`.

The ssl-checker repository renders both, the screenshots from its own code with fictional certificates. Run the build here first, then, with both repositories side by side, from `ssl-checker`:

```bash
SITE_IMAGES=../ssl-checker-website/img node store/tools/make-screenshots.mjs
```

In PowerShell: `$env:SITE_IMAGES='..\ssl-checker-website\img'; node store/tools/make-screenshots.mjs`. `LANGS=de,fr` limits a run to some languages, named like the extension's `_locales` folders (`pt_BR`, `zh_CN`).

## Keeping the policy current

The policy says what the extension and the PlusPrivacy notary do with data. When a change in the ssl-checker repository changes that (a new permission, something new sent, stored or kept by the notary), update the policy before that version is submitted to the store: the English and Romanian texts in `i18n/policy/`, every translation (a translation that says less than the English one misleads its readers), and the date, `updated`, in every `i18n/*.json`. Then run the build.

## Chrome Web Store

The listing is <https://chromewebstore.google.com/detail/ssl-checker/nbanpljakngdndmmekhogfliinegiapb>. The product page's first button ("Add to Chrome") and the first footer link on every page point to it; pages in other languages add `?hl=<language>` (`?hl=pt-BR`), so that the store shows the listing in that language.

## Publishing

GitHub Pages publishes the `main` branch as it is. `.nojekyll` turns off Jekyll, and `CNAME` holds the custom domain.

One-time setup:

1. Verify the domain, so that no other GitHub account can serve pages on it: profile **Settings → Pages → Add a domain**, `plusprivacy.com`, then add the TXT record GitHub shows and press **Verify**. This covers the immediate subdomains, `sslchecker.plusprivacy.com` included.
2. Repository **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch `main`, folder `/ (root)`. The custom domain, `sslchecker.plusprivacy.com`, comes from `CNAME`.
3. DNS: a CNAME record `sslchecker` → `mastaleru.github.io` (the account's Pages domain, without the repository name). No wildcard records.
4. When **Settings → Pages** reports the DNS check as successful, tick **Enforce HTTPS**. GitHub gets the certificate from Let's Encrypt; this can take a while after the DNS change.

Every push to `main` then publishes within a minute or two; the **Actions** tab shows each deployment. GitHub Pages does not run the build: commit the generated pages together with the texts.
