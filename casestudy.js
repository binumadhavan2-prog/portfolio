// Project case studies: clicking a project card (or its "case study" link) opens a full-screen
// panel with the overview, what was built, a "how it works" flow, the stack and links.
// The terminal (terminal.js) opens these too, through window.caseStudies.
(function () {
  const CASES = {
    mah: {
      title: 'Mutual Aid House',
      aliases: ['mutual-aid-house', 'mutual', 'mutualaidhouse'],
      kind: 'Direct Selling Platform · Client Project · built at Onwords',
      overview: 'A production platform for a direct selling company. Members buy products, grow a network, earn commissions and withdraw them to their bank or UPI, while the company runs everything from one admin panel.',
      built: [
        'Product shop with Cashfree checkout and order tracking.',
        'Member network with a binary commission engine.',
        'Wallets paid out through Cashfree Payouts (bank or UPI) once KYC is approved.',
        'Refunds with automatic commission clawback.',
        'Admin panel: members, genealogy tree, commissions, payouts, KYC and Excel reports.',
        'Money stored as integer paise; unit, end-to-end API and browser UI tests.',
        'Automatic deploys with GitHub Actions to Supabase Edge Functions and Cloudflare Pages.',
      ],
      flow: ['Customer order', 'Cashfree checkout', 'Commission engine', 'Member wallet', 'KYC check', 'Bank / UPI payout'],
    },
    neema: {
      title: 'Neema Homes',
      aliases: ['neema-homes', 'neemahomes'],
      kind: 'Interior Design Website · Trial Project at Onwords · not launched',
      overview: 'A website for an interior design and modular kitchen business, built as a trial project. Visitors browse rooms and past work and estimate a price; the owner manages content from a private dashboard.',
      built: [
        'Room pages, a project gallery and a hero slider.',
        'Price calculator for quick estimates.',
        'Enquiries and gallery content stored in Supabase.',
        'Private admin dashboard secured with Supabase Auth and row-level security.',
        'Database schema tracked as migrations.',
      ],
      flow: ['Visitor', 'Rooms & gallery', 'Price calculator', 'Enquiry', 'Supabase (RLS)', 'Admin dashboard'],
    },
    kalyan: {
      title: 'Kalyan Finance',
      aliases: ['kalyan-finance', 'kalyanfinance'],
      kind: 'Finance Company Website · Client Project · built at Onwords',
      overview: 'A multi-page website for a financial services company, in English and Tamil, that helps customers understand loans and get in touch.',
      built: [
        'English / Tamil language toggle across the whole site.',
        'Loan repayment calculator.',
        'Video hero and customer-focused page structure.',
        'Validated enquiry form.',
        'Colour system, visual assets and SEO-friendly page organisation.',
        'Rates and facts come only from the client, never invented.',
      ],
      flow: ['Visitor', 'English / தமிழ்', 'Loan calculator', 'Enquiry form'],
    },
    pilot: {
      title: 'Support Pilot AI',
      aliases: ['support-pilot-ai', 'support-pilot', 'supportpilot'],
      kind: 'AI Support & Operations Copilot · Personal Project',
      overview: 'A support ticket system where AI does the first pass: it triages each ticket and drafts a reply grounded in the company\'s own documents, and a human approves every reply before it goes out.',
      built: [
        'Claude triages tickets and drafts replies with source citations.',
        'Multilingual retrieval (English, Hinglish, Tanglish) with local embeddings and pgvector.',
        'Human approval on every reply.',
        'Role-based access, multi-tenancy, SLA timers and analytics.',
        'Free no-API-key mode; runs with Docker.',
      ],
      flow: ['New ticket', 'Claude triage', 'Search docs (pgvector)', 'Draft reply + citations', 'Human approves', 'Reply sent'],
    },
    kavacham: {
      title: 'Kavacham',
      aliases: ['kavach'],
      kind: 'Windows Security & Cleanup App · Personal Project',
      overview: 'An antivirus companion for Windows that combines Microsoft Defender with its own scanning engine, plus privacy alerts, a security checkup and junk cleaning, in one desktop app.',
      built: [
        'Microsoft Defender scans plus its own engine: SHA-256 signatures, heuristics and quarantine.',
        'URL reputation from free threat feeds.',
        'USB and Android phone scanning (ADB).',
        'Security checkup with one-click fixes.',
        'Camera and microphone privacy alerts, and junk cleaning.',
      ],
      flow: ['File / USB / phone', 'Defender + own engine', 'Threat found?', 'Quarantine', 'Security checkup'],
    },
    monkey: {
      title: 'Monkey Play',
      aliases: ['monkey-play', 'monkeyplay'],
      kind: 'Animated Desktop Companion · Personal Project',
      overview: 'A cartoon monkey that lives on your desktop and keeps you company: it reminds you to rest, dances to your music, tells the weather and chats with you.',
      built: [
        'Tail physics and eyes that follow the cursor.',
        'Water and eye-rest reminders.',
        'Dances to the music you play.',
        'Weather forecasts from the Open-Meteo API.',
        'Chat powered by Claude, plus browser-tab tricks.',
        'Released as a Windows app (C#) and an Android app (Java).',
      ],
      flow: ['Desktop / phone', 'Monkey companion', 'Reminders · music · weather', 'Claude chat'],
    },
    bigmart: {
      title: 'BigMart',
      aliases: ['big-mart'],
      kind: 'Online Grocery Management Web App · Academic Project, Luminar Technolab · 2022–2023',
      overview: 'The course project from the full-stack development course at Luminar Technolab: a web application for online grocery transactions and product management.',
      built: [
        'Database-driven product catalogue and transactions.',
        'Product management for the store.',
        'Built with Python, SQL and MySQL, with an HTML/CSS front end.',
      ],
      flow: ['Customer', 'Browse products', 'Place order', 'MySQL database', 'Product management'],
    },
  };

  const ORDER = Object.keys(CASES);
  const slug = id => CASES[id].title.toLowerCase().replace(/\s+/g, '-');   // "mutual-aid-house"
  const cards = [...document.querySelectorAll('.project[data-case]')];
  cards.forEach(card => { if (CASES[card.dataset.case]) CASES[card.dataset.case].card = card; });

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const dialog = document.createElement('dialog');
  dialog.className = 'case';
  dialog.setAttribute('aria-labelledby', 'caseTitle');
  dialog.innerHTML = `
    <div class="case-window">
      <div class="editor-bar case-bar">
        <i></i><i></i><i></i><span class="mono" id="casePath"></span>
        <div class="case-nav">
          <button class="case-btn mono" data-step="-1" aria-label="Previous project">&larr; prev</button>
          <button class="case-btn mono" data-step="1" aria-label="Next project">next &rarr;</button>
          <button class="case-close" aria-label="Close case study">&times;</button>
        </div>
      </div>
      <div class="case-body" id="caseBody"></div>
    </div>`;
  document.body.append(dialog);
  const body = dialog.querySelector('#caseBody');
  let current = null;

  function render(id) {
    const c = CASES[id];
    const card = c.card;
    const shot = card?.querySelector('.shot')?.cloneNode(true);
    const badge = card?.querySelector('.badge')?.outerHTML || '';
    const pills = card?.querySelector('.pills')?.outerHTML || '';
    const links = card?.querySelector('.project-links')?.cloneNode(true);
    links?.querySelector('.case-open')?.remove();

    dialog.querySelector('#casePath').textContent = `~/projects/${slug(id)}/README.md`;
    body.innerHTML = `
      <div class="case-hero">
        <div class="case-shot"></div>
        <div class="case-head">
          <div class="project-head"><h2 id="caseTitle">${esc(c.title)}</h2>${badge}</div>
          <p class="project-type">${esc(c.kind)}</p>
          <p class="case-overview">${esc(c.overview)}</p>
          <div class="case-links"></div>
        </div>
      </div>
      <div class="case-grid">
        <section>
          <h3 class="case-h mono"><span class="green">##</span> what_i_built</h3>
          <ul class="case-list">${c.built.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        </section>
        <section>
          <h3 class="case-h mono"><span class="green">##</span> how_it_works</h3>
          <ol class="case-flow mono">${c.flow.map((s, i) => `<li style="--i:${i}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(s)}</li>`).join('')}</ol>
          <h3 class="case-h mono"><span class="green">##</span> stack</h3>
          ${pills}
        </section>
      </div>`;
    if (shot) body.querySelector('.case-shot').append(shot); else body.querySelector('.case-shot').remove();
    if (links && links.children.length) body.querySelector('.case-links').append(links);
    body.scrollTop = 0;
    current = id;
  }

  function open(id) {
    if (!CASES[id]) return false;
    render(id);
    if (!dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add('case-modal');
    }
    return true;
  }

  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('case-modal');
    CASES[current]?.card?.querySelector('.case-open')?.focus({ preventScroll: true });
  });

  function step(dir) {
    const i = ORDER.indexOf(current);
    render(ORDER[(i + dir + ORDER.length) % ORDER.length]);
  }

  dialog.addEventListener('click', e => {
    if (e.target === dialog) return close();                      // backdrop
    if (e.target.closest('.case-close')) return close();
    const b = e.target.closest('[data-step]');
    if (b) step(+b.dataset.step);
  });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  // Each card gets a "case study" link, and a click anywhere on the card (except its links) opens it.
  cards.forEach(card => {
    const id = card.dataset.case;
    let links = card.querySelector('.project-links');
    if (!links) {
      links = document.createElement('div');
      links.className = 'project-links mono';
      card.querySelector('.project-info').append(links);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'case-open';
    btn.textContent = 'case study →';
    btn.setAttribute('aria-label', `Open the ${CASES[id].title} case study`);
    links.prepend(btn);
    card.addEventListener('click', e => {
      if (e.target.closest('a, button:not(.case-open)')) return;
      open(id);
    });
  });

  // Lookup by id, title or alias, for the terminal.
  function find(name) {
    const q = String(name || '').toLowerCase().replace(/\s+/g, '-');
    return ORDER.find(id => id === q || slug(id) === q || CASES[id].aliases.includes(q)) || null;
  }

  window.caseStudies = {
    open, close, find,
    list: () => ORDER.map(id => ({ id, name: slug(id), title: CASES[id].title, kind: CASES[id].kind })),
  };
})();
