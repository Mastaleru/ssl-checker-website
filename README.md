# SSL Checker website

The site at <https://sslchecker.plusprivacy.com>: a short page about the [SSL Checker](https://github.com/Mastaleru/ssl-checker) extension and its privacy policy, which the Chrome Web Store listing links to.

| Page           | Address                                     | File                 |
| -------------- | ------------------------------------------- | -------------------- |
| Home           | https://sslchecker.plusprivacy.com/         | `index.html`         |
| Privacy policy | https://sslchecker.plusprivacy.com/privacy/ | `privacy/index.html` |

Plain HTML and one stylesheet, with no build step. Links between the pages are relative, so the site also works at `https://mastaleru.github.io/ssl-checker-website/` and from a local server: `python -m http.server` in this folder, then <http://localhost:8000/>.

## Keeping the policy current

The policy says what the extension and the PlusPrivacy notary do with data. When a change in the ssl-checker repository changes that (a new permission, something new sent, stored or kept by the notary), update `privacy/index.html`, English and Romanian, together with its date, before that version is submitted to the store.

## Publishing

GitHub Pages publishes the `main` branch as it is. `.nojekyll` turns off Jekyll, and `CNAME` holds the custom domain.

One-time setup:

1. Verify the domain, so that no other GitHub account can serve pages on it: profile **Settings → Pages → Add a domain**, `plusprivacy.com`, then add the TXT record GitHub shows and press **Verify**. This covers the immediate subdomains, `sslchecker.plusprivacy.com` included.
2. Repository **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch `main`, folder `/ (root)`. The custom domain, `sslchecker.plusprivacy.com`, comes from `CNAME`.
3. DNS: a CNAME record `sslchecker` → `mastaleru.github.io` (the account's Pages domain, without the repository name). No wildcard records.
4. When **Settings → Pages** reports the DNS check as successful, tick **Enforce HTTPS**. GitHub gets the certificate from Let's Encrypt; this can take a while after the DNS change.

Every push to `main` then publishes within a minute or two; the **Actions** tab shows each deployment.
