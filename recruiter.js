// Recruiter view: a calm one-page summary (no effects) for people short on time.
// Opens from the nav button, the hero link, or a direct link ending in ?view=recruiter.
// Everything is read from the page, so it always matches the full portfolio.
(function () {
  const root = document.documentElement;
  const text = (sel, el = document) => el.querySelector(sel)?.textContent.trim().replace(/\s+/g, ' ') || '';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const view = document.createElement('div');
  view.className = 'rec';
  view.id = 'recruiterView';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-label', 'Recruiter view');
  view.hidden = true;
  document.body.append(view);

  function build() {
    const openTo = text('.open-to').replace(/^open_to:\s*/, '');
    const jobs = [...document.querySelectorAll('.journey li')].map(li => ({
      title: text('h3', li), org: text('.j-org', li), year: text('.j-year', li),
      desc: text('p:not(.j-org)', li), cert: li.querySelector('.j-cert')?.getAttribute('href'),
    }));
    const projects = [...document.querySelectorAll('.project[data-case]')].map(card => ({
      id: card.dataset.case, title: text('h3', card), kind: text('.project-type', card),
      desc: text('.project-info > p:not(.project-type)', card),
      tags: [...card.querySelectorAll('.pills li')].map(li => li.textContent.trim()),
      links: [...card.querySelectorAll('.project-links a')].map(a => ({ href: a.href, label: a.textContent.replace('↗', '').trim() })),
    }));
    const skills = [...document.querySelectorAll('.hl-grid .hl-row')].map(r => ({
      label: text('.hl-label', r).replace('//', '').trim(),
      items: [...r.querySelectorAll('.hl-cell:not(.hl-label)')].map(c => c.textContent.replace(/[()]/g, '').trim()),
    }));

    view.innerHTML = `
      <div class="rec-bar">
        <span class="mono"><span class="green">⚡</span> recruiter view <small>· the 30-second version</small></span>
        <button type="button" class="rec-close" data-close>Full portfolio ✕</button>
      </div>
      <article class="rec-page">
        <header class="rec-head">
          <img src="assets/profile.webp" alt="" width="96" height="96">
          <div>
            <h1>Binu M</h1>
            <p class="rec-role">Full Stack Web Developer · Python Developer</p>
            <p class="rec-meta mono">📍 ${esc(text('.info-row .info span'))} &nbsp;·&nbsp; 💼 Web Developer @ Onwords (2026 – present)</p>
            ${openTo ? `<p class="rec-open mono"><b>Open to:</b> ${esc(openTo)}</p>` : ''}
          </div>
        </header>
        <div class="rec-actions">
          <a class="btn btn-primary btn-sm" href="assets/Binu_M_Resume.pdf" download><svg class="ic"><use href="#i-download"/></svg> Resume (PDF)</a>
          <a class="btn btn-outline btn-sm" href="mailto:binumadhavan2@gmail.com"><svg class="ic"><use href="#i-mail"/></svg> binumadhavan2@gmail.com</a>
          <a class="btn btn-outline btn-sm" href="https://www.linkedin.com/in/binu-madhavan-734a99251" target="_blank" rel="noopener"><svg class="ic"><use href="#i-linkedin"/></svg> LinkedIn</a>
          <a class="btn btn-outline btn-sm" href="https://github.com/binumadhavan2-prog" target="_blank" rel="noopener"><svg class="ic"><use href="#i-github"/></svg> GitHub</a>
        </div>

        <section><h2 class="mono">Summary</h2><p>${esc(text('.about-text'))}</p></section>

        <section><h2 class="mono">Experience &amp; education</h2>
          <ul class="rec-jobs">${jobs.map(j => `
            <li><div class="rec-row"><b>${esc(j.title)}</b><span class="mono">${esc(j.year)}</span></div>
              <span class="rec-org">${esc(j.org)}</span>${j.desc ? `<p>${esc(j.desc)}</p>` : ''}
              ${j.cert ? `<a class="rec-link-sm mono" href="${esc(j.cert)}" target="_blank" rel="noopener">view certificate ↗</a>` : ''}</li>`).join('')}
          </ul></section>

        <section><h2 class="mono">Projects</h2>
          <ul class="rec-projects">${projects.map(p => `
            <li><div class="rec-row"><b>${esc(p.title)}</b><button type="button" class="rec-link-sm mono" data-case-open="${p.id}">case study →</button></div>
              <span class="rec-org">${esc(p.kind)}</span>
              <p>${esc(p.desc)}</p>
              <p class="rec-tags mono">${p.tags.map(esc).join(' · ')}</p>
              ${p.links.length ? `<p class="rec-plinks mono">${p.links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</p>` : ''}</li>`).join('')}
          </ul></section>

        <section><h2 class="mono">Skills</h2>
          <dl class="rec-skills">${skills.map(s => `<dt class="mono">${esc(s.label)}</dt><dd>${s.items.map(esc).join(', ')}</dd>`).join('')}</dl></section>

        <footer class="rec-foot mono">Want the fun version? <button type="button" data-close>Explore the full portfolio →</button></footer>
      </article>`;
  }

  let lastFocus = null;
  function open() {
    build();
    lastFocus = document.activeElement;
    view.hidden = false;
    view.scrollTop = 0;
    root.classList.add('recruiter');
    setParam(true);
    view.querySelector('.rec-close').focus({ preventScroll: true });
  }
  function close() {
    if (view.hidden) return;
    view.hidden = true;
    root.classList.remove('recruiter');
    setParam(false);
    lastFocus?.focus?.({ preventScroll: true });
  }
  // keep ?view=recruiter in the address bar while open, so the link can be shared
  function setParam(on) {
    try {
      const url = new URL(location.href);
      on ? url.searchParams.set('view', 'recruiter') : url.searchParams.delete('view');
      if (!on && url.hash === '#recruiter') url.hash = '';
      history.replaceState(null, '', url);
    } catch (e) {}
  }

  view.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return close();
    const c = e.target.closest('[data-case-open]');
    if (c) window.caseStudies?.open(c.dataset.caseOpen);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !view.hidden && !document.querySelector('dialog[open]')) close();
  });
  document.getElementById('recruiterBtn')?.addEventListener('click', () => (view.hidden ? open() : close()));
  document.querySelectorAll('[data-recruiter]').forEach(b => b.addEventListener('click', open));
  window.recruiterView = { open, close };

  if (/[?&]view=recruiter|#recruiter/.test(location.href)) open();
})();
