// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Theme toggle (dark is the default design), revealed with a clip-path wipe.
// The old and new pages are View Transition snapshots, so nothing re-renders mid-wipe.
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const WIPE_FROM = {
  ltr: 'inset(0 100% 0 0)',
  rtl: 'inset(0 0 0 100%)',
  ttb: 'inset(0 0 100% 0)',
  btt: 'inset(100% 0 0 0)',
};

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  try { localStorage.setItem('theme', theme); } catch (e) {}
}

themeToggle.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'light' ? 'dark' : 'light'} mode`);

let wiping = false;
themeToggle.addEventListener('click', () => {
  if (wiping) return;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) return applyTheme(next);

  wiping = true;
  const direction = themeToggle.dataset.direction || 'ltr';
  const transition = document.startViewTransition(() => applyTheme(next));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [WIPE_FROM[direction] || WIPE_FROM.ltr, 'inset(0 0 0 0)'] },
      { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
    );
  });
  transition.finished.finally(() => { wiping = false; });
});

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);

// Active nav link
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.querySelectorAll('a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`)
    );
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

