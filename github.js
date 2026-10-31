// GitHub section: hand-picked repos with live details (language, last push) from the GitHub API,
// and a contribution graph that only appears once there is enough public activity to show.
// Works without the network too: the cards fall back to the details written here.
(function () {
  const root = document.getElementById('ghRepos');
  if (!root) return;
  const USER = 'binumadhavan2-prog';
  const MIN_CONTRIBUTIONS = 50;      // below this the graph would look empty, so it stays hidden

  // Edit this list to change which repos are shown (in this order).
  const REPOS = [
    { name: 'support-pilot-ai', desc: 'AI support copilot: ticket triage and cited answers with Claude, pgvector RAG and human approval.', lang: 'TypeScript', case: 'pilot' },
    { name: 'monkey-play', desc: 'Animated desktop companion for Windows and Android, with reminders, weather and a Claude chat.', lang: 'C#', case: 'monkey' },
    { name: 'kalyan-finance', desc: 'Multi-page finance website with an English/Tamil toggle and a loan calculator.', lang: 'JavaScript', case: 'kalyan' },
    { name: 'neema-homes', desc: 'Interior design website with a Supabase-backed gallery, enquiries and an admin dashboard.', lang: 'JavaScript', case: 'neema' },
  ];
  const LANG_COLORS = { TypeScript: '#3178c6', JavaScript: '#f1e05a', 'C#': '#178600', Python: '#3572A5', Java: '#b07219', HTML: '#e34c26', CSS: '#563d7c' };

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function ago(iso) {
    const s = (Date.now() - new Date(iso)) / 1000;
    for (const [n, u] of [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']]) {
      if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? 's' : ''} ago`; }
    }
    return 'just now';
  }

  function render(live = {}) {
    root.innerHTML = REPOS.map(r => {
      const d = live[r.name] || {};
      const lang = d.language || r.lang;
      return `
        <article class="gh-repo">
          <div class="gh-repo-head mono">
            <svg class="ic"><use href="#i-github"/></svg>
            <a href="https://github.com/${USER}/${r.name}" target="_blank" rel="noopener"><span class="gh-user">${USER}/</span>${esc(r.name)}</a>
          </div>
          <p>${esc(d.description || r.desc)}</p>
          <div class="gh-meta mono">
            ${lang ? `<span><i style="background:${LANG_COLORS[lang] || 'var(--muted)'}"></i>${esc(lang)}</span>` : ''}
            ${d.pushed_at ? `<span title="${esc(new Date(d.pushed_at).toLocaleString())}">updated ${ago(d.pushed_at)}</span>` : ''}
            ${r.case ? `<button type="button" class="gh-case" data-case-open="${r.case}">case study →</button>` : ''}
          </div>
        </article>`;
    }).join('');
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-case-open]');
    if (b) window.caseStudies?.open(b.dataset.caseOpen);
  });

  render();

  // Only ask GitHub once the section is close, and cache for an hour (the API allows 60 calls/hour).
  const CACHE = 'gh-cache-v1';
  function cached() {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE));
      if (c && Date.now() - c.t < 3600e3) return c;
    } catch (e) {}
    return null;
  }

  async function load() {
    let data = cached();
    if (!data) {
      const [repos, contrib] = await Promise.allSettled([
        fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
      ]);
      data = { t: Date.now(), repos: {}, contrib: null };
      if (repos.status === 'fulfilled') repos.value.forEach(r => { data.repos[r.name] = { description: r.description, language: r.language, pushed_at: r.pushed_at }; });
      if (contrib.status === 'fulfilled') data.contrib = contrib.value;
      try { sessionStorage.setItem(CACHE, JSON.stringify(data)); } catch (e) {}
    }
    render(data.repos);
    graph(data.contrib);
  }

  function graph(c) {
    const box = document.getElementById('ghGraph');
    const total = c?.total?.lastYear || 0;
    if (!box || total < MIN_CONTRIBUTIONS) return;
    const days = c.contributions;
    const pad = new Date(days[0].date).getDay();                     // start the grid on a Sunday
    const cells = Array(pad).fill('<i class="pad"></i>').concat(days.map(d =>
      `<i class="l${d.level}" title="${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}"></i>`));
    box.innerHTML = `
      <div class="gh-graph-head mono"><span>${total} contributions in the last year</span>
        <span class="gh-legend">less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</span></div>
      <div class="gh-cells">${cells.join('')}</div>`;
    box.hidden = false;
  }

  new IntersectionObserver((entries, io) => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); load().catch(() => {}); }
  }, { rootMargin: '400px' }).observe(root);
})();
