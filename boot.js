// Boot intro: a short terminal "boot" screen shown once per browser session.
// The <head> script decides whether to boot (adds html.booting and window.bootDone);
// this file plays the log, fills the bar, wipes the screen away and resolves bootDone,
// which fade.js waits on so the hero animates in after the intro. Any key or click skips it.
(function () {
  const root = document.documentElement;
  const boot = document.getElementById('boot');
  if (!boot || !root.classList.contains('booting')) return;
  const log = boot.querySelector('.boot-log');
  const bar = boot.querySelector('.boot-bar i');
  const pct = boot.querySelector('.boot-pct');

  const LINES = [
    ['binu.dev boot loader v26.10', 'dim'],
    ['[ ok ] mounting /home/binu', ''],
    ['[ ok ] loading skills.json', ''],
    ['[ ok ] compiling projects/ (7 found)', ''],
    ['[ ok ] linking experience @ onwords', ''],
    ['[ ok ] starting portfolio.service', ''],
    ['> welcome, visitor.', 'hi'],
  ];
  const STEP = 190;                         // ms per line
  const TOTAL = STEP * LINES.length + 250;
  let done = false, start = performance.now(), shown = 0;

  function finish() {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('booted', '1'); } catch (e) {}
    boot.classList.add('boot-out');
    window.__bootResolve?.();
    setTimeout(() => { root.classList.remove('booting'); boot.remove(); }, 650);
  }

  function frame(now) {
    if (done) return;
    const t = now - start;
    while (shown < LINES.length && t >= shown * STEP) {
      const [txt, cls] = LINES[shown++];
      const line = document.createElement('div');
      line.className = cls;
      line.textContent = txt;
      log.append(line);
    }
    const p = Math.min(t / TOTAL, 1);
    bar.style.transform = `scaleX(${p})`;
    pct.textContent = `${Math.round(p * 100)}%`;
    if (p >= 1) return void setTimeout(finish, 180);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const skip = () => finish();
  addEventListener('keydown', skip, { once: true });
  boot.addEventListener('pointerdown', skip, { once: true });
})();
