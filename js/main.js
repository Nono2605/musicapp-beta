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
    s.onload = () => { console.log('Loaded script:', src); resolve(); };
    s.onerror = () => { console.error('Failed to load script:', src); reject(new Error('Failed to load ' + src)); };
    document.head.appendChild(s);
  });
}

function initThreeParticles() {
  console.log('initThreeParticles: attempting to initialize three.js flow-sphere');
  const container = document.getElementById('three-root');
  if (!container) {
    console.error('initThreeParticles: no #three-root container found');
    return Promise.reject(new Error('No container'));
  }

  return new Promise((resolve) => {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x04070d,
        transparent: true,
        opacity: 0.78,
      })
    );
    scene.add(sphere);

    const vortices = [
      { position: new THREE.Vector3(0.15, 0.82, 0.54).normalize(), strength: 1.8, sharpness: 3.2 },
      { position: new THREE.Vector3(-0.78, 0.22, 0.58).normalize(), strength: -1.3, sharpness: 3.8 },
      { position: new THREE.Vector3(0.72, -0.35, 0.58).normalize(), strength: 1.5, sharpness: 4.0 },
      { position: new THREE.Vector3(-0.35, -0.72, -0.58).normalize(), strength: -1.8, sharpness: 3.0 },
      { position: new THREE.Vector3(0.65, 0.48, -0.58).normalize(), strength: 0.9, sharpness: 4.5 },
    ];

    const temp = new THREE.Vector3();
    function field(p) {
      const velocity = new THREE.Vector3();
      for (const vortex of vortices) {
        const c = vortex.position;
        const dot = p.dot(c);
        const influence = Math.exp(vortex.sharpness * (dot - 1));
        temp.crossVectors(p, c);
        velocity.addScaledVector(temp, vortex.strength * influence);
      }
      return velocity.normalize();
    }

    function integrate(start, direction, steps = 260) {
      const points = [];
      let p = start.clone();
      for (let i = 0; i < steps; i++) {
        points.push(p.clone());
        const v = field(p);
        p.addScaledVector(v, 0.018 * direction);
        p.normalize().multiplyScalar(1.02);
      }
      return points;
    }

    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7b7cff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePositions = [];
    const lineCount = Math.min(Math.max(260, Math.floor((container.clientWidth * container.clientHeight) / 5)), 600);

    for (let i = 0; i < lineCount; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const start = new THREE.Vector3(s * Math.cos(theta), u, s * Math.sin(theta));

      const forward = integrate(start, 1, 180);
      const backward = integrate(start, -1, 100);
      backward.reverse();

      const points = [...backward, ...forward];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      linesGroup.add(new THREE.Line(geometry, lineMaterial));

      for (let j = 15; j < points.length; j += 18) {
        if (Math.random() < 0.34) {
          const p = points[j];
          particlePositions.push(p.x, p.y, p.z);
        }
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.017,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const haloMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { color: { value: new THREE.Color(0x4f46ff) } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float fresnel = pow(1.0 - abs(vNormal.z), 4.0);
          gl_FragColor = vec4(color, fresnel * 0.28);
        }
      `,
    });

    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 96), haloMaterial);
    scene.add(halo);

    // audio-demo / heartbeat variables (no external audio connected)
    let smoothedBass = 0;
    let smoothedVolume = 0;

    function updateAudioDemo(now) {
      const t = now / 1000;
      // demo oscillation: slow breathing + occasional stronger pulse
      smoothedVolume = 0.5 + Math.sin(t * 1.6) * 0.5;
      const targetBass = Math.pow(smoothedVolume, 3);
      smoothedBass += (targetBass - smoothedBass) * 0.12;
    }

    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();

      // update demo audio state
      updateAudioDemo(performance.now());
      const heartbeat = smoothedBass; // 0..1

      // pulse influenced by heartbeat
      const pulse = 1 + heartbeat * 0.12 + 0.01 * Math.sin(t * 0.6);

      // apply transform and rotation
      linesGroup.rotation.y = t * 0.025;
      particles.rotation.y = t * 0.025;
      halo.rotation.y = t * 0.025;

      linesGroup.scale.setScalar(pulse);
      particles.scale.setScalar(pulse);
      halo.scale.setScalar(pulse * 1.02);

      // dynamic properties
      lineMaterial.opacity = 0.20 + heartbeat * 0.30;
      cores.material.size = 0.028 + heartbeat * 0.055;
      cores.material.opacity = 0.65 + heartbeat * 0.35;

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
  const cdn = loadScript('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js').then(() => window.THREE).catch(() => null);

  Promise.all([local.catch(() => null), cdn.catch(() => null)]).then((results) => {
    if (window.THREE) {
      initThreeParticles().catch(() => { /* fallback handled below */ });
    } else {
      // fallback: Canvas2D particle globe
      console.warn('three.js not available — starting Canvas2D fallback');
      // Keep existing canvas implementation (initParticleSphere code)
      // Reuse previous function body from earlier Canvas2D implementation

      const container = document.getElementById('three-root');
      if (!container) {
        console.error('Canvas2D fallback: no #three-root container found');
        return;
      }

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
