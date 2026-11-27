/* ===== Bloqueos estilo Arena (los cuatro tableros) =====
   No toca el motor: el panel de bloqueos sigue siendo #jBlockWrap y sus
   <select data-blk> la fuente de verdad (también en multijugador). Esta capa
   los oculta y pinta una mesa con tus criaturas, los atacantes y flechas.

   Uso: toca una criatura tuya y luego el atacante al que bloquea. Toca una
   flecha (o el atacante ya asignado) para quitarla. «Aceptar bloqueos» rellena
   los selects y pulsa el botón original. */
(function () {
  'use strict';
  if (window.__blockArena) return;
  window.__blockArena = true;

  var TX = {
    es: { title: 'Declara bloqueos', hint: 'Toca una criatura tuya y luego el atacante. Toca la flecha para quitarla.', confirm: 'Aceptar bloqueos', none: 'sin bloquear', all: 'todas bloqueadas', blocked: 'bloqueados', clear: 'Quitar todo', atkRow: 'Atacantes', blkRow: 'Tus criaturas', remove: 'Quitar bloqueo', no: 'No puede bloquear', blockedBy: 'Bloquea a', pick: 'Elige bloqueador' },
    en: { title: 'Declare blockers', hint: 'Tap one of your creatures, then the attacker. Tap the arrow to remove it.', confirm: 'Confirm blocks', none: 'unblocked', all: 'all blocked', blocked: 'blocked', clear: 'Clear all', atkRow: 'Attackers', blkRow: 'Your creatures', remove: 'Remove block', no: 'Cannot block', blockedBy: 'Blocks', pick: 'Pick a blocker' },
    fr: { title: 'Déclarer les bloqueurs', hint: 'Touchez une de vos créatures, puis l’attaquant. Touchez la flèche pour l’enlever.', confirm: 'Confirmer les blocages', none: 'sans blocage', all: 'tous bloqués', blocked: 'bloqués', clear: 'Tout effacer', atkRow: 'Attaquants', blkRow: 'Vos créatures', remove: 'Retirer le blocage', no: 'Ne peut pas bloquer', blockedBy: 'Bloque', pick: 'Choisir un bloqueur' }
  };

  function lang() {
    var l = '';
    try { l = (localStorage.getItem('cj2_lang') || '').slice(0, 2); } catch (e) {}
    if (!l) l = String(document.documentElement.lang || 'es').slice(0, 2);
    return TX[l] ? l : 'es';
  }
  function tx(k) { return TX[lang()][k]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var wrap = null, box = null, okBtn = null;
  var homeParent = null, homeNext = null;
  var assign = {};          /* attackerId -> blockerId */
  var selected = null;      /* blocker perm id */
  var lastKey = '';
  var built = null;

  function perms() {
    var you = (typeof G !== 'undefined' && G.you) ? (G.you.bf || []) : [];
    var ai = (typeof G !== 'undefined' && G.ai) ? (G.ai.bf || []) : [];
    return { you: you, ai: ai };
  }
  function permById(id, list) {
    for (var i = 0; i < list.length; i++) if (+list[i].id === +id) return list[i];
    return null;
  }
  function imgOf(p) {
    try {
      if (p && p.card && typeof cardImg === 'function') return cardImg(p.card) || p.card.img || '';
    } catch (e) {}
    return (p && p.card && p.card.img) || '';
  }
  function nameOf(p) { return p && p.card ? (p.card.name || '') : ''; }
  function initialsOf(p) {
    var s = String(nameOf(p)).replace(/^[^A-Za-zÀ-ÿ]+/, '').replace(/[^A-Za-zÀ-ÿ ]/g, '').trim();
    return (s.slice(0, 2) || '?').toUpperCase();
  }
  function ptOf(p) {
    try { return (typeof pwOf === 'function' ? pwOf(p) : p.pow) + '/' + (typeof thOf === 'function' ? thOf(p) : p.tou); }
    catch (e) { return (p.pow || 0) + '/' + (p.tou || 0); }
  }

  function selects() {
    return box ? Array.prototype.slice.call(box.querySelectorAll('select[data-blk]')) : [];
  }
  function keyOf() {
    return selects().map(function (s) {
      return s.dataset.blk + ':' + Array.prototype.map.call(s.options, function (o) { return o.value; }).join(',');
    }).join('|');
  }

  function canPair(sel, bid) {
    if (!sel) return false;
    return Array.prototype.some.call(sel.options, function (o) { return +o.value === +bid; });
  }

  function cardNode(p, kind) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ba-card ' + (kind === 'atk' ? 'ba-atkcard' : 'ba-blkcard');
    b.dataset.id = p.id;
    b.dataset.kind = kind;
    var img = imgOf(p);
    /* las iniciales quedan siempre detrás: si la imagen tarda o falla, la
       carta sigue leyéndose en vez de ser un rectángulo vacío */
    b.innerHTML = '<span class="ba-art"><span class="ba-noart">' + esc(initialsOf(p)) + '</span>' +
      (img ? '<img src="' + esc(img) + '" alt="">' : '') + '</span>' +
      '<span class="ba-nm">' + esc(nameOf(p)) + '</span><span class="ba-pt">' + esc(ptOf(p)) + '</span>';
    b.title = nameOf(p) + ' · ' + ptOf(p);
    return b;
  }

  function renderArrows() {
    if (!built) return;
    var svg = built.querySelector('.ba-arrows');
    var board = built.querySelector('.ba-board');
    if (!svg || !board) return;
    var rb = board.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + Math.max(1, rb.width) + ' ' + Math.max(1, rb.height));
    svg.setAttribute('width', rb.width);
    svg.setAttribute('height', rb.height);
    var html = '<defs><marker id="baArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>';
    Object.keys(assign).forEach(function (aid) {
      var bid = assign[aid];
      var bEl = built.querySelector('.ba-blkcard[data-id="' + bid + '"]');
      var aEl = built.querySelector('.ba-atkcard[data-id="' + aid + '"]');
      if (!bEl || !aEl) return;
      var br = bEl.getBoundingClientRect(), ar = aEl.getBoundingClientRect();
      /* 4 px de aire: la punta no toca el nombre de la carta */
      var x1 = br.left - rb.left + br.width / 2, y1 = br.top - rb.top - 4;
      var x2 = ar.left - rb.left + ar.width / 2, y2 = ar.top - rb.top + ar.height + 4;
      /* codo en el hueco entre bandas: la flecha nunca cruza una carta */
      var my = (y1 + y2) / 2, xm = (x1 + x2) / 2;
      html += '<path class="ba-line" d="M' + x1 + ',' + y1 + ' V' + my + ' H' + x2 + ' V' + y2 + '" marker-end="url(#baArrow)"/>';
      html += '<circle class="ba-kill" data-kill="' + aid + '" cx="' + xm + '" cy="' + my + '" r="9"><title>' + esc(tx('remove')) + '</title></circle>';
      html += '<text class="ba-killx" x="' + xm + '" y="' + (my + 3.6) + '" text-anchor="middle">×</text>';
    });
    svg.innerHTML = html;
    Array.prototype.forEach.call(svg.querySelectorAll('[data-kill]'), function (c) {
      c.addEventListener('click', function (ev) {
        ev.stopPropagation();
        delete assign[c.dataset.kill];
        sync();
      });
    });
  }

  function status() {
    if (!built) return;
    var atk = selects().length;
    var done = Object.keys(assign).length;
    var un = atk - done;
    built.querySelector('.ba-status').textContent = done + '/' + atk + ' ' + tx('blocked') +
      (un ? ' · ' + un + ' ' + tx('none') : ' · ' + tx('all'));
    var clearBtn = built.querySelector('.ba-clear');
    if (clearBtn) clearBtn.disabled = !done;
  }

  function sync() {
    selects().forEach(function (s) {
      var v = assign[s.dataset.blk];
      s.value = v ? String(v) : '';
    });
    if (!built) return;
    built.classList.toggle('ba-aim', selected != null);
    Array.prototype.forEach.call(built.querySelectorAll('.ba-blkcard'), function (el) {
      var id = +el.dataset.id;
      var used = Object.keys(assign).some(function (a) { return +assign[a] === id; });
      el.classList.toggle('ba-used', used);
      el.classList.toggle('ba-sel', selected === id);
    });
    status();
    renderArrows();
  }

  function targetOf(aid) {
    if (!built) return null;
    return built.querySelector('.ba-atkcard[data-id="' + aid + '"]');
  }

  function onClick(ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('.ba-card') : null;
    if (!t || !built) return;
    ev.preventDefault();
    var id = +t.dataset.id;
    if (t.dataset.kind === 'atk') {
      if (selected != null) {
        var sel = selects().filter(function (s) { return +s.dataset.blk === id; })[0];
        if (!canPair(sel, selected)) {
          t.classList.add('ba-no');
          setTimeout(function () { t.classList.remove('ba-no'); }, 380);
          return;
        }
        /* un bloqueador solo puede bloquear un atacante */
        Object.keys(assign).forEach(function (a) { if (+assign[a] === +selected) delete assign[a]; });
        assign[id] = selected;
        selected = null;
        sync();
        return;
      }
      if (assign[id]) { delete assign[id]; sync(); }
      return;
    }
    /* criatura propia */
    selected = (selected === id) ? null : id;
    sync();
  }

  function build() {
    if (!wrap || !box || !okBtn) return;
    /* #jugar puede tener un ancestro con transform: un position:fixed dentro
       se coloca respecto a ese ancestro y la mesa se sale de la pantalla. Se
       saca el panel al body mientras dura la declaración de bloqueos. */
    if (wrap.parentNode && wrap.parentNode !== document.body) {
      homeParent = wrap.parentNode;
      homeNext = wrap.nextSibling;
      document.body.appendChild(wrap);
    }
    var key = keyOf();
    if (!key || !selects().length) return;
    var p = perms();
    var attackerIds = selects().map(function (s) { return +s.dataset.blk; });
    var blockerIds = [];
    selects().forEach(function (s) {
      Array.prototype.forEach.call(s.options, function (o) {
        if (o.value && blockerIds.indexOf(+o.value) < 0) blockerIds.push(+o.value);
      });
    });
    var attackers = attackerIds.map(function (id) { return permById(id, p.ai) || permById(id, p.you); }).filter(Boolean);
    var blockers = blockerIds.map(function (id) { return permById(id, p.you); }).filter(Boolean);
    if (!attackers.length) return;

    /* asignaciones previas que sigan siendo legales */
    var next = {};
    selects().forEach(function (s) {
      if (s.value && canPair(s, +s.value)) next[+s.dataset.blk] = +s.value;
    });
    assign = next;
    selected = null;

    var old = box.querySelector('.ba');
    if (old) old.remove();
    Array.prototype.forEach.call(box.querySelectorAll(':scope > .row'), function (r) { r.style.display = 'none'; });
    okBtn.style.display = 'none';

    var el = document.createElement('div');
    el.className = 'ba';
    var atk = attackers.map(function (a) { return cardNode(a, 'atk').outerHTML; }).join('');
    var blk = blockers.length ? blockers.map(function (b) { return cardNode(b, 'blk').outerHTML; }).join('') : '<p class="ba-empty">' + esc(tx('no')) + '</p>';
    el.innerHTML =
      '<div class="ba-head"><b>' + esc(tx('title')) + '</b><span>' + esc(tx('hint')) + '</span></div>' +
      '<div class="ba-board">' +
        '<div class="ba-band ba-band-atk"><span class="ba-lab">' + esc(tx('atkRow')) + ' <i>' + attackers.length + '</i></span>' +
          '<div class="ba-row ba-row-atk">' + atk + '</div></div>' +
        '<div class="ba-band ba-band-blk"><span class="ba-lab">' + esc(tx('blkRow')) + ' <i>' + blockers.length + '</i></span>' +
          '<div class="ba-row ba-row-blk">' + blk + '</div></div>' +
        '<svg class="ba-arrows" aria-hidden="true"></svg></div>' +
      '<div class="ba-foot"><span class="ba-status"></span>' +
        '<button type="button" class="btn ba-clear">' + esc(tx('clear')) + '</button>' +
        '<button type="button" class="btn ba-ok">' + esc(tx('confirm')) + '</button></div>';
    box.appendChild(el);
    built = el;
    el.addEventListener('click', onClick);
    el.querySelector('.ba-clear').addEventListener('click', function (ev) {
      ev.preventDefault();
      assign = {};
      selected = null;
      sync();
    });
    el.querySelector('.ba-ok').addEventListener('click', function (ev) {
      ev.preventDefault();
      selects().forEach(function (s) {
        var v = assign[s.dataset.blk];
        s.value = v ? String(v) : '';
      });
      assign = {};
      lastKey = '';
      var original = document.getElementById('jBlockOk');
      if (original) original.click();
    });
    lastKey = key;
    var imgs = el.querySelectorAll('.ba-art img');
    Array.prototype.forEach.call(imgs, function (im) {
      im.addEventListener('load', renderArrows);
      im.addEventListener('error', function () { im.remove(); });
    });
    requestAnimationFrame(function () { sync(); renderArrows(); });
  }

  function scan() {
    if (!wrap || !wrap.isConnected) wrap = document.getElementById('jBlockWrap');
    if (!box || !box.isConnected) box = document.getElementById('jBlockList');
    /* startBlocks/askBlocks rehacen el panel y el botón: no cachear el nodo */
    okBtn = document.getElementById('jBlockOk');
    if (!wrap || !box || !okBtn) return;
    var open = wrap.style.display !== 'none' && wrap.getClientRects().length > 0;
    if (!open) {
      if (homeParent && wrap.parentNode === document.body) {
        homeParent.insertBefore(wrap, homeNext && homeNext.parentNode === homeParent ? homeNext : null);
      }
      lastKey = ''; built = null; return;
    }
    var key = keyOf();
    if (!key) return;
    if (key !== lastKey || !box.querySelector('.ba')) build();
  }

  function start() {
    scan();
    try {
      new MutationObserver(function () { scan(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    } catch (e) {}
    window.addEventListener('resize', function () { if (built) renderArrows(); });
    /* startBlocks/askBlocks pueden escribir el panel después del observer */
    var mo = window.MutationObserver;
    if (mo) {
      try {
        new mo(function () { setTimeout(scan, 0); }).observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.__blockArenaRefresh = scan;
})();
