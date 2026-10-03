import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* =====================================================================
   ---------- EDIT ME ---------- (everything you normally change is here)
   ===================================================================== */
const CONFIG = { red: 0xff1f3d, bg: 0x030304, coreZ: -24 };

/* AUDIO CONFIG — paths & volumes (0 to 1). Missing files are skipped silently. */
const SOUND_DEFAULT_ON = true;   /* set to false to start with sound OFF (a saved visitor choice still wins) */
const AUDIO_DEBUG = true;        /* true = helpful "[DXF AUDIO]" messages in the browser console */
const AUDIO_CONFIG = {
  music: { src: "./assets/audio/ambient.mp3", volume: 0.22, loop: true },
  effects: {
    enter:      { src: "./assets/audio/enter.mp3",      volume: 0.35 },
    transition: { src: "./assets/audio/transition.mp3", volume: 0.28 },
    hover:      { src: "./assets/audio/hover.mp3",      volume: 0.18 },
    click:      { src: "./assets/audio/click.mp3",      volume: 0.30 }
  }
};

/* SELECTED WORK — add one object per project; cards are generated automatically.
   Required: title, category, description, url
   Optional: status (default "ONLINE"), featured (default false), image (path/URL), model (reserved), year
   Empty array = the section shows "NO PROJECTS YET".
   Copy this format:
   { title: "Project name", category: "WEB EXPERIENCE", description: "Short description.",
     url: "https://...", status: "ONLINE", featured: false, image: null, model: null, year: "2026" } */
const selectedWork = [
];

/* MY WEBSITES — add one object per website; cards are generated automatically.
   Required: name, description, url · Optional: status (default "Live"), button (default "VISIT WEBSITE") */
const websites = [
  {
    name: 'GitHub',
    description: 'My code, repositories and other projects.',
    url: 'https://github.com/z335173749-gif',
    status: 'Live',
    button: 'VIEW GITHUB'
  }
];

/* ---------- helpers & quality ---------- */
const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const rnd = THREE.MathUtils.randFloat;
/* only http(s) or relative URLs are allowed (blocks javascript: etc.) */
function safeUrl(u) {
  try { const x = new URL(String(u), location.href); return /^https?:$/.test(x.protocol) ? x.href : '#'; } catch (e) { return '#'; }
}
const isExternal = href => { try { return new URL(href).origin !== location.origin; } catch (e) { return false; } };
function mk(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

const coarse = matchMedia('(pointer:coarse)').matches || innerWidth < 820;
const lowEnd = coarse || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const Q = {
  particles: lowEnd ? 1400 : 4200,
  floaters: lowEnd ? 34 : 70,
  shards: lowEnd ? 8 : 18,
  pr: Math.min(devicePixelRatio || 1, lowEnd ? 1.5 : 2)
};
let pr = Q.pr;

/* ---------- state ---------- */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });
const intro = { v: 0 };
const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
let target = scrollY / maxScroll(), prog = target;

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.create({ trigger: '#scroll', start: 'top top', end: 'bottom bottom', onUpdate: s => { target = s.progress; } });
  gsap.to(intro, { v: 1, duration: 3.2, ease: 'power2.inOut' });
  gsap.from('.brand', { opacity: 0, duration: 2, delay: 1 });
  gsap.from('.hero .ln', { yPercent: 35, opacity: 0, duration: 1.8, stagger: .28, ease: 'power3.out', delay: .7 });
  gsap.from('.panel.first .tag', { opacity: 0, duration: 1.6, delay: 2.1 });
  gsap.from('.cue', { opacity: 0, duration: 1.4, delay: 3 });
} else {
  intro.v = 1;
  addEventListener('scroll', () => { target = scrollY / maxScroll(); }, { passive: true });
}

/* ---------- HTML panels moving through depth ---------- */
const panels = [...document.querySelectorAll('.panel')].map(el => ({
  el, a: +el.dataset.a, b: +el.dataset.b,
  first: el.classList.contains('first'), last: el.classList.contains('last'), vis: false
}));
const bar = $('#bar');

function updatePanels(p, mx, my) {
  for (const o of panels) {
    const t = (p - o.a) / (o.b - o.a);
    let op = (o.first ? 1 : ss(0, .22, t)) * (o.last ? 1 : 1 - ss(.78, 1, t));
    if (t < 0 || t > 1) op = 0;
    if (op < .01) { if (o.vis) { o.el.style.visibility = 'hidden'; o.el.classList.remove('live'); o.vis = false; } continue; }
    if (!o.vis) { o.el.style.visibility = 'visible'; o.vis = true; }
    const z = o.last ? (t - 1) * 420 : o.first ? t * 520 : (t - .5) * 520;
    o.el.style.opacity = op.toFixed(3);
    o.el.style.transform = `translate3d(${(-mx * 14).toFixed(1)}px,${(-my * 10).toFixed(1)}px,${z.toFixed(1)}px)`;
    if (o.el.id === 'p-sites') [...sitesEl.children].forEach((c, i) => {
      c.style.setProperty('--px', (-mx * (8 + i * 6)).toFixed(1) + 'px');
      c.style.setProperty('--py', (Math.sin(p * 24 + i * 1.7) * 5 - my * 6).toFixed(1) + 'px');
      c.style.setProperty('--dz', (-i * 30 + Math.sin(p * 18 + i) * 12).toFixed(1) + 'px');
    });
    o.el.classList.toggle('live', op > .6);
  }
  bar.style.transform = `scaleY(${p.toFixed(4)})`;
}

/* ---------- card tilt ---------- */
function tilt(c) {
  c.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
    c.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg');
    c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  });
  c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
}
/* ---------- selected work cards (generated from selectedWork) ---------- */
const workEl = $('#work');
const projects = selectedWork.filter(w => {
  const ok = w && w.title && w.category && w.description && w.url;
  if (!ok) console.warn('[DXF] selectedWork entry skipped (needs title, category, description, url):', w);
  return ok;
});
if (!projects.length) {
  workEl.append(mk('div', 'empty', 'NO PROJECTS YET'));
} else {
  projects.forEach((w, i) => {
    const el = mk('article', 'card' + (w.featured ? ' featured' : ''));
    if (w.image) {
      const img = mk('img', 'thumb'); img.alt = ''; img.loading = 'lazy';
      img.addEventListener('error', () => img.remove()); /* never show a broken image */
      img.src = safeUrl(w.image); el.append(img);
    }
    const meta = mk('div', 'meta');
    meta.append(mk('span', 'n', String(i + 1).padStart(2, '0')), mk('span', 'status', String(w.status || 'ONLINE').toUpperCase()));
    if (w.year) meta.append(mk('span', 'year', String(w.year)));
    const body = mk('div', 'body');
    body.append(mk('small', 'cat', w.category), mk('h3', null, w.title), mk('p', 'desc', w.description));
    const href = safeUrl(w.url), a = mk('a', 'visit', 'VISIT PROJECT'); a.href = href;
    if (isExternal(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    el.append(meta, body, a); workEl.append(el); tilt(el);
  });
}

/* ---------- website directory cards (generated) ---------- */
const sitesEl = $('#sites');
websites.forEach(w => {
  const el = mk('article', 'site'), st = mk('span', 'status', String(w.status || 'Live').toUpperCase());
  const h = mk('h3', null, w.name), p = mk('p', 'desc', w.description);
  const a = mk('a', 'visit', w.button || 'VISIT WEBSITE'); a.href = safeUrl(w.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
  el.append(st, h, p, a); sitesEl.append(el); tilt(el);
});

/* ---------- discord: copy username (no invite link) ---------- */
const dc = $('#copy-discord');
dc?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('ujm8'); } catch { return; }
  dc.textContent = 'COPIED';
  setTimeout(() => { dc.textContent = 'DISCORD · ujm8'; }, 1600);
});

/* ---------- 3D world ---------- */
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: !lowEnd, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
} catch (e) {
  document.documentElement.classList.add('no-gl');
}
const world = renderer ? buildWorld() : null;

function buildWorld() {
  const Z = CONFIG.coreZ;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.bg);
  scene.fog = new THREE.FogExp2(CONFIG.bg, .022);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = .18;

  const camera = new THREE.PerspectiveCamera(50, 1, .1, 220);

  /* lighting */
  scene.add(new THREE.AmbientLight(0x1a1a24, .5));
  const red = new THREE.PointLight(CONFIG.red, 90, 60, 2); red.position.set(0, 0, Z); scene.add(red);
  const key = new THREE.SpotLight(CONFIG.red, 260, 70, .5, .8, 2); key.position.set(6, 14, Z + 8); key.target.position.set(0, 0, Z); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7f9cff, 1.1); rim.position.set(-8, 5, Z - 14); rim.target.position.set(0, 0, Z); scene.add(rim, rim.target);

  /* materials */
  const metal = new THREE.MeshStandardMaterial({ color: 0x17171a, metalness: 1, roughness: .28, flatShading: true });
  const metalLight = new THREE.MeshStandardMaterial({ color: 0x4a4a52, metalness: 1, roughness: .35 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x200006, emissive: CONFIG.red, emissiveIntensity: 2.6, roughness: .4 });

  /* central artifact */
  const core = new THREE.Group(); core.position.set(0, 0, Z); scene.add(core);
  const ico1 = new THREE.IcosahedronGeometry(1.7, 1), ico2 = new THREE.IcosahedronGeometry(.75, 1), ico3 = new THREE.IcosahedronGeometry(2.35, 1);
  const glass = new THREE.Mesh(ico3, new THREE.MeshPhysicalMaterial({ color: 0x888899, metalness: 0, roughness: .05, transparent: true, opacity: .1, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(ico3), new THREE.LineBasicMaterial({ color: CONFIG.red, transparent: true, opacity: .22 }));
  const shell = new THREE.Mesh(ico1, metal);
  const heart = new THREE.Mesh(ico2, glow);
  core.add(shell, heart, glass, edges);
  const rings = [[2.9, .05, metalLight], [3.6, .035, glow], [4.4, .025, metalLight]].map(([r, t, m], i) => {
    const g = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 160), m);
    g.rotation.set(i + .6, i * .7, 0); core.add(g); return g;
  });
  const plates = new THREE.Group(), plateGeo = new THREE.BoxGeometry(.16, 1.3, .5);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, m = new THREE.Mesh(plateGeo, metal);
    m.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); m.rotation.y = -a; plates.add(m);
  }
  core.add(plates);

  /* abstract satellites (each its own shape, depth, spin) */
  const sats = [
    new THREE.Mesh(new THREE.TorusKnotGeometry(.55, .15, 100, 12), metalLight),
    new THREE.Mesh(new THREE.DodecahedronGeometry(.85), metal),
    new THREE.Mesh(new THREE.TorusGeometry(.8, .09, 12, 48), glow),
    new THREE.Mesh(new THREE.ConeGeometry(.55, 1.8, 4), metalLight),
    new THREE.Mesh(new THREE.OctahedronGeometry(.8), metal)
  ];
  sats.forEach((m, i) => { m.userData = { a: i / sats.length * Math.PI * 2, r: 9 + (i % 3) * 1.4, y: (i % 2 ? 1 : -1) * (4 + i * .5), s: .05 + i * .012 }; scene.add(m); });

  /* parallax group: instanced floaters + glowing shards */
  const fieldG = new THREE.Group(); scene.add(fieldG);
  const dummy = new THREE.Object3D();
  function field(n, geo, mat, rMin, rMax, sMin, sMax) {
    const mesh = new THREE.InstancedMesh(geo, mat, n), d = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, r = rnd(rMin, rMax);
      d.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * .6, z: rnd(24, -70), s: rnd(sMin, sMax), rx: rnd(-.5, .5), ry: rnd(-.5, .5), ph: Math.random() * 6.28 });
    }
    fieldG.add(mesh); return { mesh, d };
  }
  const fields = [
    field(Q.floaters, new THREE.OctahedronGeometry(1), metal, 9, 18, .4, 1.5),
    field(Q.shards, new THREE.TetrahedronGeometry(1), new THREE.MeshBasicMaterial({ color: CONFIG.red }), 8, 20, .1, .3)
  ];

  /* floor */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: .9, roughness: .38 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -14, -30); scene.add(floor);

  /* particles */
  const N = Q.particles, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sz = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos.set([rnd(-35, 35), rnd(-12, 16), rnd(30, -75)], i * 3);
    sz[i] = Math.pow(Math.random(), 3) * 3.2 + .6;
    const hot = Math.random() < .12, b = rnd(.35, 1);
    col.set(hot ? [1, .12, .2] : [.75 * b, .78 * b, .9 * b], i * 3);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  pg.setAttribute('size', new THREE.BufferAttribute(sz, 1));
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: pr } },
    vertexShader: `attribute float size;attribute vec3 aCol;uniform float uTime,uPR;varying vec3 vC;varying float vA;
      void main(){vec3 p=position;p.x+=sin(uTime*.12+position.y*.7)*.6;p.y+=sin(uTime*.1+position.x*.5+position.z)*.5;
      vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;gl_PointSize=clamp(size*uPR*90./d,1.,24.*uPR);
      vA=smoothstep(.5,4.,d)*(1.-smoothstep(45.,80.,d));vC=aCol;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 vC;varying float vA;
      void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r);a*=a;gl_FragColor=vec4(vC,a*vA*.9);}`
  });
  const points = new THREE.Points(pg, pm); points.frustumCulled = false; scene.add(points);

  /* directory hall: a second area off to the side of the core */
  const HALL = new THREE.Vector3(-30, 0, -62);
  const hall = new THREE.Group(); hall.position.copy(HALL); scene.add(hall);
  const slabGeo = new THREE.BoxGeometry(1.2, 16, 1.2), lineGeo = new THREE.BoxGeometry(.06, 16, .06);
  [[-8, 2], [8, -2], [-14, -10], [14, -12]].forEach(([x, z]) => {
    const m = new THREE.Mesh(slabGeo, metal); m.position.set(x, 1, z);
    const l = new THREE.Mesh(lineGeo, glow); l.position.set(x + .62, 1, z + .62);
    hall.add(m, l);
  });
  const gate = new THREE.Mesh(new THREE.TorusGeometry(6, .05, 12, 128), glow); gate.position.set(0, 0, -6); hall.add(gate);
  const hallLight = new THREE.PointLight(CONFIG.red, 20, 40, 2); hallLight.position.set(0, 2, -4); hall.add(hallLight);

  /* camera path: in, around the core, into the hall, then back out.
     Points are evenly spaced in scroll progress (11 points = every 0.1). */
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, .2, 16), new THREE.Vector3(0, .4, 6), new THREE.Vector3(5, 1.5, -6),
    new THREE.Vector3(7, 0, -20), new THREE.Vector3(0, .5, -36), new THREE.Vector3(-10, .5, -48),
    new THREE.Vector3(-19, .6, -52), new THREE.Vector3(-24, .5, -54), new THREE.Vector3(-26, .6, -55),
    new THREE.Vector3(-8, .5, -30), new THREE.Vector3(0, .6, -2)
  ], false, 'centripetal');
  const look = new THREE.Vector3(), tmp = new THREE.Vector3();

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 1 ? 68 : 50; camera.updateProjectionMatrix();
    pm.uniforms.uPR.value = pr;
  }

  function update(p, t, dt, mx, my, fade) {
    const d = ss(.8, 1, p);
    pm.uniforms.uTime.value = t;

    /* central object reacts to scroll */
    core.rotation.y = t * .08 + p * Math.PI * 2.5;
    core.rotation.x = Math.sin(p * Math.PI) * .5;
    core.position.y = Math.sin(p * Math.PI * 2) * 1.2;
    core.position.x = Math.sin(p * 6) * .8;
    core.scale.setScalar(1 + Math.sin(t * .8) * .015);
    rings.forEach((r, i) => { r.rotation.z = t * (.1 + i * .07) * (i % 2 ? -1 : 1); });
    plates.rotation.y = -t * .15 - p * 4;
    heart.rotation.y = t * .4;
    glow.emissiveIntensity = (2.2 + Math.sin(t * 1.5) * .6 + p * 1.2) * (1 - d * .5);
    red.position.set(core.position.x + mx * 3, core.position.y, Z);

    /* satellites */
    sats.forEach(m => {
      const u = m.userData, a = u.a + t * u.s + p * 1.5;
      m.position.set(core.position.x + Math.cos(a) * u.r, u.y + Math.sin(t * .4 + u.a) * .5, Z + Math.sin(a) * u.r);
      m.rotation.set(t * .3 + u.a + p * 2, t * .2 + p * 3, 0);
    });

    /* instanced field */
    fields.forEach(f => {
      f.d.forEach((o, i) => {
        dummy.position.set(o.x + Math.sin(t * .2 + o.ph) * .4, o.y + Math.cos(t * .25 + o.ph) * .5, o.z);
        dummy.rotation.set(t * o.rx + p * 3, t * o.ry + p * 4, 0);
        dummy.scale.setScalar(o.s); dummy.updateMatrix(); f.mesh.setMatrixAt(i, dummy.matrix);
      });
      f.mesh.instanceMatrix.needsUpdate = true;
    });
    fieldG.rotation.y = mx * .03; fieldG.rotation.x = my * .02;

    /* camera */
    camera.position.copy(path.getPoint(clamp(p, 0, 1)));
    camera.position.x += mx * .6; camera.position.y -= my * .4;
    const w = ss(.46, .58, p) * (1 - ss(.8, .9, p));
    look.set(core.position.x + mx * .8, core.position.y - my * .5, Z).lerp(HALL, w);
    hallLight.intensity = 20 + 60 * w; gate.rotation.z = t * .1;
    camera.lookAt(look);
    camera.rotateZ(Math.sin(p * Math.PI * 4) * .03);

    /* mood: darker, thicker toward the end */
    red.intensity = 90 * (1 - d * .5) * (1 + Math.sin(t * 1.7) * .08);
    key.intensity = 260 * (1 - d * .6); key.position.x = 6 + mx * 4;
    scene.fog.density = .022 + d * .012;
    renderer.toneMappingExposure = 1.1 * fade * (1 - d * .35);
    renderer.render(scene, camera);
  }

  function dispose() {
    scene.traverse(o => { o.geometry?.dispose(); [].concat(o.material || []).forEach(m => m.dispose()); });
    envTex.dispose(); pmrem.dispose(); renderer.dispose();
  }
  return { resize, update, dispose };
}

/* ---------- audio ---------- */
const SECTIONS = [0, .14, .30, .44, .60, .84]; /* hero, identity, world, work, websites, contact */
const GAP = { enter: 0, transition: 1500, hover: 500, click: 120 };
const dlogSeen = new Set();
function dlog(msg, once = true) {
  if (!AUDIO_DEBUG || (once && dlogSeen.has(msg))) return;
  dlogSeen.add(msg); console.info('[DXF AUDIO] ' + msg);
}
let soundOn = SOUND_DEFAULT_ON;
try { const v = localStorage.getItem('dxf-sound'); if (v === 'on') soundOn = true; else if (v === 'off') soundOn = false; } catch (e) { /* storage blocked */ }
const aEls = {}, aLast = {};
let interacted = false, started = false, begun = false, duckUntil = 0, duck = 1, vol = 0, sec = -1;
const soundBtn = $('#sound');
if (!soundOn) dlog('Sound OFF');

function aGet(key, cfg, loop) {
  if (aEls[key]) return aEls[key];
  const a = new Audio();
  a.preload = 'auto'; a.loop = !!loop; a.volume = clamp(cfg.volume, 0, 1); a.dead = false;
  a.addEventListener('error', () => {
    if (a.dead) return;
    a.dead = true; dlog('Audio file missing or failed to load: ' + cfg.src);
    if (key === 'music' && interacted && !started) { started = true; begin(); } /* no music file: still run the enter sound */
  });
  a.src = cfg.src; aEls[key] = a; return a;
}
function sfx(name) {
  if (!soundOn || !interacted) return;
  const cfg = AUDIO_CONFIG.effects[name]; if (!cfg) return;
  const a = aGet(name, cfg); if (a.dead) return;
  const now = performance.now(); if (now - (aLast[name] || 0) < GAP[name]) return;
  aLast[name] = now;
  if (name === 'transition') duckUntil = now + 1100;
  try {
    a.currentTime = 0; a.volume = clamp(cfg.volume, 0, 1);
    a.play().catch(e => { if (e && e.name === 'NotAllowedError') dlog('Sound effect "' + name + '" blocked by the browser'); });
  } catch (e) { /* ignore */ }
}
function begin() { if (!begun) { begun = true; sfx('enter'); } }
function tryStart() {
  if (!soundOn || started || !interacted) return;
  const m = aGet('music', AUDIO_CONFIG.music, AUDIO_CONFIG.music.loop);
  if (m.dead) { started = true; begin(); return; }
  m.play().then(() => { started = true; dlog('Music started'); begin(); })
    .catch(e => {
      if (m.dead || m.error) { started = true; begin(); }
      else if (e && e.name === 'NotAllowedError') dlog('Autoplay blocked — waiting for interaction');
      else if (!e || e.name !== 'AbortError') dlog('Music could not start (' + (e && e.name) + ')');
    });
}
function onGesture() {
  interacted = true;
  Object.keys(AUDIO_CONFIG.effects).forEach(k => aGet(k, AUDIO_CONFIG.effects[k])); /* load effects once, after first interaction */
  tryStart();
}
['pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => addEventListener(ev, onGesture, { passive: true }));

function paintSound() {
  soundBtn.classList.toggle('off', !soundOn);
  soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundBtn.querySelector('span').textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
}
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn; interacted = true;
  try { localStorage.setItem('dxf-sound', soundOn ? 'on' : 'off'); } catch (e) { /* ignore */ }
  paintSound(); dlog(soundOn ? 'Sound ON' : 'Sound OFF', false);
  if (soundOn) {
    const m = aEls.music;
    if (started && m && !m.dead) { if (m.paused) m.play().catch(() => {}); } else tryStart();
    sfx('click');
  } else {
    Object.keys(aEls).forEach(k => { if (k !== 'music') aEls[k].pause(); });
  }
});
paintSound();
document.addEventListener('click', e => { const t = e.target.closest('a,button'); if (t && t.id !== 'sound') sfx('click'); });
document.addEventListener('pointerover', e => {
  if (e.pointerType === 'touch') return;
  const t = e.target.closest('.card,.site,.visit,.btn,.sound');
  if (t && !t.contains(e.relatedTarget)) sfx('hover');
});
document.addEventListener('visibilitychange', () => {
  const m = aEls.music; if (!m || !started || m.dead) return;
  if (document.hidden) m.pause(); else if (soundOn) m.play().catch(() => {});
});

/* gentle level changes: swell entering the world, dip on transitions, quiet finale */
function audioTick(p, dt) {
  const m = aEls.music;
  if (!m || !started || m.dead) return;
  duck += ((performance.now() < duckUntil ? .6 : 1) - duck) * (1 - Math.exp(-dt * 5));
  const tgt = soundOn ? AUDIO_CONFIG.music.volume * (.88 + .22 * ss(.08, .2, p)) * (1 - .45 * ss(.88, 1, p)) * duck : 0;
  vol += (tgt - vol) * (1 - Math.exp(-dt * (soundOn ? 2 : 6)));
  m.volume = clamp(vol, 0, 1);
  if (!soundOn && vol < .002 && !m.paused) m.pause();
}
/* one sound per section crossing (hysteresis + cooldown stop rapid back-and-forth retriggers) */
function audioSection(p) {
  let i = sec < 0 ? 0 : sec;
  while (i < SECTIONS.length - 1 && p > SECTIONS[i + 1] + .006) i++;
  while (i > 0 && p < SECTIONS[i] - .006) i--;
  if (sec >= 0 && i !== sec) sfx('transition');
  sec = i;
}

/* ---------- main loop ---------- */
const clock = new THREE.Clock();
let warm = 0, acc = 0, n = 0;
function frame() {
  requestAnimationFrame(frame);
  const raw = clock.getDelta(), dt = Math.min(raw, .05), t = clock.elapsedTime;
  prog += (target - prog) * (1 - Math.exp(-dt * 3.5));
  const k = 1 - Math.exp(-dt * 3);
  mouse.sx += (mouse.x - mouse.sx) * k; mouse.sy += (mouse.y - mouse.sy) * k;
  updatePanels(prog, mouse.sx, mouse.sy);
  audioTick(prog, dt); audioSection(prog);
  if (!world) return;
  world.update(prog, t, dt, mouse.sx, mouse.sy, intro.v);
  /* auto quality: lower resolution if frames stay slow */
  if (++warm > 60) {
    acc += raw; n++;
    if (n === 90) { if (acc / n > .026 && pr > .8) { pr = Math.max(.75, pr - .35); world.resize(); } acc = n = 0; }
  }
}
if (world) { world.resize(); addEventListener('resize', world.resize); addEventListener('pagehide', world.dispose); }
frame();
