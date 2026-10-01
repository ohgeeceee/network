(() => {
  'use strict';

  const sites = window.OGCNetwork?.sites || [];
  // Public repository snapshot from github.com/ohgeeceee, checked 2026-10-01.
  // Keep private repositories out of this client-side portfolio.
  const repositories = [
    { name: 'network', description: 'The home for this portfolio and the independent sites in the network.', language: 'HTML', homepage: 'https://ohgeec.com' },
    { name: 'soulregistry', description: 'An open registry and marketplace for portable AI agent identities and SOUL.md files.', language: 'JavaScript', homepage: 'https://ohgeeceee.github.io/soulregistry/' },
    { name: 'beemuu', description: 'Open-source BMW diagnostics and telemetry, built with Tauri, Rust, Python, and web UI.', language: 'JavaScript', homepage: 'https://beemuu.com' },
    { name: 'montanablotter', description: 'The codebase behind Montana Blotter, a public-records newsroom.', language: 'Python', homepage: 'https://montanablotter.com' },
    { name: 'beemuu-plugins', description: 'Plugins for the beemuu diagnostics suite.', language: 'JavaScript', homepage: 'https://plugins.beemuu.com/' },
    { name: 'garageroute', description: 'The software behind GarageRoute: discover local sales and plan a route.', language: 'TypeScript', homepage: 'https://www.garageroute.com' },
    { name: 'finally.help', description: 'The project behind plain-language explainers at finally.help.', language: 'JavaScript', homepage: 'https://finally.help' },
    { name: 'edgesync', description: '', language: 'TypeScript' },
    { name: 'hoteldeposit', description: '', language: 'HTML' },
    { name: 'conductor', description: '', language: '' },
    { name: 'trade-operations', description: '', language: '' },
    { name: 'manners', description: 'A tiny browser extension that adds please and thank you to messages before you send.', language: 'HTML', homepage: 'https://manners.pro/' },
    { name: 'supportmt', description: 'The project behind SupportMT and its Montana community-resilience work.', language: 'TypeScript', homepage: 'https://supportmt.com' },
    { name: '.vscode', description: 'Public editor and workspace settings repository.', language: '' },
    { name: 'domainchecker', description: 'A domain-checking project.', language: '' },
    { name: 'montanasolutions', description: 'A Montana-based technology company project.', language: 'HTML' },
    { name: 'yourkidding-me', description: 'A personal portfolio project.', language: 'TypeScript' },
    { name: 'educationalhistory', description: 'A Montana history and education project.', language: '' },
  ];
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

  function populateRepositories() {
    const grid = document.querySelector('#github-projects');
    if (!grid) return;
    const count = document.querySelector('#repo-count');
    if (count) count.textContent = String(repositories.length);

    repositories.forEach((repo, index) => {
      const url = `https://github.com/ohgeeceee/${encodeURIComponent(repo.name)}`;
      const card = element('article', 'repo-card rv');
      const head = element('div', 'repo-card__head');
      head.append(element('span', 'repo-number', String(index + 1).padStart(2, '0')));
      head.append(element('span', 'repo-mark', '↗'));
      card.append(head);
      card.append(element('h3', 'repo-name', repo.name));
      card.append(element('p', 'repo-description', repo.description || 'Explore this public project on GitHub.'));
      const foot = element('div', 'repo-card__foot');
      foot.append(element('span', 'repo-language', repo.language || 'Public repository'));
      const links = element('div', 'repo-links');
      if (repo.homepage) {
        const live = element('a', 'repo-live', 'Live ↗');
        live.href = repo.homepage;
        live.target = '_blank';
        live.rel = 'noopener noreferrer';
        live.setAttribute('aria-label', `Open ${repo.name} website`);
        links.append(live);
      }
      const source = element('a', 'repo-source', 'Source ↗');
      source.href = url;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.setAttribute('aria-label', `View ${repo.name} on GitHub`);
      links.append(source);
      foot.append(links);
      card.append(foot);
      grid.append(card);
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
  populateRepositories();
  revealOnScroll();
  const year = document.querySelector('#yr');
  if (year) year.textContent = String(new Date().getFullYear());
})();
