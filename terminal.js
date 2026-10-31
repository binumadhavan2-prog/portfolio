// Interactive terminal: a small shell visitors can type into to explore the portfolio.
// Content (about, skills, journey, links) is read from the page itself so it never drifts.
(function () {
  const term = document.getElementById('terminal');
  if (!term) return;
  const out = term.querySelector('.term-out');
  const input = term.querySelector('.term-input');
  const screen = term.querySelector('.term-screen');

  const LINKS = {
    github: 'https://github.com/binumadhavan2-prog',
    linkedin: 'https://www.linkedin.com/in/binu-madhavan-734a99251',
    email: 'mailto:binumadhavan2@gmail.com',
  };
  const SECTIONS = ['home', 'about', 'skills', 'projects', 'github', 'journey', 'contact'];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const text = sel => document.querySelector(sel)?.textContent.trim().replace(/\s+/g, ' ') || '';
  const cmd = c => `<button type="button" class="t-cmd" data-run="${esc(c)}">${esc(c)}</button>`;

  function print(html, cls = '') {
    const line = document.createElement('div');
    line.className = `t-line ${cls}`;
    line.innerHTML = html;
    out.append(line);
    screen.scrollTop = screen.scrollHeight;
  }
  function echo(value) {
    const line = document.createElement('div');
    line.className = 't-line t-echo';
    line.innerHTML = '<span class="t-prompt">binu@dev:~$</span> ';
    line.append(document.createTextNode(value));
    out.append(line);
  }
  function openUrl(url) {
    if (url.startsWith('mailto:')) location.href = url;
    else window.open(url, '_blank', 'noopener');
  }

  // ---------- commands ----------
  const COMMANDS = {
    help: {
      desc: 'list commands',
      run() {
        const rows = Object.entries(COMMANDS).filter(([, c]) => !c.hidden)
          .map(([name, c]) => `<div class="t-row">${cmd(name + (c.args ? ' ' : ''))}<span class="t-dim">${esc(c.args ? c.args + '  ' : '')}${esc(c.desc)}</span></div>`);
        print(`<span class="t-dim">available commands:</span>${rows.join('')}<span class="t-dim">tip: Tab completes, ↑ ↓ walk through history.</span>`);
      },
    },
    whoami: {
      desc: 'who is this guy?',
      run() {
        print(`<b class="t-hi">Binu M</b> — Full Stack Web Developer @ Onwords Private Limited<br><span class="t-dim">📍 ${esc(text('.info-row .info span'))}</span>`);
      },
    },
    about: {
      desc: 'a short intro',
      run() { print(esc(text('.about-text'))); },
    },
    skills: {
      desc: 'tech I work with',
      run() {
        const rows = [...document.querySelectorAll('.hl-grid .hl-row')].map(row => {
          const label = row.querySelector('.hl-label')?.textContent.replace('//', '').trim();
          const items = [...row.querySelectorAll('.hl-cell:not(.hl-label)')].map(c => c.textContent.replace(/[()]/g, '').trim());
          return `<div class="t-row"><span class="t-key">${esc(label)}</span><span>${items.map(esc).join(' · ')}</span></div>`;
        });
        print(rows.join(''));
      },
    },
    projects: {
      desc: 'list projects',
      run() {
        const rows = window.caseStudies.list().map(p =>
          `<div class="t-row">${cmd('open ' + p.name)}<span class="t-dim">${esc(p.kind)}</span></div>`);
        print(`${rows.join('')}<span class="t-dim">run <b>open &lt;name&gt;</b> for the full case study.</span>`);
      },
    },
    open: {
      args: '<project>',
      desc: 'open a project case study',
      run(arg) {
        if (!arg) return print(`usage: open &lt;project&gt; — try ${cmd('projects')}`, 't-err');
        const id = window.caseStudies.find(arg);
        if (!id) return print(`open: no such project: ${esc(arg)} — try ${cmd('projects')}`, 't-err');
        window.caseStudies.open(id);
        print(`<span class="t-ok">✔</span> opened ${esc(arg)} <span class="t-dim">(Esc to close)</span>`);
      },
    },
    experience: {
      desc: 'work & education (git log)',
      run() {
        const rows = [...document.querySelectorAll('.journey li')].map(li =>
          `<div class="t-log"><span class="t-key">${esc(li.querySelector('.j-hash')?.textContent.trim())}</span><br>${esc(li.querySelector('h3')?.textContent)} <span class="t-dim">· ${esc(li.querySelector('.j-org')?.textContent)} · ${esc(li.querySelector('.j-year')?.textContent)}</span></div>`);
        print(rows.join(''));
      },
    },
    contact: {
      desc: 'ways to reach me',
      run() {
        print(`<div class="t-row"><span class="t-key">email</span><a href="${LINKS.email}">binumadhavan2@gmail.com</a></div>
               <div class="t-row"><span class="t-key">linkedin</span><a href="${LINKS.linkedin}" target="_blank" rel="noopener">in/binu-madhavan</a></div>
               <div class="t-row"><span class="t-key">github</span><a href="${LINKS.github}" target="_blank" rel="noopener">binumadhavan2-prog</a></div>`);
      },
    },
    resume: {
      desc: 'download my resume (PDF)',
      run() {
        const a = document.createElement('a');
        a.href = 'assets/Binu_M_Resume.pdf';
        a.download = 'Binu_M_Resume.pdf';
        a.click();
        print('<span class="t-ok">✔</span> downloading Binu_M_Resume.pdf …');
      },
    },
    github: { desc: 'open GitHub', run() { openUrl(LINKS.github); print('opening github …'); } },
    linkedin: { desc: 'open LinkedIn', run() { openUrl(LINKS.linkedin); print('opening linkedin …'); } },
    email: { desc: 'write me an email', run() { openUrl(LINKS.email); print('opening your mail app …'); } },
    cd: {
      args: '<section>',
      desc: 'jump to a section',
      run(arg) {
        const s = (arg || '').replace(/^[~/.]+/, '').toLowerCase();
        if (!SECTIONS.includes(s)) return print(`cd: try one of: ${SECTIONS.map(x => cmd('cd ' + x)).join(' ')}`, 't-err');
        document.getElementById(s)?.scrollIntoView({ behavior: 'smooth' });
        print(`<span class="t-dim">→ /${esc(s)}</span>`);
      },
    },
    ls: {
      desc: 'list directory',
      run(arg) {
        if (/^projects\/?$/.test(arg || '')) return COMMANDS.projects.run();
        print(SECTIONS.map(s => `<span class="t-dir">${s}/</span>`).join('  ') + '  <span>resume.pdf</span>  <span>README.md</span>');
      },
    },
    cat: {
      args: '<file>',
      desc: 'read a file',
      hidden: true,
      run(arg) {
        if (/readme|about/i.test(arg || '')) return COMMANDS.about.run();
        if (/resume/i.test(arg || '')) return COMMANDS.resume.run();
        if (arg && window.caseStudies.find(arg.replace(/\/?(readme\.md)?$/i, ''))) return COMMANDS.open.run(arg.replace(/\/?(readme\.md)?$/i, ''));
        print(`cat: ${esc(arg || '')}: no such file`, 't-err');
      },
    },
    theme: {
      args: '[dark|light]',
      desc: 'switch colour theme',
      run(arg) {
        const now = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        const want = arg === 'dark' || arg === 'light' ? arg : (now === 'dark' ? 'light' : 'dark');
        if (want !== now) document.getElementById('themeToggle')?.click();
        print(`theme: ${want}`);
      },
    },
    clear: { desc: 'clear the screen', run() { out.innerHTML = ''; } },
    history: { desc: 'show command history', hidden: true, run() { print(history.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`).join('<br>') || '<span class="t-dim">(empty)</span>'); } },
    date: { desc: 'print the date', hidden: true, run() { print(esc(new Date().toString())); } },
    pwd: { desc: 'print working directory', hidden: true, run() { print('/home/binu/portfolio'); } },
    echo: { desc: 'print text', hidden: true, run(arg, raw) { print(esc(raw.replace(/^echo\s*/, ''))); } },
    sudo: {
      desc: 'try it ;)',
      hidden: true,
      run(arg, raw) {
        if (/^sudo\s+hire\s+binu/i.test(raw)) {
          print('<span class="t-ok">[sudo] access granted.</span> Great choice! Opening a new email to Binu …');
          term.classList.remove('t-party'); void term.offsetWidth; term.classList.add('t-party');
          setTimeout(() => openUrl(LINKS.email + '?subject=' + encodeURIComponent("Let's work together")), 900);
          return;
        }
        print('binu is not in the sudoers file. This incident will be reported. <span class="t-dim">(hint: sudo hire binu)</span>', 't-err');
      },
    },
    recruiter: { desc: 'open the 30-second recruiter view', run() { window.recruiterView?.open(); print('<span class="t-ok">✔</span> opening recruiter view …'); } },
    bot: { desc: 'call BM-bot, the robot guide', run() { window.bmBot?.show(); print('<span class="t-ok">✔</span> BM-bot is on its way 🤖'); } },
    exit: { desc: 'leave the terminal', hidden: true, run() { input.blur(); print('<span class="t-dim">bye! (click to come back)</span>'); } },
  };
  COMMANDS.ll = { ...COMMANDS.ls, hidden: true };
  COMMANDS['?'] = { ...COMMANDS.help, hidden: true };

  // ---------- input ----------
  const history = [];
  let hIndex = 0;

  function run(raw) {
    const line = raw.trim();
    echo(line);
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    const [name, ...rest] = line.split(/\s+/);
    const c = COMMANDS[name.toLowerCase()];
    if (!c) return print(`command not found: ${esc(name)} — type ${cmd('help')}`, 't-err');
    c.run(rest.join(' '), line);
    screen.scrollTop = screen.scrollHeight;
  }

  function complete() {
    const v = input.value;
    const parts = v.split(/\s+/);
    let pool;
    if (parts.length === 1) pool = Object.keys(COMMANDS).filter(k => !COMMANDS[k].hidden || k === 'sudo').map(k => k + ' ');
    else if (/^(open|cat)$/.test(parts[0])) pool = window.caseStudies.list().map(p => `${parts[0]} ${p.name}`);
    else if (parts[0] === 'cd') pool = SECTIONS.map(s => `cd ${s}`);
    else if (parts[0] === 'theme') pool = ['theme dark', 'theme light'];
    else return;
    const hits = pool.filter(p => p.startsWith(v));
    if (hits.length === 1) input.value = hits[0];
    else if (hits.length > 1) {
      const common = hits.reduce((a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
      if (common.length > v.length) input.value = common;
      else { echo(v); print(hits.map(h => esc(h.trim().split(' ').pop())).join('  '), 't-dim'); }
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { run(input.value); input.value = ''; }
    else if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIndex > 0) input.value = history[--hIndex]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIndex = Math.min(hIndex + 1, history.length); input.value = history[hIndex] || ''; }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); COMMANDS.clear.run(); }
  });

  // clicking a command anywhere (output or the chips) runs it; clicking the screen focuses input
  document.addEventListener('click', e => {
    const b = e.target.closest('.t-cmd');
    if (b && (term.contains(b) || b.closest('.term-chips'))) {
      const c = b.dataset.run;
      if (c.endsWith(' ')) { input.value = c; input.focus(); return; }
      run(c);
      input.focus({ preventScroll: true });
    }
  });
  screen.addEventListener('click', e => {
    if (!e.target.closest('a, button') && !getSelection().toString()) input.focus({ preventScroll: true });
  });

  // "binu@dev:~$ whoami" in the hero jumps into the terminal and runs it
  document.querySelector('.hello')?.addEventListener('click', () => {
    term.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { run('whoami'); input.focus({ preventScroll: true }); }, 500);
  });

  // "/" or "`" from anywhere focuses the terminal
  addEventListener('keydown', e => {
    if ((e.key === '/' || e.key === '`') && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      term.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus({ preventScroll: true });
    }
  });

  print(`<span class="t-hi">binu.dev shell</span> <span class="t-dim">v1.0 — type</span> ${cmd('help')} <span class="t-dim">to start, or try</span> ${cmd('projects')}`);
})();
