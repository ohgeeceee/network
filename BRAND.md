# The ohgeeceee network — brand & integration system

This is the connective tissue for the sites you make: **finally**, **Manners**,
**beemuu**, **Montana Blotter**, **Idaho Blotter**, and **Garage Route**. The goal
isn't to make them look identical — each has its own personality — but to make it
obvious they come from the same hand, and to let a visitor on one hop to the others.

Three pieces ship together:

| File | What it is |
|------|-----------|
| `ogc-network.js` | The single source of truth (the site registry) **and** the drop-in network bar. |
| `index.html` | The portfolio hub — the "front door" that showcases every site. |
| `BRAND.md` | This document. |

Everything reads from one list of sites inside `ogc-network.js`. Edit that list once
and the hub, every network bar, and every future site update together.

---

## 1. The name & the mark

**Network name:** *ohgeeceee network* (after your GitHub handle). It's the umbrella —
the individual products keep their own names.

**The mark** is a three-node graph: three sites, connected. It's one small inline SVG,
so it needs no image files and recolours to any ink colour.

```
   ●          three dots joined in a triangle =
  / \         "a small network of connected things"
 ●---●
```

The mark lives inside `ogc-network.js` and `index.html`. To reuse it elsewhere, copy
the `<svg>…</svg>` block and change the `fill`/`stroke` colour.

> **Naming note:** the hub currently points at `ohgeeceee.net` as the umbrella domain.
> You don't own that yet — pick any domain you like for the hub (even one of the ones
> you already have) and change the single `HUB` constant at the top of `ogc-network.js`.

---

## 2. Design tokens

The network's own "chrome" is deliberately neutral — warm off-white and near-black —
so each site's colour is the thing that pops. Copy these into any new site.

```css
:root{
  /* network neutrals */
  --ink:    #14110E;   /* warm near-black — text, mark */
  --paper:  #FAF7F2;   /* warm off-white — page background */
  --muted:  #6B645C;   /* secondary text */
  --line:   rgba(20,17,14,.11); /* hairline borders */
  --card:   #FFFFFF;

  /* type */
  --serif:'Fraunces', Georgia, serif;   /* display / headings */
  --sans: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif; /* body / UI */
}
```

**Per-site accent colours** (each site's signature, used for its card stripe, monogram,
and dot in the bar):

| Site | Accent | Hex |
|------|--------|-----|
| finally | amber | `#DE8C2C` |
| Manners | old-gold | `#A9853B` |
| beemuu | BMW blue | `#2E6DB4` |
| Montana Blotter | oxblood | `#9E3B34` |
| Idaho Blotter | pine | `#3E7D57` |
| GarageRoute | teal | `#1F9E8F` |

These are defined per-site in the registry (`accent` field). Change one there and it
updates everywhere.

---

## 3. Typography

- **Headings / display:** Fraunces (a warm, slightly old-style serif). Falls back to
  Georgia if the webfont doesn't load.
- **Body / UI:** Inter, falling back to the system sans stack.

Both load from Google Fonts on the hub. The network bar uses **system fonts only** so
it never adds a font request to a site it's embedded on.

---

## 4. The network bar (cross-site integration)

A small strip that links every sibling site. Drop it into any site with one line:

```html
<script src="https://YOUR-HUB-DOMAIN/ogc-network.js" defer></script>
```

It automatically:

- lists every **other** site (it detects the current domain and hides it),
- adapts to light or dark pages,
- shows a `soon` tag on sites that aren't live yet,
- adds **zero** cookies, requests, or trackers.

### Options (attributes on the `<script>` tag)

| Attribute | Values | Default | Effect |
|-----------|--------|---------|--------|
| `data-ogc-theme` | `light` `dark` `auto` | `auto` | Force the palette. `auto` samples the page background. |
| `data-ogc-position` | `inline` `bottom` | `inline` | `inline` sits at the end of the page; `bottom` pins it to the viewport. |
| `data-ogc-bar` | `off` | — | Load the registry but don't inject a bar (used on the hub). |

### Examples

```html
<!-- Most sites: just this -->
<script src="https://ohgeeceee.net/ogc-network.js" defer></script>

<!-- A dark site (beemuu, Manners) — force the dark palette -->
<script src="https://ohgeeceee.net/ogc-network.js" data-ogc-theme="dark" defer></script>

<!-- Pin the bar to the bottom of the screen -->
<script src="https://ohgeeceee.net/ogc-network.js" data-ogc-position="bottom" defer></script>
```

---

## 4½. Support / tip jar (Stripe)

There's a shared "Support the network" tip jar wired into every surface: a **Support**
button on the network bar, a CTA band on the hub, and a dedicated page at
`support.html`. It offers preset one-time tips (Coffee $3 / Lunch $8 / Patron $25)
plus a pay-what-you-want option, all going to **one shared Stripe account**.

### Why Payment Links (and not a checkout API)

Your sites are static — there's no server to hold a Stripe secret key, and you should
**never** put a secret key in front-end JavaScript. [Stripe Payment Links](https://dashboard.stripe.com/payment-links)
are the correct tool: each one is just a hosted checkout URL you create in the dashboard.
No backend, no keys in your repo, PCI handled by Stripe. The tip buttons are plain links.

### One-time setup (~5 minutes)

1. Go to **Stripe → Payment Links → New link**.
2. Create four links:
   - a **$3** fixed-price link ("Coffee"),
   - an **$8** fixed-price link ("Lunch"),
   - a **$25** fixed-price link ("Patron"),
   - one link with **"Let customers choose what to pay"** enabled (the custom amount).
3. Copy each link's URL (looks like `https://buy.stripe.com/xxxxxxxx`).
4. Open `ogc-network.js`, find the `SUPPORT` block, and paste each URL over the
   matching `https://buy.stripe.com/REPLACE_*` placeholder.

That's it. Until you paste real links, `support.html` shows a small amber "not set up
yet" note **only to you** — it disappears automatically once the placeholders are gone.

### The `SUPPORT` config

```js
var SUPPORT = {
  enabled: true,
  heading: "Support the network",
  blurb:   "…",
  currency:"$",
  tiers: [
    { label:"Coffee", amount:3,  note:"A small thank-you",  link:"https://buy.stripe.com/…" },
    { label:"Lunch",  amount:8,  note:"…", link:"https://buy.stripe.com/…", featured:true },
    { label:"Patron", amount:25, note:"…", link:"https://buy.stripe.com/…" }
  ],
  customLink: "https://buy.stripe.com/…",  // "customer chooses amount" link
  monthlyLink: ""                          // optional subscription link; "" hides it
};
```

- Change amounts, labels, or notes freely — the page and bar re-render from this.
- `featured:true` gives a tier the "Most picked" flag.
- Want a **monthly** option too? Create a subscription Payment Link and drop its URL in
  `monthlyLink`; a "Support monthly instead" link appears automatically.
- To turn the whole thing off, set `enabled:false` (the bar button and CTA vanish).

### Alternative: the Stripe Buy Button

If you'd rather have Stripe's own embedded widget (with Apple/Google Pay buttons baked
in), you can swap any tip link for a `<stripe-buy-button>` — it's also 100% client-side
(publishable key only, which is safe to expose). Payment Links are simpler and match the
network's look, so they're the default here.

---

## 5. Installing across the sites (static / GitHub Pages)

Each site is its own static repo under `github.com/ohgeeceee`. Two ways to wire them up:

### Option A — point every site at the hub's copy (recommended)

Host `ogc-network.js` **once** on the hub domain, then add the one-line `<script>` to
each site's HTML (just before `</body>`). Now the registry lives in a single place: add
a seventh site later and every bar picks it up automatically, no redeploys of the other
repos needed.

1. Deploy `index.html` + `ogc-network.js` to your hub domain.
2. In each site repo, paste the `<script>` line into the main template/`index.html`.
3. Commit & push. Done.

### Option B — vendor a copy into each repo

If you'd rather not create a cross-site dependency, copy `ogc-network.js` into each
repo and reference it locally (`<script src="/ogc-network.js" defer></script>`). Trade-off:
when the site list changes you re-copy the file into each repo. A tiny script or GitHub
Action can automate that sync.

### Per-site cheat sheet

| Site | Suggested tag |
|------|---------------|
| finally.help | `<script src="…/ogc-network.js" data-ogc-theme="light" defer></script>` |
| manners.pro | `…data-ogc-theme="dark" defer></script>` |
| beemuu.com | `…data-ogc-theme="dark" defer></script>` |
| montanablotter.com | `…data-ogc-theme="light" defer></script>` |
| idahoblotter.com | same as Montana, when it launches |
| garageroute.com | `…data-ogc-theme="dark" defer></script>` (dark slate site) |

(`auto` works fine too — the explicit theme just skips the background-sampling step.)

---

## 6. Adding or changing a site

Open `ogc-network.js`, find the `SITES` array, and edit one object:

```js
{
  id: "newsite",                 // unique slug
  name: "New Site",              // display name
  monogram: "NS",                // 1–2 chars for the badge
  url: "https://newsite.com",
  aliases: ["newsite.net"],      // other domains that are "the same site"
  tagline: "One clear sentence.",
  blurb: "Even shorter, for the bar.",
  category: "Developer tools",   // groups it on the hub
  accent: "#2E6DB4",             // its signature colour
  status: "live"                 // "live" or "soon"
}
```

Save. The hub re-groups it, every bar starts linking to it, and `soon` sites get the
tag automatically. Categories render in the order set by `CATEGORY_ORDER`.

---

## 7. Principles (so it stays coherent)

1. **The network is quiet; the products are loud.** Neutral chrome, colourful products.
2. **One list, everywhere.** Never hard-code the site list in two places — edit the registry.
3. **No trackers in the connective tissue.** The bar and hub add nothing that phones home.
   This matches the ethos already on Manners and beemuu.
4. **Every site keeps its soul.** The bar links out; it doesn't restyle the host page.
