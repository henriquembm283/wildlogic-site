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
uniform sampler2D uA,uM;uniform vec2 uRes,uLens;uniform float uCell,uR,uN,uT,uIn,uDis,uDisA,uDisB,uDim,uTex,uKeep;
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
 float g1=glyph(px+vec2(0.,uKeep*(uCell*1.4-mod(uRes.y,uCell*1.4))),uCell,v1,i1);
 float g2=glyph(px,uCell*.52,v2,i2);
 float h1=h(i1),h2=h(i2+17.);
 vec2 c1=(i1+.5)*vec2(uCell,uCell*1.4);
 float m=smoothstep(uR,uR*.15,distance(c1,uLens*uRes));
 float a1=smoothstep(0.,.15,uIn*1.15-h1)*smoothstep(0.,.15,h1*.85+.15-max(uDis,uKeep*.55*smoothstep(.5,1.,px.y/uRes.y)))*smoothstep(.2,1.,px.y/(uCell*8.));
 float sp=step(1.-(.009+.06*m)*uDim,h(i1+floor(uT*1.4+h1*9.)));
 vec3 lit=min(paper*(.16+.5*v1)*(1.+2.4*m*(1.-uKeep*smoothstep(.6,1.,px.y/uRes.y)))*uDim,paper);
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
  const GLYPHS = "  0101101001101001011010";   // zeros and ones, light to dense: this is an IT company

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
    const U = {}; ["uA", "uM", "uRes", "uLens", "uCell", "uR", "uN", "uT", "uIn", "uDis", "uDisA", "uDisB", "uDim", "uTex", "uKeep"].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
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
      gl.uniform1f(U.uCell, (small ? Math.max(9, opt.cell * 0.72) : opt.cell) * d);
      gl.uniform1f(U.uR, Math.min(w, hgt) * opt.r);
      gl.uniform1f(U.uT, reduce ? 3 : now / 1000);
      gl.uniform1f(U.uIn, 1 - Math.pow(1 - tin, 3)); gl.uniform1f(U.uDim, opt.dim || 1); gl.uniform1f(U.uTex, opt.tex == null ? 1 : opt.tex); gl.uniform1f(U.uKeep, opt.keep ? 1 : 0);
      gl.uniform1f(U.uDis, smooth(0.08, 0.9, p) * (opt.keep ? 0.58 : 1));   // keep: the field thins out but never empties, so it can carry on into the next section gl.uniform1f(U.uDisA, smooth(0.3, 0.82, p)); gl.uniform1f(U.uDisB, smooth(0.5, 1, p));
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
      innerWidth < 700 ? { cell: 12.5, keep: 1, r: 0.42, lx: 0.55, ly: 0.52, wx: 0.3, wy: 0.12 } : { cell: 11, keep: 1, r: 0.34, lx: 0.66, ly: 0.42, wx: 0.24, wy: 0.2 });
    const onScroll = () => {
      const prog = hero.offsetHeight <= innerHeight + 2 ? 0 : progressOf(hero);   // phone: the hero is one screen tall and does not dissolve
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

  // "everything is data": how far the galaxy has scrolled away (0 to 1). The stars use it to turn into falling digits, the stage uses it to build itself.
  let dataG = 0;
  const hsh = (a, b, c) => { const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return v - Math.floor(v); };
  const sprites = {};
  const digit = (one, acc) => { const key = (one ? "1" : "0") + (acc ? "a" : "p"); let c = sprites[key]; if (c) return c;
    c = sprites[key] = document.createElement("canvas"); c.width = 24; c.height = 36; const x = c.getContext("2d");
    x.font = '700 26px "Bricolage Grotesque", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = acc ? "#ccff3d" : "#f4f3ef"; x.fillText(one ? "1" : "0", 12, 19); return c; };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const k in sprites) delete sprites[k]; });

  /* ---------------- galaxy: a two-armed spiral whose stars drift slowly outward along the arms; seven of them are links ---------------- */
  const gal = document.querySelector(".galaxy");
  if (gal) {
    const cv = gal.querySelector("canvas"), ctx = cv.getContext("2d"), links = [...gal.querySelectorAll(".stars a")], head = gal.querySelector(".galaxy-head");
    const TAU = Math.PI * 2, small = innerWidth < 700, WIND = 4.6;
    let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const gauss = () => rnd() + rnd() + rnd() - 1.5;
    const armR = (u) => 0.05 + Math.pow(u, 0.9) * 1.0, armA = (arm, r) => arm * Math.PI + WIND * Math.pow(r, 0.72);
    const pts = [];
    for (let i = 0, n = small ? 3600 : 9000; i < n; i++) {
      const kind = rnd(), p = { s: rnd(), acc: rnd() < 0.03, k: 0, u: rnd(), arm: i % 2, ja: 0, jr: 0, r: 0, a: 0 };
      if (kind < 0.19) { p.k = 1; p.r = Math.pow(rnd(), 1.6) * 0.2; p.a = rnd() * TAU; }                          // the bright middle
      else if (kind < 0.62) { p.ja = gauss() * 0.3; p.jr = gauss() * 0.035; }                                      // the crisp ridge of each arm
      else if (kind < 0.95) { p.ja = gauss() * 0.8; p.jr = gauss() * 0.09; }                                       // the softer body around it
      else { p.k = 2; p.r = 0.2 + Math.pow(rnd(), 0.6) * 1.15; p.a = rnd() * TAU; }                                 // loose stars around
      p.big = p.k !== 2 && rnd() < 0.005;                                                                           // a few bright ones get a small cross
      pts.push(p);
    }
    const pins = links.map((l) => ({ l, g: l.dataset.g.split(",").map(Number), m: l.dataset.m.split(",").map(Number), x: 0, y: 0, w: 0, h: 0, flip: false }));
    // with a mouse: pointing at a star shows a small framed picture of that project beside it, so you see what the name is before you click.
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      links.forEach((l) => {
        if (!l.dataset.bg) return; let img = null; const pin = pins.find((q) => q.l === l);
        const on = () => {
          if (!img) { img = new Image(); img.alt = ""; img.decoding = "async"; img.src = l.dataset.bg; if (l.dataset.bgInv !== undefined) img.className = "inv"; l.querySelector("i").append(img); }
          // a framed picture sits just above its star (below when there is no room above), kept inside the section
          const w = 184, h = 118, gr = gal.getBoundingClientRect(), ir = l.querySelector("i").getBoundingClientRect(), il = ir.left - gr.left, it = ir.top - gr.top, hr = head.getBoundingClientRect();
          const left = Math.max(12, Math.min(W - 12 - w, pin.flip ? il + 44 - w : il)), up = it - 4 - h > (left < hr.right - gr.left + 16 ? hr.bottom - gr.top + 8 : 12), top = up ? it - 4 - h : it + 48;
          l.style.setProperty("--tx", (left - il).toFixed(0) + "px"); l.style.setProperty("--ty", (top - it).toFixed(0) + "px"); l.style.setProperty("--to", (pin.flip ? "100% " : "0 ") + (up ? "100%" : "0"));
          requestAnimationFrame(() => requestAnimationFrame(() => l.classList.add("pic")));
        };
        const off = () => l.classList.remove("pic");
        l.addEventListener("pointerenter", on); l.addEventListener("pointerleave", off); l.addEventListener("focus", on); l.addEventListener("blur", off);
      });
    }
    // the zeros and ones of the hero carry on into the top of this section and thin out to nothing, so the two sections read as one sky
    const bits = document.createElement("canvas"), bctx = bits.getContext("2d"); let bitsAt = -1e9, bitsW = 0, bitsN = 0;
    const bitsPaint = (now) => {
      bitsAt = now; bitsW = W; bitsN++; const cw = W < 700 ? 9 : 11, ch = cw * 1.4, fh = Math.min(H * 0.55, 500), hr = head.getBoundingClientRect(), gr = gal.getBoundingClientRect();
      const y0 = 0;                                                    // the hero's rows are shifted to end exactly on its bottom edge, so these rows simply carry on
      bits.width = W * dpr; bits.height = Math.ceil(fh) * dpr; bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, fh);
      bctx.font = "700 " + (cw * 1.15).toFixed(1) + 'px "Bricolage Grotesque", sans-serif'; bctx.textAlign = "center"; bctx.textBaseline = "middle"; bctx.fillStyle = "#f4f3ef";
      const hx = hr.right - gr.left, hy = hr.bottom - gr.top, hh = (ix, iy, k) => { const v = Math.sin(ix * 12.9898 + iy * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
      for (let iy = 0; y0 + iy * ch < fh; iy++) { const y = y0 + iy * ch + ch / 2, t = clamp01(1 - y / fh), keep = 0.5 * t * t;
        for (let ix = 0; ix * cw < W; ix++) { const x = ix * cw + cw / 2;
          if (hh(ix, iy, 1) > keep) continue;                            // fewer and fewer the further down
          const near = clamp01(Math.max(x - hx, y - hy, 0) / 90);        // fades out softly towards the heading instead of stopping at a box
          if (near <= 0) continue;
          const flip = hh(ix, iy, 2) < 0.12 ? bitsN : 0;                 // a few change now and then
          bctx.globalAlpha = (0.2 + 0.4 * hh(ix, iy, 3)) * (0.3 + 0.7 * t) * near; bctx.fillText(hh(ix, iy, 4 + flip) > 0.5 ? "1" : "0", x, y); } }
    };
    let W = 0, H = 0, dpr = 1, rx = 0, ry = 0, raf = 0, vis = false, born = 0, mx = 0, my = 0, ox = 0, oy = 0, tilt = 0, cx0 = 0, cy0 = 0;
    const spot = (r, a, rot, grow) => { const x = Math.cos(a + rot) * r * rx * grow, y = Math.sin(a + rot) * r * ry * grow, ct = Math.cos(tilt), st = Math.sin(tilt); return [x * ct - y * st, x * st + y * ct]; };
    // where the seven names sit: on the arms, then nudged apart so no two names, the heading or the edges ever touch, at any window size
    const place = () => {
      const tall = H > W, m = W < 480 ? 12 : 20, pad = W < 480 ? 10 : 16, hr = head.getBoundingClientRect(), gr = gal.getBoundingClientRect(), hRight = hr.right - gr.left + pad, hBottom = hr.bottom - gr.top + pad;
      pins.forEach((p) => {
        { const r = p.g[1] ? armR(p.g[1]) : 0, q = spot(r, armA(p.g[0], r), 0, 1); p.x = cx0 + q[0]; p.y = cy0 + q[1]; }
        p.l.classList.remove("flip"); p.w = p.l.offsetWidth; p.h = p.l.offsetHeight;
        p.flip = p.x > W * 0.6 || p.x + p.w > W - m; p.l.classList.toggle("flip", p.flip); p.l.classList.toggle("core", !p.g[1]);
      });
      const L = (p) => (p.flip ? p.x - p.w + 22 : p.x - 22), T = (p) => p.y - 22;
      const keep = (p) => {
        let l = L(p), t = T(p);
        const dl = Math.max(m, Math.min(W - m - p.w, l)) - l; p.x += dl; l += dl;
        const top = l < hRight ? hBottom : m, dt = Math.max(top, Math.min(H - m - p.h, t)) - t; p.y += dt;
      };
      for (let it = 0; it < 240; it++) {
        pins.forEach(keep);
        for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
          const a = pins[i], b = pins[j], ox2 = Math.min(L(a) + a.w, L(b) + b.w) - Math.max(L(a), L(b)) + pad, oy2 = Math.min(T(a) + a.h, T(b) + b.h) - Math.max(T(a), T(b)) + pad;
          if (ox2 <= 0 || oy2 <= 0) continue;
          if (oy2 <= ox2 || W < 480) { const d = oy2 / 2 * (T(a) <= T(b) ? 1 : -1); a.y -= d; b.y += d; } else { const d = ox2 / 2 * (L(a) <= L(b) ? 1 : -1); a.x -= d; b.x += d; }
        }
      }
      pins.forEach(keep);
    };
    const size = () => { W = gal.clientWidth; H = gal.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2); cv.width = W * dpr; cv.height = H * dpr;
      const tall = H > W; rx = tall ? Math.min(H * 0.5, W * 1.25) : Math.min(W * 0.46, H * 0.94); ry = tall ? Math.min(W * 0.47, rx * 0.62) : rx * 0.52; tilt = tall ? -1.25 : -0.3; cx0 = W * 0.5; cy0 = H * (tall ? 0.56 : 0.54); place(); };
    const draw = (now) => {
      const f = reduce || !born ? 1 : clamp01((now - born) / 1700), e = 1 - Math.pow(1 - f, 3);            // forms once, ease-out
      const rot = -(1 - e) * 0.9, grow = 0.5 + 0.5 * e, flow = reduce ? 0 : now * 0.0000045, spin = reduce ? 0 : now * 0.00003;
      const g = dataG, zoom = 1 + g * g * 4.5, sink = g * H * 0.42, away = 1 - smooth(0.5, 1, g);   // scrolling on, you fly into the galaxy: it swells from its middle, the stars rush past and thin out, and the projects are what is behind them
      ox += (mx - ox) * 0.05; oy += (my - oy) * 0.05;
      const dk = W < 480 ? 0 : 1, cx = cx0 + ox * 18 * dk, cy = cy0 + oy * 12 * dk;   // no drift on a narrow screen: there is no room to spare at the edges
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (now - bitsAt > 1600 || bitsW !== W) bitsPaint(now); ctx.globalAlpha = e; ctx.drawImage(bits, 0, 0, bits.width / dpr, bits.height / dpr); ctx.globalAlpha = 1;
      let pi = 0;
      for (const p of pts) { pi++;
        let r = p.r, a = p.a, fade = 1;
        if (p.k === 0) { const u = (p.u + flow * (0.6 + 0.8 * p.s)) % 1; r = armR(u) + p.jr; a = armA(p.arm, r) + p.ja * (1 - 0.45 * u); fade = Math.min(1, u * 14, (1 - u) * 18); }   // drifts out along its arm, fading in and out at the ends
        else if (p.k === 1) a += spin * (1.4 - p.r * 4);                                                     // the middle turns on itself
        const q = spot(r, a, rot, grow), x = cx + q[0] * zoom, y = cy + q[1] * zoom + sink;
        if (x < -6 || y < -6 || x > W + 6 || y > H + 6) continue;
        const tw = reduce ? 1 : 0.72 + 0.28 * Math.sin(now * 0.0011 * (0.5 + p.s) + p.s * 40);
        const al = e * away * fade * tw * (p.acc || p.big ? 0.95 : p.k === 2 ? 0.12 + 0.3 * p.s : 0.26 + 0.8 * p.s * (1.3 - 0.5 * Math.min(1, r)));
        const d = (p.acc ? 2.6 : p.big ? 2.8 : p.k === 2 ? 0.9 + p.s * 1.1 : 0.9 + p.s * p.s * 2.1) * (1 + g * 1.2);
        ctx.globalAlpha = al; ctx.fillStyle = p.acc ? "#ccff3d" : "#f4f3ef";
        if (d > 1.7) { ctx.beginPath(); ctx.arc(x, y, d / 2, 0, TAU); ctx.fill(); } else ctx.fillRect(x - d / 2, y - d / 2, d, d);
        if (p.big) { const n = 5 + 4 * tw; ctx.globalAlpha = al * 0.55; ctx.fillRect(x - n, y - 0.5, n * 2, 1); ctx.fillRect(x - 0.5, y - n, 1, n * 2); }
      }
      ctx.globalAlpha = 1;
      for (const p of pins) { const k = reduce ? 0 : now * 0.0004 + p.m[0] * 9;
        const x = cx0 + (p.x - cx0) * zoom + Math.sin(k) * 4 + ox * 18 * dk + (1 - e) * (cx0 - p.x) * 0.5, y = cy0 + (p.y - cy0) * zoom + sink + Math.cos(k * 0.8) * 4 + oy * 12 * dk + (1 - e) * (cy0 - p.y) * 0.5;
        p.l.style.opacity = g > 0 ? e * (1 - smooth(0.2, 0.6, g)) : e;
        p.l.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)" + (p.flip ? " translateX(-100%)" : ""); }
    };
    const loop = (now) => { raf = 0; draw(now); if (vis && !document.hidden && !reduce) raf = requestAnimationFrame(loop); };
    const sync = () => { const on = vis && !document.hidden; if (on && !born) born = performance.now(); if (on && !raf && !reduce) raf = requestAnimationFrame(loop); if (on && reduce) draw(0); };
    new IntersectionObserver(([en]) => { vis = en.isIntersecting; sync(); }, { threshold: 0.05 }).observe(gal);
    document.addEventListener("visibilitychange", sync);
    addEventListener("resize", () => { size(); if (reduce) draw(0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { place(); if (reduce) draw(0); });   // names are measured, so measure again once the typeface is in
    gal.addEventListener("pointermove", (ev) => { if (ev.pointerType === "touch") return; const r = gal.getBoundingClientRect(); mx = (ev.clientX - r.left) / r.width - 0.5; my = (ev.clientY - r.top) / r.height - 0.5; }, { passive: true });
    size(); draw(0);
  }

  /* ---------------- projects ---------------- */
  // the ground colour blends from one project to the next instead of cutting
  const projWrap = document.querySelector(".projects");
  if (projWrap) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !projWrap.classList.contains("stage")) projWrap.style.backgroundColor = getComputedStyle(e.target).getPropertyValue("--tint").trim(); }), { rootMargin: "-50% 0px -50% 0px" });
    projWrap.querySelectorAll(".proj").forEach((p) => io.observe(p));
    // PC: the eight projects share one stage. A list of names on the left; the picked project fills the right. (Phones keep the stacked panels.)
    const mqStage = matchMedia("(min-width: 1100px)");
    if (/[?&]stage/.test(location.search)) {
      const projs = [...projWrap.querySelectorAll(".proj")], list = document.createElement("div");
      list.className = "stage-list"; list.setAttribute("role", "group"); list.setAttribute("aria-label", "Projects");
      const tabs = projs.map((p) => { const h = p.querySelector("h3"), name = h.textContent.trim() || h.querySelector("img").alt, b = document.createElement("button");
        b.type = "button"; b.className = "stage-tab"; b.id = "t-" + p.id; b.setAttribute("aria-controls", p.id); b.setAttribute("aria-label", name);
        const n = document.createElement("b"), k = document.createElement("small"); n.textContent = name; k.textContent = p.querySelector(".kind").textContent.split("·")[0].trim(); b.append(n, k); b.dataset.name = name; list.append(b); return b; });
      let cur = 0, dec = 0, on = false, hov = 0;
      const tintOf = (i) => getComputedStyle(projs[i]).getPropertyValue("--tint").trim();
      const galEl = document.querySelector(".galaxy"), hex = (h) => [1, 3, 5].map((n) => parseInt(h.slice(n, n + 2), 16));
      // no line between the galaxy and the stage: while both are on screen they share one ground colour, which slides from the galaxy's night to the picked project's colour as you scroll
      const ground = () => { const t = hex(tintOf(cur)), n = [28, 28, 28], k = dataG > 0 && dataG < 1 ? smooth(0.1, 0.9, dataG) : 1, c = "rgb(" + n.map((v, i) => Math.round(v + (t[i] - v) * k)).join(" ") + ")";
        projWrap.style.backgroundColor = c; if (galEl) galEl.style.backgroundColor = on && dataG > 0 && dataG < 1 ? c : ""; };
      // galaxy to stage: the list and the picked project rise into place as the galaxy flies past. Tied to the scroll, so it runs both ways and never plays on its own.
      const arrive = () => { const g = dataG, live = on && g > 0 && g < 1; projWrap.classList.toggle("building", live); if (live) projWrap.style.setProperty("--in", smooth(0.3, 0.9, g).toFixed(3)); };
      const onScroll = () => { const gal = galEl; if (!gal || !on || reduce) { dataG = 0; if (gal) gal.style.backgroundColor = ""; arrive(); return; }
        const r = gal.getBoundingClientRect(); dataG = clamp01(-r.top / r.height); if (dataG > 0.995) dataG = 1; ground(); arrive(); };
      // between projects: the picture breaks into zeros and ones (110 ms), the project changes underneath, and the digits clear from left to right (360 ms) to show the new one
      const cover = document.createElement("canvas"), cctx = cover.getContext("2d"); cover.className = "stage-cover"; cover.setAttribute("aria-hidden", "true");
      let craf = 0, cT = 0, cPhase = 0, cFrom = 0, cW = 0, cH = 0, cSeed = 0, cThen = null;
      const coverFit = (a, b) => { const w = projWrap.getBoundingClientRect(); let l = 1e9, t = 1e9, r2 = 0, bt = 0;
        [a, b].forEach((p) => p.querySelectorAll(".proj-media, .proj-strip").forEach((m) => { const q = m.getBoundingClientRect(); if (!q.width) return; l = Math.min(l, q.left); t = Math.min(t, q.top); r2 = Math.max(r2, q.right); bt = Math.max(bt, q.bottom); }));
        cW = Math.ceil(r2 - l) + 16; cH = Math.ceil(bt - t) + 16; const d = Math.min(devicePixelRatio || 1, 2); cover.width = cW * d; cover.height = cH * d;
        cover.style.cssText = "left:" + (l - w.left - 8).toFixed(0) + "px;top:" + (t - w.top - 8).toFixed(0) + "px;width:" + cW + "px;height:" + cH + "px"; cctx.setTransform(d, 0, 0, d, 0, 0); };
      const coverDraw = (now) => { craf = 0; const dur = cPhase === 1 ? 110 : 360, k = clamp01((now - cT) / dur), cw = 14, ch = 20, bg = getComputedStyle(projWrap).backgroundColor;
        const lvl = cPhase === 1 ? cFrom + (1 - cFrom) * k : (1 - k) * (1 - k);                  // how much is covered: fills fast, clears with an ease-out
        cctx.clearRect(0, 0, cW, cH);
        for (let ix = 0; ix * cw < cW; ix++) for (let iy = 0; iy * ch < cH; iy++) {
          const h = hsh(ix, iy, cSeed), th = cPhase === 1 ? h : 0.3 * h + 0.7 * (1 - ix * cw / cW);    // clearing runs left to right, with a ragged edge
          if (cPhase === 1 ? th > lvl : th > lvl * 1.02) continue;
          cctx.globalAlpha = 1; cctx.fillStyle = bg; cctx.fillRect(ix * cw, iy * ch, cw + 0.5, ch + 0.5);
          cctx.globalAlpha = 0.25 + 0.6 * hsh(ix, iy, cSeed + 1); cctx.drawImage(digit(hsh(ix, iy, cSeed + 2 + Math.floor(now / 70)) > 0.5, hsh(ix, iy, cSeed + 3) < 0.08), ix * cw + 2, iy * ch + 2.5, 10, 15); }
        if (k < 1) { craf = requestAnimationFrame(coverDraw); return; }
        if (cPhase === 1) { const then = cThen; cThen = null; then(); cPhase = 2; cT = now; cSeed += 7; craf = requestAnimationFrame(coverDraw); }
        else { cPhase = 0; cover.remove(); } };
      // the picked name is typed out of zeros and ones: 420 ms, once per pick, so the switch reads as the machine fetching it
      const decode = (el, name) => { cancelAnimationFrame(dec); if (reduce) { el.textContent = name; return; } const t0 = performance.now();
        const step = (now) => { const k = clamp01((now - t0) / 420), n = Math.floor(k * name.length); let t = name.slice(0, n); for (let i = n; i < name.length; i++) t += name[i] === " " ? " " : Math.random() < 0.5 ? "0" : "1"; el.textContent = t; if (k < 1) dec = requestAnimationFrame(step); };
        dec = requestAnimationFrame(step); };
      const show = (i) => { projs.forEach((p, j) => p.classList.toggle("on", j === i)); ground();
        projs[i].querySelectorAll("[data-reveal]").forEach((f) => { f.style.clipPath = ""; }); projs[i].querySelectorAll(".proj-text").forEach((t) => { t.style.opacity = ""; t.style.transform = ""; }); };
      const pick = (i, focus, quiet) => { if (i === cur && (cThen || projs[i].classList.contains("on"))) { if (focus) tabs[i].focus(); return; }
        const was = projs.findIndex((p) => p.classList.contains("on"));
        tabs[cur].firstChild.textContent = tabs[cur].dataset.name; cur = i;
        tabs.forEach((t, j) => t.setAttribute("aria-pressed", j === i ? "true" : "false"));
        if (quiet || reduce || was < 0) show(i);
        else { coverFit(projs[was], projs[i]); if (!cover.isConnected) projWrap.append(cover);
          cFrom = cPhase === 2 ? clamp01(1 - (performance.now() - cT) / 360) * 0.6 : cPhase === 1 ? cFrom : 0; if (cPhase !== 1) { cPhase = 1; cT = performance.now(); }
          cThen = () => show(cur); if (!craf) craf = requestAnimationFrame(coverDraw); }
        if (!quiet) decode(tabs[i].firstChild, tabs[i].dataset.name); if (focus) tabs[i].focus(); };
      tabs.forEach((b, i) => {
        b.addEventListener("click", () => pick(i));
        b.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse") return; clearTimeout(hov); hov = setTimeout(() => pick(i), 90); });   // a short pause, so crossing the list does not flicker through every project
        b.addEventListener("pointerleave", () => clearTimeout(hov));
        b.addEventListener("keydown", (e) => { const k = e.key, to = k === "ArrowDown" ? (i + 1) % tabs.length : k === "ArrowUp" ? (i + tabs.length - 1) % tabs.length : k === "Home" ? 0 : k === "End" ? tabs.length - 1 : -1; if (to >= 0) { e.preventDefault(); pick(to, true); } });
      });
      const set = () => { const want = mqStage.matches; if (want === on) return; on = want; projWrap.classList.toggle("stage", on);
        if (on) { projWrap.prepend(list); pick(cur, false, true); }
        else { list.remove(); cover.remove(); cancelAnimationFrame(craf); craf = 0; cPhase = 0; cThen = null; projWrap.classList.remove("building"); projs.forEach((p) => p.classList.remove("on")); }
        onScroll(); };
      set(); mqStage.addEventListener("change", set);
      addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll);
      const go = (id, smoothly) => { const i = projs.findIndex((p) => p.id === id); if (i < 0 || !on) return false; pick(i); projWrap.scrollIntoView({ behavior: smoothly && !reduce ? "smooth" : "auto", block: "start" }); return true; };
      document.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest('a[href^="#p-"]'); if (a && go(a.getAttribute("href").slice(1), true)) e.preventDefault(); });
      if (location.hash.indexOf("#p-") === 0) go(location.hash.slice(1), false);
    }
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
    // morph between topics, tied to the scroll: each picture opens from a star-sized dot into the full frame as it nears the
    // middle of the screen and closes back to a dot as it leaves, while its text dissolves. With the colour blend behind,
    // one topic turns into the next instead of sliding past.
    const morphs = [...document.querySelectorAll("[data-reveal]")].map((fig) => ({ fig, text: fig.parentElement.querySelector(".proj-text") }));
    if (morphs.length) {
      const ease = (t) => t * t * (3 - 2 * t), amt = (el, vh, a, b) => { const r = el.getBoundingClientRect(); return [ease(clamp01(1 - (Math.abs(r.top + r.height / 2 - vh / 2) / vh - a) / (b - a))), r]; };
      let tick = 0;
      const paint = () => {
        tick = 0; const vh = innerHeight;
        if (projWrap && projWrap.classList.contains("stage")) return;   // on the stage nothing is tied to the scroll
        morphs.forEach(({ fig, text }) => {
          const pr = fig.parentElement.getBoundingClientRect();
          if (pr.bottom < 0 || pr.top > vh) { fig.style.clipPath = "none"; if (text) { text.style.opacity = ""; text.style.transform = "none"; } return; }   // off screen: rest open, so print and full-page captures are whole
          const st = innerWidth <= 900, [e, r] = amt(fig, vh, st ? 0.36 : 0.2, st ? 0.68 : 0.62), k = 1 - e;   // stacked on a phone: the picture is open as soon as it is properly on screen
          fig.style.clipPath = e > 0.999 ? "none" : `inset(${((r.height / 2 - 9) * k).toFixed(1)}px ${((r.width / 2 - 9) * k).toFixed(1)}px round ${(Math.min(r.width, r.height) / 2 * k).toFixed(1)}px)`;
          if (text) { const [t] = amt(text, vh, st ? 0.46 : 0.34, st ? 0.76 : 0.62); text.style.opacity = t.toFixed(3); text.style.transform = t > 0.999 ? "none" : `translateY(${((1 - t) * 28 * (text.getBoundingClientRect().top > vh / 2 ? 1 : -1)).toFixed(1)}px)`; }
        });
      };
      const ask = () => { if (!tick) tick = requestAnimationFrame(paint); };
      addEventListener("scroll", ask, { passive: true }); addEventListener("resize", ask); paint();
    }
    const intro = document.querySelectorAll(".hero-say > *, .nav:not(.dark) a");
    if (intro.length) M.animate(intro, { opacity: [0, 1] }, { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08, { startDelay: 0.1 }) });
  } else {
    document.querySelectorAll("[data-in]").forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; });
  }
})();
