// BM-bot: a small robot guide that walks along the bottom of the screen.
// It walks to each section as you scroll and gives one tip per section, waves after the boot
// intro, follows the mouse with its eyes, and opens a menu with a guided tour, quick actions and
// a "ask me" box. Answers come from the page itself (no AI service, nothing invented).
(function () {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 640;
  const STORE = 'bmbot-hidden';
  const ready = window.bootDone || Promise.resolve();

  // ---------- markup ----------
  const bot = document.createElement('div');
  bot.className = 'bot';
  bot.innerHTML = `
    <div class="bot-bubble" role="status" aria-live="polite"><p></p></div>
    <div class="bot-panel" role="dialog" aria-label="BM-bot menu" hidden>
      <div class="bot-panel-head mono"><span><span class="green">●</span> BM-bot <small>· portfolio guide</small></span><button class="bot-x" aria-label="Close menu">&times;</button></div>
      <div class="bot-log mono"></div>
      <div class="bot-actions">
        <button data-act="tour">▶ Take a tour</button>
        <button data-act="best">★ Best project</button>
        <button data-act="resume">⬇ Resume</button>
        <button data-act="contact">✉ Contact Binu</button>
        <button data-act="terminal">&gt;_ Terminal</button>
        <button data-act="hide">Hide me</button>
      </div>
      <form class="bot-ask"><input class="mono" type="text" placeholder="ask me: skills, projects, contact…" aria-label="Ask BM-bot" autocomplete="off"><button aria-label="Send">→</button></form>
    </div>
    <button class="bot-body" type="button" aria-label="BM-bot, your portfolio guide. Open menu" data-cursor="hi!">
      <svg viewBox="0 0 120 150" aria-hidden="true">
        <defs>
          <linearGradient id="botMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2b31"/><stop offset="1" stop-color="#121215"/></linearGradient>
          <linearGradient id="botVisor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0306"/><stop offset="1" stop-color="#05050a"/></linearGradient>
          <radialGradient id="botGlow"><stop offset="0" stop-color="#ff5a4f"/><stop offset="1" stop-color="#e62e3d" stop-opacity="0"/></radialGradient>
        </defs>
        <ellipse class="bot-shadow" cx="60" cy="146" rx="30" ry="4"/>
        <g class="bot-leg bot-leg-l"><rect x="40" y="108" width="12" height="26" rx="6" fill="url(#botMetal)" stroke="#3a3a42"/><rect x="36" y="130" width="20" height="9" rx="4.5" fill="#e62e3d"/></g>
        <g class="bot-leg bot-leg-r"><rect x="68" y="108" width="12" height="26" rx="6" fill="url(#botMetal)" stroke="#3a3a42"/><rect x="64" y="130" width="20" height="9" rx="4.5" fill="#e62e3d"/></g>
        <g class="bot-upper">
        <g class="bot-arm bot-arm-l"><rect x="14" y="72" width="11" height="32" rx="5.5" fill="url(#botMetal)" stroke="#3a3a42"/><circle cx="19.5" cy="106" r="6" fill="#e62e3d"/></g>
        <g class="bot-arm bot-arm-r"><rect x="95" y="72" width="11" height="32" rx="5.5" fill="url(#botMetal)" stroke="#3a3a42"/><circle cx="100.5" cy="106" r="6" fill="#e62e3d"/></g>
        <g class="bot-torso">
          <rect x="27" y="66" width="66" height="48" rx="14" fill="url(#botMetal)" stroke="#3a3a42"/>
          <rect x="41" y="78" width="38" height="20" rx="5" fill="#09090b" stroke="#2a2a30"/>
          <text x="60" y="92.5" text-anchor="middle" class="bot-chest">&lt;/&gt;</text>
          <circle cx="60" cy="106" r="2.2" class="bot-led"/>
        </g>
        <g class="bot-head">
          <line x1="60" y1="16" x2="60" y2="4" stroke="#3a3a42" stroke-width="3" stroke-linecap="round"/>
          <circle cx="60" cy="5" r="9" fill="url(#botGlow)" class="bot-halo"/>
          <circle cx="60" cy="5" r="4" fill="#ff5a4f" class="bot-antenna"/>
          <rect x="22" y="15" width="76" height="52" rx="20" fill="url(#botMetal)" stroke="#3a3a42"/>
          <rect x="15" y="34" width="8" height="16" rx="3" fill="#e62e3d"/>
          <rect x="97" y="34" width="8" height="16" rx="3" fill="#e62e3d"/>
          <rect x="31" y="25" width="58" height="32" rx="13" fill="url(#botVisor)" stroke="#e62e3d" stroke-opacity="0.45"/>
          <g class="bot-eyes">
            <rect class="bot-eye" x="42" y="34" width="11" height="14" rx="5.5"/>
            <rect class="bot-eye" x="67" y="34" width="11" height="14" rx="5.5"/>
          </g>
          <path class="bot-mouth" d="M53 52 q7 4 14 0" fill="none" stroke="#ff5a4f" stroke-width="2" stroke-linecap="round"/>
        </g>
        </g>
      </svg>
    </button>
    <button class="bot-show" type="button" aria-label="Bring back BM-bot" hidden>🤖</button>`;
  document.body.append(bot);

  const body = bot.querySelector('.bot-body');
  const svg = body.querySelector('svg');
  const eyes = bot.querySelector('.bot-eyes');
  const [legL, legR, armL, armR, upper] = ['.bot-leg-l', '.bot-leg-r', '.bot-arm-l', '.bot-arm-r', '.bot-upper'].map(s => svg.querySelector(s));
  const bubble = bot.querySelector('.bot-bubble');
  const bubbleText = bubble.querySelector('p');
  const panel = bot.querySelector('.bot-panel');
  const log = bot.querySelector('.bot-log');
  const askForm = bot.querySelector('.bot-ask');
  const askInput = askForm.querySelector('input');
  const showBtn = bot.querySelector('.bot-show');

  // ---------- page content used for tips and answers ----------
  const text = sel => document.querySelector(sel)?.textContent.trim().replace(/\s+/g, ' ') || '';
  const skills = () => [...document.querySelectorAll('.hl-grid .hl-row')].map(r =>
    `${r.querySelector('.hl-label')?.textContent.replace('//', '').trim()}: ${[...r.querySelectorAll('.hl-cell:not(.hl-label)')].map(c => c.textContent.replace(/[()]/g, '').trim()).join(', ')}`);
  const projects = () => window.caseStudies?.list() || [];

  const TIPS = {
    home: 'Hi! I\'m BM-bot 👋 Click me any time for a quick tour.',
    shell: 'This terminal really works. Try typing <b>help</b> or <b>sudo hire binu</b> 😉',
    about: 'Binu is a full-stack developer at Onwords, based in Palakkad, Kerala.',
    skills: 'Hover the skills grid. The red highlight follows you around!',
    projects: 'Click any project card for the full case study, with a how-it-works flow.',
    github: 'These cards are live from GitHub. Tip: tap 🔍 in the menu bar (or press <b>Ctrl + K</b>) to search the whole portfolio.',
    journey: 'His career, written as a git log. The newest commit is on top.',
    contact: 'Like what you see? Email Binu, he\'d love to hear from you ✉',
  };
  const SPOTS = { home: 0.9, shell: 0.88, about: 0.08, skills: 0.9, projects: 0.06, github: 0.9, journey: 0.08, contact: 0.5 };
  const TOUR = ['home', 'shell', 'about', 'skills', 'projects', 'github', 'journey', 'contact'];

  // ---------- movement ----------
  // The walk cycle is driven by distance travelled (not a timer), so the feet never skate:
  // one full stride = STRIDE px. Speed ramps up and down, and it slows to a stop before turning.
  const W = () => (small() ? 64 : 84);
  const MAX_V = 115, ACCEL = 260, STRIDE = 52;     // ~4.5 steps a second at full speed
  let x = 0, target = 0, facing = 1, v = 0, dist = 0, walking = false, raf = 0, last = 0;

  function clampX(val) { return Math.max(12, Math.min(innerWidth - W() - 24, val)); }
  function place() {
    bot.style.transform = `translateX(${x}px)`;
    const lean = (v / MAX_V) * 4;                                   // lean into the walk
    svg.style.transform = `scaleX(${facing}) rotate(${lean}deg)`;
    bot.dataset.side = x + W() / 2 > innerWidth / 2 ? 'left' : 'right';   // where the bubble/panel open
  }
  // The robot faces the viewer, so it walks with a step-and-sway: each foot lifts in turn,
  // the body rocks onto the planted foot and the arms swing a little.
  // amp 0..1 scales the whole gait, so it eases in as the robot speeds up and out as it stops.
  function pose(amp) {
    const ph = (dist / STRIDE) * Math.PI * 2, s = Math.sin(ph);
    const liftL = Math.max(0, s), liftR = Math.max(0, -s);
    legL.style.transform = `translateY(${-liftL * 7 * amp}px) rotate(${liftL * 5 * amp}deg)`;
    legR.style.transform = `translateY(${-liftR * 7 * amp}px) rotate(${-liftR * 5 * amp}deg)`;
    armL.style.transform = `rotate(${(4 + s * 9) * amp}deg)`;
    armR.style.transform = `rotate(${(-4 + s * 9) * amp}deg)`;
    upper.style.transform = `translateY(${-Math.abs(s) * 2.5 * amp}px) rotate(${-s * 4 * amp}deg)`;
  }
  function walkTo(frac) {
    target = clampX(frac * innerWidth - W() / 2);
    if (reduceMotion || small()) { x = small() ? clampX(innerWidth) : target; place(); return; }
    if (Math.abs(target - x) < 4) return;
    if (!walking) {
      facing = target > x ? 1 : -1;
      walking = true;
      bot.classList.add('walking');
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  }
  function step(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const d = target - x, dir = Math.sign(d) || facing;
    if (dir !== facing) {
      v = Math.max(0, v - ACCEL * 1.6 * dt);                        // brake, then turn around
      if (v === 0) facing = dir;
    } else if (Math.abs(d) <= (v * v) / (2 * ACCEL) + 0.5) {
      v = Math.max(8, v - ACCEL * dt);                              // ease into the stop
    } else {
      v = Math.min(MAX_V, v + ACCEL * dt);
    }
    const move = Math.min(v * dt, dir === facing ? Math.abs(d) : v * dt);
    x += facing * move;
    dist += move;
    pose(Math.min(1, v / 55));
    place();
    if (Math.abs(target - x) < 0.5 && dir === facing) {
      x = target; v = 0; walking = false;
      bot.classList.remove('walking');
      settle();
      return;
    }
    raf = requestAnimationFrame(step);
  }
  // after stopping, bring the limbs back to rest smoothly instead of snapping
  function settle() {
    [legL, legR, armL, armR, upper].forEach(el => {
      el.style.transition = 'transform 0.25s ease-out';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 260);
    });
    place();
  }

  // ---------- speech ----------
  let hideTimer = 0;
  function say(html, ms = 5200) {
    bubbleText.innerHTML = html;
    bubble.classList.add('on');
    clearTimeout(hideTimer);
    if (ms) hideTimer = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  function wave() {
    bot.classList.remove('waving'); void bot.offsetWidth; bot.classList.add('waving');
    setTimeout(() => bot.classList.remove('waving'), 1600);
  }

  // ---------- eyes follow the pointer, blink now and then ----------
  addEventListener('pointermove', e => {
    const r = body.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.3);
    const len = Math.hypot(dx, dy) || 1;
    eyes.style.transform = `translate(${(dx / len) * 3 * facing}px, ${(dy / len) * 2.5}px)`;
  }, { passive: true });
  (function blink() {
    setTimeout(() => { bot.classList.add('blink'); setTimeout(() => { bot.classList.remove('blink'); blink(); }, 140); }, 2500 + Math.random() * 3500);
  })();

  // ---------- section awareness: walk over and give one tip per section ----------
  const seen = new Set();
  let current = 'home', touring = false, panelOpen = false;
  const sections = ['home', 'shell', 'about', 'skills', 'projects', 'github', 'journey', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting || touring) return;
      current = e.target.id;
      walkTo(SPOTS[current] ?? 0.85);
      if (!seen.has(current) && !panelOpen && !bot.classList.contains('hidden')) {
        seen.add(current);
        setTimeout(() => say(TIPS[current]), 600);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  // ---------- menu ----------
  function addLog(html, who = 'bot') {
    const p = document.createElement('p');
    p.className = `m-${who}`;
    if (who === 'you') p.textContent = html; else p.innerHTML = html;
    log.append(p);
    log.scrollTop = log.scrollHeight;
  }
  function openPanel() {
    panelOpen = true;
    panel.hidden = false;
    bubble.classList.remove('on');
    if (!log.children.length) addLog('Hi! I\'m <b>BM-bot</b>, Binu\'s portfolio guide. Pick an option, or ask me something.');
    body.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    panelOpen = false;
    panel.hidden = true;
    body.setAttribute('aria-expanded', 'false');
  }
  body.addEventListener('click', () => {
    if (touring) return stopTour('Tour stopped. Click me again any time!');
    panelOpen ? closePanel() : (openPanel(), wave());
  });
  bot.querySelector('.bot-x').addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panelOpen) closePanel(); });

  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const ACTIONS = {
    tour: () => { closePanel(); startTour(); },
    best: () => { closePanel(); go('projects'); setTimeout(() => window.caseStudies?.open('mah'), 700); say('Here\'s his biggest one: <b>Mutual Aid House</b>, a production platform with payments and payouts.'); },
    resume: () => { const a = document.createElement('a'); a.href = 'assets/Binu_M_Resume.pdf'; a.download = 'Binu_M_Resume.pdf'; a.click(); addLog('Downloading Binu\'s resume (PDF) ⬇'); },
    contact: () => { closePanel(); go('contact'); say('Email: <b>binumadhavan2@gmail.com</b>. Or use the buttons right here ✉', 7000); },
    terminal: () => { closePanel(); document.getElementById('terminal')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => document.querySelector('.term-input')?.focus({ preventScroll: true }), 600); say('Type <b>help</b> to see what the terminal can do.'); },
    hide: () => { closePanel(); hide(true); },
  };
  bot.querySelector('.bot-actions').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b) ACTIONS[b.dataset.act]();
  });

  // ---------- "ask me": keyword answers from the page ----------
  function answer(q) {
    const s = q.toLowerCase();
    const has = (...w) => w.some(k => s.includes(k));
    if (has('hello', 'hi ', 'hey') || s === 'hi') return 'Hey there! 👋 Ask me about Binu\'s skills, projects, experience or how to contact him.';
    if (has('skill', 'stack', 'tech', 'language', 'know')) return skills().map(l => `• ${l}`).join('<br>');
    if (has('best', 'biggest', 'favourite', 'favorite', 'main project')) { setTimeout(() => window.caseStudies?.open('mah'), 400); return 'His biggest is <b>Mutual Aid House</b>, a production direct-selling platform. Opening it…'; }
    const proj = projects().find(p => s.includes(p.title.toLowerCase()) || s.includes(p.name) || s.includes(p.title.toLowerCase().split(' ')[0]));
    if (proj && !has('projects')) { setTimeout(() => window.caseStudies?.open(proj.id), 400); return `Opening the <b>${proj.title}</b> case study…`; }
    if (has('project', 'work', 'portfolio', 'built', 'build')) return projects().map(p => `• <b>${p.title}</b>: ${p.kind}`).join('<br>');
    if (has('experience', 'job', 'company', 'onwords', 'working')) return 'Binu is a <b>Web Developer at Onwords Private Limited</b>, Coimbatore (2026 – present), building websites and web apps across frontend, backend and Python.';
    if (has('education', 'study', 'college', 'degree', 'course', 'luminar')) return [...document.querySelectorAll('.journey li')].slice(1).map(li => `• ${li.querySelector('h3')?.textContent}, ${li.querySelector('.j-org')?.textContent} (${li.querySelector('.j-year')?.textContent})`).join('<br>');
    if (has('available', 'hire', 'hiring', 'freelance', 'open to')) return `${text('.status-card strong')}! The best way to reach him is <b>binumadhavan2@gmail.com</b>.`;
    if (has('contact', 'email', 'mail', 'reach', 'phone', 'linkedin', 'github')) return 'Email: <a href="mailto:binumadhavan2@gmail.com">binumadhavan2@gmail.com</a><br>LinkedIn: <a href="https://www.linkedin.com/in/binu-madhavan-734a99251" target="_blank" rel="noopener">in/binu-madhavan</a><br>GitHub: <a href="https://github.com/binumadhavan2-prog" target="_blank" rel="noopener">binumadhavan2-prog</a>';
    if (has('where', 'location', 'live', 'based', 'city')) return `He's based in <b>${text('.info-row .info span')}</b>.`;
    if (has('resume', 'cv')) { ACTIONS.resume(); return 'Sure, downloading his resume now.'; }
    if (has('who', 'about', 'binu')) return text('.about-text');
    if (has('robot', 'bot', 'you')) return 'I\'m BM-bot, a little guide Binu built into this portfolio with plain JavaScript and SVG. 🤖';
    if (has('tour')) { setTimeout(() => ACTIONS.tour(), 300); return 'Starting the tour!'; }
    return 'Hmm, I don\'t know that one yet. Try asking about <b>skills</b>, <b>projects</b>, <b>experience</b>, <b>education</b> or <b>contact</b>.';
  }
  askForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = askInput.value.trim();
    if (!q) return;
    addLog(q, 'you');
    askInput.value = '';
    bot.classList.add('thinking');
    setTimeout(() => { bot.classList.remove('thinking'); addLog(answer(q)); }, 450);
  });

  // ---------- guided tour ----------
  let tourTimer = 0;
  function startTour() {
    touring = true;
    bot.classList.add('touring');
    let i = 0;
    const next = () => {
      if (!touring) return;
      if (i >= TOUR.length) return stopTour('That\'s the tour! Thanks for visiting 🙌 Click me if you need anything.');
      const id = TOUR[i++];
      go(id);
      walkTo(SPOTS[id]);
      setTimeout(() => touring && say(`<small class="bot-step">${i}/${TOUR.length}</small> ${TIPS[id]}`, 0), 700);
      tourTimer = setTimeout(next, 4800);
    };
    say('Let\'s go! (click me to stop)', 0);
    tourTimer = setTimeout(next, 900);
  }
  function stopTour(msg) {
    touring = false;
    clearTimeout(tourTimer);
    bot.classList.remove('touring');
    say(msg, 5000);
  }

  // ---------- hide / show ----------
  function hide(remember) {
    bot.classList.add('hidden');
    bubble.classList.remove('on');
    showBtn.hidden = false;
    if (remember) try { localStorage.setItem(STORE, '1'); } catch (e) {}
  }
  function show() {
    bot.classList.remove('hidden');
    showBtn.hidden = true;
    try { localStorage.removeItem(STORE); } catch (e) {}
    wave();
    say('I\'m back! 👋');
  }
  showBtn.addEventListener('click', show);
  window.bmBot = { show, hide: () => hide(true), say, tour: startTour };

  // ---------- start ----------
  x = clampX(innerWidth * 0.9);
  place();
  addEventListener('resize', () => { x = clampX(x); target = clampX(target); place(); });
  let hidden = false;
  try { hidden = localStorage.getItem(STORE) === '1'; } catch (e) {}
  if (hidden) hide(false);
  ready.then(() => {
    bot.classList.add('in');
    sections.forEach(s => io.observe(s));
    if (!hidden) setTimeout(() => { wave(); seen.add('home'); say(TIPS.home); }, 700);
  });
})();
