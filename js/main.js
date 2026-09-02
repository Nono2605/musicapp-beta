const body = document.body;
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-links a');
const year = document.getElementById('year');
const brand = (window.BRAND || 'BRAND').toUpperCase();

const replaceBrandText = () => {
  if (!document.body) return;

  document.title = document.title.replace(/LYVER/gi, brand);

  document.querySelectorAll('*').forEach((element) => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      element.setAttribute('aria-label', ariaLabel.replace(/LYVER/gi, brand));
    }

    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/LYVER/gi, brand);
      }
    });
  });
};

replaceBrandText();

if (year) {
  year.textContent = new Date().getFullYear();
}

const updateHeaderState = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
};

updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    body.classList.remove('nav-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// Particle-sphere using Canvas2D to emulate a three.js particle globe
function initParticleSphere() {
  const container = document.getElementById('three-root');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(container.clientWidth));
    const h = Math.max(1, Math.floor(container.clientHeight));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2; minDim = Math.min(w, h);
  }

  window.addEventListener('resize', resize);

  // parameters (tweakable)
  let particleCount = Math.max(400, Math.floor((container.clientWidth * container.clientHeight) / 1200));
  if (particleCount > 2000) particleCount = 2000;
  let cx = 0, cy = 0, minDim = 0;

  // particle storage
  const particles = [];
  const rand = (min, max) => min + Math.random() * (max - min);

  // pre-render circle for particle (improves perf)
  const dotCanvas = document.createElement('canvas');
  const dotSize = 64;
  dotCanvas.width = dotSize; dotCanvas.height = dotSize;
  const dctx = dotCanvas.getContext('2d');
  const dg = dctx.createRadialGradient(dotSize/2.6, dotSize/2.8, dotSize*0.02, dotSize/2, dotSize/2, dotSize/2);
  dg.addColorStop(0, 'rgba(255,255,255,0.95)');
  dg.addColorStop(0.14, 'rgba(158,238,255,0.9)');
  dg.addColorStop(0.32, 'rgba(125,225,255,0.55)');
  dg.addColorStop(1, 'rgba(125,225,255,0)');
  dctx.fillStyle = dg;
  dctx.beginPath(); dctx.arc(dotSize/2, dotSize/2, dotSize/2, 0, Math.PI*2); dctx.fill();

  // initialize particles positioned on sphere surface with slight thickness
  function initParticles() {
    particles.length = 0;
    const radius = minDim * 0.28;
    const thickness = radius * 0.28;
    for (let i = 0; i < particleCount; i++) {
      // spherical coordinates
      const u = Math.random();
      const v = Math.random();
      const theta = Math.acos(2 * u - 1) - Math.PI/2; // -PI/2..PI/2
      const phi = 2 * Math.PI * v;
      // add radial variation
      const rVar = radius + (Math.random() - 0.5) * thickness;
      const x = Math.cos(theta) * Math.cos(phi) * rVar;
      const y = Math.cos(theta) * Math.sin(phi) * rVar;
      const z = Math.sin(theta) * rVar;

      // color by latitude & index
      const hue = (i / particleCount) * 360; // full hue sweep
      const color = `hsl(${hue}, 85%, 60%)`;

      particles.push({ x, y, z, baseR: rVar, hue, size: rand(0.6, 1.6) });
    }
  }

  resize();
  initParticles();

  let t0 = performance.now();

  function project(p, rotY, rotX, fov, perspective) {
    // rotate around Y and X
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;
    const y1 = p.y;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    // perspective projection
    const scale = fov / (fov + z2 + perspective);
    return { x: cx + x1 * scale, y: cy + y2 * scale, s: scale };
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    // clear with transparent (don't fill black)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // parameters
    const rotY = t * 0.25; // slow rotation
    const rotX = Math.sin(t * 0.12) * 0.12;
    const fov = Math.max(200, minDim * 0.9);
    const perspective = 0;

    // draw orbits / trails: optional faint rings
    // draw particles sorted by depth for proper additive blending
    const projected = particles.map((p) => {
      return { p, proj: project(p, rotY, rotX, fov, perspective) };
    });

    projected.sort((a,b) => (b.p.z - a.p.z));

    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < projected.length; i++) {
      const { p, proj } = projected[i];
      const depth = ( (p.z / (minDim*0.5)) + 1) * 0.5; // 0..1
      const size = Math.max(0.8, p.size * 8 * proj.s);
      const alpha = 0.12 + 0.8 * proj.s * (0.6 + Math.sin(t + i) * 0.06);

      // tint color using hue
      const hue = p.hue;
      ctx.fillStyle = `hsla(${hue},85%,60%,${alpha})`;

      // draw pre-rendered dot scaled
      ctx.drawImage(dotCanvas, 0, 0, dotSize, dotSize, proj.x - size/2, proj.y - size/2, size, size);
    }

    // subtle outer ring
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

document.addEventListener('DOMContentLoaded', initParticleSphere);
