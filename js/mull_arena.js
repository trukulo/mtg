/* ================= MULLIGAN AL ESTILO ARENA =================
   Solo cambia la presentación: los ids (#jMullOver, #jMullFan, #jMullDo,
   #jMullKeep) y toda la lógica (mullRender, mullOpen, manejadores) siguen
   igual. La capa:
   - convierte el diálogo en una pantalla completa con viñeta,
   - coloca la mano en arco (rotación y altura por carta),
   - pone cabecera con el jugador y «Ver campo de batalla»,
   - cambia los textos de la cabecera a los de Arena.
------------------------------------------------------------------ */
(function () {
  'use strict';
  var over = document.getElementById('jMullOver');
  if (!over || typeof mullRender !== 'function') return;

  var $ = function (s) { return document.querySelector(s); };
  var TXT = {
    es: {
      first: 'Tú juegas primero', second: 'Tu oponente juega primero',
      wait: 'Tu oponente está eligiendo entre conservar 7 cartas o hacer mulligan.',
      peek: 'Ver campo de batalla', back: 'Volver a la mano',
      you: 'Tú', opp: 'Rival'
    },
    en: {
      first: 'You go first', second: 'Your opponent goes first',
      wait: 'Your opponent is choosing between keeping 7 cards or taking a mulligan.',
      peek: 'View battlefield', back: 'Back to hand',
      you: 'You', opp: 'Opponent'
    },
    fr: {
      first: 'Vous commencez', second: 'Votre adversaire commence',
      wait: 'Votre adversaire choisit entre garder 7 cartes ou faire un mulligan.',
      peek: 'Voir le champ de bataille', back: 'Revenir à la main',
      you: 'Vous', opp: 'Adversaire'
    }
  };
  function tx(k) { var d = TXT[typeof LANG !== 'undefined' ? LANG : 'es'] || TXT.es; return d[k] || TXT.es[k] || k; }

  /* ---------- una sola vez: cabecera y botón ---------- */
  over.classList.add('mull-arena');
  var dlg = over.querySelector('.mull-dialog');
  if (dlg && !over.querySelector('.ma-top')) {
    var top = document.createElement('div');
    top.className = 'ma-top';
    top.innerHTML =
      '<div class="ma-who"><b id="maName"></b><span id="maSub"></span></div>' +
      '<div class="ma-actions"><button type="button" class="ma-peek" id="maPeek"></button></div>';
    dlg.insertBefore(top, dlg.firstChild);
  }

  var peekBtn = document.getElementById('maPeek');
  var peeking = false;
  function setPeek(on) {
    peeking = !!on;
    over.classList.toggle('peek', peeking);
    if (peekBtn) peekBtn.textContent = peeking ? tx('back') : tx('peek');
  }
  if (peekBtn) peekBtn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); setPeek(!peeking); };

  /* ---------- cabecera ---------- */
  function head() {
    var tEl = document.getElementById('jMullT');
    var pEl = document.getElementById('jMullP');
    var fan = document.getElementById('jMullFan');
    var choosing = !!(fan && fan.classList.contains('choose'));
    if (!choosing && tEl) {
      var title = (typeof G !== 'undefined' && G && G.turn === 'ai') ? tx('second') : tx('first');
      if (tEl.textContent !== title) tEl.textContent = title;
    }
    if (!choosing && pEl && pEl.textContent !== tx('wait')) pEl.textContent = tx('wait');

    var nameEl = document.getElementById('maName'), subEl = document.getElementById('maSub');
    try {
      var P = (typeof G !== 'undefined' && G) ? G.you : null;
      if (nameEl) nameEl.textContent = (P && P.name) ? P.name : tx('you');
      if (subEl) {
        var label = '';
        if (P && P.cmd && P.cmd.name) label = cardName(cardOfSafe(P.cmd.name));
        else if (P && P.deck && P.deck.name) label = P.deck.name;
        subEl.textContent = label || '';
      }
    } catch (e) { }
    if (peekBtn) peekBtn.textContent = peeking ? tx('back') : tx('peek');
  }

  /* ---------- arco de la mano ---------- */
  function arc() {
    var fan = document.getElementById('jMullFan');
    if (!fan) return;
    var cards = fan.querySelectorAll('.mcard');
    var n = cards.length;
    if (!n) return;
    var mid = (n - 1) / 2;
    for (var i = 0; i < n; i++) {
      var d = mid ? (i - mid) / mid : 0;       /* -1 … 1 */
      var rot = Math.round(d * 15 * 10) / 10;  /* ±15° */
      var ty = Math.round(Math.abs(d) * Math.abs(d) * 28);
      cards[i].style.setProperty('--rot', rot + 'deg');
      cards[i].style.setProperty('--ty', ty + 'px');
      cards[i].style.zIndex = String(100 - Math.abs(Math.round(d * 10)));
    }
  }

  /* ---------- engancharse al render del mulligan ---------- */
  var base = mullRender;
  function refresh() {
    over.classList.add('mull-arena');
    head();
    arc();
  }
  mullRender = function () {
    var r = base.apply(this, arguments);
    refresh();
    return r;
  };

  /* el fan se repinta dentro de mullRender, pero también al elegir cartas */
  var fanEl = document.getElementById('jMullFan');
  if (fanEl && window.MutationObserver) {
    new MutationObserver(function () { requestAnimationFrame(refresh); })
      .observe(fanEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  var tEl = document.getElementById('jMullT');
  if (tEl && window.MutationObserver) {
    new MutationObserver(function () { requestAnimationFrame(head); })
      .observe(tEl, { childList: true, characterData: true, subtree: true });
  }

  /* si el overlay se abre por otra vía, decorarlo igualmente */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (over.classList.contains('on')) requestAnimationFrame(refresh);
    }).observe(over, { attributes: true, attributeFilter: ['class'] });
  }

  refresh();
})();
