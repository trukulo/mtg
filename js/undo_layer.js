/* ================= DESHACER · REANUDAR · REPLAY =================
   Cómo funciona:
   - Cada repintado del tablero (el motor repinta después de cada acción) guarda
     una foto del estado completo. Esas fotos forman la línea de tiempo.
   - Deshacer retrocede a la foto anterior en la que era tu turno (las de la IA se
     saltan), así el botón siempre te devuelve a una decisión tuya.
   - Cada foto lleva como etiqueta la última línea del registro: los botones sirven
     además como replay paso a paso de lo que ha pasado.
   - La partida viva se guarda en localStorage (una sola copia, sin historial) y al
     recargar se ofrece continuarla; empezar una partida nueva borra la guardada.
   No toca el motor ni los ids: si esta capa falla, la partida sigue igual.
------------------------------------------------------------------ */
(function () {
  'use strict';
  if (typeof G === 'undefined' || !G) return;

  var KEY = 'tcg_game_v1';
  var MAX = 40;
  var hist = [], pos = -1, applying = false, saveT = null, barEl = null;
  var flashT = null, flashing = false;

  function el(id) { return document.getElementById(id); }

  /* ---------- copia segura (sin Sets, sin funciones, sin ciclos) ---------- */
  function clone(v, stack) {
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof Set) return Array.from(v);
    stack = stack || [];
    if (stack.indexOf(v) >= 0) return null;
    stack.push(v);
    var out = Array.isArray(v) ? [] : {};
    for (var k in v) {
      if (!Object.prototype.hasOwnProperty.call(v, k)) continue;
      var x = v[k];
      if (typeof x === 'function') continue;
      out[k] = clone(x, stack);
    }
    stack.pop();
    return out;
  }

  function ser() {
    if (!G || !G.you) return null;
    try {
      return JSON.stringify(clone({
        turn: G.turn, turnNo: G.turnNo, phase: G.phase, over: !!G.over, diff: G.diff,
        you: G.you, ai: G.ai, pending: G.pending || null, log: (G.log || []).slice(-80)
      }));
    } catch (e) { return null; }
  }

  function lastLog() {
    var l = (G && G.log && G.log[G.log.length - 1]) || null;
    return l ? String(l.t || '').replace(/<[^>]*>/g, '') : '';
  }

  function deckName() {
    try { return (G.you && G.you.deck && G.you.deck.name) || ''; } catch (e) { return ''; }
  }

  /* ---------- línea de tiempo ---------- */
  function push() {
    if (applying || !G || !G.you || G.over) return false;
    var s = ser();
    if (!s) return false;
    var ref = (pos === hist.length - 1) ? hist[hist.length - 1] : hist[pos];
    if (ref && ref.s === s) return false;                          /* nada nuevo */
    /* la foto anterior se queda con la línea de registro que provocó el cambio */
    if (pos >= 0 && hist[pos] && !hist[pos].label) hist[pos].label = lastLog();
    if (pos < hist.length - 1) hist = hist.slice(0, pos + 1);        /* jugada nueva */
    hist.push({ s: s, label: lastLog(), at: Date.now(), turn: G.turn });
    if (hist.length > MAX) hist.shift();
    pos = hist.length - 1;
    renderBar();
    return true;
  }

  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try {
        if (!G || !G.you) return;
        if (G.over) { localStorage.removeItem(KEY); return; }
        var s = ser();
        if (!s) return;
        localStorage.setItem(KEY, JSON.stringify({
          s: s, label: lastLog(), at: Date.now(), turnNo: G.turnNo, deck: deckName()
        }));
      } catch (e) { /* sin espacio: se juega igual */ }
    }, 400);
  }

  /* ---------- aplicar una foto ---------- */
  function applyAt(i) {
    var h = hist[i];
    if (!h) return false;
    var st;
    try { st = JSON.parse(h.s); } catch (e) { return false; }
    applying = true;
    try {
      G.turn = st.turn; G.turnNo = st.turnNo; G.phase = st.phase; G.over = !!st.over;
      G.diff = st.diff; G.you = st.you; G.ai = st.ai; G.pending = st.pending || null;
      G.log = st.log || [];
      G.selected = new Set();
      G._seenBf = new Set();
      G.busy = false;
      pos = i;
      if (typeof renderBoard === 'function') renderBoard();
      if (typeof renderLog === 'function') renderLog();
      if (typeof renderPhase === 'function') renderPhase();
      if (typeof renderCommand === 'function') renderCommand();
      if (typeof hideZoom === 'function') hideZoom();
    } finally { applying = false; }
    persist();
    renderBar();
    return true;
  }

  function prevMine(i) {
    while (i >= 0) {
      if (hist[i] && hist[i].turn === 'you') return i;
      i--;
    }
    return -1;
  }

  function undo() {
    if (!G || !G.you) return;
    if (G.busy || G.turn !== 'you') { flashBar('Espera a que termine la IA'); return; }
    var i = prevMine(pos - 1);
    if (i < 0) { flashBar('No hay más atrás'); return; }
    applyAt(i);
  }

  function redo() {
    if (!G || pos >= hist.length - 1) return;
    if (G.busy || G.turn !== 'you') { flashBar('Espera a que termine la IA'); return; }
    applyAt(pos + 1);
  }

  /* ---------- barra ---------- */
  function ensureBar() {
    if (barEl) return barEl;
    barEl = document.createElement('div');
    barEl.id = 'undoBar';
    barEl.innerHTML =
      '<button type="button" id="undoDo" title="Deshacer (Ctrl+Z)">&#8630;</button>' +
      '<button type="button" id="undoRedo" title="Rehacer (Ctrl+Y)">&#8631;</button>' +
      '<span id="undoStep"></span>';
    document.body.appendChild(barEl);
    el('undoDo').onclick = function (e) { e.preventDefault(); undo(); };
    el('undoRedo').onclick = function (e) { e.preventDefault(); redo(); };
    return barEl;
  }

  function flashBar(msg) {
    var sp = el('undoStep');
    if (!sp) return;
    flashing = true;
    sp.innerHTML = '<b>' + msg + '</b>';
    clearTimeout(flashT);
    flashT = setTimeout(function () { flashing = false; renderBar(); }, 1600);
  }

  function renderBar() {
    var bar = ensureBar();
    var on = !!(G && G.you) && document.body.classList.contains('playing');
    bar.classList.toggle('on', on);
    if (!on) return;
    var b1 = el('undoDo'), b2 = el('undoRedo'), sp = el('undoStep');
    var aiTurnNow = !!(G && G.you && (G.turn !== 'you' || G.busy));
    if (b1) {
      b1.disabled = aiTurnNow || prevMine(pos - 1) < 0;
      b1.title = aiTurnNow ? 'Puedes deshacer cuando termine la IA' : 'Deshacer (Ctrl+Z)';
    }
    if (b2) b2.disabled = aiTurnNow || pos >= hist.length - 1;
    if (sp && !flashing) {
      /* lo último del registro: lo que acaba de pasar en la mesa */
      var label = lastLog() || (hist[pos] && hist[pos].label) || '';
      sp.innerHTML = '<b>' + (pos + 1) + '/' + hist.length + '</b>' +
        (label ? ' · ' + String(label).replace(/[<>&]/g, '') : '');
      sp.title = label;
    }
  }

  /* ---------- reanudar al recargar ---------- */
  function showGame() {
    if (typeof go === 'function') { try { go('jugar'); } catch (e) { } }
    var j = el('jugar'), t = el('jTable'), s = el('jSetup'), m = document.querySelector('main');
    if (j) j.classList.add('playing');
    if (m) m.classList.add('wide', 'playing');
    if (t) t.style.display = 'block';
    if (s) s.style.display = 'none';
    document.body.classList.add('playing');
    if (t) document.body.classList.add('arena-mat-on');
  }

  function resume(saved) {
    var st;
    try { st = JSON.parse(saved.s); } catch (e) { return false; }
    hist = []; pos = -1;
    applying = true;
    try {
      G.you = st.you; G.ai = st.ai; G.turn = st.turn; G.turnNo = st.turnNo;
      G.phase = st.phase; G.over = !!st.over; G.diff = st.diff; G.pending = st.pending || null;
      G.log = st.log || [];
      G.selected = new Set(); G._seenBf = new Set(); G.busy = false;
    } finally { applying = false; }
    showGame();
    applying = true;
    try {
      if (typeof renderLog === 'function') renderLog();
      if (typeof renderPhase === 'function') renderPhase();
      if (typeof renderCommand === 'function') renderCommand();
      if (typeof renderBoard === 'function') renderBoard();
    } finally { applying = false; }
    hist.push({ s: saved.s, label: saved.label || '', at: Date.now(), turn: st.turn });
    pos = 0;
    renderBar();
    if (!G.over && G.turn === 'ai' && typeof aiTurn === 'function') {
      setTimeout(function () { try { aiTurn(); } catch (e) { } }, 700);
    }
    return true;
  }

  function offerResume() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { localStorage.removeItem(KEY); return; }
    if (!saved || !saved.s) { localStorage.removeItem(KEY); return; }
    if (el('undoResume')) return;
    var box = document.createElement('div');
    box.id = 'undoResume';
    box.className = 'on';
    var when = '';
    try {
      when = new Date(saved.at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { }
    box.innerHTML = '<span class="ut">Partida guardada' +
      (saved.deck ? ' · <b>' + String(saved.deck).replace(/[<>&]/g, '') + '</b>' : '') +
      (saved.turnNo ? ' · turno <b>' + saved.turnNo + '</b>' : '') +
      (when ? ' · ' + when : '') +
      '</span><button type="button" class="pri" id="undoCont">Continuar</button>' +
      '<button type="button" id="undoDiscard">Descartar</button>';
    document.body.appendChild(box);
    el('undoCont').onclick = function () {
      box.remove();
      if (!resume(saved)) localStorage.removeItem(KEY);
    };
    el('undoDiscard').onclick = function () {
      box.remove();
      try { localStorage.removeItem(KEY); } catch (e) { }
    };
  }

  /* ---------- engancharse ---------- */
  /* partida nueva: historial y guardado empiezan de cero */
  if (typeof startGame === 'function') {
    var sg = startGame;
    startGame = function () {
      hist = []; pos = -1; applying = false;
      try { localStorage.removeItem(KEY); } catch (e) { }
      try { renderBar(); } catch (e) { }
      return sg.apply(this, arguments);
    };
  }

  /* cada repintado: foto nueva (si cambió algo) y partida guardada al día */
  if (typeof renderBoard === 'function') {
    var rb = renderBoard;
    renderBoard = function () {
      var r = rb.apply(this, arguments);
      if (!applying) {
        try { push(); } catch (e) { }
        try { persist(); } catch (e) { }
      }
      try { renderBar(); } catch (e) { }
      return r;
    };
  }

  document.addEventListener('keydown', function (e) {
    if (!G || !G.you) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) {
      e.preventDefault(); redo();
    }
  });

  /* refresco suave de la barra (el turno de la IA cambia sin repintar) */
  setInterval(function () {
    try { if (!flashing && G && G.you && document.body.classList.contains('playing')) renderBar(); } catch (e) { }
  }, 700);

  window.__undo = {
    undo: undo, redo: redo, push: push,
    hist: function () { return hist.length; },
    pos: function () { return pos; },
    dump: function () {
      return hist.map(function (h, i) {
        try {
          var st = JSON.parse(h.s);
          return {
            i: i, turn: st.turn, turnNo: st.turnNo, over: !!st.over,
            mano: (st.you.hand || []).length,
            tierras: (st.you.bf || []).filter(function (x) { return x.card && x.card.land; }).length,
            vida: st.you.life, label: h.label
          };
        } catch (e) { return { i: i, error: String(e) }; }
      });
    }
  };

  if (document.readyState !== 'loading') setTimeout(function () { try { offerResume(); } catch (e) { } }, 300);
  else document.addEventListener('DOMContentLoaded', function () { try { offerResume(); } catch (e) { } });
})();
