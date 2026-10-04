# The tech-support knowledge base — how it works

Everything under `tech-support/` is **generated**. Do not edit those HTML files by
hand — edit the source in `content/guides/` and rebuild.

```
content/guides/*.md      ← the source of truth (YAML front matter + markdown body)
build/generate.mjs       ← the generator + validator (zero dependencies)
tech-support/**          ← generated: hub, category hubs, one page per guide
content/guides.json      ← generated manifest (used by the hub, sitemap, feed)
sitemap.xml              ← generated
tech-support/feed.xml    ← generated RSS
tech-support.html        ← generated redirect stub for the old URL
```

## Build

```sh
node build/generate.mjs
```

Node 18+ is all you need. There is no `npm install` — the YAML and markdown subsets
are parsed in `generate.mjs` on purpose, so the build adds no dependencies and no
third-party requests.

The build **fails without writing anything** if the schema is wrong: a missing required
field, an unknown category, a duplicate slug, a `related_guides` entry pointing at a
slug that does not exist, or a body with no `### Step 1`. Warnings (stale guides,
missing screenshots) print but do not block.

## Adding a guide

1. Copy an existing file in `content/guides/` as a template.
2. Set the front matter (see the field list below) and write the body.
3. Run `node build/generate.mjs`.
4. Drop real screenshots into `tech-support/<category>/<slug>/img/` using the exact
   filenames referenced in the body. Until a file exists, the page renders a dashed
   "Screenshot to add" placeholder instead of a broken image.

## Front-matter fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | The problem in the user's words. Becomes the H1. |
| `slug` | yes | Lowercase, hyphenated. Becomes the URL. |
| `category` | yes | One of `connectivity`, `security`, `hardware`, `software`. |
| `summary` | yes | ≤140 chars. Becomes the meta description and the card blurb. |
| `difficulty_level` | yes | `easy` \| `medium` \| `advanced`. |
| `estimated_time` | yes | Minutes, integer. |
| `primary_device` | yes | `iphone` `android` `windows` `mac` `chromebook` `router` `printer` `tv` `any`. |
| `targeted_region` | yes | `us` \| `montana` \| `rural-us`. Drives the local note. |
| `quick_fix` | yes | The 30-second action. Renders in the signature callout. |
| `author` `published` `updated` `last_verified` | yes | Dates as `YYYY-MM-DD`. |
| `order` | yes | Integer sort key. |
| `tags` | no | Inline list, e.g. `[device:iphone, problem:slow]`. |
| `os_versions` | no | Inline list, e.g. `[iOS 17+, Android 13+]`. |
| `audience` | no | Inline list, e.g. `[senior, rural]`. |
| `problem_type` | no | Short label shown in the kicker. |
| `symptoms` | no | Inline list of literal phrases people search for. |
| `prerequisites` | no | Block list. Renders as "Before you start". |
| `dont_need` | no | One line reassuring the reader what they do *not* need to do. |
| `verification` | no | Block list. Renders as the "Did it work?" checklist. |
| `escalation` | no | Block list. Renders as the "Still not working?" accordion. |
| `faq` | no | Inline list of `"Question|Answer"`. Quote any entry containing a comma. |
| `related_guides` | no | Inline list of slugs. Must exist. |
| `network_links` | no | Inline list of `"Site|https://url|anchor text"`. |
| `sources` | no | Block list of `Label|https://url`. |
| `review_interval` | no | Days. Default 180. Flags the guide stale once passed. |
| `hero_image` `og_image` | no | Paths. Defaults to `/og-image.png`. |

### Front-matter syntax notes

The parser handles a deliberate subset of YAML: `key: value`, quoted scalars, inline
`[a, b]` lists, and indented `  - item` block lists. There are **no nested maps** — the
step-by-step content lives in the markdown body, which keeps the front matter flat and
safe to parse without a YAML library.

Because inline lists split on commas, put quotes around any inline-list entry that
contains a comma:

```yaml
faq: ["Why is it slow?|Because everyone is online at once, and capacity is shared.", "Does rain matter?|Yes."]
```

## Body conventions

| You write | You get |
|-----------|---------|
| `## Heading` | A section heading |
| `### Step 3 — Do the thing` | A numbered step block (the `Step N` is pulled out) |
| `### Heading` | A plain sub-heading |
| `![alt text](/path/shot.png)` | A screenshot figure — or a placeholder if the file is missing |
| `> text` | A neutral callout |
| `> [!warn] text` | An amber warning callout |
| `> [!stop] text` | A red stop callout |
| `- item` / `1. item` | Lists |
| `**bold**` `*italic*` `` `code` `` `[link](url)` | Inline formatting |

## Freshness

Tech guides rot — menus move, apps change. Every guide carries `last_verified` and
`review_interval`; once `last_verified + review_interval` is in the past, the build
warns that the guide is stale. Re-verify and bump `last_verified` on a quarterly-ish
cadence, and re-shoot screenshots when the OS or brand version changes.

## Where things point

- Every guide's call-to-action links to `/book.html` (set by `BOOKING_URL` at the top
  of `generate.mjs` — change it there to repoint every CTA at once).
- `related_guides` must name real slugs; the validator enforces it, which is what stops
  orphaned pages and dead internal links as the library grows.