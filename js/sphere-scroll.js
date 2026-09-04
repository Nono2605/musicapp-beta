// Scroll-driven companion sphere.
// The sphere lives in a fixed, full-viewport stage (#sphere-stage) and glides
// between a handful of "waypoints" — one per major section — as the user
// scrolls. Each waypoint describes where the sphere should rest (as a % of
// the viewport) plus its scale/opacity, chosen so it always sits in the
// empty space beside/behind the section's text rather than on top of it.
(function () {
  const stage = document.getElementById('sphere-stage');
  const visual = document.getElementById('sphere-visual');
  if (!stage || !visual) return;

  const WAYPOINTS = [
    { id: 'hero', x: 74, y: 46, scale: 1.05, opacity: 1 },
    { id: 'about', x: 88, y: 26, scale: 0.5, opacity: 0.55 },
    { id: 'ai', x: 91, y: 16, scale: 0.32, opacity: 0.28 },
    { id: 'discover-surface', x: 50, y: 50, scale: 0.001, opacity: 0 },
    { id: 'transparency', x: 80, y: 52, scale: 0.65, opacity: 0.4 },
    { id: 'creators', x: 82, y: 42, scale: 0.6, opacity: 0.38 },
    { id: 'final-cta', x: 50, y: 16, scale: 0.55, opacity: 0.5 },
    { id: 'site-footer', x: 50, y: 16, scale: 0.55, opacity: 0 },
  ];

  // On narrow viewports every section collapses to a single stacked column,
  // so roaming across the full width would constantly cross over text. Keep
  // the sphere confined to the top-right corner instead — only its
  // scale/opacity still tell the per-section story.
  const WAYPOINTS_COMPACT = [
    { id: 'hero', x: 88, y: 15, scale: 0.5, opacity: 0.92 },
    { id: 'about', x: 90, y: 8, scale: 0.3, opacity: 0.32 },
    { id: 'ai', x: 90, y: 8, scale: 0.24, opacity: 0.2 },
    { id: 'discover-surface', x: 50, y: 50, scale: 0.001, opacity: 0 },
    { id: 'transparency', x: 90, y: 8, scale: 0.3, opacity: 0.22 },
    { id: 'creators', x: 90, y: 8, scale: 0.28, opacity: 0.2 },
    { id: 'final-cta', x: 50, y: 8, scale: 0.32, opacity: 0.3 },
    { id: 'site-footer', x: 50, y: 8, scale: 0.32, opacity: 0 },
  ];

  const compactQuery = window.matchMedia('(max-width: 720px)');

  // Resolve each waypoint's DOM element once; skip any that aren't present.
  function resolveAnchors() {
    const source = compactQuery.matches ? WAYPOINTS_COMPACT : WAYPOINTS;
    return source
      .map((wp) => ({ ...wp, el: document.getElementById(wp.id) }))
      .filter((wp) => wp.el);
  }

  let anchors = resolveAnchors();

  if (!anchors.length) return;

  let maxScroll = 1;

  function measure() {
    anchors = resolveAnchors();
    const viewportHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    maxScroll = Math.max(1, docHeight - viewportHeight);

    anchors.forEach((wp) => {
      const rect = wp.el.getBoundingClientRect();
      const centerDocY = rect.top + window.scrollY + rect.height / 2;
      // Fraction of the whole scrollable range at which this section's
      // vertical center crosses the viewport's vertical center.
      const t = (centerDocY - viewportHeight / 2) / maxScroll;
      wp.t = Math.min(1, Math.max(0, t));
    });
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (t) => t * t * (3 - 2 * t);

  function targetForScroll(scrollT) {
    // Before the first anchor or after the last: hold at the endpoint.
    if (scrollT <= anchors[0].t) return anchors[0];
    if (scrollT >= anchors[anchors.length - 1].t) return anchors[anchors.length - 1];

    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      if (scrollT >= a.t && scrollT <= b.t) {
        const span = b.t - a.t || 1;
        const localT = smoothstep((scrollT - a.t) / span);
        return {
          x: lerp(a.x, b.x, localT),
          y: lerp(a.y, b.y, localT),
          scale: lerp(a.scale, b.scale, localT),
          opacity: lerp(a.opacity, b.opacity, localT),
        };
      }
    }
    return anchors[anchors.length - 1];
  }

  // Displayed values ease toward the target each frame for a fluid, slightly
  // trailing "companion" feel rather than a rigid 1:1 scroll link.
  let current = { x: anchors[0].x, y: anchors[0].y, scale: anchors[0].scale, opacity: anchors[0].opacity };
  let target = { ...current };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyStyles() {
    visual.style.setProperty('--sphere-x', `${current.x}vw`);
    visual.style.setProperty('--sphere-y', `${current.y}vh`);
    visual.style.setProperty('--sphere-scale', current.scale.toFixed(3));
    visual.style.setProperty('--sphere-opacity', current.opacity.toFixed(3));
  }

  function tick() {
    const ease = reduceMotion ? 1 : 0.09;
    current.x = lerp(current.x, target.x, ease);
    current.y = lerp(current.y, target.y, ease);
    current.scale = lerp(current.scale, target.scale, ease);
    current.opacity = lerp(current.opacity, target.opacity, ease);
    applyStyles();
    requestAnimationFrame(tick);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollT = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      target = targetForScroll(scrollT);
      ticking = false;
    });
  }

  function onResize() {
    measure();
    onScroll();
  }

  measure();
  target = targetForScroll(Math.min(1, Math.max(0, window.scrollY / maxScroll)));
  current = { ...target };
  applyStyles();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  if (typeof compactQuery.addEventListener === 'function') {
    compactQuery.addEventListener('change', onResize);
  } else if (typeof compactQuery.addListener === 'function') {
    compactQuery.addListener(onResize);
  }
  requestAnimationFrame(tick);
})();
