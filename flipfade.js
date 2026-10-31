// Flip-fade text: vanilla port of VengeanceUI's FlipFadeText.
//
//   <span class="flip-fade" data-words="BUILDING,CODING" data-interval="2500"></span>
//
// Each letter flips in (rotateX 90 -> 0, rising, unblurring), staggered; on change the
// word flips out letter by letter, then the next one flips in (AnimatePresence mode="wait").
(function () {
  const ENTER_EASE = 'cubic-bezier(0.2, 0.65, 0.3, 0.9)';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.flip-fade').forEach(host => {
    const words = (host.dataset.words || 'LOADING,COMPUTING,SEARCHING,RETRIEVING,ASSEMBLING')
      .split(',').map(w => w.trim()).filter(Boolean);
    const interval = +host.dataset.interval || 2500;
    const letterDuration = (+host.dataset.letterDuration || 0.6) * 1000;
    const stagger = (+host.dataset.staggerDelay || 0.1) * 1000;
    const exitStagger = (+host.dataset.exitStaggerDelay || 0.05) * 1000;

    host.setAttribute('aria-label', words.join(', '));
    host.setAttribute('role', 'text');
    let index = 0, current = null, busy = false;

    function render(word) {
      const el = document.createElement('span');
      el.className = 'flip-fade-word';
      el.setAttribute('aria-hidden', 'true');
      [...word].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'flip-fade-letter';
        s.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(s);
      });
      host.appendChild(el);
      return el;
    }

    function enter(el) {
      if (reduce) return;
      [...el.children].forEach((s, i) => s.animate([
        { transform: 'translateY(20px) rotateX(90deg)', opacity: 0, filter: 'blur(8px)' },
        { transform: 'translateY(0) rotateX(0deg)', opacity: 1, filter: 'blur(0px)' },
      ], { duration: letterDuration, delay: i * stagger, easing: ENTER_EASE, fill: 'both' }));
    }

    function exit(el) {
      if (reduce) return Promise.resolve();
      return Promise.all([...el.children].map((s, i) => s.animate([
        { transform: 'translateY(0) rotateX(0deg)', opacity: 1, filter: 'blur(0px)' },
        { transform: 'translateY(-20px) rotateX(-90deg)', opacity: 0, filter: 'blur(8px)' },
      ], { duration: letterDuration * 0.67, delay: i * exitStagger, easing: 'ease-in', fill: 'both' }).finished));
    }

    current = render(words[0]);
    enter(current);

    setInterval(async () => {
      if (document.hidden || busy) return;
      busy = true;
      const old = current;
      index = (index + 1) % words.length;
      await exit(old);
      old.remove();
      current = render(words[index]);
      enter(current);
      busy = false;
    }, interval);
  });
})();
