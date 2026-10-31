// Command palette (Ctrl+K / Cmd+K, or the search button in the nav): type to filter, ↑ ↓ to move,
// Enter to run. Jumps to sections and projects, and runs quick actions.
(function () {
  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const link = url => (url.startsWith('mailto:') ? (location.href = url) : window.open(url, '_blank', 'noopener'));

  const ITEMS = [
    { group: 'Go to', icon: '#', label: 'Home', keys: 'top hero start', run: () => go('home') },
    { group: 'Go to', icon: '#', label: 'Terminal', keys: 'bash shell command', run: () => { go('shell'); setTimeout(() => document.querySelector('.term-input')?.focus({ preventScroll: true }), 600); } },
    { group: 'Go to', icon: '#', label: 'About', keys: 'me intro story', run: () => go('about') },
    { group: 'Go to', icon: '#', label: 'Skills', keys: 'tech stack', run: () => go('skills') },
    { group: 'Go to', icon: '#', label: 'Projects', keys: 'work portfolio', run: () => go('projects') },
    { group: 'Go to', icon: '#', label: 'GitHub', keys: 'repos code open source', run: () => go('github') },
    { group: 'Go to', icon: '#', label: 'Journey', keys: 'experience education career git log', run: () => go('journey') },
    { group: 'Go to', icon: '#', label: 'Contact', keys: 'email hire reach', run: () => go('contact') },
    ...(window.caseStudies?.list() || []).map(p => ({
      group: 'Projects', icon: '▸', label: p.title, hint: p.kind.split(' · ')[0], keys: p.kind, run: () => window.caseStudies.open(p.id),
    })),
    { group: 'Actions', icon: '⚡', label: 'Recruiter view (30-second summary)', keys: 'quick summary hire recruiter hr', run: () => window.recruiterView?.open() },
    { group: 'Actions', icon: '⬇', label: 'Download resume', keys: 'cv pdf', run: () => { const a = document.createElement('a'); a.href = 'assets/Binu_M_Resume.pdf'; a.download = 'Binu_M_Resume.pdf'; a.click(); } },
    { group: 'Actions', icon: '✉', label: 'Email Binu', hint: 'binumadhavan2@gmail.com', keys: 'mail contact hire', run: () => link('mailto:binumadhavan2@gmail.com') },
    { group: 'Actions', icon: '↗', label: 'Open GitHub profile', keys: 'code repos', run: () => link('https://github.com/binumadhavan2-prog') },
    { group: 'Actions', icon: '↗', label: 'Open LinkedIn', keys: 'profile network', run: () => link('https://www.linkedin.com/in/binu-madhavan-734a99251') },
    { group: 'Actions', icon: '◐', label: 'Toggle light / dark theme', keys: 'mode colour color', run: () => document.getElementById('themeToggle')?.click() },
    { group: 'Actions', icon: '🤖', label: 'Take a tour with BM-bot', keys: 'robot guide help', run: () => { window.bmBot?.show?.(); window.bmBot?.tour?.(); } },
  ];

  const dialog = document.createElement('dialog');
  dialog.className = 'palette';
  dialog.setAttribute('aria-label', 'Command palette');
  dialog.innerHTML = `
    <div class="pal-box">
      <div class="pal-search"><span class="green mono">&gt;</span>
        <input type="text" placeholder="Search sections, projects, actions…" aria-label="Search" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="palList">
        <kbd class="mono">esc</kbd></div>
      <ul class="pal-list" id="palList" role="listbox"></ul>
      <div class="pal-foot mono"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
    </div>`;
  document.body.append(dialog);
  const input = dialog.querySelector('input');
  const list = dialog.querySelector('.pal-list');
  let shown = [], active = 0;

  // simple fuzzy match: every typed character appears in order; earlier/denser matches score higher
  function score(item, q) {
    if (!q) return 1;
    const hay = `${item.label} ${item.keys || ''} ${item.group}`.toLowerCase();
    if (hay.includes(q)) return 100 - hay.indexOf(q);
    let i = 0, gaps = 0, last = -1;
    for (const ch of q) {
      const j = hay.indexOf(ch, last + 1);
      if (j < 0) return 0;
      gaps += j - last - 1; last = j; i++;
    }
    return Math.max(1, 50 - gaps);
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    shown = ITEMS.map(it => ({ it, s: score(it, q) })).filter(x => x.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0)).map(x => x.it);
    active = Math.min(active, Math.max(shown.length - 1, 0));
    let group = '';
    list.innerHTML = shown.length ? shown.map((it, i) => {
      const head = !q && it.group !== group ? `<li class="pal-group mono" role="presentation">${(group = it.group)}</li>` : '';
      return `${head}<li class="pal-item${i === active ? ' on' : ''}" role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === active}">
        <span class="pal-ic">${it.icon}</span><span class="pal-label">${it.label}</span>${it.hint ? `<span class="pal-hint mono">${it.hint}</span>` : ''}</li>`;
    }).join('') : '<li class="pal-empty mono">no results. Try "projects", "resume" or "email"</li>';
    input.setAttribute('aria-activedescendant', shown.length ? `pal-${active}` : '');
    list.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (dialog.open) return;
    document.querySelector('dialog.case[open]')?.close();
    input.value = '';
    active = 0;
    render();
    dialog.showModal();
    document.documentElement.classList.add('case-modal');     // reuse: lock scroll + system cursor
    input.focus();
  }
  function close() { if (dialog.open) dialog.close(); }
  function runActive() {
    const it = shown[active];
    if (!it) return;
    close();
    setTimeout(it.run, 60);
  }

  dialog.addEventListener('close', () => document.documentElement.classList.remove('case-modal'));
  dialog.addEventListener('click', e => {
    if (e.target === dialog) return close();
    const li = e.target.closest('.pal-item');
    if (li) { active = +li.dataset.i; runActive(); }
  });
  list.addEventListener('pointermove', e => {
    const li = e.target.closest('.pal-item');
    if (li && +li.dataset.i !== active) { active = +li.dataset.i; list.querySelector('.on')?.classList.remove('on'); li.classList.add('on'); }
  });
  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(shown.length, 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(shown.length, 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); runActive(); }
  });

  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dialog.open ? close() : open(); }
  });
  document.getElementById('paletteBtn')?.addEventListener('click', open);
  window.palette = { open, close };
})();
