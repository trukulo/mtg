/* ============================================================
   Sagas y planeswalkers · capa autocontenida
   - Sagas: entran con un contador de relato y resuelven el capítulo I; al empezar
     tu fase principal (primer repintado del turno) se añade un contador y se
     resuelve ese capítulo; al llegar al último la saga se sacrifica.
   - Planeswalkers: entran con su lealtad, tienen panel de habilidades de lealtad
     (una por turno, no se puede bajar de 0), mueren con 0 de lealtad y reciben
     daño con `loyalty` (el motor de commander/brawl/standard ya lo hace; aquí se
     rellena lo que falta, sobre todo en captain).
   Los efectos se resuelven con `applySpell`, como el resto de capas.
   ============================================================ */
(() => {
  if (typeof G === 'undefined' || typeof applySpell !== 'function' || typeof playFromHand !== 'function') return;

  Object.assign(I18N.es, {
    'sw.pwEnter': '{c} entra con {n} de lealtad.',
    'sw.pwAbility': '{c}: {a}.',
    'sw.pwDies': '{c} pierde toda su lealtad.',
    'sw.sagaEnter': '{c} entra con un contador de relato (capítulo I).',
    'sw.sagaTick': '{c}: contador de relato {n}.',
    'sw.sagaDone': '{c} completó su último capítulo y se sacrifica.',
    'sw.loyalty': 'Lealtad {n}',
    'sw.lore': 'Relato {n}',
    'sw.panel': 'Habilidades',
    'sw.sagaChapter': '{c}: capítulo {n}.',
    'sw.pumpAll': '{n} criaturas obtienen {a}/{b}.',
    'sw.draw': 'Robo de {n} carta(s).',
    'sw.xPick': 'Elige X (0 a {n})',
    'sw.both': 'ambos jugadores'
  });
  Object.assign(I18N.en, {
    'sw.pwEnter': '{c} enters with {n} loyalty.',
    'sw.pwAbility': '{c}: {a}.',
    'sw.pwDies': '{c} loses all loyalty.',
    'sw.sagaEnter': '{c} enters with a lore counter (chapter I).',
    'sw.sagaTick': '{c}: lore counter {n}.',
    'sw.sagaDone': '{c} finished its last chapter and is sacrificed.',
    'sw.loyalty': 'Loyalty {n}',
    'sw.lore': 'Lore {n}',
    'sw.panel': 'Abilities',
    'sw.sagaChapter': '{c}: chapter {n}.',
    'sw.pumpAll': '{n} creatures get {a}/{b}.',
    'sw.draw': 'Draw of {n} card(s).',
    'sw.xPick': 'Choose X (0 to {n})',
    'sw.both': 'both players'
  });
  Object.assign(I18N.fr, {
    'sw.pwEnter': '{c} arrive avec {n} de loyauté.',
    'sw.pwAbility': '{c} : {a}.',
    'sw.pwDies': '{c} perd toute sa loyauté.',
    'sw.sagaEnter': '{c} arrive avec un marqueur de récit (chapitre I).',
    'sw.sagaTick': '{c} : marqueur de récit {n}.',
    'sw.sagaDone': '{c} a terminé son dernier chapitre et est sacrifié.',
    'sw.loyalty': 'Loyauté {n}',
    'sw.lore': 'Récit {n}',
    'sw.panel': 'Capacités',
    'sw.sagaChapter': '{c} : chapitre {n}.',
    'sw.pumpAll': '{n} créatures gagnent {a}/{b}.',
    'sw.draw': 'Pioche de {n} carte(s).',
    'sw.xPick': 'Choisissez X (0 à {n})',
    'sw.both': 'les deux joueurs'
  });

  const isPW = c => /planeswalker/i.test(String((c && c.type) || ''));
  const isSaga = c => /\bsaga\b/i.test(String((c && c.type) || ''));
  const side = P => (P === G.you ? 'you' : 'ai');

  /* ---------- sagas ---------- */
  const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };
  const roman = r => ROMAN[String(r || '').trim().toLowerCase()] || 0;
  /* la raya puede llegar como em dash, en dash o guion: se pide por código para
     no depender de cómo se sirva el archivo */
  const CHAPTER = /^(?:chapter\s*)?(VIII|VII|VI|IV|V|III|II|I)(?:\s*,\s*(?:VIII|VII|VI|IV|V|III|II|I))*\s*[\u2014\u2013-]\s*(.+)$/i;

  function sagaChapters(card) {
    const out = [];
    String((card && card.oracle) || '').split('\n').forEach(line => {
      const m = line.trim().match(CHAPTER);
      if (!m) return;
      /* la coletilla entre paréntesis es texto recordatorio («Then sacrifice it») */
      const eff = m[2].replace(/\s*\([^)]*\)\.?\s*$/, '').trim();
      if (!eff) return;
      const nums = line.trim().replace(/^chapter\s*/i, '').split(/[\u2014\u2013-]/)[0].split(',');
      nums.forEach(r => { const n = roman(r); if (n) out.push({ n: n, eff: eff }); });
    });
    return out.sort((a, b) => a.n - b.n);
  }
  const sagaMax = card => sagaChapters(card).reduce((m, c) => Math.max(m, c.n), 0);

  const isCrea = x => !!(x && x.card && /\bcreature\b/i.test(String(x.card.type || '')) && !/planeswalker/i.test(String(x.card.type || '')));

  /* «las criaturas que controlas / los caballeros que controlas obtienen +N/+M»:
     applySpell solo sube a un objetivo, así que este caso se aplica a todas (y así
     no cae en el atajo de tokens, que creaba una ficha por el tipo del texto). */
  function massPump(P, eff) {
    const m = eff.match(/gets? ([+-]\d+)\/([+-]\d+)/i);
    if (!m) return false;
    if (!/you control|each creature|all creatures|all .+ you control/i.test(eff)) return false;
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    if (!a && !b) return false;
    const only = (eff.match(/^\s*(?:all|each|other)?\s*([a-z]+s)\s+you control/i) || [])[1];
    const needle = only ? only.replace(/s$/, '').toLowerCase() : '';
    const list = (P.bf || []).filter(x => isCrea(x));
    const target = needle ? list.filter(x => String(x.card.type || '').toLowerCase().indexOf(needle) >= 0) : list;
    if (!target.length) return false;
    target.forEach(x => { x.a += a; x.b += b; });
    logLine(t('sw.pumpAll', { n: target.length, a: (a >= 0 ? '+' : '') + a, b: (b >= 0 ? '+' : '') + b }), side(P));
    return true;
  }

  /* «cada jugador roba una carta» / «el jugador objetivo roba tres»: el motor solo
     reconoce «draw a card», así que estos casos se resuelven aquí. Se exige el
     verbo en tercera persona (draws) para no robar dos veces lo que ya hace applySpell. */
  function drawEffect(P, eff) {
    /* imperativo con cifra («Draw 3 cards.», lo que deja una X resuelta): el motor
       solo reconoce el número escrito con letras, así que esta parte es de la capa */
    let m = eff.match(/^\s*draw\s+(\d+)\s+cards?/i);
    if (!m) m = eff.match(/(each player|each opponent|target player|that player)?\s*draws\s+(a|an|one|two|three|four|\d+)\s+cards?/i);
    if (!m) return false;
    const num = m[2] != null ? m[2] : m[1];
    const n = /^\d+$/.test(num) ? +num : ({ a: 1, an: 1, one: 1, two: 2, three: 3, four: 4 }[String(num).toLowerCase()] || 0);
    if (!n) return false;
    const who = String(m[2] != null ? (m[1] || '') : '').toLowerCase();
    const foe = P === G.you ? G.ai : G.you;
    if (/each player/.test(who)) { draw(P, n); draw(foe, n); }
    else if (/each opponent|that player/.test(who)) { draw(foe, n); }
    else { draw(P, n); }
    logLine(t('sw.draw', { n: n, p: /each player/.test(who) ? t('sw.both') : (P.name || '') }), side(P));
    return true;
  }

  function applyEffect(P, srcCard, eff, quiet) {
    if (!eff) return false;
    if (massPump(P, eff)) return true;
    if (drawEffect(P, eff)) return true;
    return applySpell(P, Object.assign({}, srcCard, { oracle: eff }), cardName(srcCard), !!quiet);
  }

  function sagaFire(P, perm, n, quiet) {
    /* una misma línea puede traer varios capítulos («I, II — …»): se resuelven todos */
    const chs = sagaChapters(perm.card).filter(c => c.n === n);
    if (!chs.length) return false;
    if (!quiet) logLine(t('sw.sagaChapter', { c: cardName(perm.card), n: n }), side(P));
    chs.forEach(ch => applyEffect(P, perm.card, ch.eff, quiet));
    return true;
  }

  /* ---------- planeswalkers: lealtad ---------- */
  function pwAbs(card) {
    const out = [];
    String((card && card.oracle) || '').split('\n').forEach(line => {
      const m = line.trim().match(/^\[?([+\u2212\u2013-]?\d+|[+\u2212\u2013-]?x)\]?\s*:\s*(.+)$/i);
      if (!m) return;
      const eff = m[2].replace(/\s*\([^)]*\)\.?\s*$/, '').trim();
      if (!eff) return;
      const raw = m[1].replace(/[\u2212\u2013]/g, '-');
      /* «−X»: el jugador elige la X (0..lealtad) al activar */
      if (/^[+-]?x$/i.test(raw)) { out.push({ n: null, x: true, sign: (/^-/.test(raw) ? -1 : 1), eff: eff }); return; }
      const n = parseInt(raw, 10);
      if (!isFinite(n)) return;
      out.push({ n: n, eff: eff });
    });
    return out;
  }

  /* coste real de la habilidad: fijo, o X elegido */
  const loyCost = (a, x) => (a && a.x
    ? (a.sign < 0 ? -1 : 1) * Math.max(0, parseInt(x, 10) || 0)
    : (a ? a.n : 0));

  function canLoy(P, perm, a, x) {
    if (!P || !perm || !perm.card || !isPW(perm.card) || perm.loyalty == null || !a) return false;
    if (perm._loyTurn === G.turnNo) return false;
    if ((perm.loyalty || 0) + loyCost(a, x) < 0) return false;
    if (P === G.you && !(G.turn === 'you' && (G.phase === 'main1' || G.phase === 'main2'))) return false;
    return true;
  }

  function useLoy(P, perm, a, x) {
    if (!canLoy(P, perm, a, x)) return false;
    const c = loyCost(a, x);
    perm.loyalty = (perm.loyalty || 0) + c;
    perm.loy = perm.loyalty;
    perm._loyTurn = G.turnNo;
    logLine(t('sw.pwAbility', { c: cardName(perm.card), a: (c > 0 ? '+' : '') + c }), side(P));
    /* la X del texto es la cantidad, sin el signo del coste */
    const v = a.x ? Math.abs(loyCost(a, x)) : null;
    const eff = v == null ? a.eff : String(a.eff).replace(/\bX\b/g, String(v));
    applyEffect(P, perm.card, eff, true);
    checkDeaths();
    renderBoard();
    return true;
  }

  /* ---------- marcas de entrada ----------
     Se ponen las marcas que falten a cualquier saga o planeswalker que ya esté en
     el campo, venga de la mano o de un efecto (reanimar, buscar, copiar): así el
     relato y la lealtad se siembran también cuando la carta no se lanza a mano.
     El capítulo I de una saga se resuelve aquí, igual que al lanzarla. */
  function seed() {
    [G.you, G.ai].forEach(P => {
      if (!P) return;
      (P.bf || []).slice().forEach(perm => {
        if (!perm || !perm.card) return;
        const c = perm.card;
        if (isPW(c) && perm.loyalty == null) {
          const loy = parseInt(c.loyalty, 10);
          if (!isFinite(loy)) return;
          perm.pw = true;
          perm.loyalty = loy;
          perm.loy = loy;
          logLine(t('sw.pwEnter', { c: cardName(c), n: loy }), side(P));
        }
        if (isSaga(c) && perm.lore == null) {
          perm.lore = 1;
          perm._sagaTurn = G.turnNo;      /* el capítulo I no cuenta como el del turno */
          logLine(t('sw.sagaEnter', { c: cardName(c) }), side(P));
          sagaFire(P, perm, 1, true);
        }
      });
    });
  }

  /* ---------- un contador por turno al empezar la fase principal ---------- */
  let tickKey = '';
  function tick() {
    if (!G.you || !G.ai || G.over) return;
    if (window.MP && MP.live && MP.role === 'guest') return;   /* el anfitrión manda */
    const key = G.turnNo + '|' + G.turn;
    if (tickKey === key) return;
    tickKey = key;
    const P = G.turn === 'you' ? G.you : G.ai;
    /* una saga recién puesta ya resolvió su capítulo I: su siguiente contador
       llega en tu próxima fase principal, no en el mismo turno */
    const sagas = (P.bf || []).filter(x => x && x.card && isSaga(x.card) &&
      x.lore != null && x._sagaTurn !== G.turnNo);
    sagas.forEach(perm => {
      const max = sagaMax(perm.card);
      if (!max) return;
      perm.lore = (perm.lore || 1) + 1;
      const n = perm.lore;
      logLine(t('sw.sagaTick', { c: cardName(perm.card), n: n }), side(P));
      sagaFire(P, perm, Math.min(n, max), true);
      if (n >= max) {
        P.bf = P.bf.filter(x => x !== perm);
        if (!perm.token) P.gy.push(perm.name);
        logLine(t('sw.sagaDone', { c: cardName(perm.card) }), side(P));
      }
    });
    /* la IA usa una habilidad de lealtad al empezar su turno */
    if (P === G.ai) {
      (P.bf || []).slice().forEach(perm => {
        if (!perm || !perm.card || !isPW(perm.card) || perm.loyalty == null) return;
        const abs = pwAbs(perm.card);
        if (!abs.length) return;
        /* la IA no elige X: usa la mejor habilidad de coste fijo */
        const fixed = abs.filter(a => !a.x);
        const pick = fixed.filter(a => a.n >= 0).sort((a, b) => b.n - a.n)[0] || fixed[0];
        if (pick && canLoy(P, perm, pick)) useLoy(P, perm, pick);
      });
    }
    if (sagas.length) { checkDeaths(); renderBoard(); }
  }

  /* ---------- lealtad al día y muerte a 0 ---------- */
  function syncLoy() {
    [G.you, G.ai].forEach(P => {
      if (!P) return;
      (P.bf || []).forEach(x => {
        if (!x || !x.card || !isPW(x.card)) return;
        if (x.loyalty == null && x.loy != null) x.loyalty = x.loy;
        if (x.loy != null && x.loy < x.loyalty) x.loyalty = x.loy;   /* daño de otros caminos */
        x.loy = x.loyalty;
      });
    });
  }
  function pwSweep() {
    [G.you, G.ai].forEach(P => {
      if (!P) return;
      (P.bf || []).filter(x => x && x.card && isPW(x.card) && x.loyalty != null && x.loyalty <= 0)
        .slice().forEach(pw => {
          P.bf = P.bf.filter(y => y !== pw);
          if (!pw.token) P.gy.push(pw.name);
          logLine(t('sw.pwDies', { c: cardName(pw.card) }), side(P));
        });
    });
  }

  /* ---------- contador en la carta ---------- */
  if (typeof permInner === 'function') {
    const piBase = permInner;
    permInner = function (x) {
      let html = piBase.apply(this, arguments);
      const c = (x && x.card) || {};
      if (isSaga(c) && x && x.lore != null) {
        html += '<span class="loy lore" title="' + t('sw.lore', { n: x.lore }) + '">' + x.lore + '</span>';
        /* el contador de relato tiene que repintarse aunque la carta no cambie de otra cosa */
      } else if (isPW(c) && x && x.loyalty != null && String(html).indexOf('class="loy"') < 0) {
        html += '<span class="loy" title="' + t('sw.loyalty', { n: x.loyalty }) + '">' + x.loyalty + '</span>';
      }
      return html;
    };
  }

  /* ---------- panel propio (captain y standard) ---------- */
  function panel() {
    let el = document.getElementById('swPanel');
    if (!el) {
      el = document.createElement('div');
      el.id = 'swPanel';
      el.className = 'swpanel';
      document.body.appendChild(el);
    }
    return el;
  }

  /* elegir X (0..lealtad) para una habilidad «−X» */
  function drawX(perm, a) {
    const el = panel();
    const max = Math.max(0, parseInt(perm.loyalty, 10) || 0);
    let h = '<div class="swhd"><b>' + t('sw.xPick', { n: max }) + '</b>'
      + '<span class="swloy">' + t('sw.loyalty', { n: perm.loyalty }) + '</span>'
      + '<button class="swx" data-swx="1" aria-label="×">×</button></div><div class="swrow">';
    const sg = a.sign < 0 ? '−' : '+';
    for (let i = 0; i <= max; i++) h += '<button class="swab" data-swxi="' + i + '">' + sg + i + '</button>';
    h += '</div><div class="sweff">' + String(a.eff || '').replace(/</g, '&lt;') + '</div>';
    el.innerHTML = h;
    el.classList.add('on');
    const x = el.querySelector('[data-swx]');
    if (x) x.onclick = () => { G.permSel = null; renderBoard(); };
    el.querySelectorAll('[data-swxi]').forEach(b => {
      b.onclick = () => { useLoy(G.you, perm, a, +b.getAttribute('data-swxi')); };
    });
  }

  function drawPanel() {
    const el = panel();
    const native = document.querySelector('.abilbox');
    if (!G.you || G.over || (window.MP && MP.live && MP.role === 'guest')) {
      el.classList.remove('on');
      if (native) native.style.display = '';
      return;
    }
    const perm = (G.you.bf || []).filter(x => x && x.id === G.permSel)[0];
    const abs = (perm && perm.card && isPW(perm.card) && perm.loyalty != null) ? pwAbs(perm.card) : [];
    const hasX = abs.some(a => a.x);
    /* el panel del motor no conoce las habilidades «−X»: en ese caso manda el de la capa */
    if (native) native.style.display = hasX ? 'none' : '';
    if (!abs.length) { el.classList.remove('on'); el.innerHTML = ''; return; }
    if (native && native.offsetParent !== null) { el.classList.remove('on'); return; }

    const canAct = G.turn === 'you' && !G.over && (G.phase === 'main1' || G.phase === 'main2');
    let h = '<div class="swhd"><b>' + cardName(perm.card) + '</b><span class="swloy">' + t('sw.loyalty', { n: perm.loyalty }) + '</span>'
      + '<button class="swx" data-swx="1" aria-label="×">×</button></div><div class="swrow">';
    abs.forEach((a, i) => {
      const dis = !canAct || perm._loyTurn === G.turnNo || (perm.loyalty + (a.x ? 0 : a.n) < 0);
      h += '<button class="swab" data-swa="' + i + '"' + (dis ? ' disabled' : '') + ' title="' + a.eff.replace(/"/g, '&quot;') + '">'
        + (a.x ? (a.sign < 0 ? '−' : '+') + 'X' : (a.n > 0 ? '+' : '') + a.n) + '</button>';
    });
    h += '</div>';
    const first = abs[0];
    if (first) h += '<div class="sweff">' + first.eff.replace(/</g, '&lt;') + '</div>';
    el.innerHTML = h;
    el.classList.add('on');
    const x = el.querySelector('[data-swx]');
    if (x) x.onclick = () => { G.permSel = null; renderBoard(); };
    el.querySelectorAll('[data-swa]').forEach(b => {
      b.onclick = () => {
        const a = abs[+b.getAttribute('data-swa')];
        if (a && a.x) { drawX(perm, a); return; }
        useLoy(G.you, perm, a);
      };
    });
    el.querySelectorAll('[data-swa]').forEach(b => {
      b.onmouseenter = () => {
        const a = abs[+b.getAttribute('data-swa')];
        const eff = el.querySelector('.sweff');
        if (a && eff) eff.textContent = a.eff;
      };
    });
  }

  /* seleccionar un planeswalker propio con un clic (captain no lo trae) */
  if (typeof bindBoardEvents === 'function') {
    const bbBase = bindBoardEvents;
    bindBoardEvents = function () {
      bbBase.apply(this, arguments);
      const root = document.querySelector('#jYouBf');
      if (!root) return;
      root.querySelectorAll('.bcard').forEach(el => {
        if (el._swBound) return;
        const id = +el.dataset.perm;
        const perm = ((G.you && G.you.bf) || []).filter(x => x && x.id === id)[0];
        if (!perm || !perm.card || !isPW(perm.card)) return;
        el._swBound = 1;
        el.addEventListener('click', () => {
          if (!G.you || G.over || G.turn !== 'you' || G.phase === 'combat') return;
          G.permSel = id;
          renderBoard();
        });
      });
    };
  }

  /* ganchos de prueba (mismo criterio que `window.fdnBuild`) */
  window.__sagaChapters = sagaChapters;
  window.__sagaMax = sagaMax;
  window.__pwAbs = pwAbs;

  /* ---------- la firma de la carta incluye el relato, para que el contador se repinte ---------- */
  if (typeof permSig === 'function') {
    const sigBase = permSig;
    permSig = function (x) {
      return sigBase.apply(this, arguments) + '|lore' + (x && x.lore != null ? x.lore : '');
    };
  }

  /* ---------- el panel del motor se rehace tras cada `renderCommand` ---------- */
  if (typeof renderCommand === 'function') {
    const rcBase = renderCommand;
    renderCommand = function () {
      const out = rcBase.apply(this, arguments);
      try { drawPanel(); } catch (e) { }
      return out;
    };
  }

  /* ---------- enganches ---------- */
  const rbBase = renderBoard;
  renderBoard = function () {
    try { seed(); } catch (e) { }
    try { tick(); } catch (e) { }
    const out = rbBase.apply(this, arguments);
    try { syncLoy(); pwSweep(); } catch (e) { }
    try { drawPanel(); } catch (e) { }
    return out;
  };
})();
