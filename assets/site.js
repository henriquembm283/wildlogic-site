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

  /* ---------------- galaxy: a slow spiral of stars; five of them are links ---------------- */
  const gal = document.querySelector(".galaxy");
  if (gal) {
    const cv = gal.querySelector("canvas"), ctx = cv.getContext("2d"), links = [...gal.querySelectorAll(".stars a")];
    const TAU = Math.PI * 2, small = innerWidth < 700;
    let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const pts = [];
    for (let i = 0, n = small ? 2200 : 4600; i < n; i++) {
      const kind = rnd();
      let r, a;
      if (kind < 0.2) { r = Math.pow(rnd(), 2) * 0.2; a = rnd() * TAU; }                                   // the bright middle
      else if (kind < 0.9) { r = 0.06 + Math.pow(rnd(), 0.85) * 0.98; a = (i % 2) * Math.PI + 2.3 * Math.log(1 + r * 6) + (rnd() + rnd() + rnd() - 1.5) * (0.75 - 0.3 * r); } // two arms
      else { r = Math.pow(rnd(), 0.5) * 1.25; a = rnd() * TAU; }                                          // loose stars around
      pts.push({ r, a, s: rnd(), acc: rnd() < 0.035 });
    }
    const pins = links.map((l) => ({ l, d: l.dataset.d.split(",").map(Number), m: l.dataset.m.split(",").map(Number) }));
    let W = 0, H = 0, dpr = 1, rx = 0, ry = 0, raf = 0, vis = false, born = 0, mx = 0, my = 0, ox = 0, oy = 0;
    const size = () => { W = gal.clientWidth; H = gal.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr;
      const tall = H > W; rx = tall ? W * 0.7 : Math.min(W * 0.47, H * 0.98); ry = tall ? H * 0.3 : rx * 0.5; };
    const draw = (now) => {
      const f = reduce || !born ? 1 : clamp01((now - born) / 1700), e = 1 - Math.pow(1 - f, 3);            // forms once, ease-out
      const rot = (reduce ? 0.6 : now * 0.000021) - (1 - e) * 0.9, grow = 0.5 + 0.5 * e, tilt = H > W ? -0.95 : -0.28, ct = Math.cos(tilt), st = Math.sin(tilt);
      ox += (mx - ox) * 0.05; oy += (my - oy) * 0.05;
      const cx = W * 0.5 + ox * 18, cy = H * (H > W ? 0.54 : 0.53) + oy * 12;
      const at = (r, a) => { const x = Math.cos(a + rot) * r * rx * grow, y = Math.sin(a + rot) * r * ry * grow; return [cx + x * ct - y * st, cy + x * st + y * ct]; };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        const [x, y] = at(p.r, p.a + (1 - p.r) * rot * 0.35);                                              // the middle turns a little faster
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(now * 0.0012 * (0.5 + p.s) + p.s * 40);
        const al = e * tw * (p.acc ? 0.95 : 0.2 + 0.75 * p.s * (1.2 - Math.min(1, p.r)));
        const d = p.acc ? 3 : 1.1 + p.s * 2.1;
        ctx.globalAlpha = al; ctx.fillStyle = p.acc ? "#ccff3d" : "#f4f3ef"; ctx.fillRect(x - d / 2, y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      for (const p of pins) { const q = H > W ? p.m : p.d, k = reduce ? 0 : now * 0.0004 + q[0] * 9;
        const x = W * q[0] + Math.sin(k) * 5 + ox * 30 + (1 - e) * (W * 0.5 - W * q[0]) * 0.5, y = H * q[1] + Math.cos(k * 0.8) * 5 + oy * 20 + (1 - e) * (H * 0.5 - H * q[1]) * 0.5, flip = q[0] > 0.6;
        p.l.classList.toggle("flip", flip); p.l.style.opacity = e;
        p.l.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)" + (flip ? " translateX(-100%)" : ""); }
    };
    const loop = (now) => { raf = 0; draw(now); if (vis && !document.hidden && !reduce) raf = requestAnimationFrame(loop); };
    const sync = () => { const on = vis && !document.hidden; if (on && !born) born = performance.now(); if (on && !raf && !reduce) raf = requestAnimationFrame(loop); if (on && reduce) draw(0); };
    new IntersectionObserver(([en]) => { vis = en.isIntersecting; sync(); }, { threshold: 0.05 }).observe(gal);
    document.addEventListener("visibilitychange", sync);
    addEventListener("resize", () => { size(); if (reduce) draw(0); });
    gal.addEventListener("pointermove", (ev) => { if (ev.pointerType === "touch") return; const r = gal.getBoundingClientRect(); mx = (ev.clientX - r.left) / r.width - 0.5; my = (ev.clientY - r.top) / r.height - 0.5; }, { passive: true });
    size(); draw(0);
  }

  /* ---------------- projects ---------------- */
  // the ground colour blends from one project to the next instead of cutting
  const projWrap = document.querySelector(".projects");
  if (projWrap) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) projWrap.style.backgroundColor = getComputedStyle(e.target).getPropertyValue("--tint").trim(); }), { rootMargin: "-50% 0px -50% 0px" });
    projWrap.querySelectorAll(".proj").forEach((p) => io.observe(p));
  }
  // Domain Access: made-up sign-ups arrive one by one; the lists decide and a stamp lands
  document.querySelectorAll("[data-desk]").forEach((fig) => {
    const NAMES = ["ana.silva", "rui.costa", "marta.reis", "joao.pinto", "ines.lopes", "tiago.sousa", "sofia.melo", "pedro.alves", "carla.nunes", "bruno.dias", "rita.gomes", "nuno.faria"];
    const RULES = [["escola.example", "ok", "Approved", "is on the allowed list"], ["campus.edu.example", "ok", "Approved", "matches *.edu.example, allowed"], ["formacao.example", "ok", "Approved", "is on the allowed list"],
      ["partner.example", "ok", "30 days", "is on the temporary list"], ["guest.example", "ok", "14 days", "is on the temporary list"],
      ["spam.example", "no", "Denied", "is on the blocked list"], ["throwaway.example", "no", "Denied", "is on the blocked list"], ["other.example", "wait", "Waiting", "is on no list, an approver decides"]];
    const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };
    const desk = el("div", "desk"), mail = el("p", "desk-mail"), rule = el("p", "desk-rule"), stamp = el("span", "stamp"), log = el("ul", "desk-log");
    desk.setAttribute("role", "img"); desk.setAttribute("aria-label", "Example: sign-ups arrive and are approved, denied or held, depending on the email domain lists");
    desk.dataset.ui = ""; desk.append(el("p", "desk-h", "New sign-up"), mail, rule, stamp, log); fig.append(desk);
    let cur = null, last = -1, timer = 0, vis = false, t2 = 0;
    const pick = () => { let i; do { i = Math.floor(Math.random() * RULES.length); } while (i === last); last = i; return [NAMES[Math.floor(Math.random() * NAMES.length)] + "@" + RULES[i][0], RULES[i]]; };
    const logIt = (c, quiet) => { const li = el("li"); const b = el("b", c[1][1], c[1][2].toLowerCase()); li.append(el("span", "", c[0]), b); log.prepend(li); while (log.children.length > 4) log.lastChild.remove();
      if (M && !reduce && !quiet) M.animate(li, { opacity: [0, 1] }, { duration: 0.3 }); };
    const step = () => {
      if (cur) logIt(cur);
      cur = pick(); mail.textContent = cur[0]; rule.textContent = cur[1][0] + " " + cur[1][3]; stamp.textContent = cur[1][2]; stamp.className = "stamp " + cur[1][1];
      if (!M || reduce) { stamp.style.opacity = 1; return; }
      stamp.style.opacity = 0;
      M.animate([mail, rule], { opacity: [0, 1], y: [10, 0] }, { duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.06) });
      clearTimeout(t2); t2 = setTimeout(() => M.animate(stamp, { opacity: [0, 1], scale: [1.7, 1] }, { duration: 0.18, ease: [0.22, 1, 0.36, 1] }), 650);
    };
    for (let i = 0; i < 3; i++) logIt(pick(), true);
    step();
    const sync = () => { const on = vis && !document.hidden && !reduce; if (on && !timer) timer = setInterval(step, 2600); if (!on && timer) { clearInterval(timer); timer = 0; } };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; sync(); }, { threshold: 0.3 }).observe(fig);
    document.addEventListener("visibilitychange", sync);
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
  // ---------- game page ----------
  // background film: plays only while on screen, never under reduced motion (the poster stays)
  document.querySelectorAll("video[data-autoplay]").forEach((v) => {
    if (reduce) return;
    new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
  });
  // chapter bar: marks the part of the page you are reading
  const chap = document.querySelector(".chapters");
  if (chap) {
    const row = chap.firstElementChild, links = [...chap.querySelectorAll('a[href^="#"]')];
    const mark = (id) => links.forEach((a) => { const on = a.hash === "#" + id; on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      if (on && row.scrollWidth > row.clientWidth) row.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" }); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) mark(e.target.id); }), { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const t = document.getElementById(a.hash.slice(1)); if (t) io.observe(t); });
  }
  // screenshot viewer: a thumbnail swaps the big picture with a short cross-fade
  document.querySelectorAll("[data-viewer]").forEach((root) => {
    const fig = root.querySelector(".viewer"), img = fig.querySelector("img"), cap = fig.querySelector("figcaption"), tabs = [...root.querySelectorAll(".thumbs a")];
    let want = "";
    tabs.forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); if (a.hasAttribute("aria-current")) return;
      tabs.forEach((t) => t.removeAttribute("aria-current")); a.setAttribute("aria-current", "true");
      const src = a.getAttribute("href"); want = src;
      const next = new Image(); next.src = src;
      const show = () => { if (want !== src) return; img.src = src; img.alt = a.dataset.cap; cap.textContent = a.dataset.cap; fig.classList.remove("swap"); };
      fig.classList.add("swap");
      Promise.all([next.decode().catch(() => {}), new Promise((r) => setTimeout(r, reduce ? 0 : 200))]).then(show);
    }));
  });

  if (M && !reduce) {
    document.querySelectorAll("[data-ins]").forEach((sec) => {
      const parts = sec.querySelectorAll("[data-in]");
      M.inView(sec, () => { M.animate(parts, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08) }); }, { amount: 0.2 });
    });
    // project pictures open like a shutter while the picture settles back, so each topic arrives instead of just scrolling past
    document.querySelectorAll("[data-reveal]").forEach((fig) => {
      M.inView(fig.parentElement, () => {   // watch the panel: a fully clipped picture never counts as "in view"
        const ease = [0.22, 1, 0.36, 1];
        M.animate(fig, { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] }, { duration: 0.9, ease });
        const pic = fig.classList.contains("duo") ? null : fig.querySelector("img, video"), inset = fig.querySelector(".inset");
        if (pic) M.animate(pic, { scale: [1.14, 1] }, { duration: 1.4, ease });
        if (inset) M.animate(inset, { opacity: [0, 1], y: [36, 0] }, { duration: 0.7, ease, delay: 0.4 });
      }, { amount: 0.25 });
    });
    const intro = document.querySelectorAll(".hero-say > *, .nav:not(.dark) a");
    if (intro.length) M.animate(intro, { opacity: [0, 1] }, { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08, { startDelay: 0.1 }) });
  } else {
    document.querySelectorAll("[data-in]").forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; });
  }
})();
