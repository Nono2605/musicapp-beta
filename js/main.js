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

// Attempt to initialize a three.js particle sphere; fall back to Canvas2D if three isn't available
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // already loaded?
    if (window.THREE) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

function initThreeParticles() {
  const container = document.getElementById('three-root');
  if (!container) return Promise.reject(new Error('No container'));

  return new Promise((resolve) => {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3.5;

    const light = new THREE.PointLight(0xffffff, 0.9);
    light.position.set(5, 5, 5);
    scene.add(light);

    // particles
    let particleCount = Math.max(1200, Math.floor((container.clientWidth * container.clientHeight) / 100));
    particleCount = Math.min(particleCount, 8000);

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const radius = 1.0;
    const thickness = 0.18;
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = Math.acos(2 * u - 1) - Math.PI / 2;
      const phi = 2 * Math.PI * v;
      const rVar = radius + (Math.random() - 0.5) * thickness;
      const x = Math.cos(theta) * Math.cos(phi) * rVar;
      const y = Math.cos(theta) * Math.sin(phi) * rVar;
      const z = Math.sin(theta) * rVar;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // color by latitude
      const hue = (i / particleCount) * 360;
      const col = new THREE.Color().setHSL((hue / 360) * 0.75 + 0.05, 0.9, 0.6);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.01 * Math.min(container.clientWidth, container.clientHeight) / 200, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthTest: true });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // heartbeat settings
    const bpm = 60; // default heartbeat
    const freq = bpm / 60; // Hz
    const amp = 0.08; // amplitude of scale pulse

    // resize handler
    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      material.size = 0.01 * Math.min(w, h) / 200;
    }
    window.addEventListener('resize', onResize);

    let t0 = performance.now();
    function animate(now) {
      const t = (now - t0) / 1000;
      // heartbeat pulse (smoothed)
      const pulse = 1 + Math.sin(t * Math.PI * 2 * freq) * amp + 0.01 * Math.sin(t * 0.6);
      points.scale.setScalar(pulse);

      // slow rotation
      points.rotation.y = t * 0.08;
      points.rotation.x = Math.sin(t * 0.12) * 0.03;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    resolve();
  });
}

// Boot: try local three, then CDN, else fallback to Canvas2D particle sphere
function initGraphics() {
  const local = loadScript('./js/three.min.js').then(() => window.THREE).catch(() => null);
  const cdn = loadScript('https://unpkg.com/three@0.161.0/build/three.min.js').then(() => window.THREE).catch(() => null);

  Promise.all([local.catch(() => null), cdn.catch(() => null)]).then((results) => {
    if (window.THREE) {
      initThreeParticles().catch(() => { /* fallback handled below */ });
    } else {
      // fallback: Canvas2D particle globe
      // Keep existing canvas implementation (initParticleSphere code)
      // Reuse previous function body from earlier Canvas2D implementation

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

          // normalized direction (unit) for pulsation
          const nx = x / rVar;
          const ny = y / rVar;
          const nz = z / rVar;

          // color by latitude & index
          const hue = (i / particleCount) * 360; // full hue sweep

          particles.push({ x, y, z, nx, ny, nz, baseR: rVar, hue, size: rand(0.6, 1.6) });
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
          // pulsation per-particle: base radius modulated by sin waves
          const pulseAmp = 0.06; // overall amplitude
          const pulse = 1 + Math.sin(t * 2.0 + (p.hue * Math.PI / 180) * 0.5) * pulseAmp + Math.sin(t * 0.36 + p.hue * 0.01) * 0.01;
          const px = p.nx * p.baseR * pulse;
          const py = p.ny * p.baseR * pulse;
          const pz = p.nz * p.baseR * pulse;
          const pp = { x: px, y: py, z: pz };
          return { p, proj: project(pp, rotY, rotX, fov, perspective) };
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
  });
}

document.addEventListener('DOMContentLoaded', initGraphics);
