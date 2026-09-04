// Scroll-triggered reveal animations.
// Elements tagged with .reveal / .reveal-left / .reveal-right / .reveal-scale
// fade/slide into place the first time they cross into the viewport.
(function () {
  const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!items.length) return;

  // Respect explicit stagger delays set via [data-reveal-delay] (in ms).
  items.forEach((el) => {
    const delay = el.getAttribute('data-reveal-delay');
    if (delay) {
      el.style.setProperty('--reveal-delay', `${parseInt(delay, 10) / 1000}s`);
    }
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal everything immediately.
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    }
  );

  items.forEach((el) => observer.observe(el));
})();
