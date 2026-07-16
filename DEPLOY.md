# Deploying the ohgeeceee network hub (free)

The hub is three static files — `index.html`, `support.html`, `ogc-network.js` (plus
`CNAME`). No build step, no server. Any static host works; below is **GitHub Pages**
(what you asked for) and one alternative worth knowing about.

---

## Recommended: GitHub Pages

Best fit here — it's free, gives you HTTPS on your own domain, and lives next to your
existing `github.com/ohgeeceee` repos.

### 1. Make the repo

1. Create a new **public** repo, e.g. `github.com/ohgeeceee/ohgeec`.
2. Add these files to the repo root (drag-and-drop in the browser is fine):
   - `index.html`
   - `support.html`
   - `ogc-network.js`
   - `CNAME`  ← already contains `ohgeec.com`, this is what binds the domain
3. Commit to the `main` branch.

### 2. Turn on Pages

Repo → **Settings → Pages** → under *Build and deployment*, set **Source: Deploy from a
branch**, **Branch: `main` / `/ (root)`** → Save. Give it a minute; it'll show a live URL.

### 3. Point ohgeec.com at GitHub

At your domain registrar's DNS, add these records for the **apex** (`ohgeec.com`):

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

And for the `www` version:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `ohgeeceee.github.io` |

(The four A records are the important ones; the AAAA records add IPv6 and are optional
but recommended. Always confirm the current IPs in GitHub's docs — link at the bottom.)

### 4. Lock in the domain + HTTPS

Back in **Settings → Pages**: the *Custom domain* box should already read `ohgeec.com`
(from the `CNAME` file). Once DNS propagates (minutes to a few hours), tick
**Enforce HTTPS**. Done — `https://ohgeec.com` is live.

### Bandwidth note

GitHub Pages has a ~100 GB/month soft limit. Since every site in the network loads
`ogc-network.js` from here, that's the one file with real traffic — but it's tiny
(~14 KB, and browsers cache it), so you're nowhere near the limit at personal scale.

---

## Alternative worth considering: Cloudflare Pages

If you'd rather not think about bandwidth at all, **Cloudflare Pages** is the one I'd
point you to. Same price (free), same drag-or-git deploy, but:

- **Unlimited bandwidth** — nice precisely because `ogc-network.js` is served to all
  your other domains.
- Faster global CDN and instant cache purges.
- Free custom domains + automatic HTTPS.

Trade-off: you manage the domain's DNS inside Cloudflare (which is itself free and, if
you move `ohgeec.com`'s nameservers there, also simplifies the DNS steps above). If your
whole world is already on GitHub, Pages is the lower-friction pick. Both are genuinely
fine.

Netlify and Vercel are also free and excellent for static sites; they're just heavier
than you need for three files. Any of the four will serve this correctly.

---

## After the hub is live

Add one line before `</body>` on each site so the network bar + Support button appear:

```html
<script src="https://ohgeec.com/ogc-network.js" defer></script>
```

Add `data-ogc-theme="dark"` on the dark sites (beemuu, Manners, GarageRoute):

```html
<script src="https://ohgeec.com/ogc-network.js" data-ogc-theme="dark" defer></script>
```

Because all sites load the registry from `ohgeec.com`, later changes (a new site, or
flipping Idaho Blotter from "soon" to "live") are a one-line edit in `ogc-network.js`
here — every site updates automatically, no redeploys elsewhere.

---

### Quick sanity check once live
- `https://ohgeec.com` shows the hub with all six cards.
- `https://ohgeec.com/ogc-network.js` loads the script (not a 404).
- On any site with the snippet, the network bar appears at the bottom.

Source for the DNS values: GitHub Docs — *Managing a custom domain for your GitHub Pages site*.
