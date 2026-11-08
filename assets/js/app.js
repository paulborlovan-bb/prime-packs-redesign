/* ==========================================================================
   PrimePacks – Redesign proposal 2026
   Shared chrome (header, cart, search, footer, accent switcher) + page logic.
   Works from file:// and from GitHub Pages. Data: data/products.js
   ========================================================================== */
(() => {
  'use strict';

  const P = (window.PP_PRODUCTS || []).slice();
  const byHandle = new Map(P.map(p => [p.h, p]));
  const LIVE = 'https://prime-packs.at';

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const imgUrl = (u, w) => (u ? u + (u.includes('?') ? '&' : '?') + 'width=' + w : '');
  const EUR = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' });
  const money = v => EUR.format(v);
  const priceHTML = v => {
    const s = EUR.format(v);
    const m = s.match(/^(.*?)(,\d{2})(.*)$/);
    return m ? `${esc(m[1])}<small>${m[2]}</small>${esc(m[3])}` : esc(s);
  };
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  const params = () => new URLSearchParams(location.search);
  const productUrl = p => `product.html?p=${encodeURIComponent(p.h)}`;
  const shopUrl = cat => (cat ? `products.html?cat=${cat}` : 'products.html');
  const hasImg = p => p.imgs && p.imgs.length;

  /* ---------- Icons ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bag: '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    menu: '<path d="M4 9h16M4 15h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowUR: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    truck: '<path d="M2.5 6.5h11v9.5h-11zM13.5 9.5h4l3 3.2v3.3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    ret: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
    seal: '<path d="M12 2.8 14.4 5l3.2-.4.6 3.2 2.8 1.6-1.4 2.9 1.4 2.9-2.8 1.6-.6 3.2-3.2-.4L12 21.2 9.6 19l-3.2.4-.6-3.2L3 14.6l1.4-2.9L3 8.8l2.8-1.6.6-3.2 3.2.4Z"/><path d="m9 12 2 2 4-4"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 10h8M8 13h5"/>'
  };
  const icon = (n, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${cls ? ` class="${cls}"` : ''}>${ICONS[n] || ''}</svg>`;
  /* Original PrimePacks logo (from prime-packs.at) – stays the same in every accent */
  const LOGO = '<img src="assets/img/logo.png" alt="" width="539" height="594">';

  /* ---------- Categories (same order as the live menu) ---------- */
  const CATS = [
    { id: 'christmas', name: 'Christmas', long: 'Weihnachten 2026', desc: 'Geschenke für Sammler, Gamer und die ganze Familie.' },
    { id: 'pokemon', name: 'Pokémon', long: 'Pokémon TCG', desc: 'Booster, Top Trainer Boxen und Kollektionen – Deutsch & Englisch.' },
    { id: 'tcg', name: 'Weitere TCGs', long: 'Weitere TCGs', desc: 'One Piece Card Game Displays und mehr.' },
    { id: 'elektronik', name: 'Elektronik & Audio', long: 'Elektronik & Audio', desc: 'Aktuelle Ausrüstung: Kameras, Konsolen, Tonies.' },
    { id: 'legami', name: 'Legami', long: 'Legami', desc: 'Lifestyle-Zubehör und Schreibwaren.' },
    { id: 'vorbestellungen', name: 'Vorbestellungen', long: 'Vorbestellungen', desc: 'Die nächsten großen Drops – jetzt sichern.' },
    { id: 'angebote', name: 'Angebote', long: 'Angebote', desc: 'Reduzierte Produkte, solange der Vorrat reicht.' }
  ];
  const catById = id => CATS.find(c => c.id === id);
  const countCat = id => P.filter(p => p.cats.includes(id)).length;
  /* Same order the live "Andere kauften auch" chain uses */
  const CHAIN = ['pokemon', 'tcg', 'elektronik', 'legami', 'christmas'];
  const primaryCat = p => CHAIN.find(c => p.cats.includes(c)) || p.cats[0] || null;

  const status = p => {
    if (p.cats.includes('vorbestellungen')) return { cls: 'warn', t: 'Vorbestellung' };
    if (p.stock > 0) return { cls: 'ok', t: `${p.stock} auf Lager` };
    return null;
  };
  const salePct = p => (p.compare ? Math.round((1 - p.price / p.compare) * 100) : 0);
  const langName = l => (l === 'EN' ? 'Englisch' : l === 'DE' ? 'Deutsch' : '');

  /* ---------- Product card ---------- */
  function card(p, opts = {}) {
    const st = status(p);
    const sale = salePct(p);
    const tags = [];
    if (sale) tags.push(`<span class="chip chip--accent">−${sale} %</span>`);
    if (st) tags.push(`<span class="chip chip--${st.cls}"><span class="dot dot--${st.cls}" aria-hidden="true"></span>${esc(st.t)}</span>`);
    if (p.lang) tags.push(`<span class="chip"><span class="sr-only">Sprache: </span>${p.lang}</span>`);
    if (p.damaged) tags.push('<span class="chip chip--warn">OVP beschädigt</span>');
    const media = hasImg(p)
      ? `<img src="${imgUrl(p.imgs[0].u, 600)}" alt="" width="600" height="600" loading="${opts.eager ? 'eager' : 'lazy'}" decoding="async">`
      : icon('box');
    const H = opts.h || 'h3';
    return `<article class="pcard${opts.reveal ? ' reveal' : ''}">
      <div class="pcard__media">${tags.length ? `<div class="pcard__tags">${tags.join('')}</div>` : ''}${media}</div>
      <div class="pcard__body">
        <p class="pcard__type">${esc(p.type || p.vendor)}</p>
        <${H} class="pcard__title"><a href="${productUrl(p)}">${esc(p.t)}</a></${H}>
        <div class="pcard__foot">
          <p class="pcard__price">${p.compare ? `<span class="price--old"><span class="sr-only">Statt </span>${money(p.compare)}</span>` : ''}<span class="price">${p.compare ? '<span class="sr-only">Jetzt </span>' : ''}${priceHTML(p.price)}</span></p>
          <button class="icon-btn icon-btn--accent pcard__add" type="button" data-add="${esc(p.h)}" aria-label="${esc(p.t)} in den Warenkorb legen">${icon('plus')}</button>
        </div>
      </div>
    </article>`;
  }

  /* ==========================================================================
     Shared chrome
     ========================================================================== */
  const page = document.body.dataset.page || '';
  const curCat = page === 'list' ? params().get('cat') || '' : '';

  function headerHTML() {
    const navItems = [`<li><a href="products.html"${page === 'list' && !curCat ? ' aria-current="page"' : ''}>Shop</a></li>`]
      .concat(CATS.map(c => `<li><a href="${shopUrl(c.id)}"${curCat === c.id ? ' aria-current="page"' : ''}${c.id === 'christmas' ? ' class="is-xmas"' : ''}>${esc(c.name)}</a></li>`));
    return `
    <a class="skip-link" href="#main">Zum Inhalt springen</a>
    <div class="announce" role="region" aria-label="Service-Hinweise">
      <div class="wrap announce__inner">
        <span class="announce__item"><span class="dot dot--ok" aria-hidden="true"></span>100 % Original · Factory Sealed</span>
        <span class="announce__item">Versand aus Österreich · EU-weit</span>
        <span class="announce__item">Gratis Rücksendung ab 40 €</span>
        <span class="announce__item">Antwort innerhalb 24 h</span>
      </div>
    </div>
    <header class="site-header">
      <div class="wrap site-header__inner">
        <a class="logo" href="index.html" aria-label="PrimePacks – zur Startseite">${LOGO}<span><b>PrimePacks</b></span></a>
        <nav class="main-nav" aria-label="Hauptnavigation"><ul>${navItems.join('')}</ul></nav>
        <div class="header-actions">
          <button class="icon-btn" type="button" data-open="search" aria-haspopup="dialog" aria-label="Suche öffnen">${icon('search')}</button>
          <button class="icon-btn" type="button" data-open="cart" aria-haspopup="dialog" aria-label="Warenkorb öffnen" data-cart-btn>${icon('bag')}<span class="badge" data-cart-count aria-hidden="true"></span></button>
          <button class="icon-btn menu-toggle" type="button" data-open="menu" aria-haspopup="dialog" aria-label="Menü öffnen">${icon('menu')}</button>
        </div>
      </div>
    </header>`;
  }

  function dialogsHTML() {
    const mobileLinks = [`<a href="products.html">Alle Produkte <span class="count">${P.length}</span></a>`]
      .concat(CATS.map(c => `<a href="${shopUrl(c.id)}"${curCat === c.id ? ' aria-current="page"' : ''}>${esc(c.name)} <span class="count">${countCat(c.id)}</span></a>`));
    return `
    <dialog class="sheet sheet--top" id="dlg-search" aria-labelledby="search-title">
      <div class="wrap" style="padding-block:20px 28px">
        <div class="sheet__head" style="padding:0 0 16px;border:0">
          <h2 class="label" id="search-title"><span class="dot" aria-hidden="true"></span>Suche</h2>
          <button class="icon-btn" type="button" data-close aria-label="Suche schließen">${icon('close')}</button>
        </div>
        <form class="search-form" role="search" action="products.html" method="get">
          <label class="field">${icon('search')}<span class="sr-only">Produkte durchsuchen</span>
            <input type="search" name="q" id="search-input" placeholder="z. B. Top Trainer Box, One Piece, Canon …" autocomplete="off" aria-describedby="search-hint">
          </label>
          <button class="btn btn--primary" type="submit">Suchen</button>
        </form>
        <p class="sr-only" id="search-hint">Ergebnisse erscheinen während der Eingabe unter dem Suchfeld.</p>
        <div class="search-results" id="search-results"></div>
        <p class="sr-only" role="status" id="search-status"></p>
      </div>
    </dialog>

    <dialog class="sheet sheet--right" id="dlg-cart" aria-labelledby="cart-title">
      <div class="sheet__inner">
        <div class="sheet__head">
          <h2 class="label" id="cart-title"><span class="dot" aria-hidden="true"></span>Warenkorb <span data-cart-count-text></span></h2>
          <button class="icon-btn" type="button" data-close aria-label="Warenkorb schließen">${icon('close')}</button>
        </div>
        <div class="sheet__body" id="cart-body"></div>
        <div class="sheet__foot" id="cart-foot"></div>
      </div>
    </dialog>

    <dialog class="sheet sheet--left" id="dlg-menu" aria-labelledby="menu-title">
      <div class="sheet__inner">
        <div class="sheet__head">
          <h2 class="label" id="menu-title"><span class="dot" aria-hidden="true"></span>Menü</h2>
          <button class="icon-btn" type="button" data-close aria-label="Menü schließen">${icon('close')}</button>
        </div>
        <nav class="sheet__body mobile-nav" aria-label="Kategorien">${mobileLinks.join('')}</nav>
        <div class="sheet__foot">
          <a class="btn btn--ghost btn--block" href="mailto:kontakt@prime-packs.at">${icon('mail')}kontakt@prime-packs.at</a>
        </div>
      </div>
    </dialog>

    <div class="toast-region" id="toasts" role="status" aria-live="polite"></div>

    <div class="proposal" id="proposal">
      <div class="proposal__panel" id="proposal-panel" hidden>
        <fieldset class="two">
          <legend>Design-Vorschlag · Variante</legend>
          <label class="swatch-opt"><input type="radio" name="pp-theme" value="dark"><span class="sw" style="background:#09090b" aria-hidden="true"></span><span>Dunkel<small>Variante 1</small></span></label>
          <label class="swatch-opt"><input type="radio" name="pp-theme" value="light"><span class="sw" style="background:#f2f2f0" aria-hidden="true"></span><span>Hell<small>Variante 2</small></span></label>
        </fieldset>
        <fieldset>
          <legend>Akzentfarbe</legend>
          <label class="swatch-opt"><input type="radio" name="pp-accent" value="blue"><span class="sw" style="background:#325fec" aria-hidden="true"></span><span>Blau<small>PrimePacks Marke</small></span></label>
          <label class="swatch-opt"><input type="radio" name="pp-accent" value="red"><span class="sw" style="background:#e0281b" aria-hidden="true"></span><span>Rot<small>Moodboard PayHot</small></span></label>
          <label class="swatch-opt"><input type="radio" name="pp-accent" value="mint"><span class="sw" style="background:#00ffcc" aria-hidden="true"></span><span>Mint<small>Moodboard Vare</small></span></label>
        </fieldset>
        <p class="proposal__note">Redesign-Vorschlag für prime-packs.at. Echte Produkte, Preise und Texte aus dem Shop (Stand 08.11.2026). Der Warenkorb ist eine Demo.</p>
      </div>
      <button class="proposal__toggle" type="button" aria-expanded="false" aria-controls="proposal-panel" aria-label="Design-Vorschlag: Variante und Akzentfarbe wählen"><span class="proposal__swatch" aria-hidden="true"></span><span class="proposal__txt" aria-hidden="true">Vorschlag</span></button>
    </div>`;
  }

  const LEGAL = [
    ['Impressum', 'impressum'], ['Datenschutz', 'datenschutz'], ['Bestellung', 'bestellung'],
    ['Produkte und Echtheit', 'produkte-und-echtheit'], ['Versand', 'versand'], ['Widerrufsrecht', 'widerrufsbelehrung'],
    ['Rückgabe und Reklamation', 'r%C3%BCckgabe-und-reklamation'], ['Zahlung und Sicherheit', 'zahlung-und-sicherheit']
  ];
  const payHTML = () => `<ul class="pay-row" aria-label="Zahlungsarten">
      <li class="pay" aria-label="Apple Pay"><span aria-hidden="true">Apple Pay</span></li>
      <li class="pay" aria-label="Google Pay"><span aria-hidden="true">G Pay</span></li>
      <li class="pay pay--klarna" aria-label="Klarna"><span aria-hidden="true">Klarna.</span></li>
      <li class="pay pay--paypal" aria-label="PayPal"><span aria-hidden="true">Pay<i>Pal</i></span></li>
      <li class="pay pay--mc" aria-label="Mastercard"><i aria-hidden="true"></i><i aria-hidden="true"></i></li>
    </ul>`;

  function footerHTML() {
    return `
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer__grid">
          <div class="footer__about">
            <a class="logo" href="index.html" aria-label="PrimePacks – zur Startseite">${LOGO}<span><b>PrimePacks</b></span></a>
            <p>Ein zuverlässiger Store für erstklassiges Zubehör, Hardware und originale Sammelkarten. Beste Qualität, schneller Versand und ein Support, auf den du dich verlassen kannst.</p>
            ${payHTML()}
          </div>
          <nav class="footer__col" aria-labelledby="f-shop">
            <h2 id="f-shop">Shop</h2>
            <ul><li><a href="index.html">Startseite</a></li>${CATS.map(c => `<li><a href="${shopUrl(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul>
          </nav>
          <nav class="footer__col" aria-labelledby="f-legal">
            <h2 id="f-legal">Support &amp; Rechtliches</h2>
            <ul>${LEGAL.map(([t, s]) => `<li><a href="${LIVE}/support-rechtliches/${s}">${t}</a></li>`).join('')}</ul>
          </nav>
          <div class="footer__col">
            <h2>Kontakt</h2>
            <ul>
              <li><a href="mailto:kontakt@prime-packs.at">kontakt@prime-packs.at</a></li>
              <li class="muted" style="padding-top:8px;font-size:14px">Antwort innerhalb von 24 Stunden an Werktagen. Bitte gib bei Fragen zu einer Bestellung immer deine Bestellnummer an.</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="wrap footer__bottom" style="margin-top:56px">
        <p>© 2026 PrimePacks. Alle Rechte vorbehalten.</p>
        <p>Redesign-Vorschlag · Powered by <a href="https://paulborlovan.com" style="text-decoration:underline;text-underline-offset:3px">paulborlovan.com</a></p>
      </div>
      <div class="wrap"><p class="footer__word" aria-hidden="true">PrimePacks</p></div>
    </footer>`;
  }

  document.body.insertAdjacentHTML('afterbegin', headerHTML());
  document.body.insertAdjacentHTML('beforeend', footerHTML() + dialogsHTML());

  /* ---------- Dialogs ---------- */
  let lastOpener = null;
  function openDialog(id, opener) {
    const d = document.getElementById('dlg-' + id);
    if (!d || d.open) return;
    $$('dialog[open]').forEach(x => x.close());
    lastOpener = opener || document.activeElement;
    if (id === 'cart') renderCart();
    d.showModal();
    if (id === 'search') { const i = $('#search-input'); i.focus(); i.select(); renderSearch(i.value); }
  }
  $$('dialog.sheet').forEach(d => {
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    d.addEventListener('close', () => { if (lastOpener && document.contains(lastOpener)) lastOpener.focus(); lastOpener = null; });
  });
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openDialog(o.dataset.open, o); return; }
    const c = e.target.closest('[data-close]');
    if (c) { c.closest('dialog')?.close(); }
  });

  /* ---------- Search ---------- */
  const hay = p => p._hay || (p._hay = norm([p.t, p.type, p.vendor, p.tags.join(' '), p.lang === 'EN' ? 'englisch english' : '', p.lang === 'DE' ? 'deutsch german' : ''].join(' ')));
  const searchProducts = q => {
    const toks = norm(q).split(/\s+/).filter(Boolean);
    return toks.length ? P.filter(p => toks.every(t => hay(p).includes(t))) : P;
  };
  let searchTimer;
  function renderSearch(q) {
    const box = $('#search-results');
    const st = $('#search-status');
    if (!q.trim()) {
      box.innerHTML = `<p class="label" style="margin:6px 4px 4px">Beliebte Suchen</p><div class="pills">${['Top Trainer Box', 'One Piece', 'Booster Bundle', '30 Jahre', 'Canon', 'Adventskalender'].map(t => `<a class="pill" href="products.html?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div>`;
      st.textContent = '';
      return;
    }
    const hits = searchProducts(q);
    box.innerHTML = hits.slice(0, 6).map(p => `
      <a class="search-hit" href="${productUrl(p)}">
        ${hasImg(p) ? `<img src="${imgUrl(p.imgs[0].u, 120)}" alt="" width="56" height="56" loading="lazy">` : '<span></span>'}
        <span><span class="m">${esc(p.type || p.vendor)}</span><br><span class="t">${esc(p.t)}</span></span>
        <span class="price">${priceHTML(p.price)}</span>
      </a>`).join('') + (hits.length > 6 ? `<a class="btn btn--ghost" style="margin-top:10px" href="products.html?q=${encodeURIComponent(q)}">Alle ${hits.length} Ergebnisse anzeigen ${icon('arrowR')}</a>` : '') +
      (hits.length ? '' : '<p class="muted" style="padding:12px 4px">Keine Produkte gefunden. Versuche einen anderen Begriff.</p>');
    st.textContent = hits.length ? `${hits.length} Produkte gefunden` : 'Keine Produkte gefunden';
  }
  $('#search-input').addEventListener('input', e => { clearTimeout(searchTimer); searchTimer = setTimeout(() => renderSearch(e.target.value), 140); });

  /* ---------- Cart (demo, localStorage) ---------- */
  const CART_KEY = 'pp-cart-v1';
  let cart = (store.get(CART_KEY, []) || []).filter(x => x && byHandle.has(x.h) && x.q > 0);
  const cartCount = () => cart.reduce((n, x) => n + x.q, 0);
  const cartTotal = () => cart.reduce((n, x) => n + byHandle.get(x.h).price * x.q, 0);
  function saveCart() { store.set(CART_KEY, cart); renderCart(); }
  function addToCart(h, q = 1) {
    const p = byHandle.get(h);
    if (!p) return;
    const it = cart.find(x => x.h === h);
    if (it) it.q = Math.min(99, it.q + q); else cart.push({ h, q });
    saveCart();
    toast(p, q);
  }
  function setQty(h, q) {
    const it = cart.find(x => x.h === h);
    if (!it) return;
    if (q <= 0) cart = cart.filter(x => x.h !== h); else it.q = Math.min(99, q);
    saveCart();
  }
  function renderCart() {
    const n = cartCount();
    $$('[data-cart-count]').forEach(b => { b.textContent = n || ''; b.dataset.count = n; });
    $$('[data-cart-btn]').forEach(b => b.setAttribute('aria-label', n ? `Warenkorb öffnen, ${n} ${n === 1 ? 'Artikel' : 'Artikel'}` : 'Warenkorb öffnen, leer'));
    $$('[data-cart-count-text]').forEach(b => { b.textContent = n ? `(${n})` : ''; });
    const body = $('#cart-body');
    const foot = $('#cart-foot');
    if (!body) return;
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">${icon('bag')}<p style="font-size:18px;color:var(--text);font-weight:600;margin-bottom:6px">Dein Warenkorb ist leer</p><p>Entdecke aktuelle Drops und Restocks.</p></div>`;
      foot.innerHTML = '<a class="btn btn--primary btn--block" href="products.html">Jetzt entdecken</a>';
      return;
    }
    body.innerHTML = `<ul>${cart.map(x => {
      const p = byHandle.get(x.h);
      return `<li class="cart-line">
        <a class="cart-line__img" href="${productUrl(p)}" tabindex="-1" aria-hidden="true">${hasImg(p) ? `<img src="${imgUrl(p.imgs[0].u, 160)}" alt="" width="76" height="76">` : ''}</a>
        <div>
          <a class="cart-line__t" href="${productUrl(p)}">${esc(p.t)}</a>
          <p class="price" style="margin-top:4px">${priceHTML(p.price)}</p>
          <div class="cart-line__row">
            <div class="qty" role="group" aria-label="Menge für ${esc(p.t)}">
              <button type="button" data-qty="${esc(p.h)}" data-d="-1" aria-label="Menge verringern">${icon('minus')}</button>
              <input type="number" inputmode="numeric" min="0" max="99" value="${x.q}" data-qty-input="${esc(p.h)}" aria-label="Menge">
              <button type="button" data-qty="${esc(p.h)}" data-d="1" aria-label="Menge erhöhen">${icon('plus')}</button>
            </div>
            <button class="text-btn" type="button" data-remove="${esc(p.h)}">${icon('trash')}<span>Entfernen<span class="sr-only">: ${esc(p.t)}</span></span></button>
          </div>
        </div>
      </li>`;
    }).join('')}</ul>`;
    const total = cartTotal();
    const left = Math.max(0, 40 - total);
    foot.innerHTML = `
      <div style="display:grid;gap:8px;margin-bottom:18px">
        <p class="fineprint">${left > 0 ? `Noch <b style="color:var(--text)">${money(left)}</b> bis zur kostenlosen Rücksendung` : '✓ Kostenlose Rücksendung für diese Bestellung'}</p>
        <div class="meter" role="progressbar" aria-label="Fortschritt bis zur kostenlosen Rücksendung" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${Math.min(40, total).toFixed(0)}"><span style="width:${Math.min(100, total / 40 * 100)}%"></span></div>
      </div>
      <div class="sum-row sum-row--total"><span>Zwischensumme</span><span class="price">${priceHTML(total)}</span></div>
      <p class="fineprint" style="margin:6px 0 16px">inkl. MwSt. · Bezahlung sicher über den Shopify Checkout</p>
      <button class="btn btn--primary btn--block btn--lg" type="button" data-checkout>Zur Kasse ${icon('arrowR')}</button>`;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-add]');
    if (a) { addToCart(a.dataset.add, Number(a.dataset.q || 1)); return; }
    const q = e.target.closest('[data-qty]');
    if (q) {
      const it = cart.find(x => x.h === q.dataset.qty);
      if (it) {
        setQty(it.h, it.q + Number(q.dataset.d));
        const again = $(`[data-qty="${CSS.escape(it.h)}"][data-d="${q.dataset.d}"]`);
        (again || $('#cart-body .cart-line__t') || $('#dlg-cart [data-close]'))?.focus();
      }
      return;
    }
    const r = e.target.closest('[data-remove]');
    if (r) { setQty(r.dataset.remove, 0); ($('#cart-body a') || $('#dlg-cart [data-close]'))?.focus(); return; }
    if (e.target.closest('[data-checkout]')) {
      toastText('Demo: Im Live-Shop führt dieser Button direkt in den Shopify Checkout.');
    }
  });
  document.addEventListener('change', e => {
    const i = e.target.closest('[data-qty-input]');
    if (i) setQty(i.dataset.qtyInput, Math.max(0, Math.floor(Number(i.value) || 0)));
  });

  /* ---------- Toasts ---------- */
  function pushToast(html) {
    const region = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    region.replaceChildren(el);
    clearTimeout(pushToast.t);
    pushToast.t = setTimeout(() => el.remove(), 5000);
  }
  function toast(p, q) {
    pushToast(`<span class="ok">${icon('check')}</span><span>${q > 1 ? q + ' × ' : ''}${esc(p.t.length > 46 ? p.t.slice(0, 44) + '…' : p.t)} wurde in den Warenkorb gelegt.</span><button type="button" data-open="cart">Ansehen</button>`);
  }
  function toastText(t) { pushToast(`<span class="ok">${icon('check')}</span><span>${esc(t)}</span>`); }

  /* ---------- Accent switcher (proposal) ---------- */
  const ACCENT_KEY = 'pp-accent';
  const root = document.documentElement;
  const setAccent = a => {
    if (!['blue', 'red', 'mint'].includes(a)) a = 'blue';
    if (a === 'blue') delete root.dataset.accent; else root.dataset.accent = a;
    store.set(ACCENT_KEY, a);
    $$('input[name="pp-accent"]').forEach(i => { i.checked = i.value === a; });
  };
  setAccent(params().get('accent') || store.get(ACCENT_KEY, 'blue'));

  /* Variant 1 "Dunkel" (default) or variant 2 "Hell" – ?variant=light */
  const THEME_KEY = 'pp-theme';
  const setTheme = t => {
    if (t !== 'light') t = 'dark';
    if (t === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme;
    store.set(THEME_KEY, t);
    $$('input[name="pp-theme"]').forEach(i => { i.checked = i.value === t; });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = t === 'light' ? '#f2f2f0' : '#09090b';
  };
  setTheme(params().get('variant') || store.get(THEME_KEY, 'dark'));
  const propBtn = $('.proposal__toggle');
  const propPanel = $('#proposal-panel');
  const closeProp = () => { propPanel.hidden = true; propBtn.setAttribute('aria-expanded', 'false'); };
  propBtn.addEventListener('click', () => {
    const open = propPanel.hidden;
    propPanel.hidden = !open;
    propBtn.setAttribute('aria-expanded', String(open));
    if (open) $('input[name="pp-theme"]:checked', propPanel)?.focus();
  });
  propPanel.addEventListener('change', e => {
    if (e.target.name === 'pp-accent') setAccent(e.target.value);
    if (e.target.name === 'pp-theme') setTheme(e.target.value);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !propPanel.hidden) { closeProp(); propBtn.focus(); } });
  document.addEventListener('click', e => { if (!propPanel.hidden && !e.target.closest('#proposal')) closeProp(); });

  /* ---------- Reveal on scroll ---------- */
  function observeReveal(scope = document) {
    const els = $$('.reveal:not(.is-in)', scope);
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = observeReveal.io || (observeReveal.io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 }));
    els.forEach(el => io.observe(el));
  }

  /* ==========================================================================
     HOME
     ========================================================================== */
  function initHome() {
    const featured = byHandle.get('one-piece-carrying-on-his-will-booster-display-op13-englisch') || P.find(hasImg);
    const stage = $('#hero-stage');
    if (stage && featured) {
      const st = status(featured);
      stage.innerHTML = `
        <div class="stage__card">
          <div class="stage__top">
            <span class="chip chip--solid">${esc(featured.type || featured.vendor)}</span>
            ${st ? `<span class="chip chip--${st.cls}"><span class="dot dot--${st.cls}" aria-hidden="true"></span>${esc(st.t)}</span>` : ''}
          </div>
          <div class="stage__img"><img src="${imgUrl(featured.imgs[0].u, 900)}" alt="${esc(featured.imgs[0].a)}" width="600" height="636" fetchpriority="high"></div>
          <div class="stage__bottom">
            <div>
              <p class="label" style="font-size:11px"><span class="dot" aria-hidden="true"></span>Drop der Woche</p>
              <p class="t" style="margin-top:8px"><a href="${productUrl(featured)}">${esc(featured.t)}</a></p>
              <span class="price">${priceHTML(featured.price)}</span>
            </div>
            <button class="icon-btn icon-btn--accent" style="width:56px;height:56px" type="button" data-add="${esc(featured.h)}" aria-label="${esc(featured.t)} in den Warenkorb legen">${icon('plus')}</button>
          </div>
        </div>
        <div class="float-pill float-pill--a" aria-hidden="true"><span class="ico">${icon('seal')}</span><span><small>Garantiert</small>100 % Original</span></div>
        <div class="float-pill float-pill--b" aria-hidden="true"><span class="ico">${icon('truck')}</span><span><small>Versand</small>in 1–3 Werktagen</span></div>
        <div class="mini-list">
          <p class="label"><span class="dot" aria-hidden="true"></span>Neu im Shop</p>
          ${P.filter(hasImg).slice(0, 3).map(p => `<a class="mini-row" href="${productUrl(p)}"><img src="${imgUrl(p.imgs[0].u, 120)}" alt="" width="36" height="36"><span class="t">${esc(p.t)}</span><span class="price">${priceHTML(p.price)}</span></a>`).join('')}
        </div>`;
    }
    $$('[data-total-products]').forEach(el => { el.textContent = P.length; });

    /* Ticker – real products & prices, decorative duplicate of the catalogue */
    const tick = $('#ticker');
    if (tick) {
      const items = P.filter(hasImg).sort((a, b) => (b.stock > 0) - (a.stock > 0)).slice(0, 18);
      const short = t => t.replace(/\s+[–-]\s+(Deutsch|Englisch|EN|DE)$/i, '').replace(/^Pokémon\s+/, '');
      const row = items.map(p => `<span class="ticker__item"><img src="${imgUrl(p.imgs[0].u, 80)}" alt="" width="26" height="26" loading="lazy">${esc(short(p.t).slice(0, 40))}<b>${money(p.price)}</b>${p.stock > 0 ? '<span class="dot dot--ok"></span>' : ''}</span>`).join('');
      tick.innerHTML = `<div class="ticker__track">${row}${row}</div>`;
    }

    /* Drops grid with filter tabs */
    const grid = $('#drops-grid');
    const tabs = $$('#drops-tabs [data-tab]');
    const live = $('#drops-status');
    /* In-stock first, otherwise newest first (data is already sorted by date) */
    const ranked = P.slice().sort((a, b) => (b.stock > 0) - (a.stock > 0));
    const renderDrops = cat => {
      const list = (cat ? ranked.filter(p => p.cats.includes(cat)) : ranked).filter(hasImg).slice(0, 8);
      grid.innerHTML = list.map(p => card(p)).join('');
      if (live) live.textContent = `${list.length} Produkte angezeigt${cat ? ' in ' + catById(cat).name : ''}`;
    };
    if (grid) {
      renderDrops('');
      tabs.forEach(t => t.addEventListener('click', () => {
        tabs.forEach(x => x.setAttribute('aria-pressed', String(x === t)));
        renderDrops(t.dataset.tab);
        $('#drops-all').href = shopUrl(t.dataset.tab);
      }));
    }

    /* Bento counts + images */
    $$('[data-count-cat]').forEach(el => { const n = countCat(el.dataset.countCat); el.textContent = `${n} ${n === 1 ? 'Produkt' : 'Produkte'}`; });
    $$('[data-product-img]').forEach(el => {
      const p = byHandle.get(el.dataset.productImg);
      if (p && hasImg(p)) { el.src = imgUrl(p.imgs[0].u, 700); } else { el.remove(); }
    });

    /* Pre-orders */
    const pre = $('#preorders');
    if (pre) {
      pre.innerHTML = P.filter(p => p.cats.includes('vorbestellungen')).slice(0, 4).map(p => `
        <li class="tx reveal">
          <div class="tx__img">${hasImg(p) ? `<img src="${imgUrl(p.imgs[0].u, 200)}" alt="" width="88" height="88" loading="lazy">` : ''}</div>
          <div>
            <h3 class="tx__t"><a href="${productUrl(p)}">${esc(p.t)}</a></h3>
            <div class="tx__m"><span class="chip chip--warn"><span class="dot dot--warn" aria-hidden="true"></span>Vorbestellung</span>${p.lang ? `<span class="chip">${p.lang}</span>` : ''}<span class="chip">${esc(p.type)}</span></div>
          </div>
          <span class="price">${priceHTML(p.price)}</span>
          <button class="btn btn--light btn--sm" type="button" data-add="${esc(p.h)}">Vorbestellen<span class="sr-only">: ${esc(p.t)}</span></button>
        </li>`).join('');
    }

    /* FAQ filter */
    const faqTabs = $$('#faq-tabs [data-faq]');
    faqTabs.forEach(t => t.addEventListener('click', () => {
      faqTabs.forEach(x => x.setAttribute('aria-pressed', String(x === t)));
      $$('.faq-group').forEach(g => { g.hidden = t.dataset.faq !== 'all' && g.dataset.group !== t.dataset.faq; });
    }));
  }

  /* ==========================================================================
     PRODUCT LIST
     ========================================================================== */
  const PRICE = [
    { id: '', label: 'Alle Preise' },
    { id: '0-50', label: 'bis 50 €', min: 0, max: 50 },
    { id: '50-150', label: '50 – 150 €', min: 50, max: 150 },
    { id: '150-400', label: '150 – 400 €', min: 150, max: 400 },
    { id: '400-', label: 'ab 400 €', min: 400, max: Infinity }
  ];
  const SORTS = [
    ['new', 'Neueste zuerst'], ['price-asc', 'Preis aufsteigend'], ['price-desc', 'Preis absteigend'], ['name', 'Name A–Z']
  ];
  const PAGE = 12;

  function initList() {
    const q0 = params();
    const state = {
      cat: catById(q0.get('cat')) ? q0.get('cat') : '',
      q: q0.get('q') || '',
      sort: SORTS.some(s => s[0] === q0.get('sort')) ? q0.get('sort') : 'new',
      lang: (q0.get('lang') || '').split(',').filter(x => x === 'DE' || x === 'EN'),
      type: (q0.get('type') || '').split('|').filter(Boolean),
      stock: q0.get('stock') === '1',
      price: PRICE.some(p => p.id === q0.get('price')) ? q0.get('price') : '',
      shown: PAGE
    };
    const cat = catById(state.cat);
    const base = state.cat ? P.filter(p => p.cats.includes(state.cat)) : P;

    /* Head */
    document.title = `${cat ? cat.name : 'Shop'} – PrimePacks TCGs`;
    $('#crumb-current').textContent = cat ? cat.name : 'Alle Produkte';
    if (cat) { $('#crumb-shop').hidden = false; }
    $('#list-title').textContent = cat ? cat.long : 'Alle Produkte';
    $('#list-desc').textContent = cat ? cat.desc : 'Premium-Hardware, TCG-Highlights und Lifestyle-Zubehör an einem Ort. Entdecke aktuelle Drops, sichere dir Vorbestellungen und genieße schnellen Versand.';
    $('#list-label').innerHTML = `<span class="slashes">///</span>${cat ? esc(cat.name) : 'Shop'}`;
    $('#cat-pills').innerHTML = [`<a class="pill" href="products.html"${!state.cat ? ' aria-current="page"' : ''}>Alle <span class="count">${P.length}</span></a>`]
      .concat(CATS.map(c => `<a class="pill" href="${shopUrl(c.id)}"${state.cat === c.id ? ' aria-current="page"' : ''}>${esc(c.name)} <span class="count">${countCat(c.id)}</span></a>`)).join('');
    const activePill = $('#cat-pills [aria-current]');
    if (activePill && state.cat) activePill.scrollIntoView({ block: 'nearest', inline: 'center' });

    /* Filters */
    const types = [...base.reduce((m, p) => m.set(p.type, (m.get(p.type) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
    const langCount = l => base.filter(p => p.lang === l).length;
    $('#f-search').value = state.q;
    $('#f-stock').checked = state.stock;
    $('#f-lang').innerHTML = `<legend>Sprache</legend>` + ['DE', 'EN'].map(l => `<label class="opt"><input type="checkbox" name="lang" value="${l}"${state.lang.includes(l) ? ' checked' : ''}>${langName(l)}<span class="n">${langCount(l)}</span></label>`).join('');
    $('#f-price').innerHTML = `<legend>Preis</legend>` + PRICE.map(r => `<label class="opt"><input type="radio" name="price" value="${r.id}"${state.price === r.id ? ' checked' : ''}>${r.label}</label>`).join('');
    const typeLimit = 7;
    $('#f-type').innerHTML = `<legend>Produkttyp</legend>` + types.map(([t, n], i) => `<label class="opt"${i >= typeLimit ? ' data-more hidden' : ''}><input type="checkbox" name="type" value="${esc(t)}"${state.type.includes(t) ? ' checked' : ''}>${esc(t)}<span class="n">${n}</span></label>`).join('') +
      (types.length > typeLimit ? `<button class="text-btn" type="button" id="type-more" aria-expanded="false">Alle ${types.length} Typen anzeigen</button>` : '');
    $('#type-more')?.addEventListener('click', e => {
      const open = e.currentTarget.getAttribute('aria-expanded') === 'true';
      $$('#f-type [data-more]').forEach(l => { l.hidden = open; });
      e.currentTarget.setAttribute('aria-expanded', String(!open));
      e.currentTarget.textContent = open ? `Alle ${types.length} Typen anzeigen` : 'Weniger anzeigen';
    });
    const sortSel = $('#sort');
    sortSel.innerHTML = SORTS.map(([v, l]) => `<option value="${v}"${state.sort === v ? ' selected' : ''}>${l}</option>`).join('');

    const filtered = () => {
      const pr = PRICE.find(r => r.id === state.price);
      let list = state.q ? searchProducts(state.q).filter(p => base.includes(p)) : base.slice();
      if (state.stock) list = list.filter(p => p.stock > 0);
      if (state.lang.length) list = list.filter(p => state.lang.includes(p.lang));
      if (state.type.length) list = list.filter(p => state.type.includes(p.type));
      if (pr && pr.id) list = list.filter(p => p.price >= pr.min && p.price < pr.max);
      const s = state.sort;
      if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
      else if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
      else if (s === 'name') list.sort((a, b) => a.t.localeCompare(b.t, 'de'));
      else list.sort((a, b) => !!hasImg(b) - !!hasImg(a)); /* newest first, products still without photo last */
      return list;
    };

    const syncUrl = () => {
      const u = new URLSearchParams();
      if (state.cat) u.set('cat', state.cat);
      if (state.q) u.set('q', state.q);
      if (state.sort !== 'new') u.set('sort', state.sort);
      if (state.lang.length) u.set('lang', state.lang.join(','));
      if (state.type.length) u.set('type', state.type.join('|'));
      if (state.stock) u.set('stock', '1');
      if (state.price) u.set('price', state.price);
      const qs = u.toString();
      try { history.replaceState(null, '', qs ? `?${qs}` : location.pathname); } catch (e) { /* file:// in some browsers */ }
    };

    const grid = $('#grid');
    const count = $('#result-count');
    const more = $('#load-more');
    const activeBox = $('#active-filters');
    const applyBtn = $('#filters-apply');
    const filterBadge = $('#filter-count');

    function renderActive() {
      const chips = [];
      if (state.q) chips.push(['q', '', `„${state.q}“`]);
      if (state.stock) chips.push(['stock', '', 'Auf Lager']);
      state.lang.forEach(l => chips.push(['lang', l, langName(l)]));
      state.type.forEach(t => chips.push(['type', t, t]));
      if (state.price) chips.push(['price', '', PRICE.find(r => r.id === state.price).label]);
      activeBox.innerHTML = chips.map(([k, v, l]) => `<button type="button" data-rm="${k}" data-v="${esc(v)}" aria-label="Filter entfernen: ${esc(l)}">${esc(l)} ${icon('close')}</button>`).join('') +
        (chips.length > 1 ? '<button type="button" data-rm="all" style="background:transparent;border-color:var(--line-2)">Alle zurücksetzen</button>' : '');
      const n = chips.length;
      filterBadge.textContent = n ? `(${n})` : '';
    }

    function render(focusFrom) {
      const list = filtered();
      const shown = list.slice(0, state.shown);
      if (!list.length) {
        grid.innerHTML = '';
        $('#empty').hidden = false;
      } else {
        $('#empty').hidden = true;
        grid.innerHTML = shown.map((p, i) => card(p, { eager: i < 4 })).join('');
      }
      count.textContent = `${list.length} ${list.length === 1 ? 'Produkt' : 'Produkte'}`;
      applyBtn.textContent = `${list.length} ${list.length === 1 ? 'Produkt' : 'Produkte'} anzeigen`;
      more.hidden = list.length <= state.shown;
      $('#shown-meter').style.width = `${Math.min(100, shown.length / Math.max(1, list.length) * 100)}%`;
      $('#shown-text').textContent = `${shown.length} von ${list.length} Produkten`;
      renderActive();
      syncUrl();
      if (typeof focusFrom === 'number') $$('.pcard__title a', grid)[focusFrom]?.focus();
    }

    const onChange = () => {
      state.stock = $('#f-stock').checked;
      state.lang = $$('#f-lang input:checked').map(i => i.value);
      state.type = $$('#f-type input:checked').map(i => i.value);
      state.price = $('#f-price input:checked')?.value || '';
      state.shown = PAGE;
      render();
    };
    $('#filters').addEventListener('change', e => { if (e.target.id !== 'f-search') onChange(); });
    let t;
    $('#f-search').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); state.shown = PAGE; render(); }, 180); });
    $('#f-search-form').addEventListener('submit', e => { e.preventDefault(); state.q = $('#f-search').value.trim(); render(); });
    sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });
    $('#load-more-btn').addEventListener('click', () => { const from = state.shown; state.shown += PAGE; render(from); });
    const reset = () => {
      Object.assign(state, { q: '', stock: false, lang: [], type: [], price: '', shown: PAGE });
      $('#f-search').value = ''; $('#f-stock').checked = false;
      $$('#f-lang input, #f-type input').forEach(i => { i.checked = false; });
      $('#f-price input[value=""]').checked = true;
      render();
    };
    $('#empty-reset').addEventListener('click', reset);
    activeBox.addEventListener('click', e => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      const k = b.dataset.rm, v = b.dataset.v;
      if (k === 'all') { reset(); count.focus(); return; }
      if (k === 'q') { state.q = ''; $('#f-search').value = ''; }
      if (k === 'stock') { state.stock = false; $('#f-stock').checked = false; }
      if (k === 'lang') { state.lang = state.lang.filter(x => x !== v); $(`#f-lang input[value="${v}"]`).checked = false; }
      if (k === 'type') { state.type = state.type.filter(x => x !== v); $$('#f-type input').forEach(i => { if (i.value === v) i.checked = false; }); }
      if (k === 'price') { state.price = ''; $('#f-price input[value=""]').checked = true; }
      state.shown = PAGE;
      render();
      (activeBox.querySelector('button') || count).focus();
    });

    /* Mobile filter drawer (manual dialog with focus trap) */
    const drawer = $('#filters');
    const scrim = $('#scrim');
    const openBtn = $('#filter-open');
    const mq = matchMedia('(max-width: 980px)');
    const focusables = () => $$('a[href], button:not([disabled]), input, select', drawer).filter(el => el.offsetParent !== null || el === document.activeElement);
    const openDrawer = () => {
      drawer.classList.add('is-open'); scrim.classList.add('is-open');
      drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => $('#filters-close').focus(), 50);
    };
    const closeDrawer = () => {
      drawer.classList.remove('is-open'); scrim.classList.remove('is-open');
      drawer.removeAttribute('role'); drawer.removeAttribute('aria-modal');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      openBtn.focus();
    };
    openBtn.addEventListener('click', openDrawer);
    $('#filters-close').addEventListener('click', closeDrawer);
    applyBtn.addEventListener('click', closeDrawer);
    scrim.addEventListener('click', closeDrawer);
    drawer.addEventListener('keydown', e => {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    mq.addEventListener?.('change', () => { if (!mq.matches && drawer.classList.contains('is-open')) closeDrawer(); });

    render();
  }

  /* ==========================================================================
     PRODUCT PAGE
     ========================================================================== */
  function related(p, n = 6) {
    const c = primaryCat(p);
    const others = P.filter(x => x.h !== p.h);
    const same = c ? others.filter(x => x.cats.includes(c)) : [];
    const rest = others.filter(x => !same.includes(x) && hasImg(x));
    return same.filter(hasImg).concat(rest).slice(0, n);
  }

  function initProduct() {
    const h = params().get('p');
    const p = h ? byHandle.get(h) : byHandle.get('one-piece-carrying-on-his-will-booster-display-op13-englisch') || P[0];
    const main = $('#pdp-root');
    if (!p) {
      document.title = 'Produkt nicht gefunden – PrimePacks TCGs';
      main.innerHTML = `<div class="notfound wrap"><p class="label"><span class="slashes">///</span>404</p><h1 class="h-2">Produkt nicht gefunden</h1><p class="muted">Dieses Produkt ist nicht (mehr) verfügbar.</p><a class="btn btn--primary" href="products.html">Zum Shop ${icon('arrowR')}</a></div>`;
      $('#related-section')?.remove();
      return;
    }
    document.title = `${p.t} – PrimePacks TCGs`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && p.desc) meta.setAttribute('content', p.desc.slice(0, 155));
    const c = catById(primaryCat(p));
    const st = status(p);
    const sale = salePct(p);
    const imgs = p.imgs.length ? p.imgs : [];

    main.innerHTML = `
      <div class="wrap">
        <nav aria-label="Brotkrumen"><ol class="crumbs">
          <li><a href="index.html">Startseite</a></li>
          <li><a href="products.html">Shop</a></li>
          ${c ? `<li><a href="${shopUrl(c.id)}">${esc(c.name)}</a></li>` : ''}
          <li><span aria-current="page">${esc(p.t.length > 48 ? p.t.slice(0, 46) + '…' : p.t)}</span></li>
        </ol></nav>

        <div class="pdp">
          <section class="gallery" aria-label="Produktbilder">
            <div class="gallery__stage" id="stage">
              <div class="gallery__tags">
                ${c ? `<span class="chip chip--solid">${esc(c.name)}</span>` : ''}
                ${p.lang ? `<span class="chip">${langName(p.lang)}</span>` : ''}
                ${sale ? `<span class="chip chip--accent">−${sale} %</span>` : ''}
              </div>
              ${imgs.length ? `<img id="stage-img" src="${imgUrl(imgs[0].u, 1200)}" alt="${esc(imgs[0].a)}" width="1000" height="1000" fetchpriority="high">` : icon('box')}
              ${imgs.length > 1 ? `
                <p class="gallery__count" aria-hidden="true"><span id="stage-n">01</span> / ${String(imgs.length).padStart(2, '0')}</p>
                <div class="gallery__nav">
                  <button class="icon-btn" type="button" data-step="-1" aria-label="Vorheriges Bild">${icon('arrowL')}</button>
                  <button class="icon-btn" type="button" data-step="1" aria-label="Nächstes Bild">${icon('arrowR')}</button>
                </div>` : ''}
            </div>
            ${imgs.length > 1 ? `<div class="thumbs" role="group" aria-label="Bild auswählen">${imgs.map((im, i) => `<button type="button" data-thumb="${i}" aria-label="Bild ${i + 1} von ${imgs.length} anzeigen"${i === 0 ? ' aria-current="true"' : ''}><img src="${imgUrl(im.u, 200)}" alt="" width="68" height="68"></button>`).join('')}</div>` : ''}
            <p class="sr-only" role="status" id="stage-status"></p>
          </section>

          <section class="buy" aria-labelledby="pdp-title">
            <p class="label"><span class="dot" aria-hidden="true"></span>${esc(p.vendor)} · ${esc(p.type)}</p>
            <h1 id="pdp-title">${esc(p.t)}</h1>
            <div class="buy__meta">
              ${st ? `<span class="chip chip--${st.cls}"><span class="dot dot--${st.cls}" aria-hidden="true"></span>${esc(st.t)}</span>` : ''}
              ${p.damaged ? '<span class="chip chip--warn">OVP beschädigt</span>' : '<span class="chip">Neu &amp; versiegelt</span>'}
              ${p.lang ? `<span class="chip">Sprache: ${langName(p.lang)}</span>` : ''}
            </div>
            <div class="buy__price">
              <span class="price">${p.compare ? '<span class="sr-only">Jetzt </span>' : ''}${priceHTML(p.price)}</span>
              ${p.compare ? `<span class="price--old"><span class="sr-only">Statt </span>${money(p.compare)}</span><span class="chip chip--accent">Du sparst ${money(p.compare - p.price)}</span>` : ''}
              <p class="fineprint">inkl. MwSt. · Kostenloser Versand · Versand aus Österreich</p>
            </div>
            <div class="buy__actions">
              <div class="qty qty--lg" role="group" aria-label="Menge">
                <button type="button" data-pq="-1" aria-label="Menge verringern">${icon('minus')}</button>
                <input type="number" id="pdp-qty" inputmode="numeric" min="1" max="99" value="1" aria-label="Menge">
                <button type="button" data-pq="1" aria-label="Menge erhöhen">${icon('plus')}</button>
              </div>
              <button class="btn btn--primary btn--lg" type="button" id="pdp-add" data-add="${esc(p.h)}">${icon('bag')}${p.cats.includes('vorbestellungen') ? 'Jetzt vorbestellen' : 'In den Warenkorb'}</button>
              <a class="btn btn--ghost" href="${LIVE}/products/${encodeURIComponent(p.h)}">Im aktuellen Shop ansehen ${icon('arrowUR')}</a>
            </div>

            <ul class="info-rows" aria-label="Service">
              <li class="info-row"><span class="ico">${icon('truck')}</span><span><b>Schneller Versand aus Österreich</b><span>Bearbeitung in 1–3 Werktagen, Lieferung in 2–5 Werktagen in alle EU-Länder.</span></span></li>
              <li class="info-row"><span class="ico">${icon('seal')}</span><span><b>100 % Original · Factory Sealed</b><span>Nur von vertrauenswürdigen Lieferanten. Abweichungen stehen immer in der Beschreibung.</span></span></li>
              <li class="info-row"><span class="ico">${icon('ret')}</span><span><b>14 Tage Rücktrittsrecht</b><span>Rücksendung kostenlos ab 40 € Bestellwert.</span></span></li>
              <li class="info-row"><span class="ico">${icon('card')}</span><span><b>Sicher bezahlen</b><span>Wir erhalten nie deine vollständigen Kartendaten.</span></span></li>
            </ul>
            ${payHTML()}

            <div>
              <details class="acc" open>
                <summary><span>Beschreibung</span><span class="pm" aria-hidden="true">${icon('plus')}</span></summary>
                <div class="acc__body"><p>${esc(p.desc || 'Für dieses Produkt ist noch keine Beschreibung hinterlegt.')}</p>${p.desc && p.desc.endsWith('...') ? `<p><a href="${LIVE}/products/${encodeURIComponent(p.h)}">Vollständige Beschreibung im Shop lesen</a></p>` : ''}</div>
              </details>
              <details class="acc">
                <summary><span>Produktdetails</span><span class="pm" aria-hidden="true">${icon('plus')}</span></summary>
                <div class="acc__body">
                  <dl class="spec">
                    <dt>Marke</dt><dd>${esc(p.vendor)}</dd>
                    <dt>Produkttyp</dt><dd>${esc(p.type)}</dd>
                    ${p.lang ? `<dt>Sprache</dt><dd>${langName(p.lang)}</dd>` : ''}
                    <dt>Zustand</dt><dd>${p.damaged ? 'Neuware, Originalverpackung beschädigt' : 'Neuware in Originalverpackung'}</dd>
                    ${c ? `<dt>Kategorie</dt><dd><a href="${shopUrl(c.id)}" style="text-decoration:underline;text-underline-offset:3px">${esc(c.name)}</a></dd>` : ''}
                    ${p.tags.length ? `<dt>Tags</dt><dd><div class="tags">${p.tags.slice(0, 10).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div></dd>` : ''}
                  </dl>
                </div>
              </details>
              <details class="acc">
                <summary><span>Versand &amp; Rückgabe</span><span class="pm" aria-hidden="true">${icon('plus')}</span></summary>
                <div class="acc__body">
                  <p>Lagernde Produkte werden normalerweise innerhalb von 1–3 Werktagen bearbeitet. Die Lieferzeit beträgt je nach Zielland ungefähr 2–5 Werktage. Sobald deine Bestellung versendet wurde, erhältst du eine Sendungsverfolgungsnummer.</p>
                  <p>Bei einem Bestellwert über 40 € übernehmen wir die Kosten der Rücksendung. Sammelkarten- und Sammlerprodukte nehmen wir nur ungeöffnet und versiegelt zurück. <a href="${LIVE}/support-rechtliches/widerrufsbelehrung">Widerrufsbelehrung</a></p>
                </div>
              </details>
            </div>
          </section>
        </div>
      </div>

      <div class="sticky-buy" id="sticky-buy" aria-hidden="true">
        ${hasImg(p) ? `<img src="${imgUrl(p.imgs[0].u, 120)}" alt="" width="44" height="44">` : ''}
        <div><p class="t">${esc(p.t)}</p><p class="price">${priceHTML(p.price)}</p></div>
        <button class="btn btn--primary btn--sm" type="button" data-add="${esc(p.h)}" tabindex="-1">${icon('bag')}In den Warenkorb</button>
      </div>`;

    /* Quantity → add button */
    const qtyIn = $('#pdp-qty');
    const addBtn = $('#pdp-add');
    const syncQ = () => { const v = Math.min(99, Math.max(1, Math.floor(Number(qtyIn.value) || 1))); qtyIn.value = v; addBtn.dataset.q = v; };
    main.addEventListener('click', e => { const b = e.target.closest('[data-pq]'); if (b) { qtyIn.value = Number(qtyIn.value) + Number(b.dataset.pq); syncQ(); } });
    qtyIn.addEventListener('change', syncQ);

    /* Gallery */
    if (imgs.length > 1) {
      let cur = 0;
      const stageImg = $('#stage-img');
      const show = i => {
        cur = (i + imgs.length) % imgs.length;
        stageImg.src = imgUrl(imgs[cur].u, 1200);
        stageImg.alt = imgs[cur].a;
        stageImg.style.animation = 'none'; void stageImg.offsetWidth; stageImg.style.animation = '';
        $$('[data-thumb]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.thumb) === cur)));
        $('#stage-n').textContent = String(cur + 1).padStart(2, '0');
        $('#stage-status').textContent = `Bild ${cur + 1} von ${imgs.length}`;
      };
      main.addEventListener('click', e => {
        const s = e.target.closest('[data-step]'); if (s) show(cur + Number(s.dataset.step));
        const t = e.target.closest('[data-thumb]'); if (t) show(Number(t.dataset.thumb));
      });
      /* swipe on touch */
      let x0 = null;
      $('#stage').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      $('#stage').addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
    }

    /* Sticky buy bar on mobile when main CTA is out of view */
    const bar = $('#sticky-buy');
    const barBtn = bar.querySelector('button');
    let barVis = null;
    const updBar = () => {
      const vis = addBtn.getBoundingClientRect().bottom < 0;
      if (vis === barVis) return;
      barVis = vis;
      bar.classList.toggle('is-visible', vis);
      bar.setAttribute('aria-hidden', String(!vis));
      barBtn.tabIndex = vis ? 0 : -1;
    };
    addEventListener('scroll', updBar, { passive: true });
    addEventListener('resize', updBar, { passive: true });
    updBar();

    /* Andere kauften auch – same category first, filled up to 6 */
    const rel = $('#related-grid');
    if (rel) rel.innerHTML = related(p).map(x => card(x)).join('');
  }

  /* ---------- Boot ---------- */
  $$('[data-pay]').forEach(el => { el.outerHTML = payHTML(); });
  renderCart();
  if (page === 'home') initHome();
  if (page === 'list') initList();
  if (page === 'product') initProduct();
  observeReveal();
  root.classList.remove('no-js');
  root.classList.add('js');
})();
