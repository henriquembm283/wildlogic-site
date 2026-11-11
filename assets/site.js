/* Wildlogic home page.
   Every move, with its reason:
   - Hero picture (WebGL): the studio's own game film drawn as a grid of code characters ("logic")
     that opens into the painting ("wild") under the pointer and as you scroll. It is the idea of the name.
   - Hero words: drift apart 0-6% with scroll (linked, no easing) so the name reads as two halves.
   - Showcase frame: 900ms ease-in-out zoom between three distances (CSS), switched by scroll position.
   - Work square: 220ms linear crossfade to the picture of the name crossing the middle.
   - Plugin list: 300ms crossfade + 360ms ease-out height on the open row. Shows what changed.
   - Section entrances: 24px rise + fade, 700ms ease-out, 80ms stagger, once. Gives reading order.
   - Contact picture: slow scroll-linked drift (parallax), so the last screen is not a still.
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

  /* ---------------- hero ---------------- */
  const hero = document.querySelector(".hero");
  if (hero) {
    const stage = hero.querySelector(".hero-stage");
    const video = stage.querySelector("video");
    const canvas = stage.querySelector("canvas");
    const wild = stage.querySelector(".word-wild"), logic = stage.querySelector(".word-logic");
    const say = stage.querySelector(".hero-say"), turn = stage.querySelector(".hero-turn");
    let prog = 0, visible = true, raf = 0;
    const lens = { x: 0.68, y: 0.42, tx: 0.68, ty: 0.42, last: -1e9 };

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: true });
    let draw = null;
    if (gl) {
      const GLYPHS = " .·:;-=+*/<>{}[]01LW#@";
      const N = GLYPHS.length, GW = 40, GH = 56;
      const atlas = document.createElement("canvas"); atlas.width = GW * N; atlas.height = GH;
      const a = atlas.getContext("2d");
      const paint = () => {
        a.fillStyle = "#000"; a.fillRect(0, 0, atlas.width, GH);
        a.fillStyle = "#fff"; a.font = '700 46px "Bricolage Grotesque", sans-serif'; a.textAlign = "center"; a.textBaseline = "middle";
        for (let i = 0; i < N; i++) a.fillText(GLYPHS[i], i * GW + GW / 2, GH / 2 + 2);
      };
      paint();

      const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
      const fs = `precision mediump float;
uniform sampler2D uV,uA;uniform vec2 uRes,uVid,uLens;uniform float uCell,uReveal,uR,uN,uT;
vec2 cover(vec2 px){vec2 uv=px/uRes;float ra=uRes.x/uRes.y,va=uVid.x/uVid.y;
 if(ra>va){float s=va/ra;uv.y=(uv.y-.5)*s+.5;}else{float s=ra/va;uv.x=(uv.x-.5)*s+.5;}return uv;}
void main(){
 vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
 vec2 cs=vec2(uCell,uCell*1.4);
 vec2 id=floor(px/cs);vec2 f=fract(px/cs);
 vec3 c=texture2D(uV,cover((id+.5)*cs)).rgb;
 float l=dot(c,vec3(.299,.587,.114));
 float tw=.06*sin(uT*1.7+id.x*12.9898+id.y*78.233);
 float gi=floor(clamp(pow(l,.75)*1.25+tw,0.,.999)*uN);
 float g=texture2D(uA,vec2((gi+f.x)/uN,f.y)).r;
 vec3 ink=vec3(.075);
 vec3 glyph=mix(ink,min(c*1.9+.06,1.),g);
 vec3 real=texture2D(uV,cover(px)).rgb*.72;
 float d=distance(px,uLens*uRes);
 float m=max(smoothstep(uR,uR*.55,d),uReveal);
 gl_FragColor=vec4(mix(glyph,real,m),1.);
}`;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
      if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
        gl.useProgram(pr);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = (n) => gl.getUniformLocation(pr, n);
        const tex = (unit, src) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); return t; };
        const at = tex(1, atlas); const vt = tex(0, null);
        if (document.fonts && document.fonts.load) document.fonts.load('700 46px "Bricolage Grotesque"').then(() => { paint(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, at); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas); });
        gl.uniform1i(U("uV"), 0); gl.uniform1i(U("uA"), 1); gl.uniform1f(U("uN"), N);
        let ready = false, source = null;
        const poster = new Image(); poster.src = video.poster;
        poster.onload = () => { if (!source) { source = poster; upload(); frame(performance.now()); } };
        const upload = () => { try { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, vt);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); ready = true; stage.classList.add("gl"); } catch (e) { ready = false; } };
        const size = () => { const d = Math.min(1.5, devicePixelRatio || 1); const w = Math.round(stage.clientWidth * d), h = Math.round(stage.clientHeight * d);
          if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); } return d; };
        draw = (now) => {
          if (!source) return;
          if (source === video && video.readyState >= 2) upload();
          if (!ready) return;
          const d = size(), small = stage.clientWidth < 700;
          gl.uniform2f(U("uRes"), canvas.width, canvas.height);
          gl.uniform2f(U("uVid"), source.videoWidth || source.naturalWidth, source.videoHeight || source.naturalHeight);
          gl.uniform2f(U("uLens"), lens.x, lens.y);
          gl.uniform1f(U("uCell"), ((small ? 11 : 15) - prog * (small ? 5 : 8)) * d);
          gl.uniform1f(U("uReveal"), clamp01((prog - 0.45) / 0.45));
          gl.uniform1f(U("uR"), Math.min(canvas.width, canvas.height) * (small ? 0.3 : 0.26));
          gl.uniform1f(U("uT"), reduce ? 0 : now / 1000);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        if (!reduce) {
          video.addEventListener("playing", () => { source = video; }, { once: true });
          video.play().catch(() => {});
        }
      }
    }

    function frame(now) {
      if (!reduce && now - lens.last > 2500) { // nobody is pointing: the lens wanders by itself
        lens.tx = 0.6 + 0.24 * Math.sin(now * 0.00031); lens.ty = 0.45 + 0.2 * Math.sin(now * 0.00043 + 1.1);
      }
      lens.x += (lens.tx - lens.x) * 0.1; lens.y += (lens.ty - lens.y) * 0.1;
      if (draw) draw(now);
    }
    const loop = (now) => { frame(now); raf = requestAnimationFrame(loop); };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? (start(), video.play().catch(() => {})) : (stop(), video.pause()); }).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden || !visible ? stop() : start()));
    addEventListener("pointermove", (e) => {
      if (!visible) return; const r = stage.getBoundingClientRect();
      lens.tx = (e.clientX - r.left) / r.width; lens.ty = (e.clientY - r.top) / r.height; lens.last = performance.now();
      if (reduce) { lens.x = lens.tx; lens.y = lens.ty; frame(0); }
    }, { passive: true });
    addEventListener("resize", () => frame(performance.now()));

    const onScroll = () => {
      prog = progressOf(hero);
      if (!reduce) {
        wild.style.transform = `translate3d(${-prog * 3}%, ${-prog * 6}%, 0)`;
        logic.style.transform = `translate3d(${prog * 3}%, ${prog * 6}%, 0)`;
      }
      const t = clamp01((prog - 0.5) / 0.2);
      turn.style.opacity = t; say.style.opacity = 1 - clamp01((prog - 0.3) / 0.2);
      say.style.visibility = prog > 0.5 ? "hidden" : "visible";
      if (reduce) frame(0);
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    start();
  }

  /* ---------------- showcase ---------------- */
  const show = document.querySelector(".show");
  if (show) {
    const set = () => { const p = progressOf(show); show.dataset.stage = p < 0.3 ? 0 : p < 0.66 ? 1 : 2; };
    addEventListener("scroll", set, { passive: true }); set();
  }

  /* ---------------- work ---------------- */
  const work = document.querySelector(".work");
  if (work) {
    const items = [...work.querySelectorAll(".work-list li")];
    const pics = [...work.querySelectorAll(".work-sq [data-k]")];
    const fl = work.querySelector(".work-fact.l"), fr = work.querySelector(".work-fact.r");
    const activate = (li) => {
      items.forEach((i) => i.classList.toggle("on", i === li));
      pics.forEach((p) => p.classList.toggle("on", !!li && p.dataset.k === li.dataset.k));
      fl.textContent = li ? li.dataset.kind : ""; fr.textContent = li ? li.dataset.state : "";
    };
    let cur = null;
    const pick = () => {
      const mid = innerHeight / 2; let best = null, bd = 1e9;
      for (const i of items) { const r = i.firstElementChild.getBoundingClientRect(); const d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bd) { bd = d; best = i; } }
      if (best !== cur) { cur = best; activate(best); }
    };
    addEventListener("scroll", pick, { passive: true }); addEventListener("resize", pick);
    activate(items[0]);
  }

  /* ---------------- plugins ---------------- */
  const plug = document.querySelector(".plug");
  if (plug) {
    const rows = [...plug.querySelectorAll(".plug-list li")];
    const pics = [...plug.querySelectorAll(".plug-pic [data-k]")];
    const open = (li) => {
      rows.forEach((r) => { const on = r === li; r.classList.toggle("on", on); r.querySelector("button").setAttribute("aria-expanded", on); });
      pics.forEach((p) => p.classList.toggle("on", p.dataset.k === li.dataset.k));
    };
    rows.forEach((r) => { const b = r.querySelector("button"); b.addEventListener("click", () => open(r)); b.addEventListener("focus", () => open(r));
      if (matchMedia("(hover: hover)").matches) b.addEventListener("pointerenter", () => open(r)); });
  }

  /* ---------------- entrances + drift ---------------- */
  if (M && !reduce) {
    document.querySelectorAll("[data-ins]").forEach((sec) => {
      const parts = sec.querySelectorAll("[data-in]");
      M.inView(sec, () => { M.animate(parts, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.08) }); }, { amount: 0.2 });
    });
    const pic = document.querySelector(".contact > img");
    if (pic) M.scroll(M.animate(pic, { y: ["-6%", "6%"] }, { ease: "linear" }), { target: pic.parentElement, offset: ["start end", "end start"] });
    const intro = document.querySelectorAll(".hero-say > *, .nav a");
    M.animate(intro, { opacity: [0, 1] }, { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.12, { startDelay: 0.15 }) });
  } else {
    document.querySelectorAll("[data-in]").forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; });
  }
})();
