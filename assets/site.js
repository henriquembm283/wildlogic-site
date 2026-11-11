/* Wildlogic.
   Every move, with its reason:
   - Code field (WebGL, hero and studio card): a slow field of code characters. They flicker, a few spark in the
     accent colour, and they light up around the pointer. The logo is cut out of the same field and assembles
     from characters on load (1.8s, ease-out): the name is made of what the studio makes.
   - Hero scroll: characters drop out one by one over the whole scroll, then the logo breaks into characters and
     goes. The scroll value is smoothed each frame so a mouse wheel does not make it jump.
   - Logo sweep: a band of denser texture crosses the letters every 8s. Keeps the still logo alive.
   - Globe (a small dial docked beside the project list): turns freely by drag (with inertia), arrow keys, arrow buttons, sideways wheel, or by picking a name.
     It settles on the nearest project so one always faces you. It is the menu, so it answers the hand directly.
   - Project background: 500ms crossfade + 1.4s ease-out settle from 106%. Says "you arrived somewhere new".
   - Project text: out in 160ms, in over 420ms with the name rising .22em. Exits are faster than entrances.
   - Studio statement: words darken as you scroll through them (linked). Sets a reading pace.
   - Studio numbers: count up once over 1.4s when they enter. Draws the eye to the facts.
   - Stack ribbon: slow constant drift, pauses on hover. Shows breadth without a list.
   - Section entrances: 24px rise + fade, 700ms ease-out, 80ms stagger, once. Gives reading order.
   All of it is skipped or made instant under prefers-reduced-motion. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const M = window.Motion;
  root.classList.add("js");
  if (!reduce && M) root.classList.add("motion");
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const progressOf = (el) => { // 0 when its top meets the viewport top, 1 when its bottom meets the viewport bottom
    const r = el.getBoundingClientRect(); const span = r.height - innerHeight;
    return span > 0 ? clamp01(-r.top / span) : 0;
  };

  /* ---------------- code field ---------------- */
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uA,uM;uniform vec2 uRes,uLens;uniform float uCell,uR,uN,uT,uIn,uDis,uDisA,uDisB,uDim,uTex;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float field(vec2 p,float t){vec2 q=p*1.7;
 q+=vec2(n(q*1.3+t*.05),n(q*1.3-t*.04+7.))*1.25;
 return n(q+vec2(t*.03,0.))*.65+n(q*2.1-t*.02)*.35;}
float glyph(vec2 px,float cell,out float v,out vec2 id){vec2 cs=vec2(cell,cell*1.4);id=floor(px/cs);vec2 f=fract(px/cs);
 v=field((id+.5)*cs/uRes.y,uT);
 float gi=floor(clamp(v*1.2-.08+.05*sin(uT*1.7+id.x*12.9898+id.y*78.233),0.,.999)*uN);
 return texture2D(uA,vec2((gi+f.x)/uN,f.y)).r;}
void main(){
 vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
 vec3 ink=vec3(.11),paper=vec3(.957,.953,.937),acc=vec3(.80,1.,.24);
 float mk=texture2D(uM,px/uRes).r;
 float v1,v2;vec2 i1,i2;
 float g1=glyph(px,uCell,v1,i1);
 float g2=glyph(px,uCell*.52,v2,i2);
 float h1=h(i1),h2=h(i2+17.);
 vec2 c1=(i1+.5)*vec2(uCell,uCell*1.4);
 float m=smoothstep(uR,uR*.15,distance(c1,uLens*uRes));
 float a1=smoothstep(0.,.15,uIn*1.15-h1)*smoothstep(0.,.15,h1*.85+.15-uDis);
 float sp=step(1.-(.009+.06*m)*uDim,h(i1+floor(uT*1.4+h1*9.)));
 vec3 lit=min(paper*(.16+.5*v1)*(1.+2.4*m)*uDim,paper);
 vec3 outC=mix(ink,mix(lit,acc,sp),g1*a1);
 float in2=clamp(uIn*1.7-.7,0.,1.);
 float pres=smoothstep(0.,.15,uIn*1.15-h2)*smoothstep(0.,.15,h2*.85+.15-uDisB);
 float sol=smoothstep(0.,.15,in2*1.15-h2)*smoothstep(0.,.15,h2*.85+.15-uDisA);
 float sw=smoothstep(.1,0.,abs((px.x+px.y*.5)/uRes.x-(fract(uT/8.)*2.6-.7)));
 float k=min((.3+.62*v2)*(1.+.7*sw+.5*m),1.)*uTex;
 float grain=.94+.06*h(px+floor(uT*12.));
 vec3 solid=paper*grain*(1.-g2*k);
 vec3 loose=mix(ink,paper,g2);
 vec3 inC=mix(ink,mix(loose,solid,sol),pres);
 gl_FragColor=vec4(mix(outC,inC,mk),1.);
}`;
  const GLYPHS = " .·:;-=+*/<>{}[]01LW#@";

  // Draws the field on `canvas`, with the given inline <svg> shapes cut out of it as the bright mass.
  function codeField(canvas, host, shapes, opt) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: true });
    if (!gl) return null;
    const N = GLYPHS.length, GW = 40, GH = 56;
    const atlas = document.createElement("canvas"); atlas.width = GW * N; atlas.height = GH;
    const a = atlas.getContext("2d");
    const paint = () => {
      a.fillStyle = "#000"; a.fillRect(0, 0, atlas.width, GH);
      a.fillStyle = "#fff"; a.font = '700 46px "Bricolage Grotesque", sans-serif'; a.textAlign = "center"; a.textBaseline = "middle";
      for (let i = 0; i < N; i++) a.fillText(GLYPHS[i], i * GW + GW / 2, GH / 2 + 2);
    };
    paint();
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ["uA", "uM", "uRes", "uLens", "uCell", "uR", "uN", "uT", "uIn", "uDis", "uDisA", "uDisB", "uDim", "uTex"].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
    const tex = (unit, src) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); return t; };
    const at = tex(1, atlas);
    const mask = document.createElement("canvas"); mask.width = mask.height = 2;
    const mt = tex(0, mask); const mc = mask.getContext("2d");
    gl.uniform1i(U.uM, 0); gl.uniform1i(U.uA, 1); gl.uniform1f(U.uN, N);
    if (document.fonts && document.fonts.load) document.fonts.load('700 46px "Bricolage Grotesque"').then(() => { paint(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, at); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas); });

    const state = { lens: { x: opt.lx, y: opt.ly, tx: opt.lx, ty: opt.ly, last: -1e9 }, prog: 0, progT: 0, stale: true, t0: 0 };
    const buildMask = (d) => {
      mask.width = canvas.width; mask.height = canvas.height;
      mc.fillStyle = "#000"; mc.fillRect(0, 0, mask.width, mask.height); mc.fillStyle = "#fff";
      const hr = host.getBoundingClientRect();
      for (const s of shapes) {
        const r = s.getBoundingClientRect(), vb = s.viewBox.baseVal;
        mc.save(); mc.translate((r.left - hr.left) * d, (r.top - hr.top) * d); mc.scale(r.width * d / vb.width, r.height * d / vb.height); mc.translate(-vb.x, -vb.y);
        s.querySelectorAll("path").forEach((p) => mc.fill(new Path2D(p.getAttribute("d")), p.getAttribute("fill-rule") || "nonzero"));
        mc.restore();
      }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mt); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    };
    state.render = (now) => {
      const d = Math.min(opt.dpr || 1.5, devicePixelRatio || 1);
      const w = Math.round(host.clientWidth * d), hgt = Math.round(host.clientHeight * d);
      if (!w || !hgt) return;
      if (canvas.width !== w || canvas.height !== hgt) { canvas.width = w; canvas.height = hgt; gl.viewport(0, 0, w, hgt); state.stale = true; }
      if (state.stale) { buildMask(d); state.stale = false; }
      if (!state.t0) state.t0 = now || 1;
      const L = state.lens;
      if (!reduce && now - L.last > 2500) { L.tx = opt.lx + opt.wx * Math.sin(now * 0.00031); L.ty = opt.ly + opt.wy * Math.sin(now * 0.00043 + 1.1); }
      L.x += (L.tx - L.x) * 0.1; L.y += (L.ty - L.y) * 0.1;
      state.prog = reduce ? state.progT : state.prog + (state.progT - state.prog) * 0.09;
      const small = host.clientWidth < 700, p = state.prog, tin = reduce ? 1 : clamp01((now - state.t0) / 1800);
      gl.uniform2f(U.uRes, w, hgt); gl.uniform2f(U.uLens, L.x, L.y);
      gl.uniform1f(U.uCell, (small ? opt.cell * 0.72 : opt.cell) * d);
      gl.uniform1f(U.uR, Math.min(w, hgt) * opt.r);
      gl.uniform1f(U.uT, reduce ? 3 : now / 1000);
      gl.uniform1f(U.uIn, 1 - Math.pow(1 - tin, 3)); gl.uniform1f(U.uDim, opt.dim || 1); gl.uniform1f(U.uTex, opt.tex == null ? 1 : opt.tex);
      gl.uniform1f(U.uDis, smooth(0.08, 0.9, p)); gl.uniform1f(U.uDisA, smooth(0.3, 0.82, p)); gl.uniform1f(U.uDisB, smooth(0.5, 1, p));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      host.classList.add("gl");
    };
    // run only while on screen
    let raf = 0, vis = false;
    const loop = (now) => { state.render(now); raf = requestAnimationFrame(loop); };
    const sync = () => { const on = vis && !document.hidden; if (on && !raf && !reduce) raf = requestAnimationFrame(loop); if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } if (on && reduce) state.render(0); };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; sync(); }).observe(host);
    document.addEventListener("visibilitychange", sync);
    addEventListener("resize", () => { state.stale = true; if (reduce && vis) state.render(0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { state.stale = true; });
    addEventListener("pointermove", (e) => {
      if (!vis) return; const r = host.getBoundingClientRect();
      if (e.clientY < r.top - 80 || e.clientY > r.bottom + 80) return;
      const L = state.lens; L.tx = (e.clientX - r.left) / r.width; L.ty = (e.clientY - r.top) / r.height; L.last = performance.now();
      if (reduce) { L.x = L.tx; L.y = L.ty; state.render(0); }
    }, { passive: true });
    return state;
  }

  /* ---------------- hero ---------------- */
  const hero = document.querySelector(".hero");
  if (hero) {
    const stage = hero.querySelector(".hero-stage");
    const say = stage.querySelector(".hero-say"), turn = stage.querySelector(".hero-turn");
    const fieldH = codeField(stage.querySelector("canvas"), stage, [...stage.querySelectorAll(".word svg")],
      innerWidth < 700 ? { cell: 15, r: 0.42, lx: 0.55, ly: 0.52, wx: 0.3, wy: 0.12 } : { cell: 15, r: 0.34, lx: 0.66, ly: 0.42, wx: 0.24, wy: 0.2 });
    const onScroll = () => {
      const prog = progressOf(hero);
      if (fieldH) { fieldH.progT = prog; if (reduce) fieldH.render(0); }
      else stage.querySelector(".words").style.opacity = 1 - smooth(0.5, 0.95, prog);
      turn.style.opacity = smooth(0.52, 0.68, prog) * (1 - smooth(0.86, 0.98, prog));
      say.style.opacity = 1 - smooth(0.08, 0.28, prog);
      say.style.visibility = prog > 0.28 ? "hidden" : "visible";
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------------- studio card ---------------- */
  const mark = document.querySelector(".company");
  if (mark) codeField(mark.querySelector("canvas"), mark, [mark.querySelector("svg")], { cell: 14, r: 0.4, lx: 0.3, ly: 0.5, wx: 0.22, wy: 0.25, dim: 0.42, tex: 0.22 } /* quiet here: the facts are the point, the logo stays solid */);

  /* ---------------- orbit: a globe you turn to pick from ---------------- */
  document.querySelectorAll(".orbit").forEach((orbit) => {
    const stage = orbit.querySelector(".orbit-stage");
    const canvas = orbit.querySelector(".globe"), ctx = canvas.getContext("2d");
    const items = [...orbit.querySelectorAll(".orbit-list li")];
    const bgs = [...orbit.querySelectorAll(".bg")], btns = [...orbit.querySelectorAll(".orbit-nav button")];
    const video = orbit.querySelector(".bg video");
    const n = items.length, TAU = Math.PI * 2, STEP = TAU / n, RAD = Math.PI / 180;
    const LAT = [16, -14, 24, -20, 6, -8].map((d) => d * RAD);
    const vec = (lat, lon) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
    const pins = items.map((li, i) => ({ k: li.dataset.k, name: li.dataset.name, lat: LAT[i % LAT.length], lon: i * STEP, v: vec(LAT[i % LAT.length], i * STEP), link: li.querySelector("a.btn"), sx: 0, sy: 0, z: -1 }));
    // points on a sphere; the ones near a pin are that entry's "land"
    const COUNT = 1700, pts = new Float32Array(COUNT * 3), land = new Int8Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (2 * (i + 0.5)) / COUNT, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
      const x = Math.cos(th) * r, z = Math.sin(th) * r; pts.set([x, y, z], i * 3); land[i] = -1;
      const wob = 0.11 * Math.sin(x * 9 + y * 4) * Math.sin(y * 11 - z * 5) + 0.07 * Math.sin(z * 17 + x * 6);
      for (let j = 0; j < n; j++) { const p = pins[j].v; if (Math.acos(Math.min(1, x * p[0] + y * p[1] + z * p[2])) < 0.47 + wob) { land[i] = j; break; } }
    }
    // rot = how far the globe is turned; it eases to `goal` unless the hand holds it or it is still spinning
    let active = -1, rot = 0, goal = 0, vel = 0, tilt = LAT[0], tiltAdd = 0, drag = null, vis = false, raf = 0, W = 0, H = 0, D = 1, cx = 0, cy = 0, R = 1;
    const paperRGB = "244,243,239", ACC = "#ccff3d";
    const nearest = () => ((Math.round(-rot / STEP) % n) + n) % n;
    const goalFor = (i) => { const base = -i * STEP; return base + Math.round((rot - base) / TAU) * TAU; };
    const setActive = (i) => {
      if (i === active) return; active = i; orbit.dataset.on = pins[i].k;
      items.forEach((el, j) => el.classList.toggle("on", j === i));
      bgs.forEach((el) => el.classList.toggle("on", el.dataset.k === pins[i].k));
      btns.forEach((b, j) => (j === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
      playVideo();
    };
    const playVideo = () => { if (!video) return; vis && bgs.indexOf(video.parentElement) === active && !reduce && !document.hidden ? video.play().catch(() => {}) : video.pause(); };
    const go = (i) => { i = ((i % n) + n) % n; vel = 0; goal = goalFor(i); if (reduce) { rot = goal; setActive(i); draw(0); } };
    const size = () => {
      D = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.36; // a small dial, docked in a corner by the stylesheet
    };
    const turnPt = (x, y, z, ca, sa, cb, sb) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca; return [x1, y * cb - z1 * sb, y * sb + z1 * cb]; };
    function draw(now) {
      const wob = reduce ? 0 : 1, a = rot + wob * 0.04 * Math.sin(now * 0.0004), b = tilt + tiltAdd + wob * 0.03 * Math.sin(now * 0.0006 + 1);
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, H);
      const sc = Math.max(0.55, R / 150), ink = "rgb(28,28,28)", paper = `rgb(${paperRGB})`;
      // orbit ring with one satellite: back half first, so the globe hides it
      const ringT = -0.32, rx = R * 1.34, ry = R * 0.3, sat = (reduce ? 0.6 : now * 0.00012) % TAU;
      const ring = (from, to) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, ringT, from, to); ctx.stroke(); };
      const satDot = () => { const ex = Math.cos(sat) * rx, ey = Math.sin(sat) * ry; ctx.fillStyle = ACC; ctx.fillRect(cx + ex * Math.cos(ringT) - ey * Math.sin(ringT) - 3, cy + ex * Math.sin(ringT) + ey * Math.cos(ringT) - 3, 6, 6); };
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${paperRGB},.28)`; ring(Math.PI, TAU); if (sat > Math.PI) satDot();
      ctx.fillStyle = "rgba(18,18,18,.72)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(${paperRGB},.4)`; ctx.stroke();
      // rim ticks turn with the globe, like a dial
      ctx.strokeStyle = `rgba(${paperRGB},.45)`; ctx.beginPath();
      for (let t = 0; t < 72; t++) { const an = (t / 72) * TAU - rot, r0 = R + 3, r1 = R + (t % 6 ? 6 : 10); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); }
      ctx.stroke();
      // latitude rings
      ctx.strokeStyle = `rgba(${paperRGB},.14)`;
      for (const la of [-50, -25, 0, 25, 50]) { ctx.beginPath(); let pen = false;
        for (let s = 0; s <= 72; s++) { const v = vec(la * RAD, (s / 72) * TAU), p = turnPt(v[0], v[1], v[2], ca, sa, cb, sb);
          if (p[2] < 0) { pen = false; continue; } const X = cx + p[0] * R, Y = cy - p[1] * R; pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; }
        ctx.stroke(); }
      // points, lit from the upper left so the ball has volume
      for (let i = 0; i < COUNT; i++) {
        const p = turnPt(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], ca, sa, cb, sb), l = land[i];
        if (p[2] < 0) { if (l >= 0) { ctx.fillStyle = paper; ctx.globalAlpha = 0.07; ctx.fillRect(cx + p[0] * R - 0.6, cy - p[1] * R - 0.6, 1.2, 1.2); } continue; }
        const lit = Math.max(0, -0.45 * p[0] + 0.5 * p[1] + 0.74 * p[2]), on = l === active;
        ctx.fillStyle = on ? ACC : paper;
        ctx.globalAlpha = (l < 0 ? 0.3 : on ? 1 : 0.62) * (0.25 + 0.75 * lit);
        const s = (l < 0 ? 1.3 : on ? 2.9 : 2.1) * sc;
        ctx.fillRect(cx + p[0] * R - s / 2, cy - p[1] * R - s / 2, s, s);
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(${paperRGB},.28)`; ctx.lineWidth = 1; ring(0, Math.PI); if (sat <= Math.PI) satDot();
      // pins and name tags
      ctx.textBaseline = "middle"; ctx.textAlign = "left";
      const order = pins.map((_, i) => i).sort((i, j) => (i === active) - (j === active));
      for (const i of order) {
        const pin = pins[i], p = turnPt(pin.v[0], pin.v[1], pin.v[2], ca, sa, cb, sb); pin.z = p[2];
        if (p[2] < 0.15) continue;
        const on = i === active, x0 = cx + p[0] * R, y0 = cy - p[1] * R, k = on ? 1 : 1.16, x1 = cx + p[0] * R * k, y1 = cy - p[1] * R * k - (on ? R * 0.3 : 0);
        ctx.globalAlpha = on ? 1 : 0.45 + 0.5 * p[2]; ctx.strokeStyle = ctx.fillStyle = paper; ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        if (on) { const t = reduce ? 0.5 : (now % 2400) / 2400; ctx.strokeStyle = ACC; ctx.globalAlpha = 1 - t; ctx.beginPath(); ctx.arc(x0, y0, 4 + t * 13, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x0, y0, 3, 0, 7); ctx.fill(); ctx.strokeStyle = paper; }
        const q = on ? 5 : 3.5; // pin head; the names live in the list beside the dial
        pin.sx = x1; pin.sy = y1; pin.hw = 16;
        ctx.fillStyle = on ? ACC : paper; ctx.fillRect(x1 - q, y1 - q, q * 2, q * 2);
      }
      ctx.globalAlpha = 1;
    }
    const loop = (now) => {
      if (!drag) {
        if (Math.abs(vel) > 0.0015) { rot += vel; vel *= 0.94; goal = goalFor(nearest()); } // still spinning from a throw
        else { vel = 0; rot += (goal - rot) * 0.1; }
        tiltAdd *= 0.9;
      }
      setActive(nearest());
      tilt += (pins[active].lat - tilt) * 0.08;
      draw(now); raf = requestAnimationFrame(loop);
    };
    const sync = () => { const on = vis && !document.hidden; if (on && !raf && !reduce) raf = requestAnimationFrame(loop); if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } playVideo(); if (on && reduce) draw(0); };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; sync(); }, { threshold: 0.05 }).observe(orbit);
    document.addEventListener("visibilitychange", sync);
    addEventListener("resize", () => { size(); if (reduce) draw(0); });
    btns.forEach((b, i) => b.addEventListener("click", () => go(i)));
    orbit.querySelectorAll("[data-turn]").forEach((b) => b.addEventListener("click", () => go(nearest() + (b.dataset.turn === "next" ? 1 : -1))));
    addEventListener("keydown", (e) => { // arrow keys turn it while it fills most of the screen
      if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || /INPUT|TEXTAREA|SELECT|VIDEO/.test(document.activeElement.tagName)) return;
      const r = orbit.getBoundingClientRect(); if (r.top > innerHeight * 0.4 || r.bottom < innerHeight * 0.6) return;
      e.preventDefault(); go(nearest() + (e.key === "ArrowRight" ? 1 : -1));
    });
    canvas.addEventListener("wheel", (e) => { // a sideways swipe on a trackpad turns it; up and down still scrolls the page
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault();
      rot -= e.deltaX / (R * 2.2); vel = 0; goal = goalFor(nearest()); if (reduce) { rot = goal; setActive(nearest()); draw(0); }
    }, { passive: false });

    const onGlobe = (e) => { const r = canvas.getBoundingClientRect(); return Math.hypot(e.clientX - r.left - cx, e.clientY - r.top - cy) < R * 1.2; };
    const pinAt = (e) => { const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1; pins.forEach((p, i) => { if (p.z >= 0.15 && Math.abs(x - p.sx) < 16 && Math.abs(y - p.sy) < 16) best = i; }); return best; };
    canvas.addEventListener("pointerdown", (e) => { if (!onGlobe(e) && pinAt(e) < 0) return; drag = { x: e.clientX, y: e.clientY, moved: 0, last: 0 }; vel = 0; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) { canvas.style.cursor = pinAt(e) >= 0 ? "pointer" : onGlobe(e) ? "grab" : ""; return; }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      rot += dx / R; drag.last = dx / R; tiltAdd = Math.max(-0.5, Math.min(0.5, tiltAdd + dy / R));
      if (reduce) { setActive(nearest()); draw(0); }
    });
    const end = (e) => { if (!drag) return; const d = drag; drag = null; canvas.style.cursor = "";
      if (d.moved < 6) { const i = pinAt(e); if (i >= 0) { if (i === active && pins[i].link) pins[i].link.click(); else go(i); } return; }
      vel = reduce ? 0 : Math.max(-0.12, Math.min(0.12, d.last)); goal = goalFor(nearest());
      if (reduce) { rot = goal; setActive(nearest()); draw(0); } };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);

    size(); setActive(0); draw(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(performance.now()));
  });

  /* ---------------- studio ---------------- */
  const say2 = document.querySelector(".statement");
  if (say2) {
    const words = say2.textContent.trim().split(/\s+/);
    say2.textContent = "";
    const spans = words.map((w, i) => { const sp = document.createElement("span"); sp.textContent = w; say2.append(sp, i < words.length - 1 ? " " : ""); return sp; });
    const lightUp = () => { const r = say2.getBoundingClientRect(); const p = reduce ? 1 : clamp01((innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.4));
      const k = Math.round(p * spans.length); spans.forEach((s, i) => s.classList.toggle("lit", i < k)); };
    addEventListener("scroll", lightUp, { passive: true }); addEventListener("resize", lightUp); lightUp();
  }
  document.querySelectorAll("[data-count]").forEach((el) => {
    const to = +el.dataset.count; if (reduce || !M || !to) return;
    el.textContent = "0";
    M.inView(el, () => { M.animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = Math.round(v)) }); }, { amount: 0.6 });
  });

  /* ---------------- entrances ---------------- */
  if (M && !reduce) {
    document.querySelectorAll("[data-ins]").forEach((sec) => {
      const parts = sec.querySelectorAll("[data-in]");
      M.inView(sec, () => { M.animate(parts, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08) }); }, { amount: 0.2 });
    });
    const intro = document.querySelectorAll(".hero-say > *, .nav:not(.dark) a");
    if (intro.length) M.animate(intro, { opacity: [0, 1] }, { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08, { startDelay: 0.1 }) });
  } else {
    document.querySelectorAll("[data-in]").forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; });
  }
})();
