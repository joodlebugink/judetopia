// Button eyes: a side quest. They're scattered across every page; click one to collect it.
(() => {
  // One photo per button (assets/img/buttons/eye-01…23.webp are in play); return null to draw a stand-in instead.
  const COUNT = 23;
  const art = i => `assets/img/buttons/eye-${String(i + 1).padStart(2, '0')}.webp`;

  // listed in the panel in menu order
  const PAGES = {
    home: { name: 'Home', href: 'index.html' },
    zines: { name: 'Joodlebug Ink', href: 'zines.html' },
    artifacts: { name: 'Wares', href: 'artifacts.html' },
    bug: { name: 'BOTW', href: 'bug.html' },
    tarot: { name: 'Tarot', href: 'tarot.html' },
    tuba: { name: "Tuba's Corner", href: 'tuba.html' },
  };

  // [selector, nth match, x, y] — x/y are fractions of that element's box
  const SPOTS = {
    zines: [
      ['.page-head h1', 0, -.25, .5], ['#alien-mode .blurb h2', 0, -.06, .35], ['#alien-mode', 0, .92, .1], ['#emergence .pages', 0, .95, .06],
      ['#alien-mode .reader-ui', 0, .9, .5], ['#emergence .blurb h2', 0, 1.06, .6], ['.shelf li', 2, 1.2, .5], ['.site-foot', 0, .14, .55],
      ['#alien-mode .pages', 0, .04, .96], ['#emergence .reader-ui', 0, .1, .5], ['.foot-mark', 0, 1.05, .1], ['#alien-mode .blurb p', 0, 1.04, .5],
      ['.site-foot', 0, .86, .3], ['.logo', 0, 1.06, .3],
    ],
    artifacts: [
      ['.charms-logo', 0, .95, .12], ['.product', 0, .82, .9], ['.charms-logo', 0, .08, .86], ['.product', 2, .9, .07],
      ['.etsy', 0, 1.12, .5], ['.market-photos img', 0, .92, .96], ['.market-photos img', 1, .9, -.04], ['.product', 1, .78, .1],
      ['.product', 3, .15, .5], ['.site-foot', 0, .8, .45], ['.logo', 0, 1.06, .3],
    ],
    tuba: [
      ['.hell-title', 0, .96, .25], ['.inferno', 0, .07, .55], ['.bubble', 0, .92, .04], ['.inferno', 0, .05, .3],
      ['.inferno', 0, .22, .93], ['.inferno', 0, .93, .42], ['.halo', 0, .5, .5], ['.inferno', 0, .64, .16],
      ['.inferno', 0, .76, .95], ['.inferno', 0, .5, .985], ['.site-foot', 0, .8, .5],
    ],
    bug: [
      ['.page-head h1', 0, .99, .12], ['.feature', 0, .03, .05], ['.scrap', 0, .9, .15], ['.fact', 0, .96, .88],
      ['.beetle', 0, .86, .22], ['.scrap', 2, .9, .62], ['.feature', 0, .97, .95], ['.archive-label', 0, .35, .5],
      ['.scrap', 1, .92, .58], ['.scrap', 3, .9, .2], ['.feature', 0, .5, -.05], ['.site-foot', 0, .2, .6],
    ],
    tarot: [
      ['.page-head h1', 0, 1.08, .4], ['.card', 0, 1.14, .82], ['.jazzy', 0, .12, .18], ['.meaning', 0, .04, .72],
      ['.credit-line', 0, .92, -.9], ['.site-foot', 0, .15, .45], ['.logo', 0, 1.06, .3],
    ],
    home: [
      ['.stage', 0, .12, .2], ['.stage', 0, .87, .3], ['.stage', 0, .06, .95], ['.stage', 0, .94, .95],
    ],
  };

  // deal spots round-robin so every page gets its share
  const order = [];
  const queues = ['zines', 'artifacts', 'bug', 'tarot', 'tuba', 'home'].map(p => SPOTS[p].map(s => [p, ...s]));
  while (queues.some(q => q.length)) queues.forEach(q => q.length && order.push(q.shift()));
  const buttons = order.slice(0, COUNT).map(([page, sel, nth, x, y], i) => ({ id: 'b' + i, i, page, sel, nth, x, y }));

  const KEY = 'judetopia.buttonEyes.v1';
  const MUTE = 'judetopia.buttonEyes.muted';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  // forget saved finds for buttons that are no longer in play (e.g. after COUNT shrinks)
  const got = new Set(read(KEY, []).filter(id => buttons.some(b => b.id === id)));
  write(KEY, [...got]);
  let muted = read(MUTE, false);
  const here = document.body.dataset.page;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['--pink', '--mint', '--sky', '--butter', '--peach', '--lilac', '--hot', '--leaf', '--salmon', '--aqua'];

  // ---------- sound: each find plays the next note of a pentatonic scale ----------
  let ac;
  const audio = () => (ac ??= new (window.AudioContext || window.webkitAudioContext)());
  const blip = (f0, f1, t, dur, type, vol) => {
    const c = audio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(dur, .09));
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + .02);
  };
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const pop = n => {
    if (muted) return;
    const t = audio().currentTime;
    const f = 392 * 2 ** (SCALE[(n - 1) % SCALE.length] / 12);
    blip(f * 2.2, f, t, .14, 'sine', .3);
    blip(f * 2, f * 2, t + .07, .4, 'triangle', .1);
  };
  const fanfare = () => {
    if (muted) return;
    const t = audio().currentTime;
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => blip(523 * 2 ** (s / 12), 523 * 2 ** (s / 12), t + i * .09, .5, 'triangle', .14));
  };

  // ---------- the tin (counter + collection) ----------
  const hud = document.createElement('div');
  hud.className = 'be-hud';
  hud.innerHTML = `
    <p class="be-toast" role="status"></p>
    <section class="be-panel" id="be-panel" aria-label="Button eye collection" hidden>
      <div class="be-top"><h2>Button eyes</h2><button type="button" class="be-x" aria-label="Close"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>
      <p class="be-sum"></p>
      <ul class="be-where"></ul>
      <ol class="be-grid"></ol>
      <div class="be-foot"><button type="button" class="be-mute"></button><button type="button" class="be-reset">start over</button></div>
    </section>
    <button type="button" class="be-tin" aria-controls="be-panel" aria-expanded="false"><span class="be-ico drawn" style="--c: var(--hot)" aria-hidden="true"></span><span class="be-count"></span></button>`;
  document.body.append(hud);
  const $ = s => hud.querySelector(s);
  const tin = $('.be-tin');
  const panel = $('.be-panel');
  const toast = $('.be-toast');

  const face = (b, el) => {
    const src = art(b.i);
    if (src) el.innerHTML = `<img src="${src}" alt="" draggable="false">`;
    else { el.classList.add('drawn'); el.style.setProperty('--c', `var(${COLORS[b.i % COLORS.length]})`); }
    el.style.setProperty('--r', `${(b.i * 47) % 70 - 35}deg`);
  };

  const render = () => {
    const n = got.size;
    hud.hidden = n === 0;
    $('.be-count').textContent = `${n}/${buttons.length}`;
    tin.setAttribute('aria-label', `Button eyes collected: ${n} of ${buttons.length}. Open collection.`);
    $('.be-sum').textContent = n === buttons.length
      ? 'Every button eye found. Jazzy-approved.'
      : `${n} of ${buttons.length} found. They're scattered all over the site.`;
    $('.be-where').innerHTML = Object.entries(PAGES).map(([key, p]) => {
      const all = buttons.filter(b => b.page === key);
      const mine = all.filter(b => got.has(b.id)).length;
      const done = mine === all.length ? ' class="done"' : '';
      return `<li${done}><a href="${p.href}">${p.name}</a><span>${mine} / ${all.length}</span></li>`;
    }).join('');
    const grid = $('.be-grid');
    grid.innerHTML = '';
    buttons.forEach(b => {
      const li = document.createElement('li');
      if (got.has(b.id)) { const s = document.createElement('span'); s.className = 'be-mini'; face(b, s); li.append(s); }
      grid.append(li);
    });
    $('.be-mute').textContent = muted ? 'sound: off' : 'sound: on';
    document.documentElement.classList.toggle('be-complete', n === buttons.length);
  };

  const say = (msg, ms = 3800) => {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(say.t);
    say.t = setTimeout(() => toast.classList.remove('on'), ms);
  };

  const open = show => {
    panel.hidden = !show;
    tin.setAttribute('aria-expanded', String(show));
  };
  tin.addEventListener('click', () => open(panel.hidden));
  $('.be-x').addEventListener('click', () => { open(false); tin.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { open(false); tin.focus(); } });
  $('.be-mute').addEventListener('click', () => { muted = !muted; write(MUTE, muted); render(); });
  const reset = $('.be-reset');
  reset.addEventListener('click', () => {
    if (!reset.classList.contains('sure')) {
      reset.classList.add('sure');
      reset.textContent = 'tap again to scatter them';
      setTimeout(() => { reset.classList.remove('sure'); reset.textContent = 'start over'; }, 3000);
      return;
    }
    got.clear();
    write(KEY, []);
    location.reload();
  });

  // ---------- the buttons on this page ----------
  const layer = document.createElement('div');
  layer.className = 'be-layer';
  if (here === 'home') layer.classList.add('in-the-dark');
  document.body.append(layer);

  const live = buttons.filter(b => b.page === here && !got.has(b.id)).map(b => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'be';
    node.setAttribute('aria-label', 'A button eye. Collect it.');
    face(b, node);
    node.addEventListener('click', () => collect(b, node));
    layer.append(node);
    return { ...b, node };
  });

  const place = () => {
    const W = document.documentElement.clientWidth;
    const size = parseFloat(getComputedStyle(layer).getPropertyValue('--be-size')) || 42;
    live.forEach(b => {
      if (!b.node.isConnected) return;
      const anchor = document.querySelectorAll(b.sel)[b.nth];
      const r = anchor?.getBoundingClientRect();
      if (!r || (!r.width && !r.height)) { b.node.hidden = true; return; }
      b.node.hidden = false;
      const x = Math.max(6, Math.min(W - size - 6, r.left + scrollX + r.width * b.x - size / 2));
      const y = r.top + scrollY + r.height * b.y - size / 2;
      b.node.style.left = `${x}px`;
      b.node.style.top = `${y}px`;
    });
  };

  const collect = (b, node) => {
    if (got.has(b.id)) return;
    got.add(b.id);
    write(KEY, [...got]);
    pop(got.size);
    const first = got.size === 1;
    render();
    const from = node.getBoundingClientRect();
    const to = tin.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const land = () => {
      node.remove();
      tin.animate([{ scale: 1 }, { scale: 1.25 }, { scale: 1 }], { duration: 320, easing: 'ease-out' });
      if (got.size === buttons.length) finish();
      else if (first) say(`You found a button eye! ${buttons.length - 1} more are scattered around the site.`, 5200);
    };
    node.disabled = true;
    if (still) return land();
    node.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${dx * .35}px, ${dy * .35 - 90}px) scale(1.7)`, offset: .35 },
      { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: .4 },
    ], { duration: 780, easing: 'cubic-bezier(.45, 0, .3, 1)', fill: 'forwards' }).finished.then(land);
  };

  const finish = () => {
    fanfare();
    open(true);
    say('Every single button eye. Tuba is impressed.', 6000);
    if (still) return;
    const t = tin.getBoundingClientRect();
    for (let k = 0; k < 18; k++) {
      const s = document.createElement('span');
      s.className = 'be-mini be-burst';
      face(buttons[k % buttons.length], s);
      s.style.left = `${t.left + t.width / 2}px`;
      s.style.top = `${t.top + t.height / 2}px`;
      document.body.append(s);
      const a = (k / 18) * Math.PI * 2;
      const d = 120 + (k % 3) * 50;
      s.animate([
        { transform: 'translate(-50%, -50%) scale(.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 60}px)) scale(1.1) rotate(${k * 40}deg)`, opacity: 0 },
      ], { duration: 1100, easing: 'cubic-bezier(.2, .7, .3, 1)' }).finished.then(() => s.remove());
    }
  };

  render();
  place();
  addEventListener('resize', place);
  addEventListener('load', place);
  document.fonts?.ready.then(place);
  new ResizeObserver(place).observe(document.body);
})();
