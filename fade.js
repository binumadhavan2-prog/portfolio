// Fade / Fades: vanilla port of the animate-ui Fade primitive.
//
//   <div data-fade>                       fade in on load
//   <div data-fade data-in-view>          fade in when scrolled into view (once)
//   <ul data-fades data-hold-delay="100"> wrap each child in a Fade, staggered
//
// Options (on data-fade or data-fades; data-fades passes them to every child):
//   data-delay (ms)  data-initial-opacity  data-opacity  data-in-view
//   data-in-view-once="false"  data-in-view-margin="0px"
//   data-stiffness / data-damping (spring, defaults 200 / 20)
// Only opacity animates, so it behaves the same under reduced motion.
(function () {
  const SPRING_DEFAULTS = { stiffness: 200, damping: 20, mass: 1 };

  // Simulate the spring once per config and turn it into keyframes for the Web Animations API.
  const springCache = new Map();
  function spring(stiffness, damping, mass) {
    const key = `${stiffness}/${damping}/${mass}`;
    if (springCache.has(key)) return springCache.get(key);
    const dt = 1 / 120, values = [];
    let x = 0, v = 0, t = 0;
    while (t < 2) {
      const a = (-stiffness * (x - 1) - damping * v) / mass;
      v += a * dt;
      x += v * dt;
      t += dt;
      values.push(Math.min(x, 1));
      if (Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.02) break;
    }
    values[values.length - 1] = 1;
    const result = { values, duration: values.length * dt * 1000 };
    springCache.set(key, result);
    return result;
  }

  function readOptions(el, inherited = {}) {
    const d = el.dataset;
    const num = (v, fallback) => (v !== undefined && v !== '' && !isNaN(+v) ? +v : fallback);
    return {
      delay: num(d.delay, inherited.delay ?? 0),
      from: num(d.initialOpacity, inherited.from ?? 0),
      to: num(d.opacity, inherited.to ?? 1),
      inView: 'inView' in d || !!inherited.inView,
      once: d.inViewOnce !== undefined ? d.inViewOnce !== 'false' : inherited.once ?? true,
      margin: d.inViewMargin || inherited.margin || '0px',
      stiffness: num(d.stiffness, inherited.stiffness ?? SPRING_DEFAULTS.stiffness),
      damping: num(d.damping, inherited.damping ?? SPRING_DEFAULTS.damping),
    };
  }

  function play(el, o) {
    const { values, duration } = spring(o.stiffness, o.damping, SPRING_DEFAULTS.mass);
    el._fadeAnim?.cancel();
    el._fadeAnim = el.animate(
      values.map(p => ({ opacity: o.from + (o.to - o.from) * p })),
      { duration, delay: o.delay, fill: 'both', easing: 'linear' }
    );
  }

  function reset(el, o) {
    el._fadeAnim?.cancel();
    el.style.opacity = o.from;
  }

  const observers = new Map();
  function observe(el, o) {
    let io = observers.get(o.margin);
    if (!io) {
      io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          const opts = e.target._fadeOpts;
          if (e.isIntersecting) {
            play(e.target, opts);
            if (opts.once) io.unobserve(e.target);
          } else if (!opts.once) {
            reset(e.target, opts);
          }
        });
      }, { rootMargin: o.margin });
      observers.set(o.margin, io);
    }
    el._fadeOpts = o;
    io.observe(el);
  }

  // Load-time fades wait for the boot intro (boot.js) so they play once it wipes away.
  const ready = window.bootDone || Promise.resolve();

  function setup(el, o) {
    el.style.opacity = o.from;
    o.inView ? observe(el, o) : ready.then(() => play(el, o));
  }

  document.querySelectorAll('[data-fades]').forEach(group => {
    const base = readOptions(group);
    const hold = +group.dataset.holdDelay || 0;
    [...group.children].forEach((child, i) => {
      setup(child, readOptions(child, { ...base, delay: base.delay + i * hold }));
    });
  });

  document.querySelectorAll('[data-fade]').forEach(el => setup(el, readOptions(el)));
})();
