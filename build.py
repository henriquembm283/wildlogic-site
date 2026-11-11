"""Builds the Wildlogic site pages. Run: python3 build.py"""
import os
OUT = os.path.dirname(os.path.abspath(__file__))
EMAIL = 'wildlogiclda@gmail.com'
DOMAIN = 'https://wildlogic.pt'
LEGAL = 'WILDLOGIC - Sistemas de Informática, Unipessoal, Lda'
NIPC = '519107276'
svg = lambda n: open(f'{OUT}/assets/img/{n}.svg').read().replace('<svg ', '<svg aria-hidden="true" focusable="false" ')

def page(path, title, desc, body, nav_cur='', home=False, scripts=''):
    depth = path.count('/')
    r = '/' if path == '404.html' else '../' * depth
    url = DOMAIN + '/' + path.replace('index.html', '')
    cur = lambda k: ' aria-current="page"' if k == nav_cur else ''
    links = f'<a href="{r}spirekeeper/"{cur("sk")}>Spirekeeper</a><a href="{r or "./"}{"" if home else "index.html" if r != "/" else ""}#plugins">Plugins</a><a href="{r or "./"}{"" if home else "index.html" if r != "/" else ""}#contact">Contact</a>'
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
    <video muted loop playsinline preload="auto" poster="assets/video/rift-poster.jpg" aria-hidden="true" tabindex="-1"><source src="assets/video/rift-loop.mp4" type="video/mp4"></video>
    <canvas aria-hidden="true"></canvas>
    <div role="img" aria-label="Wild Logic"><span class="word word-wild">{svg("wild")}</span><span class="word word-logic">{svg("logic")}</span></div>
    <div class="hero-say">
      <h1 id="title">Wildlogic makes games and tools</h1>
      <p>A studio in Caldas da Rainha, Portugal: one painted game, three Moodle plugins and add-ons for World of Warcraft.</p>
      <a class="btn" href="#work">See what we make</a>
    </div>
    <p class="hero-turn">Half of what we make is wild. The other half is logic.</p>
  </div>
</section>

<section class="show" id="spirekeeper" data-stage="0" aria-labelledby="show-h">
  <div class="show-stage">
    <h2 class="show-h" id="show-h"><span class="a">Spirekeeper is</span> <span class="b">the wild half</span></h2>
    <div class="show-frame"><img src="assets/img/sk-poster.webp" width="716" height="896" alt="Spirekeeper key art: the heroes Ysolde, Ignis, Ember and Volt under a torn violet sky"></div>
    <ul class="show-side show-facts">
      <li><b>68</b><span>levels across ten painted lands</span></li>
      <li><b>7</b><span>elements to build and fuse</span></li>
      <li><b>287</b><span>recorded voice lines</span></li>
    </ul>
    <div class="show-side show-cap">
      <p>A tower defense with a fully voiced story. Build towers of seven elements, fuse them, and stop the Hollow King. Coming soon to Steam and Android.</p>
      <a class="btn" href="spirekeeper/">Open the Spirekeeper page</a>
    </div>
  </div>
</section>

<section class="field work" id="work" aria-labelledby="work-h">
  <div class="work-rail" aria-hidden="true"><div class="work-hold">
  <div class="work-sq">
    <div class="pics">
      <img data-k="sk" src="assets/img/sq-spirekeeper.webp" width="900" height="900" alt="" loading="lazy">
      <img data-k="ar" src="assets/img/sq-autorules.webp" width="900" height="900" alt="" loading="lazy">
      <img data-k="tr" src="assets/img/sq-teamreports.webp" width="900" height="900" alt="" loading="lazy">
      <div class="tile" data-k="da">{svg("wl")}</div>
      <div class="tile" data-k="wow">{svg("wl")}</div>
    </div>
  </div>
  <span class="work-fact l"></span><span class="work-fact r"></span>
  </div></div>
  <h2 id="work-h">Everything</h2>
  <ul class="work-list">
    <li data-k="sk" data-kind="Game" data-state="Coming soon"><a href="spirekeeper/">Spirekeeper</a></li>
    <li data-k="ar" data-kind="Moodle plugin" data-state="Free and Pro"><a href="#plugins">Automation Rules</a></li>
    <li data-k="tr" data-kind="Moodle plugin" data-state="Free and Pro"><a href="#plugins">Team Reports</a></li>
    <li data-k="da" data-kind="Moodle plugin" data-state="Free and Pro"><a href="#plugins">Domain Access</a></li>
    <li data-k="wow" data-kind="World of Warcraft" data-state="List coming soon"><a href="#contact">WoW add-ons</a></li>
  </ul>
</section>

<section class="field on-ink" id="plugins" aria-labelledby="plug-h">
  <div class="plug" data-ins>
    <div class="plug-pic" data-in>
      <img class="on" data-k="ar" data-ui src="assets/img/ui-autorules.webp" width="1280" height="880" alt="Automation Rules: a rule that messages learners who have not opened a course for 7 days" loading="lazy">
      <img data-k="tr" data-ui src="assets/img/ui-teamreports.webp" width="1300" height="890" alt="Team Reports: preview of a weekly report listing learners with overdue courses" loading="lazy">
      <div class="ui" data-k="da" data-ui>
        <p class="ui-h">Pending signups</p>
        <table>
          <tr><th>Email</th><th>Domain list</th><th>Result</th></tr>
          <tr><td>ana@example.org</td><td>Allow</td><td><span class="tag ok">Approved</span></td></tr>
          <tr><td>rui@partner.example</td><td>Temporary</td><td><span class="tag tmp">30 days</span></td></tr>
          <tr><td>x@spam.example</td><td>Deny</td><td><span class="tag no">Refused</span></td></tr>
          <tr><td>eva@other.example</td><td>No list</td><td><span class="tag wait">Waits for approver</span></td></tr>
        </table>
      </div>
      <div class="tile-wl" data-k="wow">{svg("wl")}</div>
    </div>
    <div class="plug-body">
      <h2 id="plug-h" data-in>The logic half</h2>
      <p data-in>Plugins for schools and training teams that run Moodle 4.1 or later. Each has a free edition and a Pro edition.</p>
      <ul class="plug-list" data-in>
        <li class="on" data-k="ar"><button type="button" aria-expanded="true">Automation Rules <small>Moodle</small></button>
          <div class="plug-desc"><div><p>"When this happens, do that." Nudge learners who stop showing up, chase assignments before they are late, and enrol people in the next course on their path.</p></div></div></li>
        <li data-k="tr"><button type="button" aria-expanded="false">Team Reports <small>Moodle</small></button>
          <div class="plug-desc"><div><p>Each manager gets a short email about their own team: who started, who is overdue, who went quiet. The full list arrives as a spreadsheet. No report builder needed.</p></div></div></li>
        <li data-k="da"><button type="button" aria-expanded="false">Domain Access <small>Moodle</small></button>
          <div class="plug-desc"><div><p>People sign up with their work email. Lists of allowed, blocked and temporary email domains decide who gets an account, so nobody approves each one by hand.</p></div></div></li>
        <li data-k="wow"><button type="button" aria-expanded="false">WoW add-ons <small>World of Warcraft</small></button>
          <div class="plug-desc"><div><p>Add-ons that make life in Azeroth a little easier. The list is on its way to this page.</p></div></div></li>
      </ul>
    </div>
  </div>
</section>

<section class="field" id="studio" aria-labelledby="studio-h">
  <div class="studio" data-ins>
    <h2 id="studio-h" data-in>One small studio</h2>
    <div class="studio-mark" data-in>{svg("wl")}</div>
    <div class="studio-text">
      <p data-in>Wildlogic designs, builds and publishes its own games and tools. No ads in anything we make, and we never sell anyone's data.</p>
      <table class="facts" data-in>
        <tr><th scope="row">Company</th><td>{{LEGAL}}</td></tr>
        <tr><th scope="row">NIPC</th><td>{{NIPC}}</td></tr>
        <tr><th scope="row">Based in</th><td>Caldas da Rainha, Portugal</td></tr>
        <tr><th scope="row">Languages</th><td>English and Portuguese</td></tr>
      </table>
    </div>
  </div>
</section>

<section class="contact" id="contact" aria-labelledby="contact-h">
  <img src="assets/img/sk-sky.webp" width="2400" height="775" alt="Painted night sky from Spirekeeper, with a violet rift above two glowing spires" loading="lazy">
  <div class="card">
    <h2 id="contact-h">Say hello</h2>
    <a class="mail" href="mailto:{{EMAIL}}">{{EMAIL}}</a>
    <p>Questions about our games or plugins, press, or working together.</p>
    <dl>
      <div><dt>Where</dt><dd>Caldas da Rainha, Portugal</dd></div>
      <div><dt>We reply in</dt><dd>English, Português</dd></div>
      <div><dt>NIPC</dt><dd>{{NIPC}}</dd></div>
    </dl>
    <a class="btn" href="mailto:{{EMAIL}}?subject=Hello%20Wildlogic">Write to us</a>
  </div>
</section>
'''
page('index.html', 'Wildlogic | Games and software from Portugal',
     'Wildlogic is a studio in Caldas da Rainha, Portugal. We make Spirekeeper, Moodle plugins and World of Warcraft add-ons.',
     home, home=True, scripts='<script src="assets/vendor/motion-12.43.0.js" defer></script>\n<script src="assets/site.js" defer></script>\n')

# ------------------------------------------------------------------ spirekeeper
shots = [('shot-spires', 'Towers of every element hold a bridge in the Crystal Spires.'),
         ('shot-map', 'The world map: ten painted lands, from a quiet village to the heart of the storm.'),
         ('shot-temple', 'Fusion towers defend the Sunken Temple.'),
         ('shot-heroes', 'Pick a hero and grow their skill tree.'),
         ('shot-story', 'Voiced story scenes between battles.'),
         ('shot-final', 'The final battle against the Hollow King.')]
figs = '\n'.join(f'    <figure><img src="{{R}}assets/img/{n}.webp" width="1600" height="900" alt="{c}" loading="lazy"><figcaption>{c}</figcaption></figure>' for n, c in shots)
sk = f'''
<section class="g-hero" aria-labelledby="sk-title">
  <img class="bg" src="{{R}}assets/img/sk-sky.webp" width="2400" height="775" alt="" fetchpriority="high">
  <div>
    <h1 id="sk-title"><img class="logo" src="{{R}}assets/img/sk-logo.webp" width="1280" height="720" alt="Spirekeeper"></h1>
    <p>A painted tower defense with a fully voiced story. Coming soon to Steam and Android.</p>
    <div class="row"><a class="btn" href="mailto:{{EMAIL}}?subject=Spirekeeper">Ask about the game</a><a href="privacy/">Privacy policy</a></div>
  </div>
</section>
<section class="field on-ink" aria-labelledby="look-h">
  <h2 class="g-h2" id="look-h">A look inside</h2>
  <div class="shots" tabindex="0" role="region" aria-label="Screenshots, scroll sideways">
{figs}
  </div>
</section>
<section class="field" aria-labelledby="rift-h">
  <h2 class="g-h2" id="rift-h">The Rift is open</h2>
  <p class="lede">For a thousand years five Elemental Spires kept the world in balance. Then the Hollow King tore the sky open. Only you can wake the Spires again.</p>
  <div class="cols">
    <div><h3>Build, fuse, adapt</h3><ul>
      <li>Towers of seven elements: Fire, Water, Earth, Air, Lightning, Nature and Dark.</li>
      <li>Fuse two towers into one of 9 fusions, then into 6 super towers.</li>
      <li>Three level 3 towers of one kind become a Paragon.</li>
      <li>Every land weakens one element and favours another.</li></ul></div>
    <div><h3>A story to fight through</h3><ul>
      <li>10 chapters and 68 levels.</li>
      <li>287 recorded voice lines, and a villain who talks back while you play.</li>
      <li>Bosses, mini-bosses and the Hollow King, who curses your towers mid-battle.</li>
      <li>Heroes Ember, Ignis, Ysolde, Volt and Gorran, each with powers and a skill tree.</li></ul></div>
    <div><h3>Play your way</h3><ul>
      <li>Normal: earn stars and unlock the next land.</li>
      <li>Hard: pick the King's Pacts yourself for Heat and black skulls.</li>
      <li>20 Challenges, 26 draft cards, a talent tree and a shop.</li>
      <li>Survival mode with 1,000 waves after the campaign.</li></ul></div>
  </div>
</section>
'''
page('spirekeeper/index.html', 'Spirekeeper | A painted tower defense by Wildlogic',
     'Spirekeeper is a story-driven tower defense with seven elements, tower fusions, heroes and a fully voiced campaign. Coming soon to Steam and Android.', sk, nav_cur='sk')

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
