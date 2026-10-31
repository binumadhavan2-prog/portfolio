// Glyph background: a WebGL grid of random characters that only shows where light falls.
// Vanilla port of the animate-ui GlyphBackground behaviour.
(function () {
  const canvas = document.getElementById('glyphs');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
  if (!gl) { canvas.remove(); return; }

  const FONT_SIZE = 12;                    // px
  const CELL_W = Math.ceil(FONT_SIZE * 0.62);
  const CELL_H = Math.round(FONT_SIZE * 1.25);
  // Printable ASCII; the field shows real source code laid out in editor-like panes
  const CHARS = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
  const PANE = 64, GUTTER = 6;             // characters per pane, blank columns between panes
  const CODE = String.raw`import { supabase } from "./supabase";

export async function loadGallery(collection) {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("slug, label, image_path, span")
    .eq("collection", collection)
    .eq("published", true)
    .order("position");
  if (error) return FALLBACK[collection];
  return data;
}

create policy "admins can write"
  on public.gallery_items for all
  using (exists (select 1 from public.admins a
                 where a.user_id = auth.uid()));

def file_fingerprint(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def scan(path, signatures):
    digest = file_fingerprint(path)
    if digest in signatures:
        quarantine(path, reason="Matches known malware")

const hits = await db
  .select({ id: chunks.id, text: chunks.text })
  .from(chunks)
  .orderBy(cosineDistance(chunks.embedding, query))
  .limit(6);

function monthlyEmi(principal, ratePerYear, months) {
  const r = ratePerYear / 12 / 100;
  return (principal * r * (1 + r) ** months) /
         ((1 + r) ** months - 1);
}

$ git commit -m "feat: price calculator"
$ git push origin main
$ vercel --prod
`.split('\n');
  const MAX_TRAIL = 24, MAX_WAVES = 8;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interactive = !reduceMotion;

  // ---------- shaders ----------
  const vs = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

  const fs = `
    precision highp float;
    uniform sampler2D u_atlas, u_cells;
    uniform vec2 u_res;          // canvas size, device px
    uniform float u_dpr, u_time, u_wake, u_nchars;
    uniform vec2 u_cell;         // cell size, css px
    uniform vec2 u_grid;         // cols, rows
    uniform vec3 u_glow, u_shape;
    uniform vec3 u_trail[${MAX_TRAIL}];   // x, y, age (s)
    uniform vec4 u_waves[${MAX_WAVES}];   // x, y, age (s), strength
    uniform float u_seeds[${MAX_WAVES}];

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_dpr;   // css px, top-left origin
      vec2 cell = floor(p / u_cell);
      vec2 local = fract(p / u_cell);
      vec2 c = (cell + 0.5) * u_cell;                                     // light is sampled per cell

      // glyph mask
      vec4 data = texture2D(u_cells, (cell + 0.5) / u_grid);
      float idx = floor(data.r * 255.0 + 0.5);
      float glyph = texture2D(u_atlas, vec2((idx + local.x) / u_nchars, local.y)).a;

      // drifting glows (~30px/s towards bottom-left), reshaping over time
      vec2 drift = vec2(-21.2, 21.2) * u_time;
      vec2 q = (c - drift) / 170.0;
      float n = fbm(q + 0.35 * vec2(fbm(q * 0.6 + u_time * 0.04), fbm(q * 0.6 - u_time * 0.03 + 7.0)));
      float glow = smoothstep(0.5 - 0.08 * u_wake, 0.8, n) * (0.45 + 0.5 * u_wake);

      // cursor trail
      for (int i = 0; i < ${MAX_TRAIL}; i++) {
        vec3 t = u_trail[i];
        if (t.z < 0.0 || t.z > 1.0) continue;
        vec2 d = c - t.xy;
        float f = 1.0 - t.z;
        glow += exp(-dot(d, d) / 3600.0) * f * f * 0.9;
      }

      // click waves
      float shape = 0.0;
      for (int i = 0; i < ${MAX_WAVES}; i++) {
        vec4 w = u_waves[i];
        if (w.z < 0.0 || w.z > 4.0) continue;
        vec2 d = c - w.xy;
        float dist = length(d);
        float th = atan(d.y, d.x);
        float s = u_seeds[i];
        float r = 420.0 * (1.0 - exp(-1.54 * w.z));                     // ~140px @0.3s, ~330px @1s
        float wob = 1.0 + 0.11 * sin(2.0 * th + s + w.z * 1.3)
                        + 0.07 * sin(3.0 * th - s * 1.7 - w.z * 0.9)
                        + 0.05 * sin(5.0 * th + s * 2.3);
        float re = r * wob;
        float inside = re - dist;
        float band = smoothstep(-1.5, 0.5, inside) * exp(-max(inside, 0.0) / 46.0);
        float fade = 1.0 - w.z / 4.0;
        shape += band * fade * fade * w.w;
      }

      float total = clamp(glow + shape, 0.0, 1.0);
      vec3 col = (u_glow * glow + u_shape * shape) / max(glow + shape, 1e-4);
      float a = glyph * total;
      gl_FragColor = vec4(col * a, a);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function makeTex(unit) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  // All GL objects die with the context, so this runs again after a context restore.
  let U = {}, atlasTex = null, cellTex = null;
  function setupGL() {
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    U = {};
    ['u_atlas', 'u_cells', 'u_res', 'u_dpr', 'u_time', 'u_wake', 'u_nchars', 'u_cell', 'u_grid',
     'u_glow', 'u_shape', 'u_trail', 'u_waves', 'u_seeds'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

    atlasTex = makeTex(0);
    cellTex = makeTex(1);
    gl.uniform1i(U.u_atlas, 0);
    gl.uniform1i(U.u_cells, 1);
    gl.uniform1f(U.u_nchars, CHARS.length);
    gl.uniform2f(U.u_cell, CELL_W, CELL_H);
  }
  setupGL();

  // ---------- sizing, atlas, cell data ----------
  let dpr = 1, cols = 0, rows = 0, cells = null;

  function buildAtlas() {
    const cw = CELL_W * dpr, ch = CELL_H * dpr;
    const c = document.createElement('canvas');
    c.width = cw * CHARS.length;
    c.height = ch;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = `500 ${FONT_SIZE * dpr}px "JetBrains Mono", ui-monospace, Consolas, monospace`;
    for (let i = 0; i < CHARS.length; i++) x.fillText(CHARS[i], i * cw + cw / 2, ch / 2 + dpr);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  }

  function uploadCells() {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, cellTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, cells);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    cols = Math.ceil(w / CELL_W);
    rows = Math.ceil(h / CELL_H);
    cells = new Uint8Array(cols * rows * 4);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pane = (c / PANE) | 0;
        const line = CODE[(r + pane * 23) % CODE.length];
        const col = c % PANE;
        const ch = (col < PANE - GUTTER && line[col]) || ' ';
        cells[(r * cols + c) * 4] = Math.max(0, ch.charCodeAt(0) - 32);
      }
    }
    buildAtlas();
    uploadCells();
    gl.uniform2f(U.u_res, canvas.width, canvas.height);
    gl.uniform1f(U.u_dpr, dpr);
    gl.uniform2f(U.u_grid, cols, rows);
    if (reduceMotion) render(0);
  }

  // ---------- colors (follow the theme accent) ----------
  function hexToRgb(hex) {
    const m = hex.trim().replace('#', '');
    const v = parseInt(m.length === 3 ? m.replace(/./g, '$&$&') : m, 16);
    return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
  }
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const accent = hexToRgb(cs.getPropertyValue('--green') || '#e62e3d');
    gl.uniform3fv(U.u_glow, accent);
    gl.uniform3fv(U.u_shape, accent);
    if (reduceMotion) render(0);
  }
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------- interaction ----------
  const trail = [];                  // {x, y, age}
  const waves = [];                  // {x, y, age, s, seed}
  let wake = 0, lastMove = -1, lastX = -1e4, lastY = -1e4;

  if (interactive) {
    addEventListener('pointermove', e => {
      lastMove = performance.now();
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (dx * dx + dy * dy > 64) {
        trail.unshift({ x: e.clientX, y: e.clientY, age: 0 });
        if (trail.length > MAX_TRAIL) trail.pop();
        lastX = e.clientX; lastY = e.clientY;
      }
    }, { passive: true });
    addEventListener('pointerdown', e => {
      const seed = Math.random() * 6.28;
      waves.unshift({ x: e.clientX, y: e.clientY, age: 0, s: 1, seed });
      waves.unshift({ x: e.clientX, y: e.clientY, age: -0.3, s: 0.55, seed: seed + 1.3 });
      waves.length = Math.min(waves.length, MAX_WAVES);
    }, { passive: true });
  }

  const trailArr = new Float32Array(MAX_TRAIL * 3);
  const waveArr = new Float32Array(MAX_WAVES * 4);
  const seedArr = new Float32Array(MAX_WAVES);

  function render(time) {
    trailArr.fill(-1);
    trail.forEach((t, i) => { trailArr[i * 3] = t.x; trailArr[i * 3 + 1] = t.y; trailArr[i * 3 + 2] = t.age; });
    waveArr.fill(-1);
    waves.forEach((w, i) => {
      waveArr[i * 4] = w.x; waveArr[i * 4 + 1] = w.y; waveArr[i * 4 + 2] = w.age; waveArr[i * 4 + 3] = w.s;
      seedArr[i] = w.seed;
    });
    gl.uniform3fv(U.u_trail, trailArr);
    gl.uniform4fv(U.u_waves, waveArr);
    gl.uniform1fv(U.u_seeds, seedArr);
    gl.uniform1f(U.u_time, time);
    gl.uniform1f(U.u_wake, wake);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ---------- loop (pauses when hidden / off screen) ----------
  let raf = 0, prev = 0, clock = 0, onScreen = true;
  function frame(now) {
    const dt = Math.max(0, Math.min((now - prev) / 1000, 0.05));
    prev = now;
    clock += dt;
    const moving = now - lastMove < 120;
    wake += ((moving ? 1 : 0) - wake) * (1 - Math.exp(-dt * (moving ? 8 : 3.5)));
    for (let i = trail.length - 1; i >= 0; i--) if ((trail[i].age += dt) > 1) trail.splice(i, 1);
    for (let i = waves.length - 1; i >= 0; i--) if ((waves[i].age += dt) > 4) waves.splice(i, 1);
    render(clock);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf || reduceMotion || document.hidden || !onScreen || gl.isContextLost()) return;
    prev = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); }).observe(canvas);
  addEventListener('resize', () => gl.isContextLost() || resize());

  // GPU reset, sleep or driver update: hide the canvas (a lost canvas can composite as a blank
  // sheet over the page) and rebuild everything when the browser hands the context back.
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    stop();
    canvas.style.visibility = 'hidden';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    setupGL();
    resize();
    readColors();
    canvas.style.visibility = '';
    start();
  });

  resize();
  readColors();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { buildAtlas(); if (reduceMotion) render(0); });
  start();
})();
