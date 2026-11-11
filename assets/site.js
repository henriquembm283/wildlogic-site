/* Wildlogic home page.
   Every move, with its reason:
   - Code field (WebGL, hero and studio mark): a slow field drawn as a grid of code characters ("logic").
     Around the pointer, and as you scroll the hero, it loosens into flowing contour lines ("wild").
     The logo is cut out of the same field, so the name is made of the idea. It is the one loud thing.
   - Globe: turns with the scroll (linked 1:1, lightly smoothed so wheel steps do not stutter), by drag, or by
     picking a name. It is the menu of the work, so it must answer the hand directly.
   - Project background: 500ms crossfade + 1.4s ease-out settle from 106%. Says "you arrived somewhere new".
   - Project text: out in 160ms, in over 420ms with the name rising .22em. Exits are faster than entrances.
   - Active pin ring: slow pulse, marks the project facing you.
   - Section entrances: 24px rise + fade, 700ms ease-out, 80ms stagger, once. Gives reading order.
   All of it is skipped or made instant under prefers-reduced-motion. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const M = window.Motion;
  root.classList.add("js");
  if (!reduce && M) root.classList.add("motion");
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const progressOf = (el) => { // 0 when its top meets the viewport top, 1 when its bottom meets the viewport bottom
    const r = el.getBoundingClientRect(); const span = r.height - innerHeight;
    return span > 0 ? clamp01(-r.top / span) : 0;
  };

  /* ---------------- code field ---------------- */
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uA,uM;uniform vec2 uRes,uLens;uniform float uCell,uReveal,uR,uN,uT;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float field(vec2 p,float t){vec2 q=p*1.7;
 q+=vec2(n(q*1.3+t*.05),n(q*1.3-t*.04+7.))*1.25;
 return n(q+vec2(t*.03,0.))*.65+n(q*2.1-t*.02)*.35;}
float glyph(vec2 px,float cell,out float v){vec2 cs=vec2(cell,cell*1.4);vec2 id=floor(px/cs),f=fract(px/cs);
 v=field((id+.5)*cs/uRes.y,uT);
 float gi=floor(clamp(v*1.2-.08+.05*sin(uT*1.7+id.x*12.9898+id.y*78.233),0.,.999)*uN);
 return texture2D(uA,vec2((gi+f.x)/uN,f.y)).r;}
void main(){
 vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
 vec3 ink=vec3(.11),paper=vec3(.957,.953,.937);
 float mk=texture2D(uM,px/uRes).r;
 float v1,v2;
 float g1=glyph(px,uCell,v1);
 float g2=glyph(px,uCell*.52,v2);
 float cv=field(px/uRes.y,uT)*10.;
#ifdef GL_OES_standard_derivatives
 float w=fwidth(cv)*1.3;
#else
 float w=.03;
#endif
 float line=1.-smoothstep(w*.5,w*1.5,abs(fract(cv)-.5));
 float m=max(smoothstep(uR,uR*.45,distance(px,uLens*uRes)),uReveal);
 vec3 outL=mix(ink,paper*(.16+.5*v1),g1);
 vec3 outW=mix(ink,paper*.5,line);
 float grain=.94+.06*h(px+floor(uT*12.));
 vec3 inL=paper*grain*(1.-g2*(.3+.62*v2));
 vec3 inW=mix(paper*grain,ink,line*.9);
 gl_FragColor=vec4(mix(mix(outL,outW,m),mix(inL,inW,m),mk),1.);
}`;
  const GLYPHS = " .·:;-=+*/<>{}[]01LW#@";

  // Draws the field on `canvas`, with the given inline <svg> shapes cut out of it as the bright mass.
  function codeField(canvas, host, shapes, opt) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: true });
    if (!gl) return null;
    gl.getExtension("OES_standard_derivatives");
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
    const U = {}; ["uA", "uM", "uRes", "uLens", "uCell", "uReveal", "uR", "uN", "uT"].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
    const tex = (unit, src) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); return t; };
    const at = tex(1, atlas);
    const mask = document.createElement("canvas"); mask.width = mask.height = 2;
    const mt = tex(0, mask); const mc = mask.getContext("2d");
    gl.uniform1i(U.uM, 0); gl.uniform1i(U.uA, 1); gl.uniform1f(U.uN, N);
    if (document.fonts && document.fonts.load) document.fonts.load('700 46px "Bricolage Grotesque"').then(() => { paint(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, at); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas); });

    const state = { lens: { x: opt.lx, y: opt.ly, tx: opt.lx, ty: opt.ly, last: -1e9 }, prog: 0, stale: true };
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
      const L = state.lens;
      if (!reduce && now - L.last > 2500) { L.tx = opt.lx + opt.wx * Math.sin(now * 0.00031); L.ty = opt.ly + opt.wy * Math.sin(now * 0.00043 + 1.1); }
      L.x += (L.tx - L.x) * 0.1; L.y += (L.ty - L.y) * 0.1;
      const small = host.clientWidth < 700;
      gl.uniform2f(U.uRes, w, hgt); gl.uniform2f(U.uLens, L.x, L.y);
      gl.uniform1f(U.uCell, (small ? opt.cell * 0.72 : opt.cell) * d);
      gl.uniform1f(U.uReveal, clamp01((state.prog - 0.35) / 0.5));
      gl.uniform1f(U.uR, Math.min(w, hgt) * opt.r);
      gl.uniform1f(U.uT, reduce ? 3 : now / 1000);
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
    const fieldH = codeField(stage.querySelector("canvas"), stage, [...stage.querySelectorAll(".word svg")], innerWidth < 700 ? { cell: 15, r: 0.36, lx: 0.55, ly: 0.52, wx: 0.3, wy: 0.12, dpr: 1.5 } : { cell: 15, r: 0.27, lx: 0.66, ly: 0.42, wx: 0.24, wy: 0.2, dpr: 1.5 });
    const onScroll = () => {
      const prog = progressOf(hero);
      if (fieldH) { fieldH.prog = prog; if (reduce) fieldH.render(0); }
      turn.style.opacity = clamp01((prog - 0.5) / 0.2); say.style.opacity = 1 - clamp01((prog - 0.3) / 0.2);
      say.style.visibility = prog > 0.5 ? "hidden" : "visible";
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------------- studio mark ---------------- */
  const mark = document.querySelector(".studio-mark");
  if (mark) codeField(mark.querySelector("canvas"), mark, [mark.querySelector("svg")], { cell: 11, r: 0.42, lx: 0.5, ly: 0.5, wx: 0.3, wy: 0.25, dpr: 1.5 });

  /* ---------------- orbit: the globe of projects ---------------- */
  const orbit = document.querySelector(".orbit");
  if (orbit) {
    const stage = orbit.querySelector(".orbit-stage");
    const canvas = orbit.querySelector(".globe"), ctx = canvas.getContext("2d");
    const items = [...orbit.querySelectorAll(".orbit-list li")];
    const bgs = [...orbit.querySelectorAll(".bg")], btns = [...orbit.querySelectorAll(".orbit-nav button")];
    const video = orbit.querySelector("video");
    const n = items.length, STEP = (Math.PI * 2) / n, RAD = Math.PI / 180;
    const LAT = [16, -14, 24, -20, 6].map((d) => d * RAD);
    const vec = (lat, lon) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
    const pins = items.map((li, i) => ({ k: li.dataset.k, name: li.dataset.name, lat: LAT[i % LAT.length], lon: i * STEP, v: vec(LAT[i % LAT.length], i * STEP), sx: 0, sy: 0, z: -1 }));
    // points on a sphere; the ones near a pin are that project's "land"
    const COUNT = innerWidth < 700 ? 2400 : 4600, pts = new Float32Array(COUNT * 3), land = new Int8Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (2 * (i + 0.5)) / COUNT, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
      const x = Math.cos(th) * r, z = Math.sin(th) * r; pts.set([x, y, z], i * 3); land[i] = -1;
      const wob = 0.11 * Math.sin(x * 9 + y * 4) * Math.sin(y * 11 - z * 5) + 0.07 * Math.sin(z * 17 + x * 6);
      for (let j = 0; j < n; j++) { const p = pins[j].v; if (Math.acos(Math.min(1, x * p[0] + y * p[1] + z * p[2])) < 0.47 + wob) { land[i] = j; break; } }
    }
    let active = -1, rotA = 0, rotB = LAT[0], tgtA = 0, tgtB = LAT[0], vis = false, raf = 0, W = 0, H = 0, D = 1, cx = 0, cy = 0, R = 1;
    const paperRGB = "244,243,239";

    const setActive = (i) => {
      if (i === active) return; active = i; orbit.dataset.on = pins[i].k;
      items.forEach((el, j) => el.classList.toggle("on", j === i));
      bgs.forEach((el) => el.classList.toggle("on", el.dataset.k === pins[i].k));
      btns.forEach((b, j) => (j === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
      playVideo();
    };
    const playVideo = () => { if (!video) return; vis && active === 0 && !reduce && !document.hidden ? video.play().catch(() => {}) : video.pause(); };
    const span = () => orbit.offsetHeight - innerHeight;
    const go = (i) => scrollTo({ top: orbit.getBoundingClientRect().top + scrollY + (span() * i) / (n - 1), behavior: reduce ? "auto" : "smooth" });
    const fromScroll = () => {
      const u = progressOf(orbit) * (n - 1), i0 = Math.floor(u), i1 = Math.min(n - 1, i0 + 1), f = u - i0;
      tgtA = -u * STEP; tgtB = pins[i0].lat + (pins[i1].lat - pins[i0].lat) * f;
      setActive(Math.round(u));
      if (reduce) { rotA = tgtA; rotB = tgtB; draw(0); }
    };
    const size = () => {
      D = Math.min(1.5, devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      const small = W < 900;
      cx = small ? W * 0.5 : W * 0.68; cy = small ? H * 0.34 : H * 0.5; R = small ? Math.min(W * 0.4, H * 0.21) : Math.min(W * 0.25, H * 0.36);
    };
    const turnPt = (x, y, z, ca, sa, cb, sb) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca; return [x1, y * cb - z1 * sb, y * sb + z1 * cb]; };
    function draw(now) {
      const wob = reduce ? 0 : 1, a = rotA + wob * 0.05 * Math.sin(now * 0.0004), b = rotB + wob * 0.035 * Math.sin(now * 0.0006 + 1);
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, H);
      const small = W < 900, ink = "rgb(28,28,28)", paper = `rgb(${paperRGB})`;
      // orbit ring with one satellite: back half first, so the globe hides it
      const ringT = -0.32, rx = R * 1.34, ry = R * 0.3, sat = (reduce ? 0.6 : now * 0.00012) % (Math.PI * 2);
      const ring = (from, to) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, ringT, from, to); ctx.stroke(); };
      const satDot = () => { const ex = Math.cos(sat) * rx, ey = Math.sin(sat) * ry; ctx.fillStyle = paper; ctx.fillRect(cx + ex * Math.cos(ringT) - ey * Math.sin(ringT) - 3, cy + ex * Math.sin(ringT) + ey * Math.cos(ringT) - 3, 6, 6); };
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${paperRGB},.28)`; ring(Math.PI, Math.PI * 2); if (sat > Math.PI) satDot();
      ctx.fillStyle = "rgba(18,18,18,.72)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(${paperRGB},.4)`; ctx.stroke();
      // rim ticks, like an instrument dial
      ctx.strokeStyle = `rgba(${paperRGB},.45)`; ctx.beginPath();
      for (let t = 0; t < 72; t++) { const an = (t / 72) * Math.PI * 2, r0 = R + 6, r1 = R + (t % 6 ? 11 : 18); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); }
      ctx.stroke();
      // latitude rings
      ctx.strokeStyle = `rgba(${paperRGB},.14)`;
      for (const la of [-50, -25, 0, 25, 50]) { ctx.beginPath(); let pen = false;
        for (let s = 0; s <= 72; s++) { const v = vec(la * RAD, (s / 72) * Math.PI * 2), p = turnPt(v[0], v[1], v[2], ca, sa, cb, sb);
          if (p[2] < 0) { pen = false; continue; } const X = cx + p[0] * R, Y = cy - p[1] * R; pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; }
        ctx.stroke(); }
      // points, lit from the upper left so the ball has volume
      ctx.fillStyle = paper;
      for (let i = 0; i < COUNT; i++) {
        const p = turnPt(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], ca, sa, cb, sb), l = land[i];
        if (p[2] < 0) { if (l >= 0) { ctx.globalAlpha = 0.07; ctx.fillRect(cx + p[0] * R - 0.6, cy - p[1] * R - 0.6, 1.2, 1.2); } continue; }
        const lit = Math.max(0, -0.45 * p[0] + 0.5 * p[1] + 0.74 * p[2]), on = l === active;
        ctx.globalAlpha = (l < 0 ? 0.3 : on ? 1 : 0.62) * (0.25 + 0.75 * lit);
        const s = l < 0 ? 1.3 : on ? 2.9 : 2.1;
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
        if (on) { const t = reduce ? 0.5 : (now % 2400) / 2400; ctx.globalAlpha = 1 - t; ctx.beginPath(); ctx.arc(x0, y0, 6 + t * 24, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x0, y0, 4.5, 0, 7); ctx.fill(); }
        const fs = on ? (small ? 15 : 17) : 13, padX = on ? 12 : 9, hgt = on ? 34 : small ? 14 : 26;
        ctx.font = `${on ? 600 : 500} ${fs}px "Bricolage Grotesque", sans-serif`;
        const label = small && !on ? "" : pin.name, tw = label ? ctx.measureText(label).width + padX * 2 : 14;
        let tx = on ? x1 - tw / 2 : p[0] < 0 ? x1 - tw : x1; tx = Math.max(8, Math.min(W - tw - 8, tx));
        const ty = y1 - hgt / 2 - (on ? hgt / 2 : 0);
        pin.sx = tx + tw / 2; pin.sy = ty + hgt / 2; pin.hw = tw / 2 + 10;
        ctx.fillStyle = on ? paper : ink; ctx.fillRect(tx, ty, tw, hgt);
        if (!on) { ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, hgt - 1); }
        ctx.fillStyle = on ? ink : paper; ctx.fillText(label, tx + padX, ty + hgt / 2 + 1);
      }
      ctx.globalAlpha = 1;
    }
    const loop = (now) => { rotA += (tgtA - rotA) * 0.14; rotB += (tgtB - rotB) * 0.14; draw(now); raf = requestAnimationFrame(loop); };
    const sync = () => { const on = vis && !document.hidden; if (on && !raf && !reduce) raf = requestAnimationFrame(loop); if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } playVideo(); if (on && reduce) draw(0); };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; sync(); }).observe(orbit);
    document.addEventListener("visibilitychange", sync);
    addEventListener("scroll", fromScroll, { passive: true });
    addEventListener("resize", () => { size(); fromScroll(); if (reduce) draw(0); });
    btns.forEach((b, i) => b.addEventListener("click", () => go(i)));

    // drag turns the globe by moving the page, so scroll and drag can never disagree
    let drag = null;
    const onGlobe = (e) => { const r = canvas.getBoundingClientRect(); return Math.hypot(e.clientX - r.left - cx, e.clientY - r.top - cy) < R * 1.2; };
    const pinAt = (e) => { const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1; pins.forEach((p, i) => { if (p.z >= 0.15 && Math.abs(x - p.sx) < (p.hw || 30) && Math.abs(y - p.sy) < 26) best = i; }); return best; };
    canvas.addEventListener("pointerdown", (e) => { if (!onGlobe(e) && pinAt(e) < 0) return; drag = { x: e.clientX, moved: 0 }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) { canvas.style.cursor = pinAt(e) >= 0 ? "pointer" : onGlobe(e) ? "grab" : ""; return; }
      const dx = e.clientX - drag.x; drag.x = e.clientX; drag.moved += Math.abs(dx);
      scrollBy({ top: (-dx * (span() / (n - 1))) / (R * STEP), behavior: "instant" });
    });
    const end = (e) => { if (!drag) return; const moved = drag.moved; drag = null; canvas.style.cursor = "";
      if (moved < 6) { const i = pinAt(e); if (i >= 0) go(i); } else go(Math.round(progressOf(orbit) * (n - 1))); };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);

    size(); fromScroll(); draw(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(performance.now()));
  }

  /* ---------------- entrances ---------------- */
  if (M && !reduce) {
    document.querySelectorAll("[data-ins]").forEach((sec) => {
      const parts = sec.querySelectorAll("[data-in]");
      M.inView(sec, () => { M.animate(parts, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08) }); }, { amount: 0.2 });
    });
    const intro = document.querySelectorAll(".hero-say > *, .nav a");
    M.animate(intro, { opacity: [0, 1] }, { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.12, { startDelay: 0.15 }) });
  } else {
    document.querySelectorAll("[data-in]").forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; });
  }
})();
