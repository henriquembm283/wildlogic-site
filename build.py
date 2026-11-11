"""Builds the Wildlogic site pages. Run: python3 build.py"""
import os
OUT = os.path.dirname(os.path.abspath(__file__))
EMAIL = 'wildlogiclda@gmail.com'
DOMAIN = 'https://wildlogic.pt'
LEGAL = 'WILDLOGIC - Sistemas de Informática, Unipessoal, Lda'
NIPC = '519107276'
svg = lambda n: open(f'{OUT}/assets/img/{n}.svg').read().replace('<svg ', '<svg aria-hidden="true" focusable="false" ')

ARROW_L = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M14.5 5 7.5 12l7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
ARROW_R = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M9.5 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
RIBBON = ''.join(f'<span>{w}</span>' for w in ['JavaScript','HTML Canvas','WebGL','PixiJS','Capacitor','PHP','Moodle','Lua'])

def page(path, title, desc, body, nav_cur='', home=False, scripts=''):
    depth = path.count('/')
    r = '/' if path == '404.html' else '../' * depth
    url = DOMAIN + '/' + path.replace('index.html', '')
    cur = lambda k: ' aria-current="page"' if k == nav_cur else ''
    links = f'<a href="{r}spirekeeper/"{cur("sk")}>Spirekeeper</a><a href="{r or "./"}{"" if home else "index.html" if r != "/" else ""}#work">Projects</a><a href="{r or "./"}{"" if home else "index.html" if r != "/" else ""}#contact">Contact</a>'
    nav = f'<nav class="nav" aria-label="Main">{links}</nav>' if home else \
          f'<nav class="nav dark" aria-label="Main"><a class="home" href="{r or "./"}" aria-label="Wildlogic home">{svg("wl")}</a><span class="links">{links}</span></nav>'
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#222222">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Wildlogic">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{DOMAIN}/assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{r}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{r}apple-touch-icon.png">
<link rel="preload" href="{r}assets/fonts/bricolage-grotesque-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{r}assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{'' if home else nav}
<main id="main">
{nav if home else ''}{body}
</main>
<footer class="foot{'' if home else ' short'}">
  <p>Wildlogic, games and software</p>
  <nav aria-label="Footer"><a href="{r}spirekeeper/">Spirekeeper</a><a href="{r}spirekeeper/privacy/">Spirekeeper privacy</a><a href="{r}privacy/">Privacy</a><a href="https://www.livroreclamacoes.pt/" rel="noopener">Livro de Reclamações</a></nav>
  <p>© 2026 {LEGAL} · NIPC {NIPC}</p>
</footer>
{scripts}</body>
</html>
'''
    html = html.replace('{R}', r).replace('{EMAIL}', EMAIL).replace('{LEGAL}', LEGAL).replace('{NIPC}', NIPC)
    full = os.path.join(OUT, path); os.makedirs(os.path.dirname(full), exist_ok=True); open(full, 'w').write(html)

# ------------------------------------------------------------------ home
home = f'''
<section class="hero" aria-labelledby="title">
  <div class="hero-stage">
    <canvas aria-hidden="true"></canvas>
    <div class="words" role="img" aria-label="Wild Logic"><span class="word word-wild">{svg("wild")}</span><span class="word word-logic">{svg("logic")}</span></div>
    <div class="hero-say">
      <h1 id="title">Wildlogic makes games and tools</h1>
      <p>A software studio in Caldas da Rainha, Portugal: one painted game, three Moodle plugins and a World of Warcraft add-on.</p>
      <a class="btn" href="#work">See what we make</a>
    </div>
    <p class="hero-turn">Half of what we make is wild. The other half is logic.</p>
  </div>
</section>

<section class="orbit" id="work" data-on="sk" aria-labelledby="work-h">
  <div class="orbit-stage">
    <div class="orbit-bg" aria-hidden="true">
      <div class="bg on" data-k="sk"><video muted loop playsinline preload="none" poster="assets/video/rift-poster.jpg" tabindex="-1"><source src="assets/video/rift-loop.mp4" type="video/mp4"></video></div>
      <div class="bg" data-k="ar"><img src="assets/img/ui-autorules.webp" width="1280" height="880" alt="" loading="lazy"></div>
      <div class="bg" data-k="tr"><img src="assets/img/ui-teamreports.webp" width="1300" height="890" alt="" loading="lazy"></div>
      <div class="bg code" data-k="da"><div class="run"><pre data-ui>allow      escola.example      approved\nallow      *.edu.example       approved\ntemporary  partner.example     30 days\ndeny       spam.example        refused\nno list    other.example       waits for approver\nallow      formacao.example    approved\ndeny       throwaway.example   refused\ntemporary  guest.example       14 days</pre><pre data-ui>allow      escola.example      approved\nallow      *.edu.example       approved\ntemporary  partner.example     30 days\ndeny       spam.example        refused\nno list    other.example       waits for approver\nallow      formacao.example    approved\ndeny       throwaway.example   refused\ntemporary  guest.example       14 days</pre><pre data-ui>allow      escola.example      approved\nallow      *.edu.example       approved\ntemporary  partner.example     30 days\ndeny       spam.example        refused\nno list    other.example       waits for approver\nallow      formacao.example    approved\ndeny       throwaway.example   refused\ntemporary  guest.example       14 days</pre><pre data-ui>allow      escola.example      approved\nallow      *.edu.example       approved\ntemporary  partner.example     30 days\ndeny       spam.example        refused\nno list    other.example       waits for approver\nallow      formacao.example    approved\ndeny       throwaway.example   refused\ntemporary  guest.example       14 days</pre><pre data-ui>allow      escola.example      approved\nallow      *.edu.example       approved\ntemporary  partner.example     30 days\ndeny       spam.example        refused\nno list    other.example       waits for approver\nallow      formacao.example    approved\ndeny       throwaway.example   refused\ntemporary  guest.example       14 days</pre><pre data-ui>allow      escola.example      approved\nallow      *.edu.example       approved\ntemporary  partner.example     30 days\ndeny       spam.example        refused\nno list    other.example       waits for approver\nallow      formacao.example    approved\ndeny       throwaway.example   refused\ntemporary  guest.example       14 days</pre></div></div>
      <div class="bg" data-k="wow"><img src="assets/img/ui-quickbuffs.webp" width="1178" height="666" alt="" loading="lazy"></div>
    </div>
    <canvas class="globe" aria-hidden="true"></canvas>
    <h2 class="orbit-h" id="work-h">What we make</h2>
    <nav class="orbit-nav" aria-label="Projects">
      <button type="button" data-k="sk"><i></i>Spirekeeper</button>
      <button type="button" data-k="ar"><i></i>Automation Rules</button>
      <button type="button" data-k="tr"><i></i>Team Reports</button>
      <button type="button" data-k="da"><i></i>Domain Access</button>
      <button type="button" data-k="wow"><i></i>Quick Buffs</button>
    </nav>
    <ol class="orbit-list">
      <li data-k="sk" data-name="Spirekeeper"><article>
        <h3>Spirekeeper</h3>
        <p class="kind">Game · Coming soon to Steam and Android</p>
        <p class="desc">A painted tower defense with a fully voiced story. Build towers of seven elements, fuse them, and stop the Hollow King.</p>
        <a class="btn" href="spirekeeper/">Enter the Spirekeeper world</a>
      </article></li>
      <li data-k="ar" data-name="Automation Rules"><article>
        <h3>Automation Rules</h3>
        <p class="kind">Moodle plugin · Free and Pro</p>
        <p class="desc">"When this happens, do that." Nudge learners who stop showing up, chase assignments before they are late, and enrol people in the next course on their path.</p>
        <a class="btn" href="mailto:{{EMAIL}}?subject=Automation%20Rules">Ask about this plugin</a>
      </article></li>
      <li data-k="tr" data-name="Team Reports"><article>
        <h3>Team Reports</h3>
        <p class="kind">Moodle plugin · Free and Pro</p>
        <p class="desc">Each manager gets a short email about their own team: who started, who is overdue, who went quiet. The full list arrives as a spreadsheet.</p>
        <a class="btn" href="mailto:{{EMAIL}}?subject=Team%20Reports">Ask about this plugin</a>
      </article></li>
      <li data-k="da" data-name="Domain Access"><article>
        <h3>Domain Access</h3>
        <p class="kind">Moodle plugin · Free and Pro</p>
        <p class="desc">People sign up with their work email. Lists of allowed, blocked and temporary email domains decide who gets an account, so nobody approves each one by hand.</p>
        <a class="btn" href="mailto:{{EMAIL}}?subject=Domain%20Access">Ask about this plugin</a>
      </article></li>
      <li data-k="wow" data-name="Quick Buffs"><article>
        <h3>Quick Buffs</h3>
        <p class="kind">World of Warcraft add-on · Free</p>
        <p class="desc">One key buffs the nearest player who is missing your buff, and refreshes the ones about to run out. No clicking, no targeting.</p>
        <a class="btn" href="https://www.curseforge.com/wow/addons/quick-buffs" rel="noopener">Get it on CurseForge</a>
      </article></li>
    </ol>
    <div class="orbit-turn"><button type="button" data-turn="prev" aria-label="Previous project">{ARROW_L}</button><button type="button" data-turn="next" aria-label="Next project">{ARROW_R}</button><p aria-hidden="true">Drag to turn</p></div>
  </div>
</section>

<section class="field studio" id="studio" aria-labelledby="studio-h">
  <h2 id="studio-h">The studio</h2>
  <p class="statement">Wildlogic is a small software studio from Caldas da Rainha, Portugal. We design, build and publish our own games and tools. No ads in anything we make. No trackers. We never sell anyone's data.</p>
  <ul class="nums" data-ins>
    <li data-in><b data-count="68">68</b><span>levels in Spirekeeper</span></li>
    <li data-in><b data-count="287">287</b><span>recorded voice lines</span></li>
    <li data-in><b data-count="3">3</b><span>Moodle plugins</span></li>
    <li data-in><b>0</b><span>ads or trackers, anywhere</span></li>
  </ul>
  <div class="ribbon" role="img" aria-label="What we build with: JavaScript, HTML Canvas, WebGL, PixiJS, Capacitor, PHP, Moodle, Lua">
    <div aria-hidden="true">{RIBBON}{RIBBON}</div>
  </div>
</section>

<section class="company" aria-labelledby="co-h">
  <canvas aria-hidden="true"></canvas>
  <span class="mark">{svg("wl")}</span>
  <div class="co-card" data-ins>
    <h2 id="co-h" data-in>The company</h2>
    <dl>
      <div data-in><dt>Legal name</dt><dd>{{LEGAL}}</dd></div>
      <div data-in><dt>NIPC</dt><dd>{{NIPC}}</dd></div>
      <div data-in><dt>Based in</dt><dd>Caldas da Rainha, Portugal</dd></div>
      <div data-in><dt>We make</dt><dd>Games, Moodle plugins, a World of Warcraft add&#8209;on</dd></div>
      <div data-in><dt>Where it runs</dt><dd>Steam and Android (coming soon), Moodle 4.1 or later</dd></div>
      <div data-in><dt>Languages</dt><dd>English and Portuguese</dd></div>
      <div data-in><dt>Privacy</dt><dd>No ads, no trackers, no data sold. <a href="privacy/">Read the policy</a></dd></div>
    </dl>
  </div>
</section>

<section class="field on-ink contact" id="contact" aria-labelledby="contact-h">
  <div data-ins>
    <h2 id="contact-h" data-in>Say hello</h2>
    <a class="mail" data-in href="mailto:{{EMAIL}}?subject=Hello%20Wildlogic">{{EMAIL}}</a>
    <div class="contact-row" data-in>
      <p>Questions about our games or plugins, press, or working together.</p>
      <dl>
        <div><dt>Where</dt><dd>Caldas da Rainha, Portugal</dd></div>
        <div><dt>We reply in</dt><dd>English, Português</dd></div>
        <div><dt>NIPC</dt><dd>{{NIPC}}</dd></div>
      </dl>
    </div>
  </div>
</section>
'''
page('index.html', 'Wildlogic | Games and software from Portugal',
     'Wildlogic is a studio in Caldas da Rainha, Portugal. We make Spirekeeper, Moodle plugins and the Quick Buffs add-on for World of Warcraft.',
     home, home=True, scripts='<script src="assets/vendor/motion-12.43.0.js" defer></script>\n<script src="assets/site.js" defer></script>\n')

# ------------------------------------------------------------------ spirekeeper
shots = [('shot-spires', 'Crystal Spires', 'Towers of every element hold a bridge in the Crystal Spires.'),
         ('shot-map', 'World map', 'The world map: ten painted lands, from a quiet village to the heart of the storm.'),
         ('shot-temple', 'Sunken Temple', 'Fusion towers defend the Sunken Temple.'),
         ('shot-heroes', 'Heroes', 'Pick a hero and grow their skill tree.'),
         ('shot-story', 'Story scene', 'Voiced story scenes between battles.'),
         ('shot-final', 'Final battle', 'The final battle against the Hollow King.')]
thumbs = '\n'.join(f'      <a href="{{R}}assets/img/{n}.webp" data-cap="{c}" aria-label="{s}"{" aria-current=\"true\"" if i == 0 else ""}><img src="{{R}}assets/img/{n}.webp" width="1600" height="900" alt="" loading="lazy"></a>' for i, (n, s, c) in enumerate(shots))
HEROES = [('ember', 'greenhollow', 'Ember', 'Fire', 518, 'The apprentice who survived. Brave, cheerful, and talks too much.'),
          ('ignis', 'cinder-throne', 'Ignis', 'Fire', 554, 'Furious at everything. Complains about every job, then does it perfectly.'),
          ('ysolde', 'frostmere', 'Ysolde', 'Ice', 588, 'Last Warden of the Water Spire. Plans everything and hates risks.'),
          ('volt', 'heart-of-the-storm', 'Volt', 'Lightning', 555, 'Sky-ship captain and storm chaser. Loves danger a little too much.'),
          ('gorran', 'mirewood', 'Gorran', 'Earth', 410, 'Warden of the Earth Spire. Slow, and impossible to move.')]
band = '\n'.join(f'    <li data-in><div class="fig"><img class="land" src="{{R}}assets/img/sk/land-{l}.webp" width="800" height="446" alt="" loading="lazy"><img src="{{R}}assets/img/sk/hero-{k}.webp" width="{w}" height="900" alt="{n}, painted portrait" loading="lazy"></div><h3>{n}</h3><p class="kind">{e}</p><p>{t}</p></li>' for k, l, n, e, w, t in HEROES)
LANDS = ['Greenhollow', 'Old Road', 'Sunscar Dunes', 'Glass Flats', 'Frostmere', 'Cinder Throne', 'Mirewood', 'Sunken Temple', 'Crystal Spires', 'Heart of the Storm']
lands = '\n'.join(f'    <li><img src="{{R}}assets/img/sk/land-{n.lower().replace(" ", "-")}.webp" width="800" height="446" alt="" loading="lazy"><span>{n}</span></li>' for n in LANDS)
sk = f'''
<section class="gk-hero" data-ins aria-labelledby="sk-title">
  <video class="gk-bg" muted loop playsinline preload="none" data-autoplay poster="{{R}}assets/video/rift-poster.jpg" tabindex="-1" aria-hidden="true"><source src="{{R}}assets/video/rift-loop.mp4" type="video/mp4"></video>
  <div class="gk-hero-in">
    <h1 data-in id="sk-title"><img src="{{R}}assets/img/sk/logo.webp" width="1400" height="174" alt="Spirekeeper"></h1>
    <p data-in class="gk-tag">A painted tower defense with a fully voiced story.</p>
    <div data-in class="gk-row"><a class="btn" href="#trailer">Watch the trailer</a><a class="btn line" href="#play">See how it plays</a></div>
  </div>
  <p data-in class="gk-status"><i></i>Coming soon to Steam and Android</p>
</section>
<nav class="chapters" aria-label="Parts of this page"><div>
  <a href="#trailer">Trailer</a><a href="#look">Screens</a><a href="#heroes">Heroes</a><a href="#story">Story</a><a href="#lands">Lands</a><a href="#play">Play</a>
</div></nav>
<section class="field on-ink gk" data-ins id="trailer" aria-labelledby="tr-h">
  <div class="rail"><h2 data-in id="tr-h">Trailer</h2><p data-in>Fifty seconds of the game. Watch the Rift open, the Spires wake and the Hollow King arrive.</p></div>
  <video data-in class="main trailer" controls playsinline preload="none" poster="{{R}}assets/video/trailer-poster.jpg" aria-label="Spirekeeper trailer"><source src="{{R}}assets/video/trailer.mp4" type="video/mp4"></video>
</section>
<section class="field gk" data-ins data-viewer id="look" aria-labelledby="look-h">
  <div class="rail"><h2 data-in id="look-h">Screens</h2><p data-in>Battles, the world map, the heroes and the story scenes. Pick a picture.</p>
    <div data-in class="thumbs">
{thumbs}
    </div></div>
  <figure data-in class="main viewer"><img src="{{R}}assets/img/{shots[0][0]}.webp" width="1600" height="900" alt="{shots[0][2]}"><figcaption aria-live="polite">{shots[0][2]}</figcaption></figure>
</section>
<section class="field on-ink gk" data-ins id="heroes" aria-labelledby="he-h">
  <div class="rail flat"><h2 data-in id="he-h">The band</h2></div>
  <p data-in class="main gk-lead">Five heroes, each with their own powers and a skill tree. Pick one for every battle.</p>
  <ul class="wide band">
{band}
  </ul>
</section>
<section class="gk-story" data-ins id="story" aria-labelledby="rift-h">
  <img class="gk-bg" src="{{R}}assets/img/sk/throne.webp" width="1920" height="1072" alt="The Hollow King on his throne" loading="lazy">
  <div class="gk-card">
    <h2 data-in id="rift-h">The Rift is open</h2>
    <p data-in class="gk-lead">For a thousand years five Elemental Spires kept the world in balance. Then the Hollow King tore the sky open.</p>
    <p data-in>He is not a shouting villain. He is calm, sad and completely sure he is right. He calls the grey silence he spreads peace. Only you can wake the Spires again.</p>
  </div>
</section>
<section class="field gk" data-ins id="lands" aria-labelledby="la-h">
  <div class="rail flat"><h2 data-in id="la-h">Ten painted lands</h2></div>
  <p data-in class="main gk-lead">From a quiet village to the heart of the storm. Every land weakens one element and favours another.</p>
  <ul data-in class="wide lands">
{lands}
  </ul>
</section>
<section class="field on-ink gk" data-ins id="play" aria-labelledby="play-h">
  <div class="rail"><h2 data-in id="play-h">How it plays</h2><p data-in>Build towers, fuse them, and change your plan when the land or the King changes the rules.</p></div>
  <div class="main">
  <ul class="nums" data-in>
    <li><b>7</b><span>elements</span></li><li><b>9</b><span>tower fusions</span></li><li><b>68</b><span>levels in 10 chapters</span></li><li><b>287</b><span>recorded voice lines</span></li>
  </ul>
  <div class="cols">
    <div data-in><h3>Build, fuse, adapt</h3><ul>
      <li>Towers of seven elements: Fire, Water, Earth, Air, Lightning, Nature and Dark.</li>
      <li>Fuse two towers into one of 9 fusions, then into 6 super towers.</li>
      <li>Three level 3 towers of one kind become a Paragon.</li></ul></div>
    <div data-in><h3>A story to fight through</h3><ul>
      <li>A villain who talks back while you play.</li>
      <li>Bosses, mini-bosses and the Hollow King, who curses your towers mid-battle.</li>
      <li>Voiced story scenes between battles.</li></ul></div>
    <div data-in><h3>Play your way</h3><ul>
      <li>Normal: earn stars and unlock the next land.</li>
      <li>Hard: pick the King's Pacts yourself for Heat and black skulls.</li>
      <li>20 Challenges, 26 draft cards, a talent tree and a shop.</li>
      <li>Survival mode with 1,000 waves after the campaign.</li></ul></div>
  </div>
  </div>
</section>
<section class="field gk gk-cta" data-ins aria-labelledby="cta-h">
  <h2 data-in class="wide" id="cta-h">Coming soon</h2>
  <p data-in class="wide gk-lead">To Steam and Android. Want to know when it is out? Write to us.</p>
  <div data-in class="wide gk-row"><a class="btn" href="mailto:{{EMAIL}}?subject=Spirekeeper">Ask about the game</a><a class="btn line" href="privacy/">Privacy policy</a></div>
</section>
'''
page('spirekeeper/index.html', 'Spirekeeper | A painted tower defense by Wildlogic',
     'Spirekeeper is a story-driven tower defense with seven elements, tower fusions, heroes and a fully voiced campaign. Coming soon to Steam and Android.', sk, nav_cur='sk', scripts='<script src="../assets/vendor/motion-12.43.0.js" defer></script>\n<script src="../assets/site.js" defer></script>\n')

skp = '''
<article class="doc">
  <h1>Spirekeeper privacy policy</h1>
  <p class="tldr">Spirekeeper does not collect, send or share any personal data. Your progress is saved only on your own device.<small>Last updated 11 November 2026. Applies to Spirekeeper on Android, Steam and the web.</small></p>
  <div class="body">
    <h2>Who we are</h2>
    <p>Spirekeeper is made and published by {LEGAL} (NIPC {NIPC}), Caldas da Rainha, Portugal. You can reach us at <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    <h2>What the game saves</h2>
    <p>The game keeps your progress and settings on your device, so you can carry on where you stopped: your levels, stars, unlocks, heroes and options like volume and quality. It never leaves your device unless you choose to copy a save code yourself.</p>
    <h2>What we do not collect</h2>
    <ul><li>No accounts, names or email addresses.</li><li>No ads and no advertising IDs.</li><li>No analytics, tracking or crash reports.</li><li>No location, contacts, photos, camera or microphone.</li></ul>
    <h2>Internet access on Android</h2>
    <p>The Android app has the standard internet permission. The game does not use it to send any data about you. It only matters if you tap a link that opens outside the game, such as this website.</p>
    <h2>Stores</h2>
    <p>When you download or buy Spirekeeper from Google Play, Steam or itch.io, that store handles your account and payment under its own privacy policy. We do not receive your payment details.</p>
    <h2>Children</h2>
    <p>The game collects no personal data from anyone, children included.</p>
    <h2>Deleting your data</h2>
    <p>Your save lives on your device, so you control it. On Android, uninstall the app or clear its storage in Settings. In a browser, clear the site data for the game. On Steam, delete the game's local files.</p>
    <h2>Your rights</h2>
    <p>Under the GDPR you may ask us any question about your data at <a href="mailto:{EMAIL}">{EMAIL}</a>. You can also complain to the Portuguese data protection authority, the <a href="https://www.cnpd.pt/" rel="noopener">CNPD</a>.</p>
    <h2>Changes</h2>
    <p>If the game ever starts handling personal data, we will update this page first and change the date.</p>
  </div>
</article>
'''
page('spirekeeper/privacy/index.html', 'Spirekeeper privacy policy | Wildlogic', 'How Spirekeeper handles your data: it collects none, and your progress stays on your device.', skp, nav_cur='sk')

sp = '''
<article class="doc">
  <h1>Privacy</h1>
  <p class="tldr">This website uses no cookies, no analytics and no trackers.<small>Last updated 11 November 2026. For the game, see the <a href="{R}spirekeeper/privacy/">Spirekeeper privacy policy</a>.</small></p>
  <div class="body">
    <h2>Who we are</h2>
    <p>{LEGAL} (NIPC {NIPC}), Caldas da Rainha, Portugal. Contact: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    <h2>Hosting</h2>
    <p>The site is hosted on GitHub Pages. Like any web host, GitHub may log your IP address for security, under the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub Privacy Statement</a>. Fonts, pictures and scripts load from this site itself, not from other companies.</p>
    <h2>Email</h2>
    <p>If you write to us, we use your email address and message only to reply. We delete them on request.</p>
    <h2>Your rights</h2>
    <p>You can ask to see, correct or delete anything we hold about you at <a href="mailto:{EMAIL}">{EMAIL}</a>. You can also complain to the Portuguese data protection authority, the <a href="https://www.cnpd.pt/" rel="noopener">CNPD</a>.</p>
  </div>
</article>
'''
page('privacy/index.html', 'Privacy | Wildlogic', 'This website uses no cookies, no analytics and no trackers.', sp)
page('404.html', 'Page not found | Wildlogic', 'This page does not exist.', '<article class="doc"><h1>This page wandered off</h1><p class="tldr">The link may be old or mistyped.<small><a href="/">Go to the home page</a></small></p></article>')
print('built')
