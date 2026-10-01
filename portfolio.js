(() => {
  'use strict';

  const sites = window.OGCNetwork?.sites || [];
  const positions = {
    idahoblotter: [28.3, 23],
    finally: [48, 10.2],
    manners: [73, 26.1],
    montanablotter: [20.1, 53.6],
    beemuu: [81.3, 55.3],
    supportmt: [39.8, 75.8],
    garageroute: [68.9, 77.8],
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function populateNetwork() {
    const rows = document.querySelector('#project-rows');
    const points = document.querySelector('#atlas-points');
    if (!rows || !points) return;

    const liveCount = sites.filter((site) => site.status === 'live').length;
    const liveValue = document.querySelector('#live-count');
    const siteValue = document.querySelector('#site-count');
    if (liveValue) liveValue.textContent = String(liveCount);
    if (siteValue) siteValue.textContent = String(sites.length);

    sites.forEach((site, index) => {
      const host = new URL(site.url).host.replace(/^www\./, '');
      const soon = site.status === 'soon';
      const row = element(soon ? 'article' : 'a', `row rv${soon ? ' soon' : ''}`);
      row.style.setProperty('--accent', site.accent);
      if (!soon) {
        row.href = site.url;
        row.setAttribute('aria-label', `${site.name}: ${site.tagline}`);
      }

      row.append(element('span', 'num', String(index + 1).padStart(2, '0')));
      const name = element('span', 'name');
      name.append(element('span', 'dot'));
      name.append(document.createTextNode(site.name));
      const status = element('span', 'st');
      status.append(element('i'));
      status.append(document.createTextNode(soon ? 'Coming soon' : 'Live'));
      name.append(status);
      row.append(name);

      const tag = element('p', 'tag', site.tagline);
      row.append(tag);
      row.append(element('span', 'go', soon ? host : `${host}  →`));
      row.append(element('span', 'cat', site.category));
      rows.append(row);

      const position = positions[site.id];
      if (!position) return;
      const point = element(soon ? 'span' : 'a', `atlas-point${soon ? ' atlas-point--soon' : ''}`);
      point.style.setProperty('--x', `${position[0]}%`);
      point.style.setProperty('--y', `${position[1]}%`);
      point.style.setProperty('--accent', site.accent);
      if (soon) {
        point.setAttribute('aria-label', `${site.name}, coming soon`);
      } else {
        point.href = site.url;
        point.setAttribute('aria-label', `Visit ${site.name}: ${site.tagline}`);
      }
      const label = element('span', 'atlas-point__label');
      label.append(element('span', 'atlas-point__name', site.name));
      label.append(element('span', 'atlas-point__host', host));
      point.append(label);
      if (position[0] > 77 || position[0] < 33) point.classList.add('atlas-point--left');
      points.append(point);
    });
  }

  function revealOnScroll() {
    const targets = [...document.querySelectorAll('.rv')];
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((node) => node.classList.add('in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    targets.forEach((node) => observer.observe(node));
  }

  populateNetwork();
  revealOnScroll();
  const year = document.querySelector('#yr');
  if (year) year.textContent = String(new Date().getFullYear());
})();
