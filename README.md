# SSL Checker website

The site at <https://sslchecker.plusprivacy.com>: the product page of the [SSL Checker](https://github.com/Mastaleru/ssl-checker) extension and its privacy policy, which the Chrome Web Store listing links to.

| Page           | English                                     | Romanian                                       |
| -------------- | ------------------------------------------- | ---------------------------------------------- |
| Product page   | https://sslchecker.plusprivacy.com/         | https://sslchecker.plusprivacy.com/ro/         |
| Privacy policy | https://sslchecker.plusprivacy.com/privacy/ | https://sslchecker.plusprivacy.com/ro/privacy/ |

Plain HTML, one stylesheet and no JavaScript beyond the language choice: the fingerprint comparison at the top of the product page works with CSS alone. Links are relative, so the site also works from a local server: `python -m http.server` in this folder, then <http://localhost:8000/>.

Nothing is loaded from other servers and there are no analytics: the fonts (Atkinson Hyperlegible Next and Mono, the extension's own, under the SIL Open Font License in `fonts/`) are served from here.

## Languages

Each page exists in English and in Romanian, with the same layout. A visitor whose browser prefers Romanian over English is sent from an English page to its Romanian copy; everyone else stays on English. The language link in the header and the footer (`?lang=en` or `?lang=ro`) records the visitor's choice in the browser, and that choice wins from then on. A Romanian page never sends a visitor to English on its own, so that search engines can read both.

When you change a text, change it in both `index.html` and `ro/index.html` (or in both privacy pages). In Romanian, wrap words joined by a hyphen in `<span class="nowrap">` (`debugger-ul`, `site-ul`), so that a line never breaks inside them.

## Images

- `img/en/` and `img/ro/`: screenshots of the real extension, in WebP, light and dark (the page picks the one that matches the visitor's color scheme). They come from the ssl-checker repository, which renders them from its own code with fictional certificates. With both repositories side by side, from `ssl-checker`:

  ```bash
  SITE_IMAGES=../ssl-checker-website/img node store/tools/make-screenshots.mjs
  ```

- `img/og-en.png` and `img/og-ro.png`: the preview shown when a page is shared (LinkedIn, Slack and the like), 1200×630. They are screenshots of `tools/og.html?lang=en` and `?lang=ro`, opened through the local server above in a 1200×630 window with the light color scheme.

## Keeping the policy current

The policy says what the extension and the PlusPrivacy notary do with data. When a change in the ssl-checker repository changes that (a new permission, something new sent, stored or kept by the notary), update both privacy pages, together with their dates, before that version is submitted to the store.

## When the extension is in the Chrome Web Store

The first button on the product page is a placeholder, "Coming soon to the Chrome Web Store". Once the listing is public, replace it in both `index.html` and `ro/index.html` with a link to the listing:

```html
<a class="button primary" href="https://chromewebstore.google.com/detail/…">Add to Chrome</a>
```

In Romanian, "Adaugă în Chrome".

## Publishing

GitHub Pages publishes the `main` branch as it is. `.nojekyll` turns off Jekyll, and `CNAME` holds the custom domain.

One-time setup:

1. Verify the domain, so that no other GitHub account can serve pages on it: profile **Settings → Pages → Add a domain**, `plusprivacy.com`, then add the TXT record GitHub shows and press **Verify**. This covers the immediate subdomains, `sslchecker.plusprivacy.com` included.
2. Repository **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch `main`, folder `/ (root)`. The custom domain, `sslchecker.plusprivacy.com`, comes from `CNAME`.
3. DNS: a CNAME record `sslchecker` → `mastaleru.github.io` (the account's Pages domain, without the repository name). No wildcard records.
4. When **Settings → Pages** reports the DNS check as successful, tick **Enforce HTTPS**. GitHub gets the certificate from Let's Encrypt; this can take a while after the DNS change.

Every push to `main` then publishes within a minute or two; the **Actions** tab shows each deployment.
