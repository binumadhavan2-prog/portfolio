// Small page effects: scroll progress bar, section titles that type in, the stats strip
// count-up, and 3D tilt + light sweep on project cards.
(function () {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ready = window.bootDone || Promise.resolve();      // start reveals after the boot intro (boot.js)
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- scroll progress bar ----------
  const bar = document.getElementById('scrollProgress');
  if (bar) {
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // ---------- section titles type themselves in ----------
  // Letters are split into spans and revealed one by one, so the layout never shifts.
  if (!reduceMotion) {
    const titles = [...document.querySelectorAll('.sec-head h2, .contact-intro h2')];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const chars = [...e.target.querySelectorAll('.tt-ch')];
      const caret = e.target.querySelector('.tt-caret');
      chars.forEach((c, i) => setTimeout(() => c.classList.add('on'), 120 + i * 45));
      setTimeout(() => caret?.classList.add('done'), 120 + chars.length * 45 + 900);
    }), { rootMargin: '0px 0px -15% 0px' });
    titles.forEach(h => {
      const text = h.textContent;
      h.setAttribute('aria-label', text);
      h.innerHTML = [...text].map(ch => `<span class="tt-ch" aria-hidden="true">${ch === ' ' ? ' ' : ch.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))}</span>`).join('') +
        '<span class="tt-caret" aria-hidden="true"></span>';
      h.classList.add('tt');
      ready.then(() => io.observe(h));
    });
  }

  // ---------- stats strip: numbers count up when scrolled into view ----------
  const stats = [...document.querySelectorAll('[data-count]')];
  stats.forEach(el => {
    const of = el.dataset.countOf;                 // optional: count matching elements on the page
    if (of) el.dataset.count = document.querySelectorAll(of).length;
    if (reduceMotion) el.textContent = el.dataset.count;
  });
  if (!reduceMotion && stats.length) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, dur = 1100, t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    stats.forEach(el => { el.textContent = '0'; ready.then(() => io.observe(el)); });
  }

  // ---------- About editor tabs: developer.py / journey.diff ----------
  const tabs = [...document.querySelectorAll('.ed-tab')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on);
      const pane = document.getElementById(t.getAttribute('aria-controls'));
      pane.hidden = !on;
      if (on && !reduceMotion) pane.querySelectorAll('.ln').forEach((ln, i) => ln.animate(
        [{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 260, delay: i * 45, easing: 'ease-out', fill: 'backwards' }));
    });
  }));

  // ---------- project cards: 3D tilt towards the mouse + red light sweep ----------
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.project').forEach(card => {
      const max = card.classList.contains('featured') ? 3 : 7;   // degrees; big card tilts less
      let raf = 0, px = 0.5, py = 0.5;
      const apply = () => {
        raf = 0;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateY(-4px)`;
      };
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerenter', () => card.classList.add('tilting'));
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf); raf = 0;
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });
  }
})();
