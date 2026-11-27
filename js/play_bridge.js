/* ===== Puente desde la Forja de mazos =====
   La Forja abre este tablero con  ?play=1&d=<json>
   y aquí se monta la partida con el motor real y un rival de la IA.
   - No guarda nada en la biblioteca del tablero.
   - Si el mazo no se puede resolver o el rival falla, se juega un espejo.
   - El parámetro se borra de la URL para que recargar no reinicie la partida. */
(function(){
  'use strict';
  var q;
  try { q = new URLSearchParams(location.search); } catch(e){ return; }
  if (q.get('play') !== '1' || !q.get('d')) return;

  var LANG = String(document.documentElement.lang || navigator.language || 'es').slice(0, 2).toLowerCase();
  var TX = {
    es: { prep:'Preparando la partida…', cards:'cartas · buscando datos…', rival:'Buscando un rival…',
          table:'Montando la mesa…', fail:'No se pudo preparar la partida: ', start:'No se pudo iniciar la partida: ',
          miss:' cartas no se encontraron en Scryfall; el mazo puede salir incompleto' },
    en: { prep:'Preparing the game…', cards:'cards · loading data…', rival:'Finding an opponent…',
          table:'Setting the table…', fail:'Could not prepare the game: ', start:'Could not start the game: ',
          miss:' cards were not found on Scryfall; the deck may be incomplete' },
    fr: { prep:'Préparation de la partie…', cards:'cartes · chargement…', rival:'Recherche d’un adversaire…',
          table:'Installation de la table…', fail:'Impossible de préparer la partie : ', start:'Impossible de lancer la partie : ',
          miss:' cartes introuvables sur Scryfall ; le deck peut être incomplet' }
  };
  var L = TX[LANG] || TX.es;

  var board = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '').toLowerCase();
  var p = null;
  try { p = JSON.parse(q.get('d')); } catch(e){ return; }
  if (!p || p.v !== 1 || !Array.isArray(p.cards) || p.format !== board) return;

  var cards = p.cards.filter(function(n){
    return typeof n === 'string' && n.trim() && n.length < 160;
  }).slice(0, 300);
  if (!cards.length) return;

  /* la partida no debe repetirse al recargar */
  try { history.replaceState(null, '', location.pathname + location.hash); } catch(e){}

  var deck = { cards: cards.slice(), captain: p.commander || null, name: p.name || 'Forja' };
  if (board === 'standard') deck.captain = null;

  var st = document.createElement('style');
  st.textContent = '#playBridge{position:fixed;inset:0;z-index:99998;display:grid;place-items:center;' +
    'background:rgba(8,11,17,.86);backdrop-filter:blur(4px);font:14px/1.4 system-ui,sans-serif;color:#e9eef7}' +
    '#playBridge .pb{display:flex;align-items:center;gap:12px;padding:18px 22px;border:1px solid #ffffff26;' +
    'border-radius:14px;background:#121824;box-shadow:0 18px 60px #0009;max-width:min(92vw,460px)}' +
    '#playBridge b{font-size:15px}#playBridge small{display:block;color:#93a1b5;margin-top:3px}' +
    '#playBridge .spin{width:22px;height:22px;flex:0 0 22px;border-radius:50%;border:3px solid #ffffff2b;' +
    'border-top-color:#f0b429;animation:pbspin .8s linear infinite}' +
    '@keyframes pbspin{to{transform:rotate(360deg)}}';
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.id = 'playBridge';
  ov.innerHTML = '<div class="pb"><span class="spin"></span><div><b>' + L.prep + '</b>' +
    '<small></small></div></div>';
  document.body.appendChild(ov);

  function say(txt){ var s = ov.querySelector('small'); if (s) s.textContent = txt; }
  function done(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }

  function ready(){
    return typeof startGame === 'function' && typeof resolveNames === 'function';
  }

  /* Rival al instante: nada de generar el mazo por Scryfall en el camino crítico.
     1) un mazo guardado del propio tablero (sus cartas ya están en la caché local);
     2) si no hay ninguno, el espejo del mazo que vienes a probar.
     Solo se piden a Scryfall los nombres sueltos que falten en caché. */
  function libraryOpponent(){
    try {
      if (typeof state === 'undefined' || !state || !Array.isArray(state.packs)) return null;
      var want = { commander: 99, brawl: 59, standard: 60, captain: 40 }[board] || 40;
      var min = Math.ceil(want * 0.6);
      var needsCmd = board === 'commander' || board === 'brawl';
      var mine = new Set(deck.cards.concat(deck.captain ? [deck.captain] : []));
      var best = null;
      /* la biblioteca guarda el comandante aparte y a veces no lo conserva: si falta, se
         toma una criatura legendaria del propio mazo guardado */
      var cmdOf = function(p){
        if (p.captain) return p.captain;
        if (p.commander) return p.commander;
        if (!needsCmd) return null;
        for (var i = 0; i < p.cards.length; i++) {
          var c = (typeof cardOf === 'function') ? cardOf(p.cards[i]) : null;
          if (c && /legendary/i.test(c.type || '') && /creature/i.test(c.type || '')) return p.cards[i];
        }
        return null;
      };
      state.packs.forEach(function(p){
        if (!p || !Array.isArray(p.cards) || p.cards.length < min) return;
        var cap = cmdOf(p);
        if (needsCmd && !cap) return;
        var same = p.cards.length === deck.cards.length && p.cards.every(function(n){ return mine.has(n); });
        if (same) return;                       /* ese es literalmente el mismo mazo */
        var score = Math.abs(p.cards.length - want) + (cap ? 0 : 1);
        if (!best || score < best.score) best = { p: p, score: score, cap: cap };
      });
      if (!best) return null;
      return {
        cards: best.p.cards.slice(0, 300),
        captain: best.cap || null,
        name: best.p.name || 'Rival'
      };
    } catch(e){ return null; }
  }

  async function boot(){
    var tries = 0;
    while (!ready() && tries++ < 100) await new Promise(function(r){ setTimeout(r, 100); });
    if (!ready()) throw new Error('El tablero todavía no está listo');

    say(deck.cards.length + ' ' + L.cards);
    var names = Array.from(new Set(deck.cards.concat(deck.captain ? [deck.captain] : [])));
    await resolveNames(names);

    say(L.rival);
    var opp = libraryOpponent();
    if (!opp) opp = { cards: deck.cards.slice(), captain: deck.captain, name: deck.name };
    /* los nombres que ya estén en caché no cuestan nada; el resto, en una sola tanda */
    var unknown = opp.cards.filter(function(n){ return typeof cardOf !== 'function' || !cardOf(n); });
    if (unknown.length) {
      try { await resolveNames(unknown); } catch(e){}
    }
    if (board === 'standard') opp.captain = null;
    else opp.captain = opp.captain || opp.commander || null;

    say(L.table);
    try { if (typeof go === 'function') go('jugar'); } catch(e){}
    var started = Promise.resolve(startGame(deck, opp));
    var t0 = Date.now();
    var iv = setInterval(function(){
      var tb = document.getElementById('jTable');
      if ((tb && tb.style.display === 'block') || Date.now() - t0 > 15000) {
        clearInterval(iv); done();
      }
    }, 120);
    started.catch(function(e){
      clearInterval(iv); done();
      console.error(e);
      try { toast(L.start + (e && e.message || e), 7000); } catch(_){}
    });
    var missing = names.filter(function(n){ return typeof cardOf !== 'function' || !cardOf(n); });
    if (missing.length) {
      try { toast(missing.length + L.miss, 7000); } catch(e){}
    }
  }

  boot().catch(function(e){
    done();
    console.error(e);
    try { toast(L.fail + (e && e.message || e), 7000); } catch(_){}
  });
})();
