/* ============================================================
   rules-core · reglas de carta que faltaban
   ------------------------------------------------------------
   Capa autocontenida (no depende de otras capas) que envuelve
   funciones del motor para añadir:

     1. sacrificio: efectos («sacrifice a creature», edictos,
        «each player sacrifices»), costes adicionales al lanzar
        y habilidades activadas con coste de sacrificio.
     2. scry y surveil de verdad: se miran las N de arriba y el
        jugador elige qué queda arriba y qué va al fondo (o al
        cementerio); la IA usa una heurística de tierras.
     3. destreza (prowess): +1/+1 a cada criatura con destreza al
        lanzar un hechizo que no sea criatura, hasta el final del
        turno.
     4. «enters tapped» al crear el permanente.

   Lo que NO cubre todavía: destello (el motor juega por turnos),
   protección contra un color, y el coste de sacrificio en hechizos
   con modo o con X (esos se lanzan por otra vía).

   Todo se puede desactivar borrando este bloque. Cada versión deja
   copia del HTML en tmp/versions/.
   ============================================================ */
(() => {
  if (typeof G === 'undefined' || typeof applySpell !== 'function') return;

  const VERSION = 'rules-core 3';
  const low = s => String(s == null ? '' : s).toLowerCase();
  const T = (k, v) => { try { return typeof t === 'function' ? t(k, v) : k; } catch (e) { return k; } };
  const log = (txt, who) => { try { logLine(txt, who); } catch (e) {} };
  const who = P => (P && P === G.you ? 'you' : 'ai');
  const cardNameOf = c => { try { return cardName(c); } catch (e) { return (c && c.name) || ''; } };

  /* ---------- textos ---------- */
  try {
    if (typeof I18N === 'object' && I18N && I18N.es) {
      Object.assign(I18N.es, {
        'r.sacrifice': '{c} se sacrifica.',
        'r.sacPick': 'Sacrificar',
        'r.sacPickSub': 'Elige qué sacrificar para {c}.',
        'r.sacNo': 'No hay nada que sacrificar para {c}.',
        'r.sacUnless': '{c}: se sacrifica {t}.',
        'r.scryHd': 'Scry {n}',
        'r.scrySub': 'Elige qué queda arriba, en orden.',
        'r.surveilHd': 'Vigilar {n}',
        'r.surveilSub': 'Lo que no quede arriba va al cementerio.',
        'r.scryTop': 'Dejar arriba',
        'r.scryBottom': 'Al fondo',
        'r.scryBin': 'Al cementerio',
        'r.scryDone': 'Scry {n}: {k} arriba, {b} al fondo.',
        'r.surveilDone': 'Vigilancia {n}: {k} arriba, {b} al cementerio.',
        'r.prowess': 'Destreza: {c} +1/+1.',
        'r.proAbil': 'Habilidades con sacrificio',
        'r.needMana': 'No hay maná para {c}.',
        'r.needSac': 'Falta una criatura que sacrificar para {c}.',
        'r.cost': 'Coste: {c}',
        'r.counters': '{n} contador(es) +1/+1 a {t}.',
        'r.exile': '{c} exilia {t}.',
        'r.costLess': '{c} cuesta {n} menos.',
        'r.actUse': '{c}: {a}.'
      });
      Object.assign(I18N.en, {
        'r.sacrifice': '{c} is sacrificed.',
        'r.sacPick': 'Sacrifice',
        'r.sacPickSub': 'Choose what to sacrifice for {c}.',
        'r.sacNo': 'Nothing to sacrifice for {c}.',
        'r.sacUnless': '{c}: {t} is sacrificed.',
        'r.scryHd': 'Scry {n}',
        'r.scrySub': 'Choose what stays on top, in order.',
        'r.surveilHd': 'Surveil {n}',
        'r.surveilSub': 'What does not stay on top goes to the graveyard.',
        'r.scryTop': 'Keep on top',
        'r.scryBottom': 'Put on bottom',
        'r.scryBin': 'Put in graveyard',
        'r.scryDone': 'Scry {n}: {k} on top, {b} on bottom.',
        'r.surveilDone': 'Surveil {n}: {k} on top, {b} binned.',
        'r.prowess': 'Prowess: {c} +1/+1.',
        'r.proAbil': 'Sacrifice abilities',
        'r.needMana': 'Not enough mana for {c}.',
        'r.needSac': 'No creature to sacrifice for {c}.',
        'r.cost': 'Cost: {c}',
        'r.counters': '{n} +1/+1 counter(s) on {t}.',
        'r.exile': '{c} exiles {t}.',
        'r.costLess': '{c} costs {n} less.',
        'r.actUse': '{c}: {a}.'
      });
      Object.assign(I18N.fr, {
        'r.sacrifice': '{c} est sacrifié.',
        'r.sacPick': 'Sacrifier',
        'r.sacPickSub': 'Choisissez quoi sacrifier pour {c}.',
        'r.sacNo': 'Rien à sacrifier pour {c}.',
        'r.sacUnless': '{c} : {t} est sacrifié.',
        'r.scryHd': 'Scry {n}',
        'r.scrySub': 'Choisissez ce qui reste au-dessus, dans l’ordre.',
        'r.surveilHd': 'Surveillance {n}',
        'r.surveilSub': 'Ce qui ne reste pas au-dessus va au cimetière.',
        'r.scryTop': 'Garder au-dessus',
        'r.scryBottom': 'Mettre en dessous',
        'r.scryBin': 'Au cimetière',
        'r.scryDone': 'Scry {n} : {k} au-dessus, {b} en dessous.',
        'r.surveilDone': 'Surveillance {n} : {k} au-dessus, {b} au cimetière.',
        'r.prowess': 'Prouesse : {c} +1/+1.',
        'r.proAbil': 'Capacités avec sacrifice',
        'r.needMana': 'Mana insuffisant pour {c}.',
        'r.needSac': 'Aucune créature à sacrifier pour {c}.',
        'r.cost': 'Coût : {c}',
        'r.counters': '{n} marqueur(s) +1/+1 sur {t}.',
        'r.exile': '{c} exile {t}.',
        'r.costLess': '{c} coûte {n} de moins.',
        'r.actUse': '{c} : {a}.'
      });
    }
  } catch (e) {}

  /* ---------- ayudas sobre el motor ---------- */
  const isCrea = x => { try { return typeof isCreature === 'function' ? isCreature(x) : !!(x && x.card && x.card.creature); } catch (e) { return false; } };
  const isLnd = x => { try { return typeof isLand === 'function' ? isLand(x) : !!(x && x.card && x.card.land); } catch (e) { return false; } };
  const kOf = (x, k) => { try { return typeof hasKw === 'function' ? !!hasKw(x, k) : false; } catch (e) { return false; } };
  const pOf = x => { try { return typeof pwOf === 'function' ? pwOf(x) : (x.pow || 0) + (x.a || 0); } catch (e) { return (x.pow || 0) + (x.a || 0); } };
  const tOf = x => { try { return typeof thOf === 'function' ? thOf(x) : (x.tou || 0) + (x.b || 0); } catch (e) { return (x.tou || 0) + (x.b || 0); } };
  const typeOf = x => low(x && x.card && x.card.type);
  const others = P => (P && P !== G.you ? G.you : G.ai);

  /* ---------- selector flotante propio ---------- */
  function picker(title, sub, opts, cb) {
    const old = document.getElementById('rulesPick');
    if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'rulesPick';
    box.innerHTML = `<div class="rpk"><div class="rpk-hd">${esc(title)}</div>${sub ? `<div class="rpk-sub">${esc(sub)}</div>` : ''}<div class="rpk-opts">${
      opts.map((o, i) => `<button data-i="${i}"${o.dis ? ' disabled' : ''}${o.tip ? ` title="${esc(o.tip)}"` : ''}>${esc(o.label)}</button>`).join('')
    }</div><button class="rpk-x" data-close="1" aria-label="×">×</button></div>`;
    document.body.appendChild(box);
    box.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => { const i = +b.dataset.i; box.remove(); cb(i); }; });
    const cl = box.querySelector('[data-close]');
    if (cl) cl.onclick = () => box.remove();
    return box;
  }

  /* ============================================================
     1 · SACRIFICIO
     ============================================================ */
  const valOf = x => {
    if (!x || !x.card) return 0;
    return (x.token ? -100 : 0) + (x.card.cmc || 0) * 0.6 + pOf(x) + tOf(x) - (x.dmg || 0) * 0.3;
  };

  /* saca el permanente del campo como sacrificio (no es «destruir»:
     indestructible no lo salva) y dispara sus «when … dies» */
  function sacrifice(P, perm) {
    if (!perm || !P || (P.bf || []).indexOf(perm) < 0) return false;
    P.bf = P.bf.filter(y => y !== perm);
    P.bf.forEach(y => { if (y.equipTo === perm.id) y.equipTo = null; });
    if (!perm.token) P.gy.push(perm.name);
    log(T('r.sacrifice', { c: cardNameOf(perm.card) }), who(P));
    if (P.cmd && perm.card && P.cmd.card && perm.card.name === P.cmd.card.name && perm.name === P.cmd.name) {
      G.log.push({ t: T('game.capBack'), c: 'sys' });
    }
    try { if (!G.over && typeof diesTrigger === 'function') diesTrigger(P, perm); } catch (e) {}
    return true;
  }

  function poolFor(P, spec) {
    const bf = (P && P.bf) || [];
    if (spec === 'land') return bf.filter(isLnd);
    if (spec === 'artifact') return bf.filter(x => /artifact/.test(typeOf(x)));
    if (spec === 'enchantment') return bf.filter(x => /enchantment/.test(typeOf(x)));
    if (spec === 'permanent') return bf.filter(x => !isLnd(x) || true);
    const cre = bf.filter(isCrea);
    if (spec === 'creature or planeswalker') return bf.filter(x => isCrea(x) || /planeswalker/.test(typeOf(x)));
    return cre;
  }

  /* elige qué sacrificar: tokens primero y luego lo más barato/débil */
  function pickVictim(P, spec) {
    const pool = poolFor(P, spec).slice().sort((a, b) => valOf(a) - valOf(b));
    return pool[0] || null;
  }

  /* «sacrifice a creature» sin objetivo: lo elige quien lo sufre.
     Si hay una criatura peor que el resto se va sola; si el jugador
     humano tiene varias, se le ofrece elegir en un selector. */
  function sacrificeFor(P, spec, srcName, allowChoice) {
    const pool = poolFor(P, spec);
    if (!pool.length) { log(T('r.sacNo', { c: srcName }), who(P)); return null; }
    const victim = pickVictim(P, spec);
    if (allowChoice && P === G.you && pool.length > 1) {
      picker(T('r.sacPick'), T('r.sacPickSub', { c: srcName }),
        pool.map(x => ({ label: `${cardNameOf(x.card)} · ${pOf(x)}/${tOf(x)}`, tip: cardNameOf(x.card) })),
        i => {
          const target = pool[i] || victim;
          if (target && sacrifice(P, target)) { try { checkDeaths(); renderBoard(); } catch (e) {} }
        });
      return victim;
    }
    sacrifice(P, victim);
    return victim;
  }

  /* lee la cláusula de sacrificio de un texto y la ejecuta.
     Devuelve el texto sin esa cláusula (para que el motor resuelva el resto). */
  /* una línea de coste lleva «:»; sin dos puntos es un efecto que se resuelve */
  const COST_LINE = /^as an additional cost|^you may sacrifice|rather than pay|^sacrifice (?:this [a-z]+|a|an|another|two|three|\d+)[^:.]{0,40}:/i;

  function handleSacrifice(P, card, srcName, oracle, quiet) {
    const o = low(oracle);
    if (!/sacrific/.test(o)) return oracle;
    const F = P === G.you ? G.ai : G.you;
    let text = oracle;

    const run = (spec, target, allowChoice) => {
      if (target === 'all') {
        [P, F].forEach(Q => sacrificeFor(Q, spec, srcName, !quiet));
      } else if (target === 'foe') {
        sacrificeFor(F, spec, srcName, !quiet);
      } else if (target === 'opponents') {
        sacrificeFor(F, spec, srcName, !quiet);
      } else {
        sacrificeFor(P, spec, srcName, !quiet || false);
      }
    };

    /* «each player sacrifices …» */
    let m = o.match(/each player sacrifices? (a|an|one|two|three|\d+) ([a-z ]{3,24})/);
    if (m) {
      run(m[2].replace(/^(creature|permanent)\b.*/, m[2].trim()).split(' ')[0], 'all');
      return stripClause(oracle, /each player sacrifices?[^.]*\.?/i);
    }
    /* «each opponent sacrifices» */
    if (/each opponent sacrifices?/.test(o)) {
      const sp = (o.match(/each opponent sacrifices? (?:a|an|one|two)?\s*([a-z]+)/) || [])[1] || 'creature';
      run(sp, 'opponents');
      return stripClause(oracle, /each opponent sacrifices?[^.]*\.?/i);
    }
    /* «target player sacrifices» / «that player sacrifices» / «its controller sacrifices» */
    if (/(target|that|its controller|defending) player sacrifices?/.test(o)) {
      const sp = (o.match(/(?:target|that|its controller|defending) player sacrifices? (?:a|an|one|two)?\s*([a-z]+)/) || [])[1] || 'creature';
      run(sp, 'foe');
      return stripClause(oracle, /(?:target|that|its controller|defending) player sacrifices?[^.]*\.?/i);
    }
    /* «sacrifice this creature» / «sacrifice it» (efecto, no coste) */
    if (/sacrifice (this creature|this permanent|this artifact|this enchantment|it)\b/.test(o) && !COST_LINE.test(o)) {
      const found = (P.bf || []).filter(x => x.card && card && low(x.card.name) === low(card.name))[0]
        || (P.bf || []).filter(x => x.card && card && x.card.name === card.name)[0];
      if (found) sacrifice(P, found);
      else log(T('r.sacNo', { c: srcName }), who(P));
      return stripClause(oracle, /sacrifice (this creature|this permanent|this artifact|this enchantment|it)[^.]*\.?/i);
    }
    /* «sacrifice a creature / another creature / a land» como efecto.
       Si es opcional («you may sacrifice») o alternativo («unless»), no se fuerza. */
    const optional = /you may sacrifice|unless .{0,40}sacrific|may have you sacrifice/i.test(o);
    m = o.match(/sacrifice (?:a|an|another|one|two|three|\d+) ([a-z]+(?: or [a-z]+)?)/);
    if (m && !optional && !COST_LINE.test(o)) {
      run(m[1].replace(/\s+or\s+planeswalker/, '').trim(), 'self', true);
      return stripClause(oracle, /sacrifice (?:a|an|another|one|two|three|\d+) [a-z ]{3,26}[^.]*\.?/i);
    }
    return oracle;
  }

  function stripClause(text, rx) {
    return String(text || '').replace(rx, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  /* ============================================================
     2 · SCRY / SURVEIL
     ============================================================ */
  function topN(P, n) {
    const out = [];
    for (let i = 0; i < n && (P.lib || []).length; i++) out.push(P.lib.shift());
    return out;
  }

  function autoKeep(P, name, surveil) {
    const c = (typeof cardOfSafe === 'function' ? cardOfSafe(name) : null) || {};
    if (c.land) {
      const lands = ((P.bf || []).filter(isLnd)).length;
      return lands < 5;
    }
    if (surveil) return (c.cmc || 0) <= 6;
    return (c.cmc || 0) <= 4 || Math.random() < 0.5;
  }

  function applyScry(P, kind, n, srcName, quiet) {
    n = Math.max(0, Math.min(12, n | 0));
    const cards = topN(P, n);
    if (!cards.length) return 0;
    const surveil = kind === 'surveil';
    const finish = (keep, rest) => {
      if (keep.length) P.lib.unshift.apply(P.lib, keep);
      if (surveil) P.gy.push.apply(P.gy, rest);
      else P.lib.push.apply(P.lib, rest);
      log(surveil ? T('r.surveilDone', { n: cards.length, k: keep.length, b: rest.length })
                  : T('r.scryDone', { n: cards.length, k: keep.length, b: rest.length }), who(P));
      try { renderBoard(); } catch (e) {}
    };
    if (P === G.you && !quiet) {
      const keep = [], rest = [];
      const step = i => {
        if (i >= cards.length) { finish(keep, rest); return; }
        const c = (typeof cardOfSafe === 'function' ? cardOfSafe(cards[i]) : null) || { name: cards[i] };
        const label = cardNameOf(c) + (c.type ? ' · ' + String(c.type).split('—')[0].trim() : '');
        picker(T(surveil ? 'r.surveilHd' : 'r.scryHd', { n: cards.length }), T(surveil ? 'r.surveilSub' : 'r.scrySub'),
          [{ label: `${T('r.scryTop')} — ${label}` }, { label: `${T(surveil ? 'r.scryBin' : 'r.scryBottom')} — ${label}` }],
          i2 => { (i2 === 0 ? keep : rest).push(cards[i]); step(i + 1); });
      };
      step(0);
      return cards.length;
    }
    const keep = [], rest = [];
    cards.forEach(nm => (autoKeep(P, nm, surveil) ? keep : rest).push(nm));
    finish(keep, rest);
    return cards.length;
  }

  /* ============================================================
     3 · DESTREZA (PROWESS)
     ============================================================ */
  function prowessPump(P) {
    if (!P || !P.bf) return 0;
    let n = 0;
    P.bf.forEach(x => {
      if (!isCrea(x) || !kOf(x, 'prowess')) return;
      x.a = (x.a || 0) + 1; x.b = (x.b || 0) + 1;
      x._prow = (x._prow || 0) + 1; n++;
      log(T('r.prowess', { c: cardNameOf(x.card) }), who(P));
    });
    return n;
  }
  function prowessClear(P) {
    if (!P || !P.bf) return;
    P.bf.forEach(x => {
      if (!x._prow) return;
      x.a -= x._prow; x.b -= x._prow; x._prow = 0;
    });
  }

  /* ============================================================
     4 · «enters tapped» y protección
     ============================================================ */
  const ENTERS_TAPPED = /enters (?:the battlefield )?tapped(?! unless)/i;

  /* ============================================================
     ENVOLTORIOS DEL MOTOR
     ============================================================ */
  const aplBase = applySpell;
  applySpell = function (P, card, srcName, quiet) {
    if (!P || !card) return aplBase.apply(this, arguments);
    let oracle = String(card.oracle || '');
    if (!oracle) return aplBase.apply(this, arguments);
    let changed = false;
    try {
      if (/sacrific/i.test(oracle)) {
        const rest = handleSacrifice(P, card, srcName || cardNameOf(card), oracle, !!quiet);
        if (rest !== oracle) { oracle = rest; changed = true; }
        if (!oracle.trim()) return true;
      }
      const after = handleCounters(P, oracle, srcName || cardNameOf(card));
      if (after !== oracle) { oracle = after; changed = true; }
      const afterEx = handleExile(P, oracle, srcName || cardNameOf(card));
      if (afterEx !== oracle) { oracle = afterEx; changed = true; }
      if (!oracle.trim()) return true;
      const m = oracle.match(/\b(scry|surveil)\s+(\d+)\b/i);
      if (m) {
        applyScry(P, low(m[1]), +m[2], srcName || cardNameOf(card), !!quiet);
        oracle = stripClause(oracle, /\b(scry|surveil)\s+\d+\b\.?/i);
        changed = true;
        if (!oracle.trim()) return true;
      }
    } catch (e) { changed = false; }

    /* destreza: si la capa de sets (cm-ux-v2) ya la aplica al lanzar, no se
       repite aquí; solo se usa en los tableros que no la tienen. */
    try {
      const hasCast = !!(window.__setRules && typeof window.__setRules.castTriggers === 'function');
      if (!hasCast && !quiet && !card.creature && !card.land && card.mana !== undefined && card.mana !== '') prowessPump(P);
    } catch (e) {}

    return aplBase.call(this, P, changed ? Object.assign({}, card, { oracle: oracle }) : card, srcName, quiet);
  };

  /* «enters tapped» al crear cualquier permanente */
  const instBase = (typeof instantiate === 'function') ? instantiate : null;
  if (instBase) {
    instantiate = function (name, token, deck) {
      const perm = instBase.apply(this, arguments);
      try {
        if (perm && perm.card && !token && ENTERS_TAPPED.test(String(perm.card.oracle || ''))) perm.tapped = true;
      } catch (e) {}
      return perm;
    };
  }

  /* fin de turno: se cae la destreza */
  if (typeof untapAll === 'function') {
    const untapBase = untapAll;
    untapAll = function (P) {
      try { prowessClear(P); } catch (e) {}
      return untapBase.apply(this, arguments);
    };
  }

  /* ============================================================
     5 · HABILIDADES ACTIVADAS CON SACRIFICIO
     ============================================================ */
  function sacAbilities(card) {
    const out = [];
    String((card && card.oracle) || '').split('\n').forEach(line => {
      const s = line.trim();
      if (!s || /^\[/.test(s)) return;
      const m = s.match(/^([^:]{1,130}):\s*(.+)$/);
      if (!m) return;
      const cost = m[1].trim(), eff = m[2].trim();
      if (!/sacrifice/i.test(cost)) return;
      if (/^(when|whenever|at |if |enchant|equip|ward|flash)/i.test(cost)) return;
      if (/^as an additional cost|rather than pay/i.test(cost)) return;
      const syms = cost.match(/\{[^}]+\}/g) || [];
      const mana = syms.filter(x => !/^\{[TQXS]\}$/i.test(x)).join('');
      const selfSac = /sacrifice (this|it)\b/i.test(cost);
      const other = cost.match(/sacrifice (a|an|another|one|two|three|\d+) ([a-z]+)/i);
      out.push({
        cost, eff, mana, tap: /\{T\}/i.test(cost),
        life: +((cost.match(/pay (\d+) life/i) || [])[1] || 0),
        sac: selfSac ? 'self' : (other ? 'other' : 'none'),
        sacWhat: other ? low(other[2]) : ''
      });
    });
    return out.slice(0, 5);
  }

  /* habilidades activadas con coste de maná, giro o vidas (sin sacrificio:
     esas las lee sacAbilities y las de descarte/exilio la capa adv-rules-2) */
  function generalAbilities(card) {
    const out = [];
    String((card && card.oracle) || '').split('\n').forEach(line => {
      const s = line.trim();
      if (!s || /^\[/.test(s)) return;
      const m = s.match(/^([^:]{1,120}):\s*(.+)$/);
      if (!m) return;
      const cost = m[1].trim(), eff = m[2].trim();
      if (/^(when|whenever|at |if |enchant|equip|ward|flash|cycling|kicker|buyback|madness|foretell|disturb|chapter|level up|cumulative upkeep|echo|unearth|bestow|suspend|vanishing|fading|crew|saddle|reconfigure|prototype|casualty|bargain|gift|offspring|impending)/i.test(cost)) return;
      if (/sacrifice|discard|exile .*from your graveyard|return .*from your graveyard/i.test(cost)) return;
      if (!/\{|pay \d+ life/i.test(cost)) return;
      if (/add \{/i.test(eff)) return;                       /* fuentes de maná: las usa el motor */
      if (!/draw|gain \d+ life|lose \d+ life|damage|destroy|exile|tap |untap|gets [+-]|counter|token|mill|scry|surveil|discard|put .*onto the battlefield|return .*hand/i.test(eff)) return;
      const syms = cost.match(/\{[^}]+\}/g) || [];
      const mana = syms.filter(x => !/^\{[TQXS]\}$/i.test(x)).join('');
      out.push({
        cost, eff, mana, tap: /\{T\}/i.test(cost),
        life: +((cost.match(/pay (\d+) life/i) || [])[1] || 0), sac: 'none'
      });
    });
    return out.slice(0, 5);
  }
  const allAbilities = card => sacAbilities(card).concat(generalAbilities(card));

  function canUse(P, perm, a) {
    if (!P || !perm || !a) return false;
    if (!a.tap && !a.mana && !a.life && perm._rulesTurn === G.turnNo) return false;
    if (a.tap && (perm.tapped || (isCrea(perm) && perm.summoning))) return false;
    if (a.life && P.life <= a.life) return false;
    if (a.mana && typeof canPay === 'function' && !canPay(P, costOf({ mana: a.mana }), 0)) return false;
    if (a.sac === 'other' && poolFor(P, a.sacWhat || 'creature').filter(x => x !== perm).length === 0) return false;
    return true;
  }

  function use(P, perm, a) {
    if (!canUse(P, perm, a)) {
      if (P === G.you && typeof toast === 'function') toast(T('r.needMana', { c: cardNameOf(perm.card) }));
      return false;
    }
    const wasTapped = perm.tapped;
    if (a.mana && typeof payMana === 'function' && !payMana(P, costOf({ mana: a.mana }), 0)) {
      if (P === G.you && typeof toast === 'function') toast(T('r.needMana', { c: cardNameOf(perm.card) }));
      return false;
    }
    if (a.tap) perm.tapped = true;
    if (a.life) P.life -= a.life;
    perm._rulesTurn = G.turnNo;
    log(T('r.actUse', { c: cardNameOf(perm.card), a: a.cost }), who(P));
    if (a.sac === 'self') {
      sacrifice(P, perm);
    } else if (a.sac === 'other') {
      const victim = poolFor(P, a.sacWhat || 'creature').filter(x => x !== perm).sort((x, y) => valOf(x) - valOf(y))[0];
      if (victim) sacrifice(P, victim);
    }
    if (!a.sac || a.sac === 'none') perm.tapped = a.tap ? true : wasTapped;
    try { applySpell(P, Object.assign({}, perm.card, { oracle: a.eff }), cardNameOf(perm.card), true); } catch (e) {}
    try { checkDeaths(); renderBoard(); } catch (e) {}
    return true;
  }

  /* insignia en las cartas propias que tienen habilidades de sacrificio */
  function paintBadges() {
    if (!G || !G.you) return;
    const inGame = document.body.classList.contains('arena-mat-on') || document.getElementById('jYouBf');
    if (!inGame) return;
    document.querySelectorAll('#jYouBf .bcard[data-perm]').forEach(el => {
      const perm = (G.you.bf || []).find(x => x.id === +el.dataset.perm);
      const has = perm && allAbilities(perm.card).some(a => canUse(G.you, perm, a));
      const badge = el.querySelector('.rules-act');
      if (!has) { if (badge) badge.remove(); return; }
      if (badge) return;
      const b = document.createElement('button');
      b.className = 'rules-act';
      b.type = 'button';
      b.textContent = '◈';
      b.title = T('r.proAbil');
      b.onclick = ev => {
        ev.preventDefault(); ev.stopPropagation();
        const abs = allAbilities(perm.card);
        picker(T('r.proAbil') + ' · ' + cardNameOf(perm.card), T('r.cost', { c: abs.map(a => a.cost).join(' / ') }),
          abs.map(a => ({ label: `${a.cost} — ${a.eff}`, dis: !canUse(G.you, perm, a), tip: a.eff })),
          i => use(G.you, perm, abs[i]));
      };
      el.appendChild(b);
    });
  }

  const rbBase = (typeof renderBoard === 'function') ? renderBoard : null;
  if (rbBase) {
    renderBoard = function () {
      const r = rbBase.apply(this, arguments);
      try { paintBadges(); } catch (e) {}
      return r;
    };
  }


  /* ============================================================
     6 · COMBATE: no se puede bloquear
     ============================================================ */
  const kwOf = x => (((x && x.card && x.card.kw) || []).map(k => low(k)));
  const colsOf = x => ((x && x.card && x.card.colors) || []).map(c => String(c).toUpperCase());

  function unblockable(x) {
    if (!x || !x.card) return false;
    const o = low(x.card.oracle);
    if (kwOf(x).includes('unblockable')) return true;
    return /can'?t be blocked|cannot be blocked|can not be blocked|\bunblockable\b/.test(o);
  }
  function evasionOf(x) {
    const o = low((x && x.card && x.card.oracle) || '');
    if (/\bfear\b/.test(o)) return 'fear';
    if (/\bintimidate\b/.test(o)) return 'intimidate';
    return '';
  }
  function canItBlock(a, b) {
    if (!a || !b || !a.card || !b.card) return true;
    if (unblockable(a)) return false;
    if (/can'?t block\b/.test(low(b.card.oracle))) return false;
    const ev = evasionOf(a);
    const bArt = /artifact/.test(low(b.card.type));
    if (ev === 'fear') return bArt || colsOf(b).includes('B');
    if (ev === 'intimidate') return bArt || colsOf(a).some(c => colsOf(b).includes(c));
    return true;
  }

  if (typeof aiBlocks === 'function') {
    const blocksBaseFn = aiBlocks;
    aiBlocks = function (attackers, defP, atkP) {
      const res = blocksBaseFn.apply(this, arguments) || {};
      try {
        Object.keys(res).forEach(id => {
          const a = (atkP && atkP.bf || []).find(x => x.id === +id);
          const b = (defP && defP.bf || []).find(x => x.id === res[id]);
          if (a && b && !canItBlock(a, b)) delete res[id];
        });
      } catch (e) {}
      return res;
    };
  }

  if (typeof startBlocks === 'function') {
    const startBlocksFn = startBlocks;
    startBlocks = function (attackers) {
      startBlocksFn.apply(this, arguments);
      try {
        const map = new Map((attackers || []).map(a => [a.id, a]));
        document.querySelectorAll('#jBlockList select').forEach(sel => {
          const a = map.get(+sel.dataset.blk);
          if (!a) return;
          [...sel.options].forEach(o => {
            if (!o.value) return;
            const b = (G.you.bf || []).find(x => x.id === +o.value);
            if (b && !canItBlock(a, b)) o.remove();
          });
          if (sel.options.length <= 1) sel.disabled = true;
        });
      } catch (e) {}
    };
  }

  /* ============================================================
     7 · CONTADORES Y EXILIO GENÉRICOS
     ============================================================ */
  const numOf = s => /^\d+$/.test(String(s)) ? +s : (NUMW[s] || 1);
  const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

  function handleCounters(P, oracle, srcName) {
    const o = low(oracle);
    if (!/counter/.test(o) || !/[+-]\d\/[+-]\d/.test(o)) return oracle;
    const F = others(P);
    const put = (x, n) => {
      if (!x) return;
      if (n >= 0) { x.a = (x.a || 0) + n; x.b = (x.b || 0) + n; }
      else { x.a = (x.a || 0) + n; x.b = (x.b || 0) + n; }
    };
    /* +1/+1 a cada criatura propia */
    let m = o.match(/put (?:a|one|two|three|four|five|\d+|x) \+1\/\+1 counters? on each (?:other )?creature you control/);
    if (m) {
      const n = numOf(m[1] === 'x' ? 1 : m[1]);
      (P.bf || []).filter(isCrea).forEach(x => put(x, n));
      log(T('r.counters', { n, t: 'todas tus criaturas' }), who(P));
      return stripClause(oracle, /put (?:a|one|two|three|four|five|\d+|x) \+1\/\+1 counters? on each (?:other )?creature you control[^.]*\.?/i);
    }
    /* -1/-1 a cada criatura (todas) */
    m = o.match(/put (?:a|one|two|three|\d+) -1\/-1 counters? on each creature/);
    if (m) {
      const n = numOf(m[1]);
      [...(P.bf || []), ...(F.bf || [])].filter(isCrea).forEach(x => put(x, -n));
      try { checkDeaths(); } catch (e) {}
      return stripClause(oracle, /put (?:a|one|two|three|\d+) -1\/-1 counters? on each creature[^.]*\.?/i);
    }
    /* -1/-1 a un objetivo */
    m = o.match(/put (?:a|one|two|three|\d+) -1\/-1 counters? on (?:target|up to one target) creature/);
    if (m) {
      const n = numOf(m[1]);
      const tg = bestTargets(P, 'foe')[0];
      if (tg) put(tg, -n);
      try { checkDeaths(); } catch (e) {}
      return stripClause(oracle, /put (?:a|one|two|three|\d+) -1\/-1 counters? on (?:target|up to one target) creature[^.]*\.?/i);
    }
    /* «reparte N contadores» entre tus criaturas */
    m = o.match(/distribute (?:two|three|four|\d+) \+1\/\+1 counters?/);
    if (m) {
      let left = numOf(m[1]);
      (P.bf || []).filter(isCrea).sort((a, b) => pOf(b) - pOf(a)).forEach(x => {
        if (left <= 0) return;
        put(x, 1); left--;
      });
      return stripClause(oracle, /distribute (?:two|three|four|\d+) \+1\/\+1 counters?[^.]*\.?/i);
    }
    return oracle;
  }

  /* exilio de tipos que el motor no contemplaba (artefacto, encantamiento, tierra) */
  function handleExile(P, oracle, srcName) {
    const o = low(oracle);
    if (!/exile target (artifact|enchantment|land|nonland permanent|creature or planeswalker)/.test(o)) return oracle;
    const F = others(P);
    const want = (o.match(/exile target (artifact|enchantment|land|nonland permanent|creature or planeswalker)/) || [])[1] || 'permanent';
    const pool = (F.bf || []).filter(x => (want === 'permanent' || want === 'nonland permanent')
      ? (want === 'permanent' || !isLnd(x)) : typeOf(x).includes(want.split(' ')[0]));
    const tg = pool.sort((a, b) => (valOf(a) - valOf(b)))[0] || (F.bf || []).filter(isCrea)[0];
    if (!tg) return stripClause(oracle, /exile target[^.]*\.?/i);
    F.bf = F.bf.filter(x => x !== tg);
    F.bf.forEach(y => { if (y.equipTo === tg.id) y.equipTo = null; });
    if (!tg.token) F.exile.push(tg.name);
    log(T('r.exile', { c: srcName, t: cardNameOf(tg.card) }), who(P));
    return stripClause(oracle, /exile target[^.]*\.?/i);
  }

  /* ============================================================
     8 · COSTE MENOS Y FICHAS CON HABILIDAD
     ============================================================ */
  const costBase = costOf;
  costOf = function (card) {
    const c = costBase.apply(this, arguments);
    try {
      const o = low(card && card.oracle);
      const m = o.match(/costs? \{(\d+)\} less/);
      if (m && c.generic > 0) {
        const P = (G && G.turn === 'you' ? G.you : G.ai);
        const cond = o.match(/if you control (?:a|an|at least one) ([a-z]+)/);
        let ok = true;
        if (cond && P && P.bf) ok = P.bf.some(x => !isLnd(x) && typeOf(x).includes(cond[1]));
        if (ok) c.generic = Math.max(0, c.generic - (+m[1] || 1));
      }
    } catch (e) {}
    return c;
  };

  function upgradeToken(perm, spec) {
    if (!perm || !perm.card) return;
    const nm = low((spec && spec.name) || perm.card.tok || perm.card.name);
    if (/treasure/.test(nm)) {
      perm.card.oracle = 'Add {W}{U}{B}{R}{G}: one mana of any color.';
      perm.card.prod = ['W', 'U', 'B', 'R', 'G'];
      perm.card.ci = ['W', 'U', 'B', 'R', 'G'];
    } else if (/clue/.test(nm)) {
      perm.card.oracle = '{2}, Sacrifice this artifact: Draw a card.';
    } else if (/food/.test(nm)) {
      perm.card.oracle = '{2}, Sacrifice this artifact: You gain 3 life.';
    }
  }
  if (typeof spawnToken === 'function') {
    const spawnBase2 = spawnToken;
    spawnToken = function (P, spec) {
      const perm = spawnBase2.apply(this, arguments);
      try { upgradeToken(perm, spec); } catch (e) {}
      return perm;
    };
  }

  /* ============================================================
     9 · COSTE ADICIONAL: «As an additional cost… sacrifice»
     ============================================================ */
  if (typeof playFromHand === 'function') {
    const playBase = playFromHand;
    playFromHand = function (P, idx, asCommander) {
      try {
        if (P && !asCommander && idx >= 0) {
          const card = typeof cardOfSafe === 'function' ? cardOfSafe(P.hand[idx]) : null;
          const o = low(card && card.oracle);
          const add = o.match(/as an additional cost to (?:cast|activate)[^.]*?sacrifice ([a-z ]{3,24})/);
          const modalLike = /\{x\}/i.test(String((card && card.mana) || '')) || /choose (one|two|one or both|up to one)/i.test(o);
          if (add && !modalLike) {
            const what = add[1].trim().split(' ')[0];
            const victim = pickVictim(P, what === 'a' ? 'creature' : what);
            if (!victim) {
              if (P === G.you && typeof toast === 'function') toast(T('r.needSac', { c: cardNameOf(card) }));
              return false;
            }
            sacrifice(P, victim);
          }
        }
      } catch (e) {}
      return playBase.apply(this, arguments);
    };
  }

  /* ---------- API para el banco de pruebas ---------- */
  window.RULES = {
    version: VERSION,
    sacrifice, sacrificeFor, pickVictim, poolFor,
    applyScry, sacAbilities, generalAbilities, allAbilities, canUse, use, prowessPump, prowessClear, handleSacrifice,
    unblockable, canItBlock, handleCounters, handleExile, upgradeToken
  };
})();
