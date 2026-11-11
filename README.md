# Wildlogic website

Plain HTML, CSS and JavaScript. No install needed. `python3 build.py` rebuilds the pages after you change text in `build.py`.

- `/` home, `/spirekeeper/` game page, `/spirekeeper/privacy/` (the link for Google Play), `/privacy/`
- Logo files in `assets/img` (`wild.svg`, `logic.svg`, `wl.svg`) were traced from the company logo.
- Fonts: Bricolage Grotesque (SIL Open Font License). Animation: Motion 12 (MIT). Both are served from this site.

## Publish on GitHub Pages
1. Repository Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
2. Custom domain: `wildlogic.pt`, then tick "Enforce HTTPS" when it appears.
3. DNS at the domain shop: four `A` records for `@` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and one `CNAME` for `www` pointing to `henriquembm283.github.io`.

## Google Search Console
Add `wildlogic.pt` as a "Domain" property, add the `TXT` record Google gives you to the DNS, press Verify.
