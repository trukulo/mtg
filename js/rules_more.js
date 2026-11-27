/* ============================================================
   rules-more · mecánicas de los once sets que faltaban
   ------------------------------------------------------------
   Capa autocontenida que envuelve funciones del motor para añadir
   las mecánicas que el motor no conocía. Todas están verificadas
   contra los textos reales de Scryfall de m15, ori, m19, m20,
   m21, fdn, grn, rna, war, dom y fra:

     amasar · proliferar · adaptar · empoderar a Jace · preparada
     disturbio (riot) · mentor · ultratumba (afterlife) · espectáculo
     afinidad · estímulo (kicker) · convocar · ciclar / ciclaje de
     tierra · contemplar a un Jace · subestimación (undergrowth)

   Depende de `rules-core` (carga después) pero no lo sustituye: usa
   su selector `.rpk` y añade insignias propias `.rm-*`. Todo se puede
   desactivar borrando este bloque.

   Aproximaciones conscientes (el motor no las modela):
     - los contadores +1/+1 y los bonus temporales comparten `a`/`b`,
       así que proliferar sube también los bonus de turno;
     - el cementerio no se puede lanzar (flashback / jump-start);
     - "contemplar" solo comprueba que haya un Jace, sin enseñarlo.
   ============================================================ */
(() => {
  if (typeof G === 'undefined' || typeof applySpell !== 'function') return;

  const VERSION = 'rules-more 2';
  const low = s => String(s == null ? '' : s).toLowerCase();
  const T = (k, v) => { try { return typeof t === 'function' ? t(k, v) : k; } catch (e) { return k; } };
  const log = (txt, who) => { try { logLine(txt, who); } catch (e) {} };
  const who = P => (P && P === G.you ? 'you' : 'ai');
  const foeOf = P => (P && P === G.you ? G.ai : G.you);
  const nameOf = x => { try { return cardName(x && x.card ? x.card : x); } catch (e) { return (x && (x.name || (x.card && x.card.name))) || ''; } };
  const cardOf2 = n => { try { return typeof cardOfSafe === 'function' ? cardOfSafe(n) : null; } catch (e) { return null; } };
  const textOf = c => {
    let s = String((c && c.oracle) || '');
    ((c && c.faces) || []).forEach(f => { if (f && f.oracle) s += '\n' + f.oracle; });
    return s;
  };
  const isCrea = x => { try { return typeof isCreature === 'function' ? isCreature(x) : !!(x && x.card && x.card.creature); } catch (e) { return false; } };
  const isPW = c => /planeswalker/i.test(String((c && c.type) || ''));
  const nextId = () => { try { return ++gid; } catch (e) { return 900000 + Math.floor(Math.random() * 1e6); } };
  const num = w => (/^(x)$/i.test(String(w || '')) ? 1 : (/^\d+$/.test(String(w || '')) ? +w : 1));

  /* ---------- textos ---------- */
  try {
    if (typeof I18N === 'object' && I18N) {
      Object.assign(I18N.es, {
        'rm.army': 'Se crea una ficha de Ejército {k}.',
        'rm.amass': 'Amasar: {n} contador(es) +1/+1 en {t}.',
        'rm.prolif': 'Proliferar: {n} permanente(s) con contadores.',
        'rm.adapt': 'Adaptar {n}: {t} gana {n} contador(es) +1/+1.',
        'rm.adaptNo': '{t} ya tiene contadores; adaptar no hace nada.',
        'rm.empower': 'Empoderar a Jace {n}: {t} gana {n} de lealtad.',
        'rm.empowerNew': 'Se crea un Jace de ficha con {n} de lealtad.',
        'rm.kicker': 'Estímulo',
        'rm.kickerSub': 'Puedes pagar {cost} extra por {c}.',
        'rm.kickYes': 'Pagar estímulo ({cost})',
        'rm.kickNo': 'Lanzar sin estímulo',
        'rm.kicked': '{c} se lanza con estímulo.',
        'rm.spectacle': 'Espectáculo: {c} cuesta {cost}.',
        'rm.cycle': 'Ciclar: se descarta {c} y se roba una carta.',
        'rm.cycleLand': 'Ciclaje de tierra: {c} por una tierra básica.',
        'rm.cycleBtn': 'Ciclar {cost}',
        'rm.cycleNo': 'No hay maná para ciclar.',
        'rm.prepared': 'Preparada: lanzar la copia de {c}',
        'rm.preparedCast': 'Se lanza la copia de {c}.',
        'rm.riot': 'Disturbio',
        'rm.riotSub': '{c} entra con tu elección.',
        'rm.riotCounter': 'Un contador +1/+1',
        'rm.riotHaste': 'Prisa',
        'rm.riotDone': 'Disturbio: {c} entra con {w}.',
        'rm.mentor': 'Mentor: +1/+1 a {t}.',
        'rm.afterlife': 'Ultratumba: {n} Espíritu(s) 1/1 con volar.',
        'rm.convoke': 'Convocar: se giran {n} criatura(s) para pagar.',
        'rm.ability': 'Habilidades de la carta',
        'rm.actUse': '{c}: {a}.',
        'rm.needMana': 'No hay maná para {c}.',
        'rm.behold': 'Contemplar a un Jace: {c}.',
        'rm.beholdTap': '{c} entra girada: no hay ningún Jace.',
        'rm.gyCast': 'Lanzar desde el cementerio',
        'rm.flashbackCast': 'Se lanza {c} desde el cementerio y se exilia.',
        'rm.jumpCast': 'Salto inicial: se descarta {d} para lanzar {c}.',
        'rm.discardNo': 'No hay otra carta que descartar.',
        'rm.splitPick': 'Elige la mitad',
        'rm.splitSub': '{c} tiene dos hechizos: elige cuál lanzas.',
        'rm.regen': 'Escudo de regeneración en {c}.',
        'rm.regenShield': '{c} se regenera: se gira y sobrevive.',
        'rm.crew': 'Tripular {n}',
        'rm.crewSub': '{c}: gira criaturas con fuerza total {n} o más.',
        'rm.crewDone': '{c} se convierte en criatura hasta el final del turno.',
        'rm.exhaustUsed': 'La habilidad de agotar de {c} ya se usó.'
      });
      Object.assign(I18N.en, {
        'rm.army': 'A {k} Army token is created.',
        'rm.amass': 'Amass: {n} +1/+1 counter(s) on {t}.',
        'rm.prolif': 'Proliferate: {n} permanent(s) with counters.',
        'rm.adapt': 'Adapt {n}: {t} gains {n} +1/+1 counter(s).',
        'rm.adaptNo': '{t} already has counters; adapt does nothing.',
        'rm.empower': 'Empower Jace {n}: {t} gains {n} loyalty.',
        'rm.empowerNew': 'A Jace token with {n} loyalty is created.',
        'rm.kicker': 'Kicker',
        'rm.kickerSub': 'You may pay an extra {cost} for {c}.',
        'rm.kickYes': 'Pay kicker ({cost})',
        'rm.kickNo': 'Cast without kicker',
        'rm.kicked': '{c} is cast with kicker.',
        'rm.spectacle': 'Spectacle: {c} costs {cost}.',
        'rm.cycle': 'Cycling: {c} is discarded and a card is drawn.',
        'rm.cycleLand': 'Landcycling: {c} for a basic land.',
        'rm.cycleBtn': 'Cycle {cost}',
        'rm.cycleNo': 'Not enough mana to cycle.',
        'rm.prepared': 'Prepared: cast the copy of {c}',
        'rm.preparedCast': 'The copy of {c} is cast.',
        'rm.riot': 'Riot',
        'rm.riotSub': '{c} enters with your choice.',
        'rm.riotCounter': 'A +1/+1 counter',
        'rm.riotHaste': 'Haste',
        'rm.riotDone': 'Riot: {c} enters with {w}.',
        'rm.mentor': 'Mentor: +1/+1 on {t}.',
        'rm.afterlife': 'Afterlife: {n} 1/1 Spirit(s) with flying.',
        'rm.convoke': 'Convoke: {n} creature(s) tapped to pay.',
        'rm.ability': 'Card abilities',
        'rm.actUse': '{c}: {a}.',
        'rm.needMana': 'Not enough mana for {c}.',
        'rm.behold': 'Behold a Jace: {c}.',
        'rm.beholdTap': '{c} enters tapped: no Jace around.',
        'rm.gyCast': 'Cast from graveyard',
        'rm.flashbackCast': '{c} is cast from the graveyard and exiled.',
        'rm.jumpCast': 'Jump-start: {d} is discarded to cast {c}.',
        'rm.discardNo': 'No other card to discard.',
        'rm.splitPick': 'Choose a half',
        'rm.splitSub': '{c} has two spells: choose which one you cast.',
        'rm.regen': 'Regeneration shield on {c}.',
        'rm.regenShield': '{c} regenerates: it taps and survives.',
        'rm.crew': 'Crew {n}',
        'rm.crewSub': '{c}: tap creatures with total power {n} or more.',
        'rm.crewDone': '{c} becomes a creature until end of turn.',
        'rm.exhaustUsed': '{c} already used its exhaust ability.'
      });
      Object.assign(I18N.fr, {
        'rm.army': 'Un jeton d’Armée {k} est créé.',
        'rm.amass': 'Amasser : {n} marqueur(s) +1/+1 sur {t}.',
        'rm.prolif': 'Proliférer : {n} permanent(s) avec des marqueurs.',
        'rm.adapt': 'Adapter {n} : {t} gagne {n} marqueur(s) +1/+1.',
        'rm.adaptNo': '{t} a déjà des marqueurs ; adapter ne fait rien.',
        'rm.empower': 'Renforcer Jace {n} : {t} gagne {n} de loyauté.',
        'rm.empowerNew': 'Un jeton Jace avec {n} de loyauté est créé.',
        'rm.kicker': 'Kick',
        'rm.kickerSub': 'Vous pouvez payer {cost} de plus pour {c}.',
        'rm.kickYes': 'Payer le kick ({cost})',
        'rm.kickNo': 'Lancer sans kick',
        'rm.kicked': '{c} est lancé avec kick.',
        'rm.spectacle': 'Spectacle : {c} coûte {cost}.',
        'rm.cycle': 'Recyclage : {c} est défaussé et une carte est piochée.',
        'rm.cycleLand': 'Recyclage de terrain : {c} contre un terrain de base.',
        'rm.cycleBtn': 'Recycler {cost}',
        'rm.cycleNo': 'Pas assez de mana pour recycler.',
        'rm.prepared': 'Préparée : lancer la copie de {c}',
        'rm.preparedCast': 'La copie de {c} est lancée.',
        'rm.riot': 'Émeute',
        'rm.riotSub': '{c} arrive avec votre choix.',
        'rm.riotCounter': 'Un marqueur +1/+1',
        'rm.riotHaste': 'Célérité',
        'rm.riotDone': 'Émeute : {c} arrive avec {w}.',
        'rm.mentor': 'Mentor : +1/+1 sur {t}.',
        'rm.afterlife': 'Après-vie : {n} Esprit(s) 1/1 avec vol.',
        'rm.convoke': 'Convocation : {n} créature(s) engagée(s) pour payer.',
        'rm.ability': 'Capacités de la carte',
        'rm.actUse': '{c} : {a}.',
        'rm.needMana': 'Mana insuffisant pour {c}.',
        'rm.behold': 'Contempler un Jace : {c}.',
        'rm.beholdTap': '{c} arrive engagé : aucun Jace.',
        'rm.gyCast': 'Lancer depuis le cimetière',
        'rm.flashbackCast': '{c} est lancé depuis le cimetière puis exilé.',
        'rm.jumpCast': 'Flashback : {d} est défaussé pour lancer {c}.',
        'rm.discardNo': 'Aucune autre carte à défausser.',
        'rm.splitPick': 'Choisir une moitié',
        'rm.splitSub': '{c} a deux sorts : choisissez lequel lancer.',
        'rm.regen': 'Bouclier de régénération sur {c}.',
        'rm.regenShield': '{c} se régénère : il s’engage et survit.',
        'rm.crew': 'Équipage {n}',
        'rm.crewSub': '{c} : engagez des créatures de force totale {n} ou plus.',
        'rm.crewDone': '{c} devient une créature jusqu’à la fin du tour.',
        'rm.exhaustUsed': '{c} a déjà utilisé sa capacité d’épuisement.'
      });
    }
  } catch (e) {}

  const COST0 = costOf;   /* ya incluye el «cuesta N menos» de rules-core */

  /* ---------- selector flotante (reusa la piel de rules-core) ---------- */
  function picker(title, sub, opts, cb, onCancel, art) {
    if (typeof document === 'undefined') return null;
    const old = document.getElementById('rulesPick');
    if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'rulesPick';
    const esc0 = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    box.innerHTML = `<div class="rpk"><div class="rpk-hd">${esc0(title)}</div>${sub ? `<div class="rpk-sub">${esc0(sub)}</div>` : ''}${
      art ? `<div class="rpk-art"><img src="${esc0(art)}" alt=""></div>` : ''
    }<div class="rpk-opts">${
      opts.map((o, i) => `<button data-i="${i}"${o.dis ? ' disabled' : ''}${o.tip ? ` title="${esc0(o.tip)}"` : ''}>${esc0(o.label)}</button>`).join('')
    }</div><button class="rpk-x" data-close="1" aria-label="×">×</button></div>`;
    document.body.appendChild(box);
    box.querySelectorAll('[data-i]').forEach(b => {
      b.onclick = () => { const i = +b.dataset.i; box.remove(); cb(i); };
    });
    const cl = box.querySelector('[data-close]');
    if (cl) cl.onclick = () => { box.remove(); if (typeof onCancel === 'function') onCancel(); };
    return box;
  }

  /* ---------- costes ---------- */
  function mergeCosts(a, b) {
    if (!a && !b) return null;
    const c = { generic: 0, colors: {}, raw: (a && a.raw) || (b && b.raw) || '' };
    [a, b].forEach(x => {
      if (!x) return;
      c.generic += x.generic || 0;
      Object.keys(x.colors || {}).forEach(k => { c.colors[k] = (c.colors[k] || 0) + x.colors[k]; });
    });
    return c;
  }
  const totalOf = c => (c ? (c.generic || 0) + Object.keys(c.colors || {}).reduce((s, k) => s + (c.colors[k] || 0), 0) : 0);
  const manaCost = str => COST0({ mana: str || '' });

  function spectacleCost(card) {
    const m = textOf(card).match(/(?:^|\n)\s*spectacle ((?:\{[^}]+\})+)/i);
    return m ? manaCost(m[1]) : null;
  }
  function spectacleOK(P) {
    const foe = foeOf(P);
    const mark = G._lifeMark;
    if (!foe || !mark) return false;
    const key = foe === G.you ? 'you' : 'ai';
    return typeof mark[key] === 'number' && foe.life < mark[key];
  }
  function hasJace(P) {
    if (!P) return false;
    if ((P.bf || []).some(x => x.card && isPW(x.card) && /jace/i.test(String(x.card.name || '')))) return true;
    return (P.hand || []).some(n => { const c = cardOf2(n); return c && isPW(c) && /jace/i.test(String(c.name || '')); });
  }

  /* ---------- cartas partidas, cementerio, tripular, cambiante ---------- */
  const isSplit = c => !!(c && /\/\//.test(String(c.type || '')) && (c.faces || []).length === 2 && !c.creature);
  const splitFaces = c => ((c && c.faces) || []).filter(f => f && (f.oracle || f.mana));

  function flashbackInfo(card) {
    const o = textOf(card);
    const fm = o.match(/(?:^|\n)\s*flashback\s*[\u2014:\u2013-]?\s*((?:\{[^}]+\})+)/i);
    if (fm) return { mode: 'flashback', mana: fm[1], discard: /flashback[^\n]*discard a card/i.test(o) };
    if (/(?:^|\n)\s*jump-start/i.test(o)) return { mode: 'jump', mana: String(card.mana || ''), discard: true };
    return null;
  }
  function cleanGyText(text) {
    return String(text || '')
      .replace(/(?:^|\n)\s*(?:flashback|jump-start)[^\n]*/gi, '\n')
      .replace(/\n{2,}/g, '\n').trim();
  }

  const crewN = card => { const m = textOf(card).match(/\bcrew (\d+)/i); return m ? +m[1] : 0; };
  function canCrew(P, perm) {
    if (!perm || !perm.card || perm.card.creature) return false;
    const n = crewN(perm.card);
    if (!n) return false;
    const total = (P.bf || []).filter(x => x !== perm && isCrea(x) && !x.tapped).reduce((s, x) => s + ((x.pow || 0) + (x.a || 0)), 0);
    return total >= n;
  }
  function doCrew(P, perm) {
    if (!perm || !perm.card) return false;
    const n = crewN(perm.card);
    if (!n || perm.card.creature) return false;
    const pool = (P.bf || []).filter(x => x !== perm && isCrea(x) && !x.tapped)
      .sort((a, b) => ((b.pow || 0) + (b.a || 0)) - ((a.pow || 0) + (a.a || 0)));
    let sum = 0;
    const used = [];
    for (const c of pool) { if (sum >= n) break; used.push(c); sum += (c.pow || 0) + (c.a || 0); }
    if (sum < n) return false;
    used.forEach(c => { c.tapped = true; });
    perm.card = Object.assign({}, perm.card, { creature: true });
    perm._crewed = true;
    perm.summoning = false;
    log(T('rm.crewDone', { c: nameOf(perm) }), who(P));
    try { renderBoard(); } catch (e) {}
    return true;
  }

  function uncrewAll() {
    [G.you, G.ai].forEach(P => {
      if (!P) return;
      (P.bf || []).forEach(x => {
        if (!x._crewed || !x.card) return;
        x.card = Object.assign({}, x.card, { creature: false });
        x._crewed = false;
      });
    });
  }

  const ALL_TYPES = 'Advisor, Aetherborn, Angel, Ape, Archer, Artificer, Assassin, Assembly-Worker, Avatar, ' +
    'Badger, Barbarian, Basilisk, Bat, Bear, Beast, Bird, Boar, Cat, Centaur, Chimera, Cleric, Construct, ' +
    'Crab, Crocodile, Cyclops, Demon, Dinosaur, Djinn, Dog, Dragon, Drake, Dwarf, Efreet, Elder, Elemental, ' +
    'Elephant, Elf, Faerie, Fish, Fox, Frog, Giant, Gnome, Goat, Goblin, God, Golem, Gorgon, Horror, Horse, ' +
    'Human, Hydra, Illusion, Imp, Insect, Jellyfish, Kavu, Kirin, Kithkin, Knight, Kraken, Leech, Leviathan, ' +
    'Lizard, Merfolk, Minotaur, Monk, Moonfolk, Mouse, Myr, Naga, Nightmare, Noble, Octopus, Ogre, Ooze, Orc, ' +
    'Pegasus, Phoenix, Plant, Praetor, Rat, Rogue, Salamander, Samurai, Saproling, Satyr, Scarecrow, Sculpture, ' +
    'Serpent, Shade, Shapeshifter, Shaman, Siren, Skeleton, Slith, Sliver, Soldier, Sphinx, Spider, Spirit, ' +
    'Squid, Squirrel, Starfish, Surrakar, Thrull, Treefolk, Troll, Turtle, Unicorn, Vampire, Vedalken, ' +
    'Wall, Warlock, Warrior, Weird, Werewolf, Whale, Wizard, Wolf, Wombat, Worm, Wraith, Wurm, Yeti, Zombie';

  function handleRegenerate(P, text, card) {
    let t = text;
    if (/can'?t be regenerated/i.test(t)) { G._noRegen = true; return t; }
    const each = /regenerate each other creature you control/i.test(t);
    const self = /regenerate (this creature|it)\b/i.test(t);
    const target = /regenerate target creature/i.test(t);
    if (!each && !self && !target) return t;
    if (each) {
      (P.bf || []).filter(isCrea).forEach(x => { x._regen = true; });
      log(T('rm.regen', { c: nameOf(card) }), who(P));
    } else if (self) {
      const perm = (P.bf || []).find(x => x.card && low(x.card.name) === low(card.name));
      if (perm) perm._regen = true;
    } else {
      const tg = (bestTargets(P, 'self') || [])[0];
      if (tg) tg._regen = true;
    }
    return t.replace(/regenerate (?:target creature|each other creature you control|this creature|it)\.?/gi, ' ')
      .replace(/\s{2,}/g, ' ').trim();
  }

  /* ---------- amasar ---------- */
  function doAmass(P, kind, n) {
    const k = String(kind || 'Zombie').replace(/s$/i, '');
    let army = (P.bf || []).find(x => isCrea(x) && /army/i.test(String(x.card.type || '')));
    if (!army) {
      army = spawnToken(P, { name: k + ' Army', creature: true, cols: ['B'], pt: { p: 0, t: 0 } });
      log(T('rm.army', { k }), who(P));
    }
    if (!army) return false;
    army.a = (army.a || 0) + n; army.b = (army.b || 0) + n;
    log(T('rm.amass', { n, t: nameOf(army) }), who(P));
    return true;
  }

  /* ---------- proliferar ---------- */
  function doProliferate(P, times) {
    let n = 0;
    for (let t = 0; t < Math.max(1, times); t++) {
      (P.bf || []).forEach(x => {
        if (!x.card) return;
        if (isPW(x.card) && x.loyalty != null) { x.loyalty += 1; n++; return; }
        if ((x.a || 0) > 0 || (x.b || 0) > 0) { if (x.a > 0) x.a += 1; if (x.b > 0) x.b += 1; n++; }
      });
    }
    log(T('rm.prolif', { n }), who(P));
    return n > 0;
  }

  /* ---------- adaptar ---------- */
  function doAdapt(P, card, n) {
    const perm = (P.bf || []).find(x => x.card && low(x.card.name) === low(card.name));
    if (!perm) return false;
    if ((perm.a || 0) !== 0 || (perm.b || 0) !== 0) { log(T('rm.adaptNo', { t: nameOf(perm) }), who(P)); return false; }
    perm.a += n; perm.b += n;
    log(T('rm.adapt', { n, t: nameOf(perm) }), who(P));
    return true;
  }

  /* ---------- empoderar a Jace ---------- */
  function doEmpower(P, n) {
    let jace = (P.bf || []).find(x => x.card && isPW(x.card) && /jace/i.test(String(x.card.name || '')));
    if (!jace) {
      const card = {
        name: 'Jace', tok: 'Jace', creature: false, land: false, basic: false,
        type: 'Token Planeswalker — Jace', colors: ['U'], ci: ['U'], prod: [], img: '', sm: '',
        cmc: 0, mana: '', oracle: '[-1]: Surveil 1.\n[-3]: Draw a card.', pow: null, tou: null,
        rarity: 'mythic', kw: [], legendary: true, set: '', token: true, loyalty: 0
      };
      jace = { id: nextId(), name: 'Jace', card, tapped: false, dmg: 0, summoning: false, token: true, pow: 0, tou: 0, a: 0, b: 0, attached: null, loyalty: 0, pw: true };
      P.bf.push(jace);
      log(T('rm.empowerNew', { n }), who(P));
    }
    jace.loyalty = (jace.loyalty || 0) + n;
    log(T('rm.empower', { n, t: nameOf(jace) }), who(P));
    return true;
  }

  /* ---------- lapidación de cláusulas ---------- */
  const stripRx = {
    amass: /\bamass [A-Za-z]+(?: (?:\d+|X))?\.?\s*(?:\([^)]*\))?/gi,
    proliferate: /\bproliferate(?: (?:\d+|X))?(?: times)?(?:, where X is [^.)]*)?\.?\s*(?:\([^)]*\))?/gi,
    adapt: /\badapt (?:\d+|X)\.?\s*(?:\([^)]*\))?/gi,
    empower: /\bempower jace (?:\d+|X)(?:, where X is [^.)]*)?\.?\s*(?:\([^)]*\))?/gi,
    prepared: /(?:at the beginning of [^,]+,\s*)?if this creature isn't prepared, it becomes prepared\.?\s*(?:\([^)]*\))?/gi
  };
  const cut = (text, key) => String(text || '').replace(stripRx[key], ' ').replace(/\s{2,}/g, ' ').trim();

  /* «si fue estimulado»: se queda o se va la frase entera */
  function stripKicked(text) {
    return String(text || '').split('\n').map(line =>
      line.replace(/(?:^|[.!?]\s+)(?:if (?:this spell|it) was kicked,)[^.!?]*[.!?]?/gi, ' ')
    ).join('\n').replace(/\s{2,}/g, ' ').trim();
  }
  function keepKicked(text) {
    return String(text || '').replace(/if (?:this spell|it) was kicked,\s*/gi, '').replace(/\binstead\b/gi, '');
  }

  /* ---------- subestimación: daño por cada criatura en el cementerio ---------- */
  function undergrowth(P, text) {
    if (!/undergrowth/i.test(text) || !/for each creature card in your graveyard/i.test(text)) return text;
    const n = (P.gy || []).filter(nm => { const c = cardOf2(nm); return c && c.creature; }).length;
    return text
      .replace(/deals? (\d+) damage/gi, (m, d) => 'deals ' + (+d * Math.max(1, n)) + ' damage')
      .replace(/for each creature card in your graveyard/gi, '');
  }

  /* ============================================================
     envoltorios del motor
     ============================================================ */

  /* ---------- costOf: afinidad + espectáculo + coste extra ---------- */
  let EXTRA = null;   /* {name, cost} mientras se lanza una carta concreta */
  const costBase = costOf;
  costOf = function (card) {
    const c = costBase.apply(this, arguments);
    try {
      const o = textOf(card).toLowerCase();
      const P = (G.turn === 'you' ? G.you : G.ai);
      /* carta partida: se puede pagar la mitad más barata (la elección se hace al lanzar) */
      if (isSplit(card)) {
        const faces = splitFaces(card);
        let best = null;
        faces.forEach(f => { const q = COST0({ mana: f.mana || '' }); if (!best || totalOf(q) < totalOf(best)) best = q; });
        if (best) { c.generic = best.generic; c.colors = Object.assign({}, best.colors); c.split = true; return c; }
      }
      /* afinidad: {1} menos por cada permanente del tipo indicado */
      const am = o.match(/(?:^|\n)\s*affinity for ([a-z]+)/);
      if (am && c.generic > 0 && P && P.bf) {
        const what = am[1].replace(/s$/, '');
        const n = P.bf.filter(x => {
          const t = low(x.card && x.card.type), nm = low(x.card && x.card.name);
          if (what === 'artifact') return /artifact/.test(t);
          if (what === 'gate') return /\bgate\b/.test(nm) || /\bgate\b/.test(t);
          if (what === 'creature') return isCrea(x);
          return t.includes(what) || nm.includes(what);
        }).length;
        if (n) c.generic = Math.max(0, c.generic - n);
      }
      /* espectáculo: coste alternativo si el rival perdió vida este turno */
      const sp = spectacleCost(card);
      if (sp && spectacleOK(P) && totalOf(sp) < totalOf(c)) {
        c.generic = sp.generic; c.colors = Object.assign({}, sp.colors); c.spectacle = true;
      }
      /* coste adicional decidido al lanzar (estímulo, contemplar) */
      if (EXTRA && card && low(card.name) === EXTRA.name && EXTRA.cost) {
        c.generic += EXTRA.cost.generic || 0;
        Object.keys(EXTRA.cost.colors || {}).forEach(k => { c.colors[k] = (c.colors[k] || 0) + EXTRA.cost.colors[k]; });
      }
    } catch (e) {}
    return c;
  };

  /* ---------- applySpell: amasar, proliferar, adaptar, empoderar… ---------- */
  const applyBase = applySpell;
  applySpell = function (P, card, srcName, quiet) {
    if (!P || !card) return applyBase.apply(this, arguments);
    let oracle = String(card.oracle || '');
    if (!oracle) return applyBase.apply(this, arguments);
    let mod = oracle, changed = false;
    try {
      const src = srcName || nameOf(card);

      /* «si fue estimulado» */
      if (/was kicked/i.test(mod)) {
        const kicked = G._kicked && low(card.name) === G._kicked;
        mod = kicked ? keepKicked(mod) : stripKicked(mod);
        changed = true;
        if (!mod) return true;
      }

      /* la línea del coste de estímulo no es un efecto */
      if (/^\s*kicker /im.test(mod)) {
        mod = mod.replace(/(?:^|\n)\s*kicker (?:\{[^}]+\})+(?:\s*\([^)]*\))?/gi, '\n').replace(/\n{2,}/g, '\n').trim();
        changed = true;
        if (!mod) return true;
      }

      /* apéndice: el motor solo lanza en tu fase principal, así que siempre se cumple */
      if (/addendum/i.test(mod)) {
        mod = mod.replace(/addendum\s*[\u2014\u2013-]\s*(?:if you cast this spell during your main phase,\s*)?/gi, '');
        changed = true;
      }
      if (/if you cast this spell during your main phase,/i.test(mod)) {
        mod = mod.replace(/if you cast this spell during your main phase,\s*/gi, '');
        changed = true;
      }

      /* «si se lanzó desde el cementerio» */
      if (/cast from (?:a|your) graveyard|wasn't cast from your hand/i.test(mod)) {
        const fromGy = G._fromGy && low(card.name) === G._fromGy;
        mod = mod.replace(/if this spell was cast from a graveyard,\s*/gi, fromGy ? '' : '\u0000');
        mod = mod.replace(/if this spell wasn't cast from your hand,\s*/gi, fromGy ? '' : '\u0000');
        if (/\u0000/.test(mod)) {
          mod = mod.split(/[.\n]/).filter(s => s.indexOf('\u0000') < 0).join('. ').replace(/\s{2,}/g, ' ').trim();
        }
        if (fromGy) mod = mod.replace(/draw a card/gi, 'draw two cards');
        changed = true;
      }

      /* regenerar: escudo de reemplazo */
      if (/\bregenerat/i.test(mod)) {
        mod = handleRegenerate(P, mod, card);
        changed = true;
        if (!mod) return true;
      }

      /* subestimación (undergrowth) */
      const afterUg = undergrowth(P, mod);
      if (afterUg !== mod) { mod = afterUg; changed = true; }

      /* amasar */
      const am = mod.match(/\bamass ([A-Za-z]+)(?: (\d+|X))?/i);
      if (am) {
        doAmass(P, am[1], num(am[2]));
        mod = cut(mod, 'amass'); changed = true;
        if (!mod) return true;
      }
      /* proliferar */
      const pr = mod.match(/\bproliferate(?: (\d+|X))?(?: times)?/i);
      if (pr) {
        doProliferate(P, num(pr[1]));
        mod = cut(mod, 'proliferate'); changed = true;
        if (!mod) return true;
      }
      /* adaptar */
      const ad = mod.match(/\badapt (\d+|X)\b/i);
      if (ad) {
        doAdapt(P, card, num(ad[1]));
        mod = cut(mod, 'adapt'); changed = true;
        if (!mod) return true;
      }
      /* empoderar a Jace */
      const em = mod.match(/\bempower jace (\d+|X)(?:, where X is (.+?))?[.)]/i);
      if (em) {
        let n = num(em[1]);
        if (/^x$/i.test(em[1]) && em[2]) {
          const where = low(em[2]);
          if (/creatures you control/.test(where)) n = (P.bf || []).filter(isCrea).length;
          else if (/islands you control/.test(where)) n = (P.bf || []).filter(x => x.card && /island/i.test(String(x.card.type || ''))).length;
          else if (/creatures? exiled this way/.test(where)) n = 1;
          else n = 1;
        }
        doEmpower(P, Math.max(0, n));
        mod = cut(mod, 'empower'); changed = true;
        if (!mod) return true;
      }
      /* «se prepara» */
      if (/becomes prepared/i.test(mod) || /becomes prepared/i.test(oracle)) {
        if (/becomes prepared/i.test(mod)) {
          const perm = (P.bf || []).find(x => x.card && low(x.card.name) === low(card.name) && x.card.faces && x.card.faces[1]);
          if (perm) perm._prep = true;
          mod = cut(mod, 'prepared'); changed = true;
          if (!mod) return true;
        }
      }
      G._rmSrc = src;
    } catch (e) {}
    let out;
    try {
      out = applyBase.call(this, P, changed ? Object.assign({}, card, { oracle: mod }) : card, srcName, quiet);
    } finally {
      G._noRegen = false;
    }
    return out;
  };

  /* ---------- instantiate: cara frontal + disturbio + preparada ---------- */
  const instBase = (typeof instantiate === 'function') ? instantiate : null;
  if (instBase) {
    instantiate = function (name, token, deck) {
      const perm = instBase.apply(this, arguments);
      try {
        if (!perm || !perm.card || token) return perm;
        const faces = perm.card.faces || [];
        /* prepare/split/transform: el permanente es la cara frontal, no la suma */
        if (faces[0] && faces[0].type && /\/\//.test(String(perm.card.type || ''))) {
          perm.card = Object.assign({}, perm.card, {
            type: faces[0].type,
            oracle: faces[0].oracle || '',
            mana: faces[0].mana || perm.card.mana,
            pow: faces[0].pow != null ? faces[0].pow : perm.card.pow,
            tou: faces[0].tou != null ? faces[0].tou : perm.card.tou
          });
        }
        const o = low(textOf(perm.card));
        if (perm.card.creature && /\briot\b/i.test(o)) perm._riot = true;
        if (perm.card.creature && /enters prepared/i.test(o) && faces[1]) perm._prep = true;
        /* cambiante: es de todos los tipos de criatura */
        if (/\bchangeling\b/i.test(o) && /creature/i.test(String(perm.card.type || ''))) {
          const base = String(perm.card.type || '');
          const head = base.split(/[\u2014-]/)[0].trim();
          perm.card = Object.assign({}, perm.card, { type: head + ' \u2014 ' + ALL_TYPES });
        }
      } catch (e) {}
      return perm;
    };
  }

  /* ---------- diesTrigger: ultratumba ---------- */
  const diesBase = (typeof diesTrigger === 'function') ? diesTrigger : null;
  if (diesBase) {
    diesTrigger = function (P, x) {
      try {
        const o = low(x && x.card && textOf(x.card));
        const m = o.match(/\bafterlife (\d+)/);
        if (m && x.card.creature) {
          const n = Math.max(0, +m[1]);
          for (let i = 0; i < n; i++) spawnToken(P, { name: 'Spirit', creature: true, cols: ['W'], pt: { p: 1, t: 1 }, kw: ['flying'] });
          if (n) log(T('rm.afterlife', { n }), who(P));
        }
      } catch (e) {}
      return diesBase.apply(this, arguments);
    };
  }

  /* ---------- killPermanent y checkDeaths: escudo de regeneración ---------- */
  const killBase = (typeof killPermanent === 'function') ? killPermanent : null;
  if (killBase) {
    killPermanent = function (P, perm) {
      try {
        if (perm && perm._regen && !G._noRegen) {
          perm._regen = false;
          perm.tapped = true;
          perm.dmg = 0;
          log(T('rm.regenShield', { c: nameOf(perm) }), who(P));
          return false;
        }
      } catch (e) {}
      return killBase.apply(this, arguments);
    };
  }
  const deathsBase = (typeof checkDeaths === 'function') ? checkDeaths : null;
  if (deathsBase) {
    checkDeaths = function () {
      try {
        [G.you, G.ai].forEach(P => {
          if (!P) return;
          (P.bf || []).forEach(x => {
            if (!x._regen || !isCrea(x)) return;
            const t = (x.tou || 0) + (x.b || 0);
            if (t > 0 && (x.dmg || 0) >= t) {
              x._regen = false;
              x.tapped = true;
              x.dmg = 0;
              log(T('rm.regenShield', { c: nameOf(x) }), who(P));
            }
          });
        });
      } catch (e) {}
      return deathsBase.apply(this, arguments);
    };
  }

  /* ---------- resolveCombat: mentor ---------- */
  const combatBase = (typeof resolveCombat === 'function') ? resolveCombat : null;
  if (combatBase) {
    resolveCombat = function (atkP, defP, attackers, blocks) {
      try {
        const atks = (attackers || []).filter(a => a && a.card);
        atks.forEach(a => {
          if (!/\bmentor\b/i.test(low(textOf(a.card)))) return;
          const mine = (a.pow || 0) + (a.a || 0);
          const cands = atks.filter(b => b !== a && ((b.pow || 0) + (b.a || 0)) < mine);
          const tg = cands.sort((x, y) => ((y.pow || 0) + (y.a || 0)) - ((x.pow || 0) + (x.a || 0)))[0];
          if (!tg) return;
          tg.a = (tg.a || 0) + 1; tg.b = (tg.b || 0) + 1;
          log(T('rm.mentor', { t: nameOf(tg) }), who(atkP));
        });
      } catch (e) {}
      return combatBase.apply(this, arguments);
    };
  }

  /* ============================================================
     lanzar desde la mano: estímulo, convocar, contemplar, ciclar
     ============================================================ */

  /* fuente de maná temporal para convocar (se retira al terminar) */
  let tmpgid = 900000;
  function manaSource(P, cols) {
    const card = { name: '__convoke', type: 'Land', land: true, basic: false, colors: [], ci: cols.slice(), prod: cols.slice(), oracle: '', cmc: 0, mana: '', kw: [], legendary: false, pow: null, tou: null, rarity: 'common', set: '' };
    const perm = { id: ++tmpgid, name: '__convoke', card, tapped: false, dmg: 0, summoning: false, token: true, pow: 0, tou: 0, a: 0, b: 0 };
    P.bf.push(perm);
    return perm;
  }

  function withConvoke(P, card, fn) {
    try {
      if (!/\bconvoke\b/.test(low(textOf(card)))) return fn();
      if (canPay(P, costOf(card), 0)) return fn();
      const need = costOf(card);
      const total = totalOf(need);
      const avail = (P.bf || []).filter(x => !x.tapped && manaOf(x).length).length;
      const short = Math.max(0, total - avail);
      const creas = (P.bf || []).filter(x => isCrea(x) && !x.tapped && !x.summoning &&
        (x.card.colors || []).some(k => 'WUBRG'.includes(k)));
      const used = creas.slice(0, Math.min(short, creas.length));
      if (!used.length) return fn();
      const temps = [];
      used.forEach(c => {
        c.tapped = true;
        temps.push(manaSource(P, (c.card.colors || []).filter(k => 'WUBRG'.includes(k))));
      });
      log(T('rm.convoke', { n: used.length }), who(P));
      let r = false;
      try { r = fn(); } finally { P.bf = P.bf.filter(x => temps.indexOf(x) < 0); }
      if (!r) used.forEach(c => { c.tapped = false; });
      try { renderBoard(); } catch (e) {}
      return r;
    } catch (e) { return fn(); }
  }

  function castPreparedCopy(P, perm) {
    const face = (perm && perm.card && perm.card.faces || [])[1];
    if (!face) return false;
    const cost = manaCost(face.mana || '');
    if (!canPay(P, cost, 0)) { if (P === G.you && typeof toast === 'function') toast(T('rm.needMana', { c: face.name || '' })); return false; }
    payMana(P, cost, 0);
    perm._prep = false;
    log(T('rm.preparedCast', { c: face.name || nameOf(perm) }), who(P));
    applySpell(P, { name: face.name || perm.card.name, type: face.type || '', oracle: face.oracle || '', creature: false, land: false, mana: face.mana || '', colors: perm.card.colors || [], kw: [], faces: [] }, face.name || nameOf(perm), false);
    try { checkDeaths(); renderBoard(); } catch (e) {}
    return true;
  }

  function returnBasicLand(P) {
    const i = (P.lib || []).findIndex(n => { const c = cardOf2(n); return c && c.land && c.basic; });
    if (i < 0) return false;
    const nm = P.lib.splice(i, 1)[0];
    P.hand.push(nm);
    return true;
  }

  function cycleCard(P, idx, want) {
    const nm = (P.hand || [])[idx];
    if (!nm) return false;
    if (want != null && low(nm) !== low(want)) return false;
    const card = cardOf2(nm);
    const m = textOf(card).match(/cycling ((?:\{[^}]+\})+)/i);
    if (!m) return false;
    const land = /landcycling/i.test(textOf(card));
    const cost = manaCost(m[1]);
    if (!canPay(P, cost, 0)) { if (P === G.you && typeof toast === 'function') toast(T('rm.cycleNo')); return false; }
    payMana(P, cost, 0);
    P.hand.splice(idx, 1);
    P.gy.push(card.name || nm);
    if (land) {
      returnBasicLand(P);
      log(T('rm.cycleLand', { c: nameOf(card) }), who(P));
    } else {
      try { draw(P, 1); } catch (e) {}
      log(T('rm.cycle', { c: nameOf(card) }), who(P));
    }
    try { renderBoard(); } catch (e) {}
    return true;
  }

  function aiSplitChoice(P, card) {
    const faces = splitFaces(card);
    let best = 0, bs = -1;
    faces.forEach((f, i) => {
      const o = low(f.oracle);
      let s = 0;
      if (/destroy|deals? \d+ damage|exile target/.test(o)) s += 3;
      if (/draw (a|two|three) card/.test(o)) s += 2;
      if (/create .*token|\+1\/\+1 counter/.test(o)) s += 1;
      if (totalOf(manaCost(f.mana || '')) < bs || bs < 0) { /* la barata desempata */ }
      if (s > bs) { bs = s; best = i; }
    });
    return best;
  }

  function castSplit(P, idx, faceIdx) {
    const name = (P.hand || [])[idx];
    if (!name) return false;
    const card = cardOf2(name);
    const faces = splitFaces(card);
    const f = faces[faceIdx] || faces[0];
    if (!f) return false;
    const cost = manaCost(f.mana || '');
    if (!canPay(P, cost, 0)) { if (P === G.you && typeof toast === 'function') toast(T('rm.needMana', { c: f.name || name })); return false; }
    payMana(P, cost, 0);
    P.hand.splice(idx, 1);
    log(T('rm.actUse', { c: f.name || name, a: (f.mana || '') }), who(P));
    applySpell(P, { name: f.name || card.name, type: f.type || '', oracle: f.oracle || '', creature: false, land: false, mana: f.mana || '', colors: card.colors || [], kw: [], faces: [] }, f.name || nameOf(card));
    P.gy.push(card.name || name);
    try { renderBoard(); } catch (e) {}
    return true;
  }

  /* lanzar desde el cementerio: retrospectiva y salto inicial */
  function castFromGrave(P, name, fixedMode) {
    const card = cardOf2(name);
    if (!card) return false;
    const info = flashbackInfo(card);
    if (!info) return false;
    const jump = (fixedMode || info.mode) === 'jump';
    const gi = (P.gy || []).findIndex(n => low(n) === low(name));
    if (gi < 0) return false;
    const cost = manaCost(info.mana);
    if (!canPay(P, cost, 0)) { if (P === G.you && typeof toast === 'function') toast(T('rm.needMana', { c: nameOf(card) })); return false; }
    if (info.discard && !(P.hand || []).length) { if (P === G.you && typeof toast === 'function') toast(T('rm.discardNo')); return false; }
    payMana(P, cost, 0);
    let dumped = null;
    if (info.discard && typeof discardOne === 'function') {
      dumped = discardOne(P);
      if (dumped) log(T('rm.jumpCast', { d: nameOf(cardOf2(dumped)), c: nameOf(card) }), who(P));
    }
    P.gy.splice(gi, 1);
    const clean = cleanGyText(textOf(card));
    G._fromGy = low(card.name);
    try {
      applySpell(P, Object.assign({}, card, { oracle: clean, faces: [] }), nameOf(card));
    } finally { G._fromGy = null; }
    P.exile.push(card.name || name);
    log(T('rm.flashbackCast', { c: nameOf(card) }), who(P));
    try { checkDeaths(); renderBoard(); } catch (e) {}
    return true;
  }

  function castingCall(P, idx, kickCost, extraCost) {
    const nm = (P.hand || [])[idx];
    if (!nm) return false;
    const card = cardOf2(nm);
    const extra = mergeCosts(kickCost, extraCost);
    EXTRA = extra ? { name: low(nm), cost: extra } : null;
    G._kicked = kickCost ? low(nm) : null;
    const spec = spectacleCost(card);
    const useSpec = !!(spec && spectacleOK(P));
    const specMana = useSpec ? (textOf(card).match(/spectacle ((?:\{[^}]+\})+)/i) || [])[1] || '' : '';
    let r = false;
    try {
      r = withConvoke(P, card, () => playBase.apply(null, [P, idx, false]));
    } finally {
      EXTRA = null; G._kicked = null;
    }
    if (r) {
      if (kickCost) log(T('rm.kicked', { c: nameOf(card) }), who(P));
      if (useSpec) log(T('rm.spectacle', { c: nameOf(card), cost: specMana }), who(P));
    }
    return r;
  }

  const playBase = playFromHand;
  playFromHand = function (P, idx, asCommander) {
    try {
      if (!P || asCommander || idx < 0 || !(P.hand || [])[idx]) return playBase.apply(this, arguments);
      const nm0 = P.hand[idx];
      const card = cardOf2(nm0);
      if (!card) return playBase.apply(this, arguments);
      const o = low(textOf(card));

      /* carta partida: elegir mitad y pagar solo esa */
      if (isSplit(card)) {
        const faces = splitFaces(card);
        if (!faces.length) return playBase.apply(this, arguments);
        if (P === G.you && G.turn === 'you') {
          if (G._splitBusy) return false;
          G._splitBusy = true;
          picker(T('rm.splitPick'), T('rm.splitSub', { c: nameOf(card) }),
            faces.map(f => ({ label: (f.name || card.name) + ' \u00b7 ' + (f.mana || ''), tip: f.oracle })),
            i => {
              G._splitBusy = false;
              if (G.turn !== 'you' || G.over) return;
              if (low((P.hand || [])[idx] || '') === low(nm0)) castSplit(P, idx, i);
            },
            () => { G._splitBusy = false; }, (typeof cardImg === 'function' ? cardImg(card) : ''));
          return true;
        }
        return castSplit(P, idx, aiSplitChoice(P, card));
      }

      /* contemplar a un Jace: si no hay, {1} extra */
      const behold = /as an additional cost to cast[^.]*behold a jace/i.test(o) && !hasJace(P) ? manaCost('{1}') : null;

      /* estímulo */
      const km = o.match(/(?:^|\n)\s*kicker ((?:\{[^}]+\})+)/i);
      if (km) {
        const kc = manaCost(km[1]);
        const total = mergeCosts(mergeCosts(costOf(card), behold), kc);
        if (canPay(P, total, 0)) {
          if (P === G.you && G.turn === 'you') {
            if (G._kickBusy) return false;
            G._kickBusy = true;
            picker(T('rm.kicker'), T('rm.kickerSub', { c: nameOf(card), cost: km[1] }),
              [{ label: T('rm.kickYes', { cost: km[1] }) }, { label: T('rm.kickNo') }],
              i => {
                G._kickBusy = false;
                if (G.turn !== 'you' || G.over) return;
                if (P.hand[idx] !== undefined && low(P.hand[idx]) === low(card.name)) castingCall(P, idx, i === 0 ? kc : null, behold);
              },
              () => {
                G._kickBusy = false;
                if (G.turn !== 'you' || G.over) return;
                if (P.hand[idx] !== undefined && low(P.hand[idx]) === low(card.name)) castingCall(P, idx, null, behold);
              }, (typeof cardImg === 'function' ? cardImg(card) : ''));
            return true;
          }
          /* la IA paga el estímulo si le sobran al menos dos manás */
          const rich = canPay(P, mergeCosts(total, manaCost('{2}')), 0);
          return castingCall(P, idx, rich ? kc : null, behold);
        }
      }
      return castingCall(P, idx, null, behold);
    } catch (e) {
      return playBase.apply(this, arguments);
    }
  };

  /* ---------- cementerio: retrospectiva y salto inicial ---------- */
  const pileBase = (typeof showPile === 'function') ? showPile : null;
  if (pileBase) {
    showPile = function (title, names, owner) {
      const r = pileBase.apply(this, arguments);
      try {
        if (owner !== 'you' || typeof document === 'undefined' || !G.you) return r;
        const box = document.getElementById('jPileView');
        if (!box) return r;
        box.querySelectorAll('.bcard[data-nm]').forEach(el => {
          const nm = el.dataset.nm;
          const idx = (names || []).findIndex(n => low(n) === low(nm));
          const card = cardOf2(nm);
          const info = card ? flashbackInfo(card) : null;
          if (!info || idx < 0 || el.querySelector('.rm-gy')) return;
          const b = makeBadge('rm-gy', '\u21ba', T('rm.gyCast') + ' \u00b7 ' + info.mana, () => {
            box.classList.remove('on');
            castFromGrave(G.you, nm, info.mode);
          });
          el.appendChild(b);
        });
      } catch (e) {}
      return r;
    };
  }

  /* la tierra que contempla entra girada si no hay Jace */
  const playBase2 = playFromHand;
  playFromHand = function (P, idx, asCommander) {
    const nm = !asCommander && P && idx >= 0 ? (P.hand || [])[idx] : null;
    const card = nm ? cardOf2(nm) : null;
    const r = playBase2.apply(this, arguments);
    try {
      if (r && card && card.land && /behold a jace/i.test(textOf(card)) && !hasJace(P)) {
        const l = P.bf[P.bf.length - 1];
        if (l && l.card && low(l.card.name) === low(card.name)) {
          l.tapped = true;
          log(T('rm.beholdTap', { c: nameOf(l) }), who(P));
          renderBoard();
        }
      }
    } catch (e) {}
    return r;
  };

  /* ============================================================
     interfaz: insignias en mano y campo
     ============================================================ */
  function moreAbilities(card) {
    const out = [];
    String(textOf(card) || '').split('\n').forEach(line => {
      const s = line.trim();
      if (!s || /^\[/.test(s)) return;
      const m = s.match(/^([^:]{1,90}):\s*(.+)$/);
      if (!m) return;
      const cost = m[1].trim(), eff = m[2].trim();
      const exhaust = /^exhaust/i.test(cost);
      if (!exhaust && !/^(adapt (?:\d+|X)|empower jace|proliferate|regenerate)/i.test(eff)) return;
      if (!/\{[^}]+\}/.test(cost) && !/pay \d+ life/i.test(cost)) return;
      const syms = cost.match(/\{[^}]+\}/g) || [];
      out.push({
        cost, eff, exhaust,
        mana: syms.filter(x => !/^\{[TQXS]\}$/i.test(x)).join(''),
        tap: /\{T\}/i.test(cost),
        life: +((cost.match(/pay (\d+) life/i) || [])[1] || 0)
      });
    });
    return out.slice(0, 4);
  }

  function canUseMore(P, perm, a) {
    if (a.exhaust && perm._exhausted) return false;
    if (a.tap && (perm.tapped || (isCrea(perm) && perm.summoning))) return false;
    if (a.life && P.life <= a.life) return false;
    if (a.mana && !canPay(P, COST0({ mana: a.mana }), 0)) return false;
    return true;
  }

  function useMore(P, perm, a) {
    if (!canUseMore(P, perm, a)) {
      if (P === G.you && typeof toast === 'function') toast(T('rm.needMana', { c: nameOf(perm) }));
      return false;
    }
    if (a.mana && !payMana(P, COST0({ mana: a.mana }), 0)) return false;
    if (a.tap) perm.tapped = true;
    if (a.life) P.life -= a.life;
    if (a.exhaust) perm._exhausted = true;
    log(T('rm.actUse', { c: nameOf(perm), a: a.cost }), who(P));
    try { applySpell(P, Object.assign({}, perm.card, { oracle: a.eff }), nameOf(perm), true); } catch (e) {}
    try { checkDeaths(); renderBoard(); } catch (e) {}
    return true;
  }

  function makeBadge(cls, text, title, onClick) {
    const b = document.createElement('button');
    b.className = cls; b.type = 'button'; b.textContent = text; b.title = title;
    b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); onClick(); };
    return b;
  }

  function paintPerms() {
    const zone = document.getElementById('jYouBf');
    if (!zone || !G.you) return;
    zone.querySelectorAll('.bcard[data-perm]').forEach(el => {
      const perm = (G.you.bf || []).find(x => x.id === +el.dataset.perm);
      if (!perm || !perm.card) return;

      const abs = moreAbilities(perm.card);
      const any = abs.some(a => canUseMore(G.you, perm, a));
      let b = el.querySelector('.rm-act');
      if (any && !b) {
        b = makeBadge('rm-act', '✦', T('rm.ability'), () => {
          picker(T('rm.ability') + ' · ' + nameOf(perm), T('rm.actUse', { c: nameOf(perm), a: abs.map(a => a.cost).join(' / ') }),
            abs.map(a => ({ label: `${a.cost} — ${a.eff}`, dis: !canUseMore(G.you, perm, a), tip: a.eff })),
            i => useMore(G.you, perm, abs[i]), null, (typeof cardImg === 'function' ? cardImg(perm.card) : ''));
        });
        el.appendChild(b);
      } else if (!any && b) b.remove();

      /* tripular: vehículo que puede convertirse en criatura */
      let cr = el.querySelector('.rm-crew');
      if (canCrew(G.you, perm)) {
        if (!cr) {
          cr = makeBadge('rm-crew', '\u2699', T('rm.crew', { n: crewN(perm.card) }), () => doCrew(G.you, perm));
          el.appendChild(cr);
        }
      } else if (cr) cr.remove();

      const face = (perm.card.faces || [])[1];
      let p = el.querySelector('.rm-prep');
      if (face && perm._prep) {
        if (!p) {
          p = makeBadge('rm-prep', '✧', T('rm.prepared', { c: face.name || '' }), () => castPreparedCopy(G.you, perm));
          el.appendChild(p);
        }
      } else if (p) p.remove();
    });
    /* disturbio pendiente del rival: heurística silenciosa */
    (G.ai.bf || []).forEach(x => {
      if (!x._riot) return;
      if (((x.pow || 0) + (x.a || 0)) >= 3) { x.a = (x.a || 0) + 1; x.b = (x.b || 0) + 1; }
      else x.summoning = false;
      x._riot = false;
    });
  }

  function resolveRiot() {
    if (!G.you || G.over) return;
    const pending = (G.you.bf || []).filter(x => x._riot);
    if (!pending.length) return;
    if (G.turn !== 'you' || G._riotBusy) {
      if (G.turn !== 'you') pending.forEach(x => { x.a = (x.a || 0) + 1; x.b = (x.b || 0) + 1; x._riot = false; });
      return;
    }
    const x = pending[0];
    G._riotBusy = true;
    picker(T('rm.riot'), T('rm.riotSub', { c: nameOf(x) }),
      [{ label: T('rm.riotCounter') }, { label: T('rm.riotHaste') }],
      i => {
        G._riotBusy = false;
        if (i === 0) { x.a = (x.a || 0) + 1; x.b = (x.b || 0) + 1; }
        else x.summoning = false;
        log(T('rm.riotDone', { c: nameOf(x), w: T(i === 0 ? 'rm.riotCounter' : 'rm.riotHaste') }), who(G.you));
        x._riot = false;
        try { renderBoard(); } catch (e) {}
      },
      () => {
        G._riotBusy = false;
        x.a = (x.a || 0) + 1; x.b = (x.b || 0) + 1;
        x._riot = false;
        try { renderBoard(); } catch (e) {}
      }, (typeof cardImg === 'function' ? cardImg(x.card) : ''));
  }

  /* El clic humano no pasa por `playFromHand`: el tablero llama a un `castFromHand`
     interno que se salta las capas. Reenganchamos el clic solo para las cartas que
     esta capa resuelve (partidas y estímulo); el resto sigue por su camino de siempre. */
  function handTapOwn(i) {
    const nm = (G.you.hand || [])[i];
    const card = nm ? cardOf2(nm) : null;
    if (!card) return false;
    if (isSplit(card)) { playFromHand(G.you, i, false); return true; }
    const km = low(textOf(card)).match(/(?:^|\n)\s*kicker ((?:\{[^}]+\})+)/i);
    if (km) {
      const behold = /as an additional cost to cast[^.]*behold a jace/i.test(low(textOf(card))) && !hasJace(G.you) ? manaCost('{1}') : null;
      const total = mergeCosts(mergeCosts(costOf(card), behold), manaCost(km[1]));
      if (canPay(G.you, total, 0)) { playFromHand(G.you, i, false); return true; }
    }
    return false;
  }

  function paintHand() {
    const box = document.getElementById('jYouHand');
    if (!box || !G.you) return;
    box.querySelectorAll('.hcard').forEach(el => {
      const nm = el.dataset.nm;
      const card = nm ? cardOf2(nm) : null;
      /* reenganche del clic (después de bindBoardEvents) */
      const cur = el.onclick;
      if (cur && cur !== el._rmWrapped) {
        el._rmWrapped = function (ev) {
          if (G.turn === 'you' && !G.over && G.phase !== 'combat' && handTapOwn(+el.dataset.hand)) return;
          return cur.call(el, ev);
        };
        el.onclick = el._rmWrapped;
      }
      const m = card ? textOf(card).match(/cycling ((?:\{[^}]+\})+)/i) : null;
      let b = el.querySelector('.rm-cyc');
      if (m && G.turn === 'you' && !G.over && G.phase !== 'combat') {
        if (!b) {
          const idx = +el.dataset.hand;
          b = makeBadge('rm-cyc', '↻', T('rm.cycleBtn', { cost: m[1] }), () => cycleCard(G.you, idx, nm));
          el.appendChild(b);
        }
      } else if (b) b.remove();
    });
  }

  function paintMore() {
    try {
      paintPerms();
      paintHand();
      resolveRiot();
    } catch (e) {}
  }

  const rbBase = (typeof renderBoard === 'function') ? renderBoard : null;
  if (rbBase) {
    renderBoard = function () {
      const r = rbBase.apply(this, arguments);
      paintMore();
      return r;
    };
  }

  /* la vida al empezar cada turno, para el espectáculo */
  if (typeof untapAll === 'function') {
    const untapBase = untapAll;
    untapAll = function (P) {
      const r = untapBase.apply(this, arguments);
      try { if (G.you && G.ai) G._lifeMark = { you: G.you.life, ai: G.ai.life }; } catch (e) {}
      try { uncrewAll(); } catch (e) {}
      try {
        [G.you, G.ai].forEach(Q => { if (Q) (Q.bf || []).forEach(x => { x._regen = false; }); });
      } catch (e) {}
      return r;
    };
  }

  /* ---------- API para el banco de pruebas ---------- */
  window.RULES_MORE = {
    version: VERSION,
    amass: doAmass, proliferate: doProliferate, adapt: doAdapt, empower: doEmpower,
    spectacleCost, spectacleOK, hasJace, cycleCard, castPreparedCopy, withConvoke,
    moreAbilities, canUseMore, useMore, resolveRiot, undergrowth, stripKicked, keepKicked,
    isSplit, splitFaces, castSplit, castFromGrave, flashbackInfo, cleanGyText,
    handleRegenerate, crewN, canCrew, doCrew, uncrewAll
  };
})();
