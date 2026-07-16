/*!
 * ogc-network.js — the ohgeeceee network
 * One file: the canonical site registry + the drop-in "network bar" + support jar.
 *
 * INSTALL (on any static site)
 *   <script src="https://ohgeeceee.net/ogc-network.js" defer></script>
 *
 * OPTIONS (attributes on the <script> tag)
 *   data-ogc-theme="dark|light|auto"   force the bar's palette (default: auto)
 *   data-ogc-bar="off"                 load the registry but DON'T inject a bar
 *   data-ogc-position="bottom|inline"  fixed to viewport bottom, or in flow (default: inline)
 *
 * No dependencies. No cookies. No telemetry. MIT.
 */
(function () {
  "use strict";

  var HUB = "https://ohgeeceee.net"; // change to wherever the hub is hosted

  var SITES = [
    {
      id: "finally", name: "finally.", monogram: "f",
      url: "https://finally.help", aliases: ["finallymakesense.com"],
      tagline: "The stuff everyone assumes you already know — explained like you're ten.",
      blurb: "Plain-language explainers. No jargon, no judgment.",
      category: "Learning", accent: "#DE8C2C", status: "live"
    },
    {
      id: "manners", name: "Manners", monogram: "M",
      url: "https://manners.pro", aliases: [],
      tagline: "Adds please and thank you to your LLM prompts, right before you hit Enter.",
      blurb: "A 4 KB browser extension. Zero telemetry.",
      category: "Developer tools", accent: "#A9853B", status: "live"
    },
    {
      id: "beemuu", name: "beemuu", monogram: "B",
      url: "https://beemuu.com", aliases: [],
      tagline: "Open-source BMW diagnostics — read DTCs, watch live data, code modules.",
      blurb: "Any OBD-II cable. No dealer, no subscription.",
      category: "Diagnostics", accent: "#2E6DB4", status: "live"
    },
    {
      id: "garageroute", name: "GarageRoute", monogram: "GR",
      url: "https://garageroute.com", aliases: ["garageroute.co"],
      tagline: "Find local garage & estate sales, preview items, and plan the smartest Saturday route.",
      blurb: "Discover sales. Plan the route.",
      category: "Marketplace", accent: "#1F9E8F", status: "live"
    },
    {
      id: "montanablotter", name: "Montana Blotter", monogram: "MB",
      url: "https://montanablotter.com",
      aliases: ["blotter.host", "agendas.montanablotter.com"],
      tagline: "Real-time public records — blotters, bookings, warrants, court data.",
      blurb: "Public records, reported plainly.",
      category: "Public records", accent: "#9E3B34", status: "live"
    },
    {
      id: "idahoblotter", name: "Idaho Blotter", monogram: "IB",
      url: "https://idahoblotter.com", aliases: [],
      tagline: "The Blotter newsroom, coming to Idaho.",
      blurb: "Public records for the Gem State.",
      category: "Public records", accent: "#3E7D57", status: "soon"
    }
  ];

  var CATEGORY_ORDER = [
    "Learning", "Developer tools", "Diagnostics",
    "Marketplace", "Public records", "In the works"
  ];

  /* SUPPORT — one shared tip jar. Static sites => Stripe Payment Links only.
     Create links at https://dashboard.stripe.com/payment-links and paste the
     URLs over the REPLACE_* placeholders. No API keys ever live in this file. */
  var SUPPORT = {
    enabled: true,
    heading: "Support the network",
    blurb: "Every site here is free, open-source, and ad-free. If one saved you " +
           "time or taught you something, you can drop a tip in the jar. It goes " +
           "straight to keeping the servers on and the next thing shipping.",
    thanksNote: "Secure checkout by Stripe. One-time — no account, no subscription.",
    currency: "$",
    tiers: [
      { label: "Coffee", amount: 3,  note: "A small thank-you",               link: "https://buy.stripe.com/REPLACE_3" },
      { label: "Lunch",  amount: 8,  note: "Keeps a site online for a month",  link: "https://buy.stripe.com/REPLACE_8", featured: true },
      { label: "Patron", amount: 25, note: "Helps fund the next feature",      link: "https://buy.stripe.com/REPLACE_25" }
    ],
    customLink: "https://buy.stripe.com/REPLACE_CUSTOM",
    monthlyLink: ""
  };

  var API = {
    version: "1.1.0", hub: HUB, sites: SITES, categoryOrder: CATEGORY_ORDER,
    support: SUPPORT, supportUrl: HUB + "/support.html",
    renderHub: renderHub, renderSupport: renderSupport, mountBar: mountBar
  };
  window.OGCNetwork = API;

  function currentScript() {
    if (document.currentScript) return document.currentScript;
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  }

  function hostMatches(site) {
    var h = location.hostname.replace(/^www\./, "");
    var domains = [site.url.replace(/^https?:\/\//, "").replace(/^www\./, "")]
      .concat(site.aliases || []);
    return domains.some(function (d) {
      d = d.replace(/^www\./, "").split("/")[0];
      return h === d || h.endsWith("." + d);
    });
  }

  function isPlaceholder(link) {
    return !link || /REPLACE|YOUR_|example\.com/.test(link);
  }

  function isDarkPreferred(scriptEl) {
    var forced = scriptEl && scriptEl.getAttribute("data-ogc-theme");
    if (forced === "dark") return true;
    if (forced === "light") return false;
    try {
      var bg = getComputedStyle(document.body).backgroundColor;
      var m = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        var lum = 0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3];
        return lum < 128;
      }
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  var MARK_PATHS =
    '<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="17" r="2.4"/>' +
    '<circle cx="19" cy="17" r="2.4"/>';
  var MARK_LINE = "M12 6.6 5.6 15.4M12 6.6l6.4 8.8M6.6 17.6h10.8";
  var HEART_PATH = "M12 21c-1-0.7-9-5.2-9-11 0-2.6 2-4.5 4.4-4.5 1.7 0 3.2 1 3.9 2.6 0.7-1.6 2.2-2.6 3.9-2.6C19.6 5.5 21.6 7.4 21.6 10c0 5.8-8 10.3-9 11z";

  function mountBar(opts) {
    opts = opts || {};
    if (document.getElementById("ogcn-bar")) return;

    var dark = !!opts.dark;
    var position = opts.position === "bottom" ? "bottom" : "inline";

    var ink = dark ? "#EDE7DE" : "#14110E";
    var paper = dark ? "#14110E" : "#FAF7F2";
    var muted = dark ? "rgba(237,231,222,.55)" : "rgba(20,17,14,.52)";
    var line = dark ? "rgba(237,231,222,.14)" : "rgba(20,17,14,.12)";
    var chipbg = dark ? "rgba(237,231,222,.05)" : "rgba(20,17,14,.03)";

    var css =
      "#ogcn-bar{all:initial;box-sizing:border-box;display:block;font-family:" +
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" +
      "background:" + paper + ";color:" + ink + ";border-top:1px solid " + line + ";" +
      "font-size:13px;line-height:1.4;" +
      (position === "bottom"
        ? "position:fixed;left:0;right:0;bottom:0;z-index:2147483000;"
        : "position:relative;width:100%;") + "}" +
      "#ogcn-bar *{box-sizing:border-box}" +
      "#ogcn-wrap{max-width:1180px;margin:0 auto;padding:11px 20px;display:flex;" +
      "align-items:center;gap:16px}" +
      "#ogcn-brand{display:flex;align-items:center;gap:9px;flex:none;" +
      "text-decoration:none;color:" + ink + ";white-space:nowrap}" +
      "#ogcn-mark{width:20px;height:20px;flex:none}" +
      "#ogcn-brand b{font-weight:600;letter-spacing:.01em}" +
      "#ogcn-brand span{color:" + muted + ";font-weight:400}" +
      "#ogcn-links{display:flex;gap:6px;overflow-x:auto;flex:1;scrollbar-width:none;" +
      "-ms-overflow-style:none;padding:2px 0;-webkit-overflow-scrolling:touch}" +
      "#ogcn-links::-webkit-scrollbar{display:none}" +
      ".ogcn-chip{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;" +
      "text-decoration:none;color:" + ink + ";border:1px solid " + line + ";" +
      "background:" + chipbg + ";border-radius:999px;padding:5px 12px 5px 9px;" +
      "transition:border-color .15s,transform .15s}" +
      ".ogcn-chip:hover{border-color:" + ink + ";transform:translateY(-1px)}" +
      ".ogcn-dot{width:8px;height:8px;border-radius:50%;flex:none}" +
      ".ogcn-chip small{color:" + muted + ";font-size:11px}" +
      "#ogcn-all{flex:none;text-decoration:none;color:" + ink + ";font-weight:600;" +
      "border-bottom:1px solid " + ink + ";padding-bottom:1px;white-space:nowrap}" +
      "#ogcn-all:hover{opacity:.65}" +
      "#ogcn-support{flex:none;display:inline-flex;align-items:center;gap:6px;" +
      "text-decoration:none;font-weight:600;white-space:nowrap;border-radius:999px;" +
      "padding:6px 14px;background:" + ink + ";color:" + paper + ";" +
      "transition:transform .15s,opacity .15s}" +
      "#ogcn-support:hover{transform:translateY(-1px);opacity:.9}" +
      "#ogcn-support svg{width:13px;height:13px}" +
      "@media(max-width:640px){#ogcn-wrap{padding:10px 14px;gap:11px}" +
      "#ogcn-brand span,#ogcn-all{display:none}}";

    var mark =
      '<svg id="ogcn-mark" viewBox="0 0 24 24" fill="' + ink + '" aria-hidden="true">' +
      MARK_PATHS + '<path d="' + MARK_LINE + '" stroke="' + ink +
      '" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>';

    var heart =
      '<svg viewBox="0 0 24 24" fill="' + paper + '" aria-hidden="true">' +
      '<path d="' + HEART_PATH + '"/></svg>';

    var others = SITES.filter(function (s) { return !hostMatches(s); });

    var chips = others.map(function (s) {
      var soon = s.status === "soon" ? '<small>soon</small>' : '';
      return '<a class="ogcn-chip" href="' + s.url +
        '" rel="noopener"' + (s.status === "soon" ? ' aria-disabled="true"' : '') + '>' +
        '<span class="ogcn-dot" style="background:' + s.accent + '"></span>' +
        s.name + soon + '</a>';
    }).join("");

    var supportBtn = SUPPORT && SUPPORT.enabled
      ? '<a id="ogcn-support" href="' + API.supportUrl + '" rel="noopener">' +
        heart + 'Support</a>'
      : '';

    var style = document.createElement("style");
    style.id = "ogcn-style";
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement("footer");
    bar.id = "ogcn-bar";
    bar.setAttribute("role", "navigation");
    bar.setAttribute("aria-label", "ohgeeceee network");
    bar.innerHTML =
      '<div id="ogcn-wrap">' +
        '<a id="ogcn-brand" href="' + HUB + '" rel="noopener">' + mark +
          '<b>ohgeeceee</b><span>network</span></a>' +
        '<nav id="ogcn-links">' + chips + '</nav>' +
        '<a id="ogcn-all" href="' + HUB + '" rel="noopener">Explore all &rarr;</a>' +
        supportBtn +
      '</div>';
    document.body.appendChild(bar);
  }

  function renderHub(target) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    var html = "";
    CATEGORY_ORDER.forEach(function (cat) {
      var inCat = SITES.filter(function (s) { return s.category === cat; });
      if (!inCat.length) return;
      html += '<section class="cat"><h2 class="cat-h">' + cat + '</h2><div class="grid">';
      inCat.forEach(function (s) {
        var soon = s.status === "soon";
        html +=
          '<a class="card' + (soon ? " soon" : "") + '" ' +
          'href="' + s.url + '" style="--accent:' + s.accent + '">' +
            '<div class="card-top">' +
              '<span class="mono" style="background:' + s.accent + '">' + s.monogram + '</span>' +
              (soon ? '<span class="badge">Coming soon</span>'
                    : '<span class="live"><i></i>Live</span>') +
            '</div>' +
            '<h3>' + s.name + '</h3><p>' + s.tagline + '</p>' +
            '<div class="card-foot"><span class="host">' +
              s.url.replace(/^https?:\/\//, "") + '</span>' +
              '<span class="go">' + (soon ? "" : "Visit &rarr;") + '</span></div>' +
          '</a>';
      });
      html += "</div></section>";
    });
    el.innerHTML = html;
  }

  function renderSupport(target) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el || !SUPPORT) return;
    var cur = SUPPORT.currency || "$";
    var unconfigured = SUPPORT.tiers.every(function (t) { return isPlaceholder(t.link); })
                       && isPlaceholder(SUPPORT.customLink);

    var setup = unconfigured
      ? '<div class="sup-setup">Almost there — these buttons need your Stripe ' +
        'Payment Links. Create them in your Stripe dashboard and paste the URLs ' +
        'into <code>SUPPORT</code> in <code>ogc-network.js</code>. ' +
        '(Only you see this note; it disappears once links are added.)</div>'
      : '';

    var tiles = SUPPORT.tiers.map(function (t) {
      var ph = isPlaceholder(t.link);
      return '<a class="sup-tier' + (t.featured ? ' feat' : '') +
        (ph ? ' ph' : '') + '" href="' + (ph ? '#' : t.link) + '"' +
        (ph ? '' : ' rel="noopener"') + '>' +
        (t.featured ? '<span class="sup-flag">Most picked</span>' : '') +
        '<span class="sup-amt">' + cur + t.amount + '</span>' +
        '<span class="sup-lbl">' + t.label + '</span>' +
        '<span class="sup-note">' + t.note + '</span></a>';
    }).join("");

    var custom = SUPPORT.customLink
      ? '<a class="sup-custom' + (isPlaceholder(SUPPORT.customLink) ? ' ph' : '') +
        '" href="' + (isPlaceholder(SUPPORT.customLink) ? '#' : SUPPORT.customLink) +
        '" rel="noopener">Choose your own amount &rarr;</a>'
      : '';

    var monthly = SUPPORT.monthlyLink && !isPlaceholder(SUPPORT.monthlyLink)
      ? '<a class="sup-custom" href="' + SUPPORT.monthlyLink + '" rel="noopener">' +
        'Support monthly instead &rarr;</a>'
      : '';

    el.innerHTML =
      setup +
      '<h1 class="sup-h">' + SUPPORT.heading + '</h1>' +
      '<p class="sup-blurb">' + SUPPORT.blurb + '</p>' +
      '<div class="sup-grid">' + tiles + '</div>' +
      '<div class="sup-alt">' + custom + monthly + '</div>' +
      '<p class="sup-fine">' + (SUPPORT.thanksNote || "") + '</p>';
  }

  var me = currentScript();
  var barOff = me && me.getAttribute("data-ogc-bar") === "off";
  var onHub = location.hostname.replace(/^www\./, "") ===
              HUB.replace(/^https?:\/\//, "").replace(/^www\./, "");

  if (!barOff && !onHub) {
    var pos = me && me.getAttribute("data-ogc-position") === "bottom" ? "bottom" : "inline";
    var run = function () { mountBar({ dark: isDarkPreferred(me), position: pos }); };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run);
    } else { run(); }
  }
})();
