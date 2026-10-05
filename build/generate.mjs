#!/usr/bin/env node
/*
 * build/generate.mjs — the ohgeeceee network knowledge base builder.
 *
 * Reads  content/guides/*.md  (YAML front matter + markdown body),
 * validates the schema, and emits:
 *
 *   tech-support/index.html                     the hub (services + guide index)
 *   tech-support/<category>/index.html           category hubs
 *   tech-support/<category>/<slug>/index.html    one page per guide
 *   content/guides.json                          the manifest (build artifact)
 *   sitemap.xml                                  regenerated from the manifest
 *   tech-support/feed.xml                        RSS for the guide library
 *   tech-support.html                            redirect stub for the old URL
 *
 * Zero dependencies — the markdown + YAML subsets are parsed here on purpose,
 * to match the network's "no third-party requests" ethos.
 *
 *   node build/generate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'guides');
const OUT_DIR = path.join(ROOT, 'tech-support');

const SITE = 'https://ohgeec.com';
const SITE_NAME = 'the ohgeeceee network';
const AUTHOR = 'ohgeeceee';
const BOOKING_URL = '/book.html';           // remote Stripe booking (change here to repoint)
const ONSITE_URL  = '/tech-support/onsite-montana/';
const ONSITE_EMAIL = 'hello@ohgeec.com';    // TODO: set the real booking inbox
const OG_DEFAULT = SITE + '/og-image.png';

/* ------------------------------------------------------------------ *
 * Service lanes — the CTA engine routes each guide to one of these.
 * A guide's front matter picks the lane via `cta_type`; the on-site
 * lane is only offered where `on_site_eligible: true`.
 * ------------------------------------------------------------------ */
const SERVICE_LANES = {
  remote_booking: { label: 'Book a remote session',   url: BOOKING_URL,           short: 'Remote' },
  onsite_request: { label: 'Request an on-site visit', url: ONSITE_URL,           short: 'On-site (MT)' },
  diagnostic:     { label: 'Get a free 10-minute call', url: ONSITE_URL + '#request', short: 'Free call' },
  none:           null,
};
const SERVICE_INTENTS = ['diy_ok', 'pro_recommended', 'pro_required'];
const CTA_TYPES = ['remote_booking', 'onsite_request', 'diagnostic', 'none'];

const CATEGORIES = {
  connectivity: { num: '01', label: 'Connectivity',           blurb: 'No service, dead zones, satellite internet, and Wi-Fi that will not reach the far end of the place.' },
  security:     { num: '02', label: 'Security & Privacy',     blurb: 'Passwords, two-factor, phishing, spam texts, and robocalls.' },
  hardware:     { num: '03', label: 'Hardware & Devices',     blurb: 'Printers, smart TVs, streaming sticks, and the gadgets around the house.' },
  software:     { num: '04', label: 'Software & Performance', blurb: 'Slow computers, browser clutter, and moving your photos and files to a new device.' },
};

const DEVICE_LABEL = {
  iphone: 'iPhone', android: 'Android', windows: 'Windows', mac: 'Mac',
  chromebook: 'Chromebook', router: 'Router', printer: 'Printer', tv: 'Smart TV', any: 'Any device',
};
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', advanced: 'Advanced' };
const REGION_LABEL = { us: 'Anywhere in the US', montana: 'Montana', 'rural-us': 'Rural US' };

const today = new Date().toISOString().slice(0, 10);
const errors = [];
const warnings = [];

/* ------------------------------------------------------------------ *
 * 1. YAML front-matter subset
 *    Supports: scalars, "quoted" scalars, [inline, lists],
 *    block lists (  - item), and | block scalars. No nested maps —
 *    the structured bits live in the markdown body by design.
 * ------------------------------------------------------------------ */
function splitInlineList(inner) {
  const out = [];
  let cur = '', q = null;
  for (const ch of inner) {
    if (q) { if (ch === q) q = null; else cur += ch; }
    else if (ch === '"' || ch === "'") q = ch;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim() !== '') out.push(cur);
  return out;
}
function parseScalar(v) {
  v = v.trim();
  if (v === '') return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (v.startsWith('[') && v.endsWith(']')) return splitInlineList(v.slice(1, -1)).map(parseScalar);
  return v;
}
function parseYaml(src) {
  const lines = src.split(/\r?\n/);
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith('#')) { i++; continue; }
    const m = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = m[2];
    if (rest === '|' || rest === '>') {
      i++;
      const buf = [];
      while (i < lines.length && (/^\s{2,}/.test(lines[i]) || lines[i].trim() === '')) {
        buf.push(lines[i].replace(/^\s{2}/, ''));
        i++;
      }
      out[key] = buf.join('\n').trim();
      continue;
    }
    if (rest === '') {
      const items = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) { items.push(parseScalar(lines[j].replace(/^\s*-\s+/, ''))); j++; }
      if (items.length) { out[key] = items; i = j; continue; }
      out[key] = '';
      i++;
      continue;
    }
    out[key] = parseScalar(rest);
    i++;
  }
  return out;
}
function parseFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('no --- front matter block found');
  return { data: parseYaml(m[1]), body: m[2] };
}

/* ------------------------------------------------------------------ *
 * 2. Markdown subset -> HTML
 * ------------------------------------------------------------------ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inline(s) {
  let t = esc(s);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt, url) => `<a href="${url}">${txt}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}
function renderFigure(alt, src) {
  const onDisk = path.join(ROOT, src.replace(/^\//, ''));
  if (fs.existsSync(onDisk)) {
    return `<figure class="shot"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" /><figcaption>${esc(alt)}</figcaption></figure>`;
  }
  warnings.push(`missing screenshot ${src} — rendered as a placeholder`);
  return `<figure class="shot shot--missing"><span class="ph-tag">Screenshot to add</span><p class="ph-alt">${esc(alt)}</p></figure>`;
}
function renderBody(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let para = [], list = null, stepOpen = false, stepsOpen = false;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map((t) => `<li>${inline(t)}</li>`).join('')}</${list.type}>`); list = null; } };
  const closeStep = () => { if (stepOpen) { flushPara(); flushList(); out.push('</div></article>'); stepOpen = false; } };
  const closeSteps = () => { closeStep(); if (stepsOpen) { out.push('</div>'); stepsOpen = false; } };

  for (const line of lines) {
    const t = line.trim();
    if (t === '') { flushPara(); flushList(); continue; }

    const step = t.match(/^###\s*Step\s+(\d+)\s*[—\-–:]\s*(.+)$/i);
    if (step) {
      closeStep();
      if (!stepsOpen) { out.push('<div class="steps">'); stepsOpen = true; }
      out.push(`<article class="step"><div class="step-head"><span class="step-num">Step ${step[1]}</span><h3>${inline(step[2])}</h3></div><div class="step-body">`);
      stepOpen = true;
      continue;
    }
    const h2 = t.match(/^##\s+(.+)$/);
    if (h2) { closeSteps(); flushPara(); flushList(); out.push(`<h2 class="sec-h">${inline(h2[1])}</h2>`); continue; }
    const h3 = t.match(/^###\s+(.+)$/);
    if (h3) { flushPara(); flushList(); out.push(`<h3>${inline(h3[1])}</h3>`); continue; }

    const fig = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (fig) { flushPara(); flushList(); out.push(renderFigure(fig[1], fig[2])); continue; }

    const call = t.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
    if (call) {
      flushPara(); flushList();
      const kind = call[1].toLowerCase();
      const cls = kind === 'warn' ? 'callout callout--warn' : kind === 'stop' ? 'callout callout--stop' : 'callout';
      out.push(`<div class="${cls}">${inline(call[2])}</div>`);
      continue;
    }
    const quote = t.match(/^>\s*(.+)$/);
    if (quote) { flushPara(); flushList(); out.push(`<div class="callout">${inline(quote[1])}</div>`); continue; }

    const ul = t.match(/^[-*]\s+(.+)$/);
    if (ul) { flushPara(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(ul[1]); continue; }
    const ol = t.match(/^\d+[.)]\s+(.+)$/);
    if (ol) { flushPara(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(ol[1]); continue; }

    flushList();
    para.push(t);
  }
  closeSteps(); flushPara(); flushList();
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * 3. Load + validate
 * ------------------------------------------------------------------ */
const REQUIRED = ['title', 'slug', 'category', 'summary', 'difficulty_level', 'estimated_time',
  'primary_device', 'targeted_region', 'quick_fix', 'author', 'published', 'updated', 'last_verified', 'order'];

function asList(v) { return v == null ? [] : Array.isArray(v) ? v : [v]; }
function pipe(v) {
  return asList(v).map((s) => {
    const [a, b, c] = String(s).split('|').map((x) => (x || '').trim());
    return { a, b, c };
  });
}

function loadGuides() {
  if (!fs.existsSync(CONTENT_DIR)) { errors.push(`content dir not found: ${CONTENT_DIR}`); return []; }
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')).sort();
  const guides = [];
  for (const file of files) {
    let parsed;
    try { parsed = parseFrontMatter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')); }
    catch (e) { errors.push(`${file}: ${e.message}`); continue; }
    const d = parsed.data;
    for (const k of REQUIRED) if (d[k] === undefined || d[k] === '') errors.push(`${file}: missing required field "${k}"`);
    if (d.category && !CATEGORIES[d.category]) errors.push(`${file}: unknown category "${d.category}"`);
    if (d.slug && !/^[a-z0-9-]+$/.test(d.slug)) errors.push(`${file}: slug must be lowercase-hyphenated ("${d.slug}")`);
    if (d.difficulty_level && !DIFFICULTY_LABEL[d.difficulty_level]) errors.push(`${file}: difficulty_level must be easy|medium|advanced`);
    if (d.targeted_region && !REGION_LABEL[d.targeted_region]) errors.push(`${file}: targeted_region must be us|montana|rural-us`);
    if (d.primary_device && !DEVICE_LABEL[d.primary_device]) errors.push(`${file}: unknown primary_device "${d.primary_device}"`);
    if (d.service_intent && !SERVICE_INTENTS.includes(d.service_intent)) errors.push(`${file}: service_intent must be ${SERVICE_INTENTS.join('|')}`);
    if (d.cta_type && !CTA_TYPES.includes(d.cta_type)) errors.push(`${file}: cta_type must be ${CTA_TYPES.join('|')}`);
    if (d.cta_type && d.cta_type !== 'none' && !d.service_link) warnings.push(`${file}: no service_link — falling back to the lane default`);
    if (d.quick_fix && String(d.quick_fix).length > 220) warnings.push(`${file}: quick_fix is ${String(d.quick_fix).length} chars (keep it under ~220)`);
    if (!/###\s*Step\s+1/i.test(parsed.body)) errors.push(`${file}: body needs at least one "### Step 1 — ..." section`);
    const words = parsed.body.split(/\s+/).filter(Boolean).length;
    guides.push({
      slug: d.slug, title: d.title, category: d.category, summary: d.summary,
      tags: asList(d.tags), difficulty_level: d.difficulty_level, estimated_time: d.estimated_time,
      reading_time: Math.max(1, Math.round(words / 200)), primary_device: d.primary_device,
      os_versions: asList(d.os_versions), audience: asList(d.audience), targeted_region: d.targeted_region,
      service_intent: d.service_intent || 'pro_recommended',
      on_site_eligible: d.on_site_eligible === true || d.on_site_eligible === 'true',
      cta_type: d.cta_type || 'remote_booking',
      cta_label: d.cta_label || (SERVICE_LANES[d.cta_type] ? SERVICE_LANES[d.cta_type].label : 'Book a session'),
      service_link: d.service_link || (SERVICE_LANES[d.cta_type] ? SERVICE_LANES[d.cta_type].url : BOOKING_URL),
      problem_type: d.problem_type || '', symptoms: asList(d.symptoms), quick_fix: d.quick_fix,
      prerequisites: asList(d.prerequisites), dont_need: d.dont_need || '',
      verification: asList(d.verification), escalation: asList(d.escalation),
      faq: pipe(d.faq).map(({ a, b }) => ({ q: a, a: b })),
      related_guides: asList(d.related_guides), network_links: pipe(d.network_links).map(({ a, b, c }) => ({ site: a, url: b, anchor: c })),
      sources: pipe(d.sources).map(({ a, b }) => ({ label: a, url: b })),
      author: d.author, published: d.published, updated: d.updated, last_verified: d.last_verified,
      review_interval: d.review_interval || 180, hero_image: d.hero_image || '', og_image: d.og_image || OG_DEFAULT,
      order: d.order, body: parsed.body,
      urlPath: `/tech-support/${d.category}/${d.slug}/`, file,
    });
  }
  // cross-checks
  const seen = new Map();
  for (const g of guides) {
    if (seen.has(g.slug)) errors.push(`duplicate slug "${g.slug}" (${g.file} and ${seen.get(g.slug)})`);
    seen.set(g.slug, g.file);
  }
  const slugs = new Set(guides.map((g) => g.slug));
  for (const g of guides) {
    for (const r of g.related_guides) if (!slugs.has(r)) errors.push(`${g.file}: related_guides points at unknown slug "${r}"`);
    if (g.related_guides.includes(g.slug)) errors.push(`${g.file}: related_guides includes itself`);
    // freshness
    const due = new Date(g.last_verified); due.setDate(due.getDate() + g.review_interval);
    if (due.toISOString().slice(0, 10) < today) warnings.push(`${g.file}: stale — last_verified ${g.last_verified} + ${g.review_interval}d has passed`);
  }
  guides.sort((a, b) => a.order - b.order);
  return guides;
}

/* ------------------------------------------------------------------ *
 * 4. Page chrome
 * ------------------------------------------------------------------ */
function jsonld(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}
function head({ title, description, canonical, ogImage, type = 'article', ld }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index,follow" />
<meta name="theme-color" content="#FAF7F2" />
<link rel="canonical" href="${esc(canonical)}" />

<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />

<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%23FAF7F2'/%3E%3Ccircle cx='12' cy='5' r='2.4' fill='%2314110E'/%3E%3Ccircle cx='5' cy='17' r='2.4' fill='%2314110E'/%3E%3Ccircle cx='19' cy='17' r='2.4' fill='%2314110E'/%3E%3Cpath d='M12 6.6 5.6 15.4M12 6.6l6.4 8.8M6.6 17.6h10.8' stroke='%2314110E' stroke-width='1.3' stroke-linecap='round' fill='none'/%3E%3C/svg%3E" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<link rel="preload" href="/fonts/fraunces-var.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/fonts.css" />
<link rel="stylesheet" href="/tech-support/tech-support.css" />
${ld ? jsonld(ld) : ''}
</head>`;
}
function topbar(active) {
  const nav = [
    ['/#work', 'Index', 'index'],
    ['/#about', 'About', 'about'],
    ['/tech-support/', 'Tech help', 'tech'],
    ['/support.html', 'Support', 'support'],
  ];
  const links = nav.map(([href, label, key]) =>
    `<a href="${href}"${key === active ? ' class="current" aria-current="page"' : (key === 'support' ? ' class="nav-support"' : '')}>${label}</a>`
  ).join('\n    ');
  return `<header class="topbar">
  <a class="brand" href="/">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="2.4" fill="#14110E"/><circle cx="5" cy="17" r="2.4" fill="#14110E"/><circle cx="19" cy="17" r="2.4" fill="#14110E"/>
      <path d="M12 6.6 5.6 15.4M12 6.6l6.4 8.8M6.6 17.6h10.8" stroke="#14110E" stroke-width="1.3" stroke-linecap="round"/>
    </svg>
    <b>ohgeeceee</b>
  </a>
  <span class="coords">Remote &mdash; anywhere in the US</span>
  <nav>
    ${links}
  </nav>
</header>`;
}
function footer() {
  return `<footer class="site">
  <span>ohgeeceee &mdash; plain-language tech guides, built on the same philosophy as <a href="https://finally.help" rel="noopener">finally.help</a></span>
  <span>46.8797&deg; N, 110.3626&deg; W</span>
  <span>&copy; <span id="yr">2026</span> ${SITE_NAME} &mdash; <a href="/">&larr; Back to the network</a></span>
</footer>`;
}
function revealScript() {
  return `<script>
(function () {
  "use strict";
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var els = document.querySelectorAll(".rv");
  if (reduced || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }
  // sticky CTA bar — appears past half a page, dismissible, remembered. No tracker.
  var bar = document.getElementById("stickybar");
  if (bar) {
    var KEY = "ogc-cta-dismissed";
    try { if (localStorage.getItem(KEY) === "1") { bar.parentNode.removeChild(bar); return; } } catch (e) {}
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.hidden = (h > 0 ? window.scrollY / h : 0) < 0.5;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var x = bar.querySelector(".sb-x");
    if (x) x.addEventListener("click", function () {
      bar.parentNode.removeChild(bar);
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    });
  }
})();
</script>`;
}
function crumbs(items) {
  const parts = items.map((it, i) => {
    const last = i === items.length - 1;
    return `<li>${last ? `<span aria-current="page">${esc(it.label)}</span>` : `<a href="${it.href}">${esc(it.label)}</a>`}</li>`;
  }).join('');
  return `<nav class="crumb" aria-label="Breadcrumb"><ol>${parts}</ol></nav>`;
}
function ctaBlock(heading, body, ctaLabel, url = BOOKING_URL, audience = 'REMOTE SESSIONS ONLY &mdash; ANYWHERE IN THE US &mdash; FLAT RATE, UP FRONT') {
  return `<section class="cta">
  <h2 class="rv">${heading}</h2>
  <p class="rv">${body}</p>
  <a class="btn rv" href="${esc(url)}" rel="noopener">${ctaLabel} &rarr;</a>
  <p class="fine rv">${audience}</p>
</section>`;
}

function guideServiceUrl(g) {
  const params = new URLSearchParams({ requestType: g.slug, sourcePage: g.urlPath });
  const [pathAndQuery, fragment] = g.service_link.split('#', 2);
  const separator = pathAndQuery.includes('?') ? '&' : '?';
  return `${pathAndQuery}${separator}${params.toString()}${fragment ? `#${fragment}` : ''}`;
}

/* ------------------------------------------------------------------ *
 * 5. Guide page
 * ------------------------------------------------------------------ */
function metaChips(g) {
  const chips = [];
  chips.push(`<span class="chip chip--go"><b>&#9889; 30-second fix</b></span>`);
  chips.push(`<span class="chip">Difficulty <b>${esc(DIFFICULTY_LABEL[g.difficulty_level] || g.difficulty_level)}</b></span>`);
  chips.push(`<span class="chip">About <b>${esc(g.estimated_time)} min</b></span>`);
  const devices = [DEVICE_LABEL[g.primary_device] || g.primary_device, ...g.os_versions].filter(Boolean);
  if (devices.length) chips.push(`<span class="chip">Works on <b>${esc(devices.join(' \u00b7 '))}</b></span>`);
  chips.push(`<span class="chip">${esc(REGION_LABEL[g.targeted_region] || g.targeted_region)}</span>`);
  return `<div class="metastrip">${chips.join('\n      ')}</div>`;
}
function relatedBlock(g, all) {
  const picks = g.related_guides.map((s) => all.find((x) => x.slug === s)).filter(Boolean);
  if (!picks.length) return '';
  const cards = picks.map((r) => `<a class="gcard" href="${r.urlPath}">
        <span class="gcat">${esc(CATEGORIES[r.category].label)}</span>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.summary)}</p>
        <span class="gmeta"><span>${esc(DIFFICULTY_LABEL[r.difficulty_level])}</span><span>${esc(r.estimated_time)} min</span><span class="go">Open &rarr;</span></span>
      </a>`).join('\n      ');
  return `<section class="related">
    <h2>Related fixes</h2>
    <div class="card-grid card-grid--3">
      ${cards}
    </div>
  </section>`;
}
function localBlock(g) {
  const links = g.network_links.map((l) => `<a href="${l.url}" rel="noopener">${esc(l.anchor || l.site)}</a>`);
  if (!links.length && g.targeted_region !== 'montana' && g.targeted_region !== 'rural-us') return '';
  return `<section class="local">
    <h2>Around the network</h2>
    <p>${g.targeted_region === 'montana' || g.targeted_region === 'rural-us'
      ? 'Written from Montana, for the places where the nearest store is a drive and the nearest technician is you.'
      : 'More from the maker of this network.'}</p>
    ${links.length ? `<p>${links.join(' \u00b7 ')}</p>` : ''}
  </section>`;
}
function faqBlock(g) {
  if (!g.faq.length) return '';
  const items = g.faq.map((f) => `<details class="escalation"><summary>${esc(f.q)}</summary><div class="esc-body"><p>${inline(f.a)}</p></div></details>`).join('\n    ');
  return `<section class="related"><h2>Common questions</h2>${items}</section>`;
}

function renderGuide(g, all) {
  const cat = CATEGORIES[g.category];
  const url = SITE + g.urlPath;
  const crumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Tech Support', href: '/tech-support/' },
    { label: cat.label, href: `/tech-support/${g.category}/` },
    { label: g.title },
  ];
  const prereq = g.prerequisites.length ? `<div class="prereq">
      <h2>Before you start</h2>
      <ul>${g.prerequisites.map((p) => `<li>${inline(p)}</li>`).join('')}</ul>
      ${g.dont_need ? `<p class="dont">${inline(g.dont_need)}</p>` : ''}
    </div>` : '';
  const verify = g.verification.length ? `<div class="verify">
      <h2>Did it work?</h2>
      <ul>${g.verification.map((v) => `<li>${inline(v)}</li>`).join('')}</ul>
    </div>` : '';
  const escBlock = g.escalation.length ? `<details class="escalation">
      <summary>Still not working?</summary>
      <div class="esc-body">
        <ol>${g.escalation.map((e) => `<li>${inline(e)}</li>`).join('')}</ol>
        <p class="esc-pro">If none of that helped, it is usually a hardware or account problem rather than a settings one &mdash; and that is exactly the kind of thing worth handing to someone for an hour. <a href="${esc(guideServiceUrl(g))}">${esc(g.cta_label)} &rarr;</a></p>
      </div>
    </details>` : '';
  const sources = g.sources.length ? g.sources.map((s) => `<a href="${s.url}" rel="noopener">${esc(s.label)}</a>`).join('') : '';

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle', headline: g.title, description: g.summary, url,
        datePublished: g.published, dateModified: g.updated,
        author: { '@type': 'Person', name: g.author, url: SITE + '/' },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE + '/' },
        mainEntityOfPage: url, image: g.og_image, inLanguage: 'en-US',
        about: g.symptoms.join(', '), keywords: [cat.label, ...g.tags].join(', '),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbItems.map((c, i) => ({
          '@type': 'ListItem', position: i + 1, name: c.label, item: c.href ? SITE + c.href : url,
        })),
      },
      ...(g.faq.length ? [{
        '@type': 'FAQPage',
        mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }] : []),
    ],
  };

  return `${head({ title: `${g.title} — ohgeeceee`, description: g.summary, canonical: url, ogImage: g.og_image, type: 'article', ld })}
<body>
${topbar('tech')}
<main>
  <div class="wrap wrap--narrow">
    ${crumbs(crumbItems)}
    <p class="kicker rv">${esc(cat.label)} / ${esc(g.problem_type || 'Fix')}</p>
    <h1 class="rv">${esc(g.title)}</h1>
    <p class="lede rv">${inline(g.summary)}</p>
    ${metaChips(g)}

    <div class="quickfix rv">
      <p class="qf-label">The 30-second fix</p>
      <p class="qf-do">${inline(g.quick_fix)}</p>
      <p class="qf-done">If that sorted it, you are done. If not, keep reading &mdash; the rest takes about ${esc(g.estimated_time)} minutes.</p>
    </div>

    ${prereq}

    ${renderBody(g.body)}

    ${verify}
    ${escBlock}
  </div>

  ${ctaBlock('Still stuck? <em>I can take it from here.</em>', 'If the steps above did not do it, that is what I am here for &mdash; remote or on-site in Montana, plain language, and clear pricing.', g.cta_label, guideServiceUrl(g), g.cta_type === 'onsite_request' ? 'ON-SITE SERVICE IN MONTANA' : 'REMOTE SUPPORT AVAILABLE')}

  <div class="wrap wrap--narrow">
    ${relatedBlock(g, all)}
    ${localBlock(g)}
    ${faqBlock(g)}
    <div class="provenance">
      <span>By ${esc(g.author)}</span>
      <span>Published ${esc(g.published)}</span>
      <span>Last verified ${esc(g.last_verified)}</span>
      ${sources ? `<span>Sources ${sources}</span>` : ''}
    </div>
  </div>
</main>
${footer()}
${revealScript()}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ *
 * 6. Category page
 * ------------------------------------------------------------------ */
function renderCategory(key, guides) {
  const cat = CATEGORIES[key];
  const inCat = guides.filter((g) => g.category === key);
  const url = `${SITE}/tech-support/${key}/`;
  const crumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Tech Support', href: '/tech-support/' },
    { label: cat.label },
  ];
  const rows = inCat.map((g) => `<a class="grow" href="${g.urlPath}">
      <h3>${esc(g.title)}</h3>
      <p class="g-sum">${esc(g.summary)}</p>
      <span class="g-meta">${esc(DIFFICULTY_LABEL[g.difficulty_level])}<br>${esc(g.estimated_time)} min</span>
    </a>`).join('\n    ');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat.label} — tech support guides`,
    url,
    description: cat.blurb,
    isPartOf: { '@type': 'CollectionPage', name: 'Tech support guides', url: SITE + '/tech-support/' },
    hasPart: inCat.map((g) => ({ '@type': 'TechArticle', name: g.title, url: SITE + g.urlPath })),
  };
  return `${head({ title: `${cat.label} — tech support guides — ohgeeceee`, description: cat.blurb, canonical: url, ogImage: OG_DEFAULT, type: 'website', ld })}
<body>
${topbar('tech')}
<main>
  <div class="wrap">
    ${crumbs(crumbItems)}
    <p class="kicker rv">Tech support / ${esc(cat.num)}</p>
    <h1 class="rv">${esc(cat.label)}</h1>
    <p class="lede rv">${esc(cat.blurb)}</p>
    <p class="sec-h rv">${inCat.length} guide${inCat.length === 1 ? '' : 's'}</p>
    <div class="guide-rows rv">
    ${rows}
    </div>
  </div>
  ${ctaBlock('Prefer to just <em>have it fixed?</em>', 'Every guide here is free. If you would rather hand it over, I do this remotely at a flat rate.', 'Book a session')}
</main>
${footer()}
${revealScript()}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ *
 * 7. Hub page
 * ------------------------------------------------------------------ */
function renderHub(guides) {
  const url = SITE + '/tech-support/';
  const byCat = Object.keys(CATEGORIES);
  const tiles = byCat.map((key) => {
    const cat = CATEGORIES[key];
    const n = guides.filter((g) => g.category === key).length;
    return `<a class="cat-tile" href="/tech-support/${key}/">
        <span class="ct-num">${esc(cat.num)}</span>
        <h3>${esc(cat.label)}</h3>
        <p>${esc(cat.blurb)}</p>
        <span class="ct-count">${n} guide${n === 1 ? '' : 's'} &rarr;</span>
      </a>`;
  }).join('\n      ');
  const featured = guides.slice(0, 3).map((g) => `<a class="gcard" href="${g.urlPath}">
        <span class="gcat">${esc(CATEGORIES[g.category].label)}</span>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.summary)}</p>
        <span class="gmeta"><span>${esc(DIFFICULTY_LABEL[g.difficulty_level])}</span><span>${esc(g.estimated_time)} min</span><span class="go">Open &rarr;</span></span>
      </a>`).join('\n      ');
  const services = [
    ['Slow computers', 'Cleanup, startup trimming, malware and adware removal. Your machine, but faster than it has been in years.'],
    ['Wi-Fi &amp; networks', 'Dead zones, router setup, getting the printer on the network and keeping it there.'],
    ['New device setup', 'Moving to a new computer or phone &mdash; files, photos, accounts, and passwords, all transferred.'],
    ['Backups &amp; security', 'A backup plan that actually runs, plus password managers and two-factor done right.'],
    ['Updates &amp; tune-ups', 'OS updates, driver wrangling, full storage drives, mystery error messages.'],
    ['Small business IT', 'Email, shared files, and the everyday tech a small shop runs on &mdash; without a contract.'],
  ].map(([h, p], i) => `<div class="svc"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${h}</h3><p>${p}</p></div>`).join('\n      ');
  const steps = [
    ['Tell me what is wrong', 'Plain words are fine. "It is slow and the thingy pops up" is a perfectly good diagnosis.'],
    ['We meet remotely', 'A secure screen-share where you watch everything I do &mdash; and can ask questions the whole time.'],
    ['Fixed, with notes', 'You get a written summary of what changed and how to keep it from happening again.'],
  ].map(([h, p], i) => `<div class="step3"><b><i>STEP ${String(i + 1).padStart(2, '0')}</i>${h}</b><p>${p}</p></div>`).join('\n      ');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tech support guides',
    url,
    description: 'Plain-language tech support guides for rural homes and everyday users — plus remote, flat-rate help when you want it done for you.',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE + '/' },
    hasPart: guides.map((g) => ({ '@type': 'TechArticle', name: g.title, url: SITE + g.urlPath })),
  };

  return `${head({ title: 'Tech support guides & remote help — ohgeeceee', description: 'Plain-language fixes for no service, slow Wi-Fi, printers, passwords, scams and slow computers — written for rural homes and everyday users. Plus remote, flat-rate help.', canonical: url, ogImage: OG_DEFAULT, type: 'website', ld })}
<body>
${topbar('tech')}
<main>
  <div class="wrap">
    <p class="kicker rv">Services / remote tech support</p>
    <h1 class="rv">Tech support, <em>minus the jargon.</em></h1>
    <p class="lede rv">I am the one person behind <a href="/#work">the ohgeeceee network</a>. Fix it yourself with the guides below, or hand it over &mdash; remote, in plain language, at a flat rate you will see before we start.</p>

    <p class="sec-h rv">Fix it yourself &mdash; browse by problem</p>
    <div class="cat-tiles rv">
      ${tiles}
    </div>

    <p class="sec-h rv">Start here</p>
    <div class="card-grid card-grid--3 rv">
      ${featured}
    </div>

    <p class="sec-h rv">What I can help with</p>
    <div class="svcs rv">
      ${services}
    </div>

    <p class="sec-h rv">How it works</p>
    <div class="steps3 rv">
      ${steps}
    </div>
  </div>

  ${ctaBlock('Something broken? <em>Let us fix it.</em>', 'Flat, up-front pricing &mdash; you will see the exact rate on the booking page before you pay. No hourly meters running in the background.', 'Book a session')}
</main>
${footer()}
${revealScript()}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ *
 * 8. Manifest, sitemap, feed, redirect stub
 * ------------------------------------------------------------------ */
function writeSitemap(guides) {
  const entries = [
    { loc: '/', mod: today, cf: 'monthly', pr: '1.0' },
    { loc: '/tech-support/', mod: today, cf: 'weekly', pr: '0.9' },
    ...Object.keys(CATEGORIES).map((k) => ({ loc: `/tech-support/${k}/`, mod: today, cf: 'weekly', pr: '0.7' })),
    ...guides.map((g) => ({ loc: g.urlPath, mod: g.last_verified, cf: 'monthly', pr: '0.8' })),
    { loc: ONSITE_URL, mod: today, cf: 'monthly', pr: '0.7' },
    { loc: '/book.html', mod: today, cf: 'monthly', pr: '0.7' },
    { loc: '/support.html', mod: today, cf: 'yearly', pr: '0.3' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${SITE}${e.loc}</loc>
    <lastmod>${e.mod}</lastmod>
    <changefreq>${e.cf}</changefreq>
    <priority>${e.pr}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}
function renderOnsiteLanding() {
  const canonical = SITE + ONSITE_URL;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'On-site home technology support in Montana',
    provider: { '@type': 'Person', name: AUTHOR, url: SITE + '/' },
    areaServed: { '@type': 'State', name: 'Montana' },
    serviceType: 'Home technology setup and troubleshooting',
    url: canonical,
  };
  return `${head({ title: 'On-site tech support in Montana — ohgeeceee', description: 'On-site help with Starlink, Wi-Fi, computers, printers, and connected devices across Montana. Request a visit and share only the details needed to plan it.', canonical, ogImage: OG_DEFAULT, type: 'website', ld })}
<body>
${topbar('tech')}
<main>
  <div class="wrap wrap--narrow">
    ${crumbs([{ label: 'Home', href: '/' }, { label: 'Tech Support', href: '/tech-support/' }, { label: 'On-site help in Montana' }])}
    <p class="kicker rv">MONTANA · HOME TECH SUPPORT</p>
    <h1 class="rv">The tech at home, sorted.</h1>
    <p class="lede rv">On-site help for rural homes, small businesses, and the places where a reliable connection matters. Tell me what is happening and where you are; we will confirm availability before scheduling.</p>
    <section class="prereq rv">
      <h2>What I can help with</h2>
      <ul>
        <li>Starlink setup, dish placement, and Wi-Fi coverage</li>
        <li>Wi-Fi dead zones, router setup, and connected devices</li>
        <li>Computer, printer, smart TV, and home network troubleshooting</li>
      </ul>
      <p class="dont">No account passwords or Wi-Fi passwords in the request form. We can arrange a safe way to share access if a visit requires it.</p>
    </section>
    <section class="cta" id="request">
      <h2>Request an on-site visit</h2>
      <p>Share your Montana town or county, a short description, and a preferred time. Exact address and access details can wait until the visit is confirmed.</p>
      <a class="btn" id="onsite-request-link" href="/book.html?mode=onsite">Request an on-site visit &rarr;</a>
      <p class="fine">MONTANA ON-SITE SERVICE · REQUESTS ARE CONFIRMED BEFORE A VISIT IS BOOKED</p>
    </section>
    <p>If remote help is a better fit, <a href="/book.html?mode=remote">request a remote session</a>. For urgent issues, call or text after we confirm your request.</p>
  </div>
</main>
${footer()}
<script>
  const incoming = new URLSearchParams(location.search);
  const booking = new URL('/book.html', location.origin);
  booking.searchParams.set('mode', 'onsite');
  booking.searchParams.set('requestType', incoming.get('requestType') || 'onsite_support');
  booking.searchParams.set('sourcePage', incoming.get('sourcePage') || location.pathname);
  document.getElementById('onsite-request-link').href = booking.pathname + booking.search;
</script>
${revealScript()}
</body>
</html>
`;
}
function writeFeed(guides) {
  const items = guides.map((g) => `    <item>
      <title>${esc(g.title)}</title>
      <link>${SITE}${g.urlPath}</link>
      <guid isPermaLink="true">${SITE}${g.urlPath}</guid>
      <description>${esc(g.summary)}</description>
      <pubDate>${new Date(g.updated + 'T12:00:00Z').toUTCString()}</pubDate>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech support guides &mdash; the ohgeeceee network</title>
    <link>${SITE}/tech-support/</link>
    <description>Plain-language fixes for the tech around a rural home.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(OUT_DIR, 'feed.xml'), xml);
}
function writeRedirectStub() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Moved — tech support — ohgeeceee</title>
<link rel="canonical" href="${SITE}/tech-support/" />
<meta name="robots" content="noindex,follow" />
<meta http-equiv="refresh" content="0; url=/tech-support/" />
<script>location.replace("/tech-support/");</script>
</head>
<body>
<p>This page moved to <a href="/tech-support/">the tech support hub</a>.</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'tech-support.html'), html);
}

/* ------------------------------------------------------------------ *
 * 9. Run
 * ------------------------------------------------------------------ */
const guides = loadGuides();

if (errors.length) {
  console.error('\n\u2716 Build failed — fix these first:\n');
  for (const e of errors) console.error('   • ' + e);
  console.error(`\n${errors.length} error(s). Nothing was written.\n`);
  process.exit(1);
}

// write pages
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHub(guides));
for (const key of Object.keys(CATEGORIES)) {
  const dir = path.join(OUT_DIR, key);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderCategory(key, guides));
}
for (const g of guides) {
  const dir = path.join(OUT_DIR, g.category, g.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderGuide(g, guides));
}

// manifest (strip the raw body — the HTML already has it)
const manifest = guides.map(({ body, ...rest }) => rest);
fs.mkdirSync(path.join(ROOT, 'content'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'content', 'guides.json'), JSON.stringify({ generated: today, count: guides.length, guides: manifest }, null, 2));

writeSitemap(guides);
fs.mkdirSync(path.join(OUT_DIR, 'onsite-montana'), { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'onsite-montana', 'index.html'), renderOnsiteLanding());
writeFeed(guides);
writeRedirectStub();

console.log(`\n\u2714 Built ${guides.length} guides, ${Object.keys(CATEGORIES).length} categories, 1 hub.`);
console.log(`  tech-support/index.html`);
console.log(`  tech-support/<category>/index.html`);
console.log(`  tech-support/<category>/<slug>/index.html`);
console.log(`  tech-support/onsite-montana/index.html`);
console.log(`  content/guides.json  (${manifest.length} entries)`);
console.log(`  sitemap.xml, tech-support/feed.xml, tech-support.html (redirect stub)`);
if (warnings.length) {
  console.log(`\n  ${warnings.length} note(s):`);
  for (const w of warnings.slice(0, 40)) console.log('   • ' + w);
  if (warnings.length > 40) console.log(`   … and ${warnings.length - 40} more`);
}
console.log('');
