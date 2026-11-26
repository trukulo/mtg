/* ============================================================
   lib-gy · búsquedas, cementerio y auras
   Capa autocontenida (envuelve applySpell y playFromHand, no toca el motor):

   - «Search your library for …»: ventana con las cartas que cumplen el filtro
     (tipo, básica, valor de maná) y el destino del texto (mano, campo girada,
     campo, arriba de la biblioteca). Después se baraja. La IA elige sola.
   - «Look at the top N cards …»: ventana con esas N; las elegidas van a la mano y el
     resto al fondo o al cementerio según el texto.
   - Cementerio: «return target … card from your graveyard to the battlefield/your
     hand», «put … from your graveyard into your hand» y «exile … card from a
     graveyard», con ventana para elegir la carta.
   - Auras: al lanzar una, se elige el huésped legal («Enchant creature», «…
     you control», «enchant land/permanent»), sin dejar lanzarla si no hay ninguno.

   **Selección múltiple**: cuando el texto deja coger varias cartas («hasta dos
   tierras», «mira las cuatro y pon dos en la mano», «exilia dos cartas de un
   cementerio») la ventana deja marcar y desmarcar con el orden numerado, muestra
   el contador k/máx y no resuelve hasta pulsar «Aceptar». Si es «hasta N», se
   puede confirmar con menos (o con cero). Con una sola carta, el clic resuelve.
   Las ventanas se encolan: un mismo hechizo puede pedir dos («muele 3, luego
   devuelve …»).
   ============================================================ */
(() => {
  if (typeof G === 'undefined' || typeof applySpell !== 'function' || typeof cardOfSafe !== 'function') return;
  if (window.__libGy) return;
  window.__libGy = true;

  Object.assign(I18N.es, {
    'lg.search': 'Buscar en la biblioteca',
    'lg.look': 'Mirar las {n} de arriba',
    'lg.gy': 'Elegir del cementerio',
    'lg.exile': 'Exiliar del cementerio',
    'lg.aura': 'Elegir a quién va el aura',
    'lg.toHand': 'Va a la mano',
    'lg.toField': 'Va al campo',
    'lg.toTop': 'Va arriba de la biblioteca',
    'lg.toGy': 'Va al cementerio',
    'lg.shuffle': 'Se baraja la biblioteca.',
    'lg.none': 'No hay cartas que cumplan el filtro.',
    'lg.found': '{p} busca en la biblioteca: {c}.',
    'lg.dig': '{p} mira las {n} de arriba: {c}.',
    'lg.back': '{p} devuelve {c} del cementerio ({w}).',
    'lg.exiled': '{p} exilia {c} del cementerio.',
    'lg.noTarget': 'No hay objetivo legal para el aura.',
    'lg.auraOn': '{a} se anexa a {t}.',
    'lg.cancel': 'Cancelar',
    'lg.confirm': 'Aceptar',
    'lg.pick': 'Elige una carta',
    'lg.pickN': 'Elige {n} cartas',
    'lg.upTo': 'Puedes elegir hasta {n}',
    'lg.upToN': 'Elige hasta {n} cartas',
    'lg.chosen': '{k}/{n} elegidas',
    'lg.you': 'Tú',
    'lg.ai': 'IA',
    'lg.aiPick': 'Elige la IA',
    'lg.aiDid': 'La IA elige por ti.',
    'lg.aiShow': 'La IA elige: {c}',
    'lg.aiNone': 'La IA no elige ninguna carta'
  });
  Object.assign(I18N.en, {
    'lg.search': 'Search your library',
    'lg.look': 'Look at the top {n}',
    'lg.gy': 'Choose from the graveyard',
    'lg.exile': 'Exile from a graveyard',
    'lg.aura': 'Choose the aura target',
    'lg.toHand': 'Goes to hand',
    'lg.toField': 'Goes to the battlefield',
    'lg.toTop': 'Goes on top of the library',
    'lg.toGy': 'Goes to the graveyard',
    'lg.shuffle': 'The library is shuffled.',
    'lg.none': 'No cards match the filter.',
    'lg.found': '{p} searches the library: {c}.',
    'lg.dig': '{p} looks at the top {n}: {c}.',
    'lg.back': '{p} returns {c} from the graveyard ({w}).',
    'lg.exiled': '{p} exiles {c} from a graveyard.',
    'lg.noTarget': 'No legal target for the aura.',
    'lg.auraOn': '{a} is attached to {t}.',
    'lg.cancel': 'Cancel',
    'lg.confirm': 'Confirm',
    'lg.pick': 'Choose a card',
    'lg.pickN': 'Choose {n} cards',
    'lg.upTo': 'You may choose up to {n}',
    'lg.upToN': 'Choose up to {n} cards',
    'lg.chosen': '{k}/{n} chosen',
    'lg.you': 'You',
    'lg.ai': 'AI',
    'lg.aiPick': 'Let the AI pick',
    'lg.aiDid': 'The AI picks for you.',
    'lg.aiShow': 'The AI picks: {c}',
    'lg.aiNone': 'The AI picks nothing'
  });
  Object.assign(I18N.fr, {
    'lg.search': 'Chercher dans la bibliothèque',
    'lg.look': 'Regarder les {n} du dessus',
    'lg.gy': 'Choisir dans le cimetière',
    'lg.exile': 'Exiler du cimetière',
    'lg.aura': 'Choisir la cible de l’aura',
    'lg.toHand': 'Va en main',
    'lg.toField': 'Arrive sur le champ',
    'lg.toTop': 'Va au-dessus de la bibliothèque',
    'lg.toGy': 'Va au cimetière',
    'lg.shuffle': 'La bibliothèque est mélangée.',
    'lg.none': 'Aucune carte ne correspond.',
    'lg.found': '{p} cherche dans la bibliothèque : {c}.',
    'lg.dig': '{p} regarde les {n} du dessus : {c}.',
    'lg.back': '{p} renvoie {c} du cimetière ({w}).',
    'lg.exiled': '{p} exile {c} du cimetière.',
    'lg.noTarget': 'Aucune cible légale pour l’aura.',
    'lg.auraOn': '{a} est attachée à {t}.',
    'lg.cancel': 'Annuler',
    'lg.confirm': 'Valider',
    'lg.pick': 'Choisir une carte',
    'lg.pickN': 'Choisir {n} cartes',
    'lg.upTo': 'Vous pouvez choisir jusqu’à {n}',
    'lg.upToN': 'Choisir jusqu’à {n} cartes',
    'lg.chosen': '{k}/{n} choisies',
    'lg.you': 'Vous',
    'lg.ai': 'IA',
    'lg.aiPick': 'L’IA choisit',
    'lg.aiDid': 'L’IA choisit pour vous.',
    'lg.aiShow': 'L’IA choisit : {c}',
    'lg.aiNone': 'L’IA ne choisit aucune carte'
  });

  const low = s => String(s || '').toLowerCase();
  const isGuest = () => !!(window.MP && window.MP.live && window.MP.role === 'guest');
  /* con el piloto automático encendido (`G.auto`) el jugador no decide nada: las
     ventanas se resuelven solas con la misma elección de la IA, que si no se
     quedarían abiertas esperando un clic y el piloto se pararía. */
  const human = P => P === G.you && !isGuest() && !(G && G.auto);
  const who = P => (P === G.you ? 'you' : 'ai');
  const WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  const nOf = w => (/^\d+$/.test(w) ? +w : (WORDS[low(w)] || 1));
  const cname = c => (typeof cardName === 'function' ? cardName(c) : (c && c.name) || '');

  /* ---------- ventana de elección (con cola) ---------- */
  const wait = [];
  let busy = false;
  let aiTimer = 0;
  const AI_PAUSE = 1000;      /* ms que se queda a la vista la elección de la IA */

  function el() {
    let e = document.getElementById('lgPick');
    if (!e) {
      e = document.createElement('div');
      e.id = 'lgPick';
      e.innerHTML = '<div class="lgbox"><div class="lghd"><b></b><span class="lgsub"></span>' +
        '<button class="lgx" aria-label="×">×</button></div><div class="lggrid"></div>' +
        '<div class="lgft"><span class="lghint"></span><span class="lgcount"></span>' +
        '<button class="lgai"></button><button class="lgskip"></button><button class="lgok" disabled></button></div></div>';
      document.body.appendChild(e);
      e.querySelector('.lgx').onclick = () => finish([]);
      e.querySelector('.lgskip').onclick = () => finish([]);
      /* «Elige la IA»: marca la elección a la vista y confirma al segundo, para que
         se vea qué ha escogido (misma heurística que usa la IA cuando le toca a ella). */
      e.querySelector('.lgai').onclick = () => {
        const req = wait[0];
        if (!req) return;
        const sel = autoSel(req, req._auto);
        markAi(req, sel);
        logLine(t('lg.aiDid'), who(G.you));
        clearTimeout(aiTimer);
        aiTimer = setTimeout(() => finish(sel), AI_PAUSE);
      };
      e.querySelector('.lgok').onclick = () => {
        const req = wait[0];
        if (!req) return;
        finish((req._sel || []).slice());
      };
      /* al encender «Piloto: SÍ» se cierra la ventana que estuviera esperando */
      document.addEventListener('click', ev => {
        const b = ev.target && ev.target.closest && ev.target.closest('#jAuto');
        if (b && G && G.auto) autoNow();
      });
      e.querySelector('.lggrid').onclick = ev => {
        const req = wait[0], b = ev.target.closest && ev.target.closest('.lgc');
        if (!req || !b) return;
        const i = +b.dataset.i;
        if (req.max <= 1) { finish([i]); return; }       /* una sola carta: el clic resuelve */
        req._sel = req._sel || [];
        const at = req._sel.indexOf(i);
        if (at >= 0) req._sel.splice(at, 1);
        else if (req._sel.length < req.max) req._sel.push(i);
        paint(req);
      };
    }
    return e;
  }

  function paint(req) {
    const e = el(), sel = req._sel || [];
    [...e.querySelectorAll('.lggrid .lgc')].forEach(b => {
      const at = sel.indexOf(+b.dataset.i);
      b.classList.toggle('sel', at >= 0);
      if (at >= 0) b.dataset.order = at + 1; else b.removeAttribute('data-order');
    });
    const cnt = e.querySelector('.lgcount');
    if (cnt) cnt.textContent = req.max > 1 ? t('lg.chosen', { k: sel.length, n: req.max }) : '';
    const ok = e.querySelector('.lgok');
    if (ok) {
      ok.style.display = req.max > 1 ? '' : 'none';
      ok.disabled = sel.length < (req.min || 0);
      ok.textContent = t('lg.confirm');
    }
    const skip = e.querySelector('.lgskip');
    if (skip) skip.style.display = (req.min || 0) > 0 ? 'none' : '';
    const ai = e.querySelector('.lgai');
    if (ai) { ai.textContent = t('lg.aiPick'); ai.title = t('lg.aiPick'); }
  }

  function show(req) {
    const e = el();
    req._sel = [];
    e.classList.remove('ai');
    e.querySelector('.lghd b').textContent = req.title;
    e.querySelector('.lghd .lgsub').textContent = req.sub || '';
    e.classList.toggle('multi', req.max > 1);
    const grid = e.querySelector('.lggrid');
    grid.innerHTML = '';
    req.cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'lgc';
      b.type = 'button';
      b.dataset.i = i;
      b.dataset.nm = c.name || cname(c);   /* vista grande al pasar el ratón */
      const img = typeof cardImg === 'function' ? cardImg(c) : c.img;
      b.innerHTML = (img ? '<img src="' + img + '" alt="" loading="lazy">' : '<span class="lgno">' + cname(c) + '</span>') +
        '<b>' + cname(c) + '</b><span>' + String(c.type || '').slice(0, 42) + '</span>';
      grid.appendChild(b);
    });
    const hint = e.querySelector('.lghint');
    hint.textContent = req.hint || (req.max > 1
      ? (req.min ? t('lg.pickN', { n: req.min }) : t('lg.upToN', { n: req.max }))
      : (req.min ? t('lg.pick') : t('lg.upTo', { n: 1 })));
    e.classList.add('on');
    paint(req);
  }

  function finish(choice) {
    const req = wait[0];
    if (!req) return;
    wait.shift();
    const e = document.getElementById('lgPick');
    if (e) { e.classList.remove('on'); e.classList.remove('multi'); e.classList.remove('ai'); }
    busy = false;
    try { req.cb(choice || []); } catch (x) { }
    pump();
  }

  function pump() {
    if (busy || !wait.length) return;
    busy = true;
    show(wait[0]);
  }

  /* pinta la elección automática dentro de la ventana y la deja en modo «solo mirar»:
     las cartas quedan marcadas con su orden y el pie dice qué ha escogido la IA. */
  function markAi(req, sel) {
    const e = el();
    req._sel = (sel || []).slice(0, req.max);
    e.classList.add('ai');
    paint(req);
    const names = req._sel.map(i => cname(req.cards[i])).filter(Boolean);
    const hint = e.querySelector('.lghint');
    if (hint) hint.textContent = names.length ? t('lg.aiShow', { c: names.join(', ') }) : t('lg.aiNone');
  }

  function endAi() {
    const e = document.getElementById('lgPick');
    if (e) { e.classList.remove('on'); e.classList.remove('ai'); e.classList.remove('multi'); }
    busy = false;
    pump();
  }

  /* resuelve ya la ventana en curso con la elección automática (y se ve un segundo) */
  function autoNow() {
    const req = wait[0];
    if (!req) return false;
    const sel = autoSel(req, req._auto);
    markAi(req, sel);
    logLine(t('lg.aiDid'), who(G.you));
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => finish(sel), AI_PAUSE);
    return true;
  }

  /* elección automática: la heurística de la IA (`auto`) o, si no la hay, las
     primeras cartas; se recorta al máximo y se completa hasta el mínimo. */
  function autoSel(req, auto) {
    const n = req.cards.length;
    let sel = [];
    try { sel = (auto ? auto(req.cards, req.max) : null) || [...Array(req.min).keys()]; } catch (x) { sel = []; }
    sel = sel.filter(i => typeof i === 'number' && i >= 0 && i < n).slice(0, req.max);
    sel = sel.filter((i, k) => sel.indexOf(i) === k);
    for (let i = 0; sel.length < req.min && sel.length < n && i < n; i++) {
      if (sel.indexOf(i) < 0) sel.push(i);
    }
    return sel;
  }

  /* req: {title, cards, min, max, cb(sel), hint, sub} — la IA no ve ventana */
  function ask(P, req, auto) {
    req.max = Math.max(1, Math.min(req.max || 1, req.cards.length || 1));
    req.min = Math.max(0, Math.min(req.min == null ? req.max : req.min, req.max));
    req._auto = auto || null;
    if (!human(P)) {
      /* La IA decide: se aplica en el acto (el motor es síncrono y no puede esperar) y
         la ventana se queda AI_PAUSE en pantalla enseñando lo elegido. */
      const sel = autoSel(req, req._auto);
      req.cb(sel);
      if (!busy && document.body.classList.contains('playing')) {
        show(req);
        markAi(req, sel);
        busy = true;
        clearTimeout(aiTimer);
        aiTimer = setTimeout(endAi, AI_PAUSE);
      }
      return;
    }
    wait.push(req);
    pump();
  }

  /* ---------- criterio de la elección automática (IA y botón «Elige la IA») ----------
     No siempre «las más caras»: se puntúa la carta según
       · el destino: a la mano / al campo / al cementerio / a la biblioteca / al exilio / de huésped
         de un aura;
       · de quién es: de tu cementerio se saca lo mejor, del rival se exilia lo mejor;
       · qué es: una tierra que arregla colores vale, una básica es la última; un instantáneo
         puesto en el campo no hace nada; una criatura grande es buen huésped de un aura. */
  /* ojo: `costOf(card)` NO devuelve un número, devuelve {colors, generic, raw}; el valor de
     maná hay que sacarlo de ahí (antes la capa restaba objetos y todas las puntuaciones
     salían NaN, así que «las más caras» elegía en realidad las primeras de la lista). */
  function mvOf(c) {
    if (typeof costOf === 'function') {
      const m = costOf(c);
      if (typeof m === 'number' && !isNaN(m)) return m;
      if (m && typeof m === 'object') {
        let n = +m.generic || 0;
        if (m.colors && typeof m.colors === 'object') n += Object.values(m.colors).reduce((a, b) => a + (+b || 0), 0);
        if (n || m.raw) return n;
      }
    }
    return +c.cmc || 0;
  }
  /* colores que produce una tierra (`prod`: ['U'], ['W','U'], ['C']…) */
  const colorsOf = c => {
    const p = Array.isArray(c.prod) ? c.prod
      : (typeof c.prod === 'string' ? (c.prod.match(/[WUBRG]/g) || []) : []);
    return new Set(p.filter(x => x && x !== 'C')).size;
  };
  function ptScore(c) {
    const raw = (c.pt != null) ? c.pt : (c.ptxt != null ? c.ptxt : (c.pow != null ? c.pow + '/' + (c.tou || 0) : ''));
    if (Array.isArray(raw)) return (+raw[0] || 0) + (+raw[1] || 0) * 0.6;
    const m = String(raw || '').match(/(\d+)\s*\/\s*(\d+)/);
    return m ? (+m[1]) + (+m[2]) * 0.6 : 0;
  }

  function scoreCard(c, ctx) {
    const T = low(c && c.type), mv = mvOf(c);
    const land = /land/.test(T), spell = /instant|sorcery/.test(T);
    let v;
    if (land) {
      v = 0.8 + Math.min(2, colorsOf(c)) * 0.5 - (/basic/i.test(T) ? 0.45 : 0);  /* la básica, la última */
    } else {
      v = 2 + mv * 0.9 + ptScore(c) * 0.25;
      if (/planeswalker/.test(T)) v += 1.2;
      if (/creature/.test(T)) v += 0.6;
      else if (spell) v += 0.3;
      if (/aura|equipment/.test(T)) v -= 0.4;
    }
    const mine = ctx.mine !== false;
    switch (ctx.dest) {
      case 'field': return spell ? v - 8 : v;          /* al campo: solo permanentes */
      case 'gy': return -v;                             /* al cementerio: lo peor */
      case 'exile': return mine ? -v : v;               /* exiliar: lo suyo, lo mejor */
      case 'host': return ptScore(c) - mv * 0.3;        /* huésped del aura: la criatura más grande */
      default: return v;                                /* a la mano / arriba de la biblioteca */
    }
  }

  const bestBy = (list, n, ctx) => list.map((c, i) => ({ i: i, v: scoreCard(c, ctx || {}) }))
    .sort((a, b) => b.v - a.v).slice(0, n).map(o => o.i);

  /* ---------- filtros de carta ---------- */
  function typeTest(what) {
    const w = low(what);
    const basic = /\bbasic\b/.test(w);
    if (/\bland\b/.test(w)) return c => /land/i.test(c.type || '') && (!basic || /basic/i.test(c.type || ''));
    if (/\bcreature\b/.test(w)) return c => /creature/i.test(c.type || '');
    if (/\bartifact\b/.test(w)) return c => /artifact/i.test(c.type || '');
    if (/\benchantment\b/.test(w)) return c => /enchantment/i.test(c.type || '');
    if (/\binstant\b/.test(w) && /\bsorcery\b/.test(w)) return c => /instant|sorcery/i.test(c.type || '');
    if (/\binstant\b/.test(w)) return c => /instant/i.test(c.type || '');
    if (/\bsorcery\b/.test(w)) return c => /sorcery/i.test(c.type || '');
    if (/\bplaneswalker\b/.test(w)) return c => /planeswalker/i.test(c.type || '');
    if (/\bpermanent\b/.test(w)) return c => !/instant|sorcery/i.test(c.type || '');
    return () => true;
  }

  function mvTest(what) {
    const m = low(what).match(/mana value (\d+) or less/);
    if (!m) return () => true;
    const max = +m[1];
    return c => (typeof costOf === 'function' ? costOf(c) : (c.cmc || 0)) <= max;
  }

  /* «dos cartas», «hasta tres tierras»…; nunca lee el «3» de «valor de maná 3 o menos» */
  function countIn(text, fallback) {
    const m = low(text).match(/(?:up to\s+)?\b(\d+|one|two|three|four|five|six)\s+(?:[a-zà-ú]+\s+){0,3}cards?\b/);
    return m ? nOf(m[1]) : fallback;
  }

  /* ---------- «Search your library for …» ---------- */
  const SEARCH = /search your library for ([^.;]*?)cards?\b([^.;]*)/i;

  function stepSearch(P, line) {
    const m = line.match(SEARCH);
    if (!m) return null;
    const what = (m[1] + ' ' + m[2]).replace(/\s+/g, ' ').trim();
    const upTo = /up to\b/i.test(what);
    const n = countIn(m[0], 1);   /* el «cards» lo consume la propia SEARCH: se cuenta sobre la frase */
    const toField = /onto the battlefield/i.test(what);
    const tapped = /\btapped\b/i.test(what);
    const toTop = /on top of your library/i.test(what);
    const test = typeTest(what), mv = mvTest(what);
    const matches = (P.lib || []).map((nm, i) => ({ nm: nm, i: i, c: cardOfSafe(nm) }))
      .filter(o => o.c && test(o.c) && mv(o.c));

    const shuffleNow = () => {
      if (P.lib && typeof shuffle === 'function') P.lib = shuffle(P.lib.slice());
      logLine(t('lg.shuffle'), who(P));
    };

    if (!matches.length) {
      logLine(t('lg.none'), who(P));
      shuffleNow();
      return { rest: line.replace(m[0], ' ') };
    }

    const move = (o) => {
      const at = P.lib.indexOf(o.nm);
      if (at >= 0) P.lib.splice(at, 1);
      if (toField) {
        const p = instantiate(o.nm, false, P.deck);
        p.summoning = false;
        p.tapped = !!tapped;
        P.bf.push(p);
      } else if (toTop) {
        P.lib.unshift(o.nm);
      } else {
        P.hand.push(o.nm);
      }
      logLine(t('lg.found', { p: P.name || '', c: cname(o.c) }), who(P));
    };

    const take = (sel) => {
      if (!sel || !sel.length) { shuffleNow(); return; }
      sel.forEach(i => { const o = matches[i]; if (o) move(o); });
      const dest = toField ? (tapped ? t('lg.toField') + ' · ' + t('game.tapped') : t('lg.toField'))
        : toTop ? t('lg.toTop') : t('lg.toHand');
      logLine(dest + ' · ' + t('lg.shuffle'), who(P));
      shuffleNow();
      if (typeof checkDeaths === 'function') checkDeaths();
      if (typeof renderBoard === 'function') renderBoard();
    };

    ask(P, {
      title: t('lg.search'), sub: what, cards: matches.map(o => o.c),
      min: upTo ? 0 : Math.min(n, matches.length),
      max: Math.min(n, matches.length),
      cb: take
    }, (list, max) => bestBy(list, max, { dest: toField ? 'field' : toTop ? 'top' : 'hand' }));
    return { rest: line.replace(m[0], ' ') };
  }

  /* ---------- «Look at the top N cards …» ---------- */
  const DIG = /look at the top (\w+) cards? of your library/i;

  function stepDig(P, line) {
    const m = line.match(DIG);
    if (!m) return null;
    const n = Math.min(20, nOf(m[1]));
    const list = (P.lib || []).slice(0, n).map(nm => ({ nm: nm, c: cardOfSafe(nm) }));
    if (!list.length) return { rest: line.replace(m[0], ' ') };
    const toGy = /into your graveyard/i.test(line);
    const allHand = /put (?:them|all of them) into your hand/i.test(line);
    /* «put two into your hand» no lleva la palabra «cards», así que se cuenta aparte */
    const putM = line.match(/put\s+(?:up to\s+)?(\d+|one|two|three|four|five|six)\b[^.]*?into your hand/i);
    const want = allHand ? list.length : (putM ? nOf(putM[1]) : 1);
    const k = Math.min(want, list.length);
    const opt = /\b(you may|may reveal|up to)\b/i.test(line);

    const take = (sel) => {
      const chosen = (sel || []).map(i => list[i]).filter(Boolean);
      const rest = list.filter(o => chosen.indexOf(o) !== -1 ? false : true);
      chosen.forEach(o => {
        const at = P.lib.indexOf(o.nm);
        if (at >= 0) P.lib.splice(at, 1);
        P.hand.push(o.nm);
      });
      rest.forEach(o => {
        const at = P.lib.indexOf(o.nm);
        if (at >= 0) P.lib.splice(at, 1);
        if (toGy) P.gy.push(o.nm); else P.lib.push(o.nm);
      });
      if (chosen.length) logLine(t('lg.dig', { p: P.name || '', n: n, c: chosen.map(o => cname(o.c)).join(', ') }), who(P));
      else logLine(t('lg.dig', { p: P.name || '', n: n, c: t('lg.toGy') === '' ? '' : t('lg.toHand') }), who(P));
      if (typeof renderBoard === 'function') renderBoard();
    };

    ask(P, {
      title: t('lg.look', { n: n }), sub: '', cards: list.map(o => o.c),
      min: opt ? 0 : k, max: k, cb: take
    }, (l, max) => bestBy(l, max, { dest: 'hand' }));
    return { rest: line.replace(m[0], ' ') };
  }

  /* ---------- cementerio: recuperar ---------- */
  const GY_RET = /(?:return|put)\s+(?:target|up to one target|up to two target)?\s*(?:([a-z ]{0,40}?)\s*)?cards?\s+from\s+(your|target player's|a)\s+graveyard\s+(?:to|into)\s+(the battlefield|your hand)/i;
  const GY_EX = /exile\s+(?:target|up to one target|up to two target)?\s*(?:([a-z ]{0,40}?)\s*)?cards?\s+from\s+(your|target player's|a|an opponent's)\s+graveyard/i;

  function gyOwner(P, which) {
    const w = low(which);
    if (/\byour\b/.test(w)) return P;
    return P === G.you ? G.ai : G.you;
  }

  function stepGy(P, line) {
    const m = line.match(GY_RET);
    if (!m) return null;
    const test = typeTest(m[1] || '');
    const owner = gyOwner(P, m[2]);
    const toField = /battlefield/i.test(m[3]);
    const tapped = /\btapped\b/.test(line);
    const n = countIn(m[0], 1);
    const list = (owner.gy || []).map(nm => ({ nm: nm, c: cardOfSafe(nm) })).filter(o => o.c && test(o.c));
    if (!list.length) return { rest: line.replace(m[0], ' ') };

    const take = (sel) => {
      (sel || []).forEach(i => {
        const o = list[i];
        if (!o) return;
        const at = owner.gy.indexOf(o.nm);
        if (at >= 0) owner.gy.splice(at, 1);
        if (toField) {
          const p = instantiate(o.nm, false, owner.deck);
          p.summoning = false; p.tapped = !!tapped;
          owner.bf.push(p);
        } else owner.hand.push(o.nm);
        logLine(t('lg.back', { p: P.name || '', c: cname(o.c), w: toField ? t('lg.toField') : t('lg.toHand') }), who(P));
      });
      if (typeof checkDeaths === 'function') checkDeaths();
      if (typeof renderBoard === 'function') renderBoard();
    };

    ask(P, {
      title: t('lg.gy'), sub: m[0].slice(0, 70), cards: list.map(o => o.c),
      min: Math.min(n, list.length), max: Math.min(n, list.length), cb: take
    }, (l, max) => bestBy(l, max, { dest: toField ? 'field' : 'hand', mine: owner === P }));
    return { rest: line.replace(m[0], ' ') };
  }

  function stepGyExile(P, line) {
    const m = line.match(GY_EX);
    if (!m) return null;
    const test = typeTest(m[1] || '');
    const owner = gyOwner(P, m[2]);
    const n = countIn(m[0], 1);
    const list = (owner.gy || []).map(nm => ({ nm: nm, c: cardOfSafe(nm) })).filter(o => o.c && test(o.c));
    if (!list.length) return { rest: line.replace(m[0], ' ') };

    const take = (sel) => {
      (sel || []).forEach(i => {
        const o = list[i];
        if (!o) return;
        const at = owner.gy.indexOf(o.nm);
        if (at >= 0) owner.gy.splice(at, 1);
        (owner.exile = owner.exile || []).push(o.nm);
        logLine(t('lg.exiled', { p: P.name || '', c: cname(o.c) }), who(P));
      });
      if (typeof renderBoard === 'function') renderBoard();
    };

    ask(P, {
      title: t('lg.exile'), sub: m[0].slice(0, 70), cards: list.map(o => o.c),
      min: Math.min(n, list.length), max: Math.min(n, list.length), cb: take
    }, (l, max) => bestBy(l, max, { dest: 'exile', mine: owner === P }));
    return { rest: line.replace(m[0], ' ') };
  }

  /* ---------- enganche en applySpell ---------- */
  const spellBase = applySpell;
  applySpell = function (P, card, srcName, quiet) {
    if (!P || !card || !card.oracle) return spellBase.apply(this, arguments);
    let did = false;
    const keep = [];
    String(card.oracle).split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) return;
      let rest = line, hit = false;
      [stepSearch, stepDig, stepGy, stepGyExile].forEach(step => {
        const r = step(P, rest);
        if (r) { hit = true; rest = r.rest; }
      });
      if (hit) did = true;
      rest = rest.replace(/\s{2,}/g, ' ').trim();
      if (rest && rest.replace(/[^a-záéíóúñ]/gi, '').length > 3) keep.push(rest);
    });
    if (!did) return spellBase.apply(this, arguments);
    if (!keep.length) return true;
    return spellBase.call(this, P, Object.assign({}, card, { oracle: keep.join('\n') }), srcName, quiet);
  };

  /* ---------- auras: elegir el huésped ---------- */
  const isAuraCard = c => /aura/i.test(String((c && c.type) || '')) || /^enchant /im.test(String((c && c.oracle) || ''));

  function auraHosts(P, card) {
    const o = low(card.oracle);
    const own = /enchant creature you control/.test(o) || /you control/.test(o);
    const kinds = [];
    if (/\bcreature\b/.test(o)) kinds.push(c => /creature/i.test(c.type || ''));
    if (/\bland\b/.test(o)) kinds.push(c => /land/i.test(c.type || ''));
    if (/\bplaneswalker\b/.test(o)) kinds.push(c => /planeswalker/i.test(c.type || ''));
    if (!kinds.length) kinds.push(c => !/instant|sorcery/i.test(c.type || ''));
    const test = c => kinds.some(f => f(c));
    const out = [];
    [G.you, G.ai].forEach(Q => {
      if (!Q) return;
      if (own && Q !== P) return;
      (Q.bf || []).forEach(x => { if (x && x.card && test(x.card)) out.push({ P: Q, perm: x }); });
    });
    return out;
  }

  const playBase = playFromHand;
  playFromHand = function (P, idx, asCmd) {
    const name = asCmd ? (P && P.cmd && P.cmd.name) : (P && P.hand ? P.hand[idx] : null);
    const card = name ? cardOfSafe(name) : null;
    if (!P || !card || !isAuraCard(card)) return playBase.apply(this, arguments);
    const hosts = auraHosts(P, card);
    if (!hosts.length) {
      if (human(P)) toast(t('lg.noTarget'));
      return false;
    }
    const cast = target => {
      const ok = playBase.call(this, P, idx, asCmd);
      if (!ok || !target) return ok;
      const perm = P.bf[P.bf.length - 1];
      if (!perm || !perm.card || perm.card.name !== card.name) return ok;
      const before = perm.attachTo;
      if (before === target.id) return ok;
      /* el motor eligió a otro: se cambia de huésped y se mueven las palabras clave */
      const granted = perm._granted || [];
      const old = (P.bf || []).concat(G.ai ? G.ai.bf : []).filter(x => x && x.id === before)[0];
      if (old && granted.length) {
        const natural = (cardOf(old.card.name) || {}).kw || [];
        const keep = (old.card.kw || []).filter(k => granted.indexOf(k) < 0 || natural.indexOf(k) >= 0);
        old.card = Object.assign({}, old.card, { kw: keep });
      }
      perm.attachTo = target.id;
      if (granted.length) {
        target.card = Object.assign({}, target.card, { kw: [...new Set([...(target.card.kw || []), ...granted])] });
      }
      logLine(t('lg.auraOn', { a: cname(card), t: cname(target.card) }), who(P));
      if (typeof renderBoard === 'function') renderBoard();
      return ok;
    };
    if (!human(P)) {
      const i = bestBy(hosts.map(h => h.perm.card), 1, { dest: 'host' })[0];
      return cast(hosts[i >= 0 ? i : 0].perm);
    }
    if (hosts.length === 1) return cast(hosts[0] && hosts[0].perm);
    /* el humano elige: se lanza en cuanto elige */
    ask(P, {
      title: t('lg.aura'), sub: cname(card), cards: hosts.map(h => h.perm.card),
      min: 1, max: 1,
      cb: sel => {
        const h = hosts[sel && sel[0]];
        if (!h) return;
        cast(h.perm);
        if (typeof renderPhase === 'function') renderPhase();
      }
    }, (l, max) => bestBy(l, max, { dest: 'host' }));
    return false;
  };

  /* ganchos de prueba */
  window.__lg = {
    search: stepSearch, dig: stepDig, gy: stepGy, exile: stepGyExile,
    auraHosts: auraHosts, pending: () => wait.length, pick: () => wait[0] || null,
    score: scoreCard, best: bestBy, autoNow: autoNow, human: human, aiPause: AI_PAUSE
  };
})();
