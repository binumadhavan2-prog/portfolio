// Custom cursor: vanilla port of the animate-ui Cursor + CursorFollow primitives (global mode).
//
//   #cursor        sticks to the pointer, its top-left corner on it (the arrow tip)
//   #cursorFollow  trails it on a spring without bounce, below-right of the pointer
//
// The label follows what is hovered: [data-cursor="..."] wins, then links / buttons.
// Positions are written as transforms in one rAF loop, so moving never touches layout.
(function () {
  const root = document.documentElement;
  const cursor = document.getElementById('cursor');
  const follow = document.getElementById('cursorFollow');
  if (!cursor || !follow) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const POP = { stiffness: 550, damping: 30 };                 // pop in, a little overshoot
  const UNPOP = { stiffness: 550, damping: 2 * Math.sqrt(550) }; // pop out, no overshoot
  const FOLLOW = { stiffness: 500, damping: 50 };              // follow, no bounce
  const SIDE_OFFSET = 22, ALIGN_OFFSET = 14;                   // side: bottom, align: end

  let px = 0, py = 0;                       // pointer
  let fx = 16, fy = 16, fvx = 0, fvy = 0;   // follower: first flight starts near the top-left
  let scale = 0, scaleV = 0;
  let active = false, raf = 0, prev = 0;

  function springStep(x, v, target, { stiffness, damping }, dt) {
    const a = -stiffness * (x - target) - damping * v;
    v += a * dt;
    return [x + v * dt, v];
  }

  function frame(now) {
    const dt = Math.max(0, Math.min((now - prev) / 1000, 1 / 30));
    prev = now;
    const steps = 4, h = dt / steps;
    const tx = px + ALIGN_OFFSET, ty = py + SIDE_OFFSET;

    for (let i = 0; i < steps; i++) {
      if (reduce) {
        scale = active ? 1 : 0;
        fx = tx; fy = ty;
      } else {
        [scale, scaleV] = springStep(scale, scaleV, active ? 1 : 0, active ? POP : UNPOP, h);
        [fx, fvx] = springStep(fx, fvx, tx, FOLLOW, h);
        [fy, fvy] = springStep(fy, fvy, ty, FOLLOW, h);
      }
    }
    if (!active && scale < 0.001) scale = 0;

    cursor.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${scale})`;
    follow.style.transform = `translate3d(${fx}px, ${fy}px, 0) scale(${scale})`;

    const settled = !active && scale === 0;
    raf = settled ? 0 : requestAnimationFrame(frame);
  }

  function run() {
    if (raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function show() {
    if (active) return;
    active = true;
    root.classList.add('cursor-active');
    cursor.classList.add('on');
    follow.classList.add('on');
    run();
  }

  function hide() {
    if (!active) return;
    active = false;
    root.classList.remove('cursor-active');
    cursor.classList.remove('on');
    follow.classList.remove('on');
    run();
  }

  function labelFor(el) {
    const tagged = el.closest('[data-cursor]');
    if (tagged) return tagged.dataset.cursor;
    const link = el.closest('a, button');
    if (!link) return 'you';
    if (link.hasAttribute('download')) return 'download';
    if ((link.getAttribute('href') || '').startsWith('mailto:')) return 'say hi';
    return link.tagName === 'BUTTON' ? 'click' : 'open';
  }

  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;     // a custom cursor only makes sense for hovering pointers
    px = e.clientX;
    py = e.clientY;
    show();
    run();
  }, { passive: true });

  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') hide(); }, { passive: true });

  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const label = labelFor(e.target);
    if (follow.textContent !== label) follow.textContent = label;
    cursor.classList.toggle('hot', label !== 'you');
  });

  // Leaving the page restores the native pointer
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) hide(); });
  addEventListener('blur', hide);
})();
