/* ===== Buscador completo de cartas para el constructor =====
   Capa compartida por los cuatro tableros. Se abre desde el botón «Buscador»
   junto al campo de búsqueda del editor y añade cartas con `addCardByName()`.

   Filtros: nombre, texto, tipo, tipos, colores (contiene/exacto/identidad),
   identidad de color, coste, fuerza/resistencia, rareza, set, legalidad,
   palabras clave, precio, orden y páginas. Usa la sintaxis de Scryfall. */
(function () {
  'use strict';
  if (window.__deckSearch) return;
  window.__deckSearch = true;

  var TX = {
    es: {
      open: '🔎 Buscador', title: 'Buscador de cartas', sub: 'Filtros de Scryfall con vista previa; pulsa una carta para añadirla al mazo.',
      name: 'Nombre', oracle: 'Texto de reglas', type: 'Tipo', types: 'Tipos', colors: 'Colores', colorMode: 'Modo de color',
      contains: 'Contiene', exact: 'Exactamente', identity: 'Identidad exacta', within: 'Dentro de la identidad',
      identityBox: 'Identidad', cmc: 'Coste (VMC)', min: 'mín', max: 'máx', power: 'Fuerza', tough: 'Resistencia',
      ability: 'Habilidad / función', synergy: 'Sinergia con', synergyPh: 'Nombre exacto de otra carta',
      synergyAnalyzing: 'Buscando sinergias…', synergyErr: 'No encuentro esa carta: ', synergyNote: 'Sinergia',
      rarity: 'Rareza', set: 'Set', setPh: 'Código o nombre (p. ej. fdn)', format: 'Legalidad', any: 'Cualquiera',
      keywords: 'Palabras clave', price: 'Precio máx. ($)', sort: 'Orden', unique: 'Impresiones', cards: 'Cartas únicas', prints: 'Todas las impresiones',
      'sort.edhrec': 'Popularidad (EDHREC)', 'sort.name': 'Nombre', 'sort.cmc': 'Coste', 'sort.released': 'Más recientes',
      'sort.rarity': 'Rareza', 'sort.usd': 'Precio', 'sort.power': 'Fuerza', 'sort.toughness': 'Resistencia',
      'kw.flying': 'Flying', 'kw.trample': 'Trample', 'kw.haste': 'Haste', 'kw.vigilance': 'Vigilance', 'kw.lifelink': 'Lifelink',
      'kw.deathtouch': 'Deathtouch', 'kw.firstStrike': 'First strike', 'kw.doubleStrike': 'Double strike', 'kw.menace': 'Menace',
      'kw.reach': 'Reach', 'kw.flash': 'Flash', 'kw.hexproof': 'Hexproof', 'kw.indestructible': 'Indestructible', 'kw.ward': 'Ward',
      'kw.protection': 'Protection', 'kw.explore': 'Explore', 'kw.surveil': 'Surveil', 'kw.scry': 'Scry', 'kw.convoke': 'Convoke',
      'kw.cascade': 'Cascade', 'kw.prowess': 'Prowess', 'kw.toxic': 'Toxic', 'kw.infect': 'Infect', 'kw.annihilator': 'Annihilator',
      'kw.cycling': 'Cycling', 'kw.kicker': 'Kicker', 'kw.flashback': 'Flashback', 'kw.ascend': 'Ascend', 'kw.partner': 'Partner',
      'kw.commander': 'Commander',
      'ty.creature': 'Criatura', 'ty.legendaryCreature': 'Criatura legendaria', 'ty.artifact': 'Artefacto',
      'ty.artifactCreature': 'Criatura artefacto', 'ty.enchantment': 'Encantamiento', 'ty.enchantmentCreature': 'Criatura encantamiento',
      'ty.planeswalker': 'Planeswalker', 'ty.legendaryPlaneswalker': 'Planeswalker legendario', 'ty.instant': 'Instantáneo',
      'ty.sorcery': 'Conjuro', 'ty.land': 'Tierra', 'ty.basicLand': 'Tierra básica', 'ty.battle': 'Batalla', 'ty.kindred': 'Kindred (tribal)',
      'co.W': 'Blanco', 'co.U': 'Azul', 'co.B': 'Negro', 'co.R': 'Rojo', 'co.G': 'Verde',
      'ra.common': 'Común', 'ra.uncommon': 'Infrecuente', 'ra.rare': 'Rara', 'ra.mythic': 'Mítica', 'ra.special': 'Especial',
      'ab.ramp': 'Rampa', 'ab.draw': 'Robar cartas', 'ab.removal': 'Remoción', 'ab.boardWipe': 'Barrido', 'ab.tutor': 'Tutor',
      'ab.recursion': 'Recursión', 'ab.protection': 'Protección', 'ab.evasion': 'Evasión', 'ab.lifegain': 'Ganar vida',
      'ab.discard': 'Descarte', 'ab.mill': 'Molino', 'ab.scry': 'Scry', 'ab.blink': 'Blink', 'ab.theft': 'Robo',
      'ab.counter': 'Contrarrestar', 'ab.sacrifice': 'Sacrificio', 'ab.countersMatter': 'Contadores', 'ab.landsMatter': 'Tierras',
      more: 'Más filtros', search: 'Buscar', clear: 'Limpiar', close: 'Cerrar', results: 'resultados', none: 'Sin resultados.', noneHint: 'Prueba a quitar algún filtro o a buscar un término más corto.',
      add: 'Añadir', prev: 'Anterior', next: 'Siguiente', onlyImg: 'Solo con imagen', deckLegal: 'Legal en este formato',
      empty: 'Elige filtros y pulsa Buscar.', loading: 'Buscando…', err: 'No se pudo buscar: ', inDeck: 'en el mazo'
    },
    en: {
      open: '🔎 Search', title: 'Card search', sub: 'Scryfall filters with preview; click a card to add it to the deck.',
      name: 'Name', oracle: 'Rules text', type: 'Type', types: 'Types', colors: 'Colors', colorMode: 'Color mode',
      contains: 'Contains', exact: 'Exactly', identity: 'Exact identity', within: 'Within identity',
      identityBox: 'Identity', cmc: 'Mana value', min: 'min', max: 'max', power: 'Power', tough: 'Toughness',
      ability: 'Ability / role', synergy: 'Synergy with', synergyPh: 'Exact name of another card',
      synergyAnalyzing: 'Finding synergies…', synergyErr: 'Card not found: ', synergyNote: 'Synergy',
      rarity: 'Rarity', set: 'Set', setPh: 'Code or name (e.g. fdn)', format: 'Legality', any: 'Any',
      keywords: 'Keywords', price: 'Max price ($)', sort: 'Sort', unique: 'Prints', cards: 'Unique cards', prints: 'All prints',
      'sort.edhrec': 'Popularity (EDHREC)', 'sort.name': 'Name', 'sort.cmc': 'Mana value', 'sort.released': 'Newest',
      'sort.rarity': 'Rarity', 'sort.usd': 'Price', 'sort.power': 'Power', 'sort.toughness': 'Toughness',
      'kw.flying': 'Flying', 'kw.trample': 'Trample', 'kw.haste': 'Haste', 'kw.vigilance': 'Vigilance', 'kw.lifelink': 'Lifelink',
      'kw.deathtouch': 'Deathtouch', 'kw.firstStrike': 'First strike', 'kw.doubleStrike': 'Double strike', 'kw.menace': 'Menace',
      'kw.reach': 'Reach', 'kw.flash': 'Flash', 'kw.hexproof': 'Hexproof', 'kw.indestructible': 'Indestructible', 'kw.ward': 'Ward',
      'kw.protection': 'Protection', 'kw.explore': 'Explore', 'kw.surveil': 'Surveil', 'kw.scry': 'Scry', 'kw.convoke': 'Convoke',
      'kw.cascade': 'Cascade', 'kw.prowess': 'Prowess', 'kw.toxic': 'Toxic', 'kw.infect': 'Infect', 'kw.annihilator': 'Annihilator',
      'kw.cycling': 'Cycling', 'kw.kicker': 'Kicker', 'kw.flashback': 'Flashback', 'kw.ascend': 'Ascend', 'kw.partner': 'Partner',
      'kw.commander': 'Commander',
      'ty.creature': 'Creature', 'ty.legendaryCreature': 'Legendary creature', 'ty.artifact': 'Artifact',
      'ty.artifactCreature': 'Artifact creature', 'ty.enchantment': 'Enchantment', 'ty.enchantmentCreature': 'Enchantment creature',
      'ty.planeswalker': 'Planeswalker', 'ty.legendaryPlaneswalker': 'Legendary planeswalker', 'ty.instant': 'Instant',
      'ty.sorcery': 'Sorcery', 'ty.land': 'Land', 'ty.basicLand': 'Basic land', 'ty.battle': 'Battle', 'ty.kindred': 'Kindred (tribal)',
      'co.W': 'White', 'co.U': 'Blue', 'co.B': 'Black', 'co.R': 'Red', 'co.G': 'Green',
      'ra.common': 'Common', 'ra.uncommon': 'Uncommon', 'ra.rare': 'Rare', 'ra.mythic': 'Mythic', 'ra.special': 'Special',
      'ab.ramp': 'Ramp', 'ab.draw': 'Card draw', 'ab.removal': 'Removal', 'ab.boardWipe': 'Board wipe', 'ab.tutor': 'Tutor',
      'ab.recursion': 'Recursion', 'ab.protection': 'Protection', 'ab.evasion': 'Evasion', 'ab.lifegain': 'Lifegain',
      'ab.discard': 'Discard', 'ab.mill': 'Mill', 'ab.scry': 'Scry', 'ab.blink': 'Blink', 'ab.theft': 'Theft',
      'ab.counter': 'Counterspell', 'ab.sacrifice': 'Sacrifice', 'ab.countersMatter': 'Counters', 'ab.landsMatter': 'Lands',
      more: 'More filters', search: 'Search', clear: 'Clear', close: 'Close', results: 'results', none: 'No results.', noneHint: 'Try removing a filter or using a shorter term.',
      add: 'Add', prev: 'Previous', next: 'Next', onlyImg: 'With image only', deckLegal: 'Legal in this format',
      empty: 'Pick filters and press Search.', loading: 'Searching…', err: 'Search failed: ', inDeck: 'in deck'
    },
    fr: {
      open: '🔎 Recherche', title: 'Recherche de cartes', sub: 'Filtres Scryfall avec aperçu ; cliquez une carte pour l’ajouter au deck.',
      name: 'Nom', oracle: 'Texte de règles', type: 'Type', types: 'Types', colors: 'Couleurs', colorMode: 'Mode de couleur',
      contains: 'Contient', exact: 'Exactement', identity: 'Identité exacte', within: 'Dans l’identité',
      identityBox: 'Identité', cmc: 'Valeur de mana', min: 'min', max: 'max', power: 'Force', tough: 'Endurance',
      ability: 'Capacité / rôle', synergy: 'Synergie avec', synergyPh: 'Nom exact d’une autre carte',
      synergyAnalyzing: 'Recherche des synergies…', synergyErr: 'Carte introuvable : ', synergyNote: 'Synergie',
      rarity: 'Rareté', set: 'Extension', setPh: 'Code ou nom (ex. fdn)', format: 'Légalité', any: 'Peu importe',
      keywords: 'Mots-clés', price: 'Prix max ($)', sort: 'Tri', unique: 'Éditions', cards: 'Cartes uniques', prints: 'Toutes les éditions',
      'sort.edhrec': 'Popularité (EDHREC)', 'sort.name': 'Nom', 'sort.cmc': 'Valeur de mana', 'sort.released': 'Plus récentes',
      'sort.rarity': 'Rareté', 'sort.usd': 'Prix', 'sort.power': 'Force', 'sort.toughness': 'Endurance',
      'kw.flying': 'Vol', 'kw.trample': 'Piétinement', 'kw.haste': 'Célérité', 'kw.vigilance': 'Vigilance', 'kw.lifelink': 'Lien de vie',
      'kw.deathtouch': 'Contact mortel', 'kw.firstStrike': 'Initiative', 'kw.doubleStrike': 'Double initiative', 'kw.menace': 'Menace',
      'kw.reach': 'Portée', 'kw.flash': 'Flash', 'kw.hexproof': 'Défense talismanique', 'kw.indestructible': 'Indestructible', 'kw.ward': 'Parade',
      'kw.protection': 'Protection', 'kw.explore': 'Explorer', 'kw.surveil': 'Surveiller', 'kw.scry': 'Regard', 'kw.convoke': 'Convocation',
      'kw.cascade': 'Cascade', 'kw.prowess': 'Prouesse', 'kw.toxic': 'Toxique', 'kw.infect': 'Infection', 'kw.annihilator': 'Annihilateur',
      'kw.cycling': 'Recyclage', 'kw.kicker': 'Kick', 'kw.flashback': 'Flashback', 'kw.ascend': 'Ascension', 'kw.partner': 'Partenariat',
      'kw.commander': 'Commandant',
      'ty.creature': 'Créature', 'ty.legendaryCreature': 'Créature légendaire', 'ty.artifact': 'Artefact',
      'ty.artifactCreature': 'Créature-artefact', 'ty.enchantment': 'Enchantement', 'ty.enchantmentCreature': 'Créature-enchantement',
      'ty.planeswalker': 'Planeswalker', 'ty.legendaryPlaneswalker': 'Planeswalker légendaire', 'ty.instant': 'Éphémère',
      'ty.sorcery': 'Rituel', 'ty.land': 'Terrain', 'ty.basicLand': 'Terrain de base', 'ty.battle': 'Bataille', 'ty.kindred': 'Clan',
      'co.W': 'Blanc', 'co.U': 'Bleu', 'co.B': 'Noir', 'co.R': 'Rouge', 'co.G': 'Vert',
      'ra.common': 'Commune', 'ra.uncommon': 'Peu commune', 'ra.rare': 'Rare', 'ra.mythic': 'Mythique', 'ra.special': 'Spéciale',
      'ab.ramp': 'Accélération', 'ab.draw': 'Pioche', 'ab.removal': 'Retrait', 'ab.boardWipe': 'Destruction de masse', 'ab.tutor': 'Tutorat',
      'ab.recursion': 'Récursion', 'ab.protection': 'Protection', 'ab.evasion': 'Évasion', 'ab.lifegain': 'Gain de vie',
      'ab.discard': 'Défausse', 'ab.mill': 'Meule', 'ab.scry': 'Regard', 'ab.blink': 'Clignotement', 'ab.theft': 'Vol',
      'ab.counter': 'Contresort', 'ab.sacrifice': 'Sacrifice', 'ab.countersMatter': 'Marqueurs', 'ab.landsMatter': 'Terrains',
      more: 'Plus de filtres', search: 'Chercher', clear: 'Effacer', close: 'Fermer', results: 'résultats', none: 'Aucun résultat.', noneHint: 'Essayez de retirer un filtre ou d’utiliser un terme plus court.',
      add: 'Ajouter', prev: 'Précédent', next: 'Suivant', onlyImg: 'Avec image', deckLegal: 'Légal dans ce format',
      empty: 'Choisissez des filtres et Chercher.', loading: 'Recherche…', err: 'Échec de la recherche : ', inDeck: 'dans le deck'
    }
  };
  function lang() {
    var l = '';
    try { l = (localStorage.getItem('cj2_lang') || '').slice(0, 2); } catch (e) {}
    if (!l) l = String(document.documentElement.lang || 'es').slice(0, 2);
    return TX[l] ? l : 'es';
  }
  function tx(k) { return TX[lang()][k]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function q(s) { return '"' + String(s || '').replace(/"/g, '') + '"'; }

  var COLORS = [['W', 'co.W'], ['U', 'co.U'], ['B', 'co.B'], ['R', 'co.R'], ['G', 'co.G']];
  var RARITIES = [['common', 'ra.common'], ['uncommon', 'ra.uncommon'], ['rare', 'ra.rare'], ['mythic', 'ra.mythic'], ['special', 'ra.special']];
  var TYPES = [['creature', 'ty.creature'], ['legendary creature', 'ty.legendaryCreature'], ['artifact', 'ty.artifact'], ['artifact creature', 'ty.artifactCreature'], ['enchantment', 'ty.enchantment'], ['enchantment creature', 'ty.enchantmentCreature'], ['planeswalker', 'ty.planeswalker'], ['legendary planeswalker', 'ty.legendaryPlaneswalker'], ['instant', 'ty.instant'], ['sorcery', 'ty.sorcery'], ['land', 'ty.land'], ['basic land', 'ty.basicLand'], ['battle', 'ty.battle'], ['kindred', 'ty.kindred']];

  function typeTerm(t) {
    if (t === 'legendary creature') return '(t:legendary t:creature)';
    if (t === 'legendary planeswalker') return '(t:legendary t:planeswalker)';
    if (t === 'artifact creature') return '(t:artifact t:creature)';
    if (t === 'enchantment creature') return '(t:enchantment t:creature)';
    if (t === 'basic land') return '(t:basic t:land)';
    return 't:' + t;
  }
  var KEYWORDS = [['flying', 'kw.flying'], ['trample', 'kw.trample'], ['haste', 'kw.haste'], ['vigilance', 'kw.vigilance'], ['lifelink', 'kw.lifelink'], ['deathtouch', 'kw.deathtouch'], ['first strike', 'kw.firstStrike'], ['double strike', 'kw.doubleStrike'], ['menace', 'kw.menace'], ['reach', 'kw.reach'], ['flash', 'kw.flash'], ['hexproof', 'kw.hexproof'], ['indestructible', 'kw.indestructible'], ['ward', 'kw.ward'], ['protection', 'kw.protection'], ['explore', 'kw.explore'], ['surveil', 'kw.surveil'], ['scry', 'kw.scry'], ['convoke', 'kw.convoke'], ['cascade', 'kw.cascade'], ['prowess', 'kw.prowess'], ['toxic', 'kw.toxic'], ['infect', 'kw.infect'], ['annihilator', 'kw.annihilator'], ['cycling', 'kw.cycling'], ['kicker', 'kw.kicker'], ['flashback', 'kw.flashback'], ['ascend', 'kw.ascend'], ['partner', 'kw.partner'], ['commander', 'kw.commander']];
  var ABILITIES = [['ramp', 'ab.ramp'], ['draw', 'ab.draw'], ['removal', 'ab.removal'], ['board-wipe', 'ab.boardWipe'], ['tutor', 'ab.tutor'], ['recursion', 'ab.recursion'], ['protection', 'ab.protection'], ['evasion', 'ab.evasion'], ['lifegain', 'ab.lifegain'], ['discard', 'ab.discard'], ['mill', 'ab.mill'], ['scry', 'ab.scry'], ['blink', 'ab.blink'], ['theft', 'ab.theft'], ['counter', 'ab.counter'], ['sacrifice-outlet', 'ab.sacrifice'], ['counters-matter', 'ab.countersMatter'], ['lands-matter', 'ab.landsMatter']];
  var FORMATS = [['commander', 'Commander'], ['brawl', 'Brawl'], ['standard', 'Standard'], ['pioneer', 'Pioneer'], ['modern', 'Modern'], ['legacy', 'Legacy'], ['vintage', 'Vintage'], ['pauper', 'Pauper']];
  var SORTS = [['edhrec', 'sort.edhrec'], ['name', 'sort.name'], ['cmc', 'sort.cmc'], ['released', 'sort.released'], ['rarity', 'sort.rarity'], ['usd', 'sort.usd'], ['power', 'sort.power'], ['toughness', 'sort.toughness']];

  var board = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '').toLowerCase();
  var modal = null, form = null, resultsEl = null, statusEl = null, pagerEl = null;
  var nextUrl = '', prevUrls = [], currentUrl = '';
  var setsLoaded = false;
  var synergyQ = '', synergyInfo = null, synergyCache = {}, synNoteEl = null, acTimer = 0;

  function apiGet(url) {
    if (typeof api === 'function') return api(url);
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  function chips(name, list, kind) {
    return list.map(function (p) {
      return '<label class="ds-chip"><input type="checkbox" name="' + name + '" value="' + p[0] + '"><span>' + (kind === 'color' ? '<i class="ds-pip p' + p[0] + '"></i>' : '') + '<span data-ds-i18n="' + p[1] + '">' + esc(tx(p[1])) + '</span></span></label>';
    }).join('');
  }

  function refreshLabels() {
    var launch = document.getElementById('dsOpen');
    if (launch) { launch.textContent = tx('open'); launch.title = tx('title'); }
    if (!modal) return;
    modal.querySelectorAll('[data-ds-i18n]').forEach(function (el) { el.textContent = tx(el.getAttribute('data-ds-i18n')); });
    modal.querySelectorAll('[data-ds-i18n-ph]').forEach(function (el) { el.placeholder = tx(el.getAttribute('data-ds-i18n-ph')); });
    var box = modal.querySelector('.ds-box');
    if (box) box.setAttribute('aria-label', tx('title'));
    var x = modal.querySelector('.ds-close');
    if (x) x.title = tx('close');
    updateCount();
  }
  try {
    new MutationObserver(refreshLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) {}

  function buildModal() {
    modal = document.createElement('div');
    modal.id = 'dsModal';
    modal.className = 'ds-modal';
    modal.innerHTML =
      '<div class="ds-box" role="dialog" aria-modal="true" aria-label="' + esc(tx('title')) + '">' +
      '<header class="ds-head"><div><h2 data-ds-i18n="title">' + esc(tx('title')) + '</h2><p data-ds-i18n="sub">' + esc(tx('sub')) + '</p></div><button type="button" class="ds-close" title="' + esc(tx('close')) + '">×</button></header>' +
      '<div class="ds-body"><form class="ds-form" autocomplete="off">' +
      '<div class="ds-grid">' +
      '<label class="ds-f ds-wide"><span data-ds-i18n="name">' + esc(tx('name')) + '</span><input name="name" placeholder="Atraxa, Praetors\' Voice"></label>' +
      '<label class="ds-f ds-wide"><span data-ds-i18n="oracle">' + esc(tx('oracle')) + '</span><input name="oracle" placeholder="draw a card"></label>' +
      '<label class="ds-f ds-wide"><span data-ds-i18n="synergy">' + esc(tx('synergy')) + '</span> <input name="synergy" list="dsNames" placeholder="' + esc(tx('synergyPh')) + '" data-ds-i18n-ph="synergyPh"><datalist id="dsNames"></datalist></label>' +
      '<p class="ds-synnote ds-wide" hidden></p>' +
      '<label class="ds-f"><span data-ds-i18n="type">' + esc(tx('type')) + '</span><input name="type" placeholder="legendary creature"></label>' +
      '<label class="ds-f"><span data-ds-i18n="cmc">' + esc(tx('cmc')) + '</span> <span class="ds-dbl"><input type="number" name="cmcMin" min="0" max="20" placeholder="' + esc(tx('min')) + '" data-ds-i18n-ph="min"><input type="number" name="cmcMax" min="0" max="20" placeholder="' + esc(tx('max')) + '" data-ds-i18n-ph="max"></span></label>' +
      '<label class="ds-f"><span data-ds-i18n="format">' + esc(tx('format')) + '</span><select name="format"><option value="" data-ds-i18n="any">' + esc(tx('any')) + '</option>' + FORMATS.map(function (f) { return '<option value="' + f[0] + '"' + (f[0] === board || (board === 'captain' && f[0] === 'commander') ? ' selected' : '') + '>' + f[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="ds-f"><span data-ds-i18n="sort">' + esc(tx('sort')) + '</span><select name="order">' + SORTS.map(function (s) { return '<option value="' + s[0] + '" data-ds-i18n="' + s[1] + '">' + esc(tx(s[1])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="ds-f"><span data-ds-i18n="unique">' + esc(tx('unique')) + '</span><select name="unique"><option value="cards" data-ds-i18n="cards">' + esc(tx('cards')) + '</option><option value="prints" data-ds-i18n="prints">' + esc(tx('prints')) + '</option></select></label>' +
      '</div>' +
      '<fieldset class="ds-set"><legend><span data-ds-i18n="colors">' + esc(tx('colors')) + '</span> · <span data-ds-i18n="colorMode">' + esc(tx('colorMode')) + '</span></legend><div class="ds-chips">' + chips('color', COLORS, 'color') + '</div>' +
      '<select name="colorMode" class="ds-mode"><option value="c" data-ds-i18n="contains">' + esc(tx('contains')) + '</option><option value="exact" data-ds-i18n="exact">' + esc(tx('exact')) + '</option><option value="id" data-ds-i18n="identity">' + esc(tx('identity')) + '</option><option value="id<=" data-ds-i18n="within">' + esc(tx('within')) + '</option></select></fieldset>' +
      '<fieldset class="ds-set"><legend data-ds-i18n="identityBox">' + esc(tx('identityBox')) + '</legend><div class="ds-chips">' + chips('identity', COLORS, 'color') + '</div></fieldset>' +
      '<fieldset class="ds-set"><legend data-ds-i18n="types">' + esc(tx('types')) + '</legend><div class="ds-chips">' + chips('typeBox', TYPES) + '</div></fieldset>' +
      '<fieldset class="ds-set"><legend data-ds-i18n="ability">' + esc(tx('ability')) + '</legend><div class="ds-chips">' + chips('ability', ABILITIES) + '</div></fieldset>' +
      '<fieldset class="ds-set"><legend data-ds-i18n="rarity">' + esc(tx('rarity')) + '</legend><div class="ds-chips">' + chips('rarity', RARITIES) + '</div></fieldset>' +
      '<details class="ds-more"><summary><span data-ds-i18n="more">' + esc(tx('more')) + '</span></summary><div class="ds-grid">' +
      '<label class="ds-f"><span data-ds-i18n="power">' + esc(tx('power')) + '</span> <input type="number" name="powMin" placeholder="' + esc(tx('min')) + '" data-ds-i18n-ph="min"></label>' +
      '<label class="ds-f"><span data-ds-i18n="tough">' + esc(tx('tough')) + '</span> <input type="number" name="touMin" placeholder="' + esc(tx('min')) + '" data-ds-i18n-ph="min"></label>' +
      '<label class="ds-f"><span data-ds-i18n="price">' + esc(tx('price')) + '</span> <input type="number" name="priceMax" min="0" step="0.5" placeholder="€/$"></label>' +
      '<label class="ds-f"><span data-ds-i18n="set">' + esc(tx('set')) + '</span> <input name="set" list="dsSets" placeholder="' + esc(tx('setPh')) + '" data-ds-i18n-ph="setPh"><datalist id="dsSets"></datalist></label>' +
      '<label class="ds-f"><span data-ds-i18n="keywords">' + esc(tx('keywords')) + '</span> <select name="keyword" multiple size="5">' + KEYWORDS.map(function (k) { return '<option value="' + k[0] + '" data-ds-i18n="' + k[1] + '">' + esc(tx(k[1])) + '</option>'; }).join('') + '</select></label>' +
      '<label class="ds-check"><input type="checkbox" name="onlyImg" checked> <span data-ds-i18n="onlyImg">' + esc(tx('onlyImg')) + '</span></label>' +
      '<label class="ds-check"><input type="checkbox" name="deckLegal"> <span data-ds-i18n="deckLegal">' + esc(tx('deckLegal')) + '</span></label>' +
      '</div></details>' +
      '<div class="ds-actions"><button type="submit" class="btn ds-go"><span data-ds-i18n="search">' + esc(tx('search')) + '</span></button><button type="button" class="btn ds-alt ds-clear"><span data-ds-i18n="clear">' + esc(tx('clear')) + '</span></button><span class="ds-count"></span></div>' +
      '</form>' +
      '<div class="ds-results" aria-live="polite"></div>' +
      '<div class="ds-pager"><button type="button" class="btn sm ds-prev" disabled>← <span data-ds-i18n="prev">' + esc(tx('prev')) + '</span></button><button type="button" class="btn sm ds-next" disabled><span data-ds-i18n="next">' + esc(tx('next')) + '</span> →</button></div>' +
      '</div></div>';
    document.body.appendChild(modal);
    form = modal.querySelector('.ds-form');
    resultsEl = modal.querySelector('.ds-results');
    statusEl = modal.querySelector('.ds-count');
    pagerEl = modal.querySelector('.ds-pager');
    synNoteEl = modal.querySelector('.ds-synnote');
    modal.querySelector('.ds-close').addEventListener('click', close);
    modal.addEventListener('click', function (ev) { if (ev.target === modal) close(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && modal.classList.contains('on')) close(); });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); search(1); });
    var synInput = form.querySelector('[name=synergy]');
    if (synInput) synInput.addEventListener('input', function () {
      var val = String(synInput.value || '').trim();
      clearTimeout(acTimer);
      if (val.length < 3) return;
      acTimer = setTimeout(function () {
        apiGet('https://api.scryfall.com/cards/autocomplete?q=' + encodeURIComponent(val)).then(function (d) {
          var dl = modal.querySelector('#dsNames');
          if (!dl || String(synInput.value || '').trim() !== val) return;
          dl.innerHTML = (d.data || []).slice(0, 12).map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('');
        }).catch(function () {});
      }, 220);
    });
    modal.querySelector('.ds-clear').addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = (c.name === 'onlyImg'); });
      nextUrl = ''; prevUrls = []; synergyQ = ''; synergyInfo = null;
      if (synNoteEl) { synNoteEl.hidden = true; synNoteEl.textContent = ''; }
      resultsEl.innerHTML = emptyState(tx('empty'));
      statusEl.textContent = '';
      statusEl.dataset.total = '';
      setPager();
    });
    pagerEl.querySelector('.ds-prev').addEventListener('click', function () {
      if (!prevUrls.length) return;
      var u = prevUrls.pop();
      load(u);
    });
    pagerEl.querySelector('.ds-next').addEventListener('click', function () {
      if (!nextUrl) return;
      if (currentUrl) prevUrls.push(currentUrl);
      load(nextUrl);
    });
    resultsEl.addEventListener('click', function (ev) {
      var b = ev.target.closest('.ds-card');
      if (!b) return;
      var nm = b.dataset.name;
      if (!nm) return;
      b.classList.add('ds-adding');
      Promise.resolve(typeof addCardByName === 'function' ? addCardByName(nm) : null).then(function () {
        b.classList.remove('ds-adding');
        b.classList.add('ds-added');
        updateCount();
        setTimeout(function () { b.classList.remove('ds-added'); }, 1200);
      }, function () { b.classList.remove('ds-adding'); });
    });
  }

  function setPager() {
    pagerEl.querySelector('.ds-prev').disabled = !prevUrls.length;
    pagerEl.querySelector('.ds-next').disabled = !nextUrl;
  }

  /* Scryfall contesta 404 con textos de «sin coincidencias» («Your query didn’t
     match any cards», «No cards found») cuando la búsqueda no devuelve nada:
     es un resultado vacío, no un error. */
  function isNotFound(e) {
    return /match any cards|no cards found|not_found/i.test(String((e && e.message) || e || ''));
  }

  function emptyState(text, hint) {
    return '<p class="ds-empty"><b>' + esc(text) + '</b>' + (hint ? '<span>' + esc(hint) + '</span>' : '') + '</p>';
  }

  function updateCount() {
    if (!statusEl) return;
    var n = 0;
    try { n = (state && state.cur && state.cur.cards) ? state.cur.cards.length : 0; } catch (e) {}
    var total = statusEl.dataset.total;
    var base = total != null && total !== '' ? total + ' ' + tx('results') : '';
    statusEl.textContent = base ? base + (n ? ' · ' + n + ' ' + tx('inDeck') : '') : '';
  }

  function buildQuery() {
    var f = new FormData(form);
    var parts = [];
    var name = String(f.get('name') || '').trim();
    var oracle = String(f.get('oracle') || '').trim();
    var type = String(f.get('type') || '').trim();
    if (name) parts.push(q(name));
    if (oracle) parts.push('o:' + q(oracle));
    if (type) parts.push('t:' + q(type));
    var typeBox = f.getAll('typeBox');
    if (typeBox.length) parts.push('(' + typeBox.map(typeTerm).join(' or ') + ')');
    var cols = f.getAll('color');
    var mode = String(f.get('colorMode') || 'c');
    if (cols.length) {
      if (mode === 'exact') parts.push('color=' + (cols.indexOf('C') >= 0 && cols.length === 1 ? 'C' : cols.filter(function (c) { return c !== 'C'; }).join('')));
      else if (mode === 'id' || mode === 'id<=') parts.push('id' + (mode === 'id<=' ? '<=' : '=') + cols.filter(function (c) { return c !== 'C'; }).join(''));
      else cols.forEach(function (c) { parts.push('c:' + (c === 'C' ? 'c' : c)); });
    }
    var ids = f.getAll('identity');
    if (ids.length) parts.push('id<=' + ids.join(''));
    var cmcMin = f.get('cmcMin'), cmcMax = f.get('cmcMax');
    if (cmcMin !== '' && cmcMin != null) parts.push('cmc>=' + cmcMin);
    if (cmcMax !== '' && cmcMax != null) parts.push('cmc<=' + cmcMax);
    var pow = f.get('powMin'), tou = f.get('touMin');
    if (pow !== '' && pow != null) parts.push('pow>=' + pow);
    if (tou !== '' && tou != null) parts.push('tou>=' + tou);
    var rar = f.getAll('rarity');
    if (rar.length) parts.push('(' + rar.map(function (r) { return 'r:' + r; }).join(' or ') + ')');
    var set = String(f.get('set') || '').trim().toLowerCase();
    if (set) parts.push(set.indexOf(' ') >= 0 ? 's:' + q(set) : 's:' + set);
    var fmt = String(f.get('format') || '');
    if (fmt) parts.push('f:' + fmt);
    if (f.get('deckLegal')) parts.push('f:' + (board === 'captain' ? 'commander' : (board || 'commander')));
    var kws = f.getAll('keyword');
    if (kws.length) parts.push('(' + kws.map(function (k) { return 'kw:' + q(k); }).join(' or ') + ')');
    var abil = f.getAll('ability');
    if (abil.length) parts.push('(' + abil.map(function (a) { return 'otag:' + a; }).join(' or ') + ')');
    if (synergyQ) parts.push(synergyQ);
    var price = f.get('priceMax');
    if (price !== '' && price != null) parts.push('usd<=' + price);
    return parts.join(' ');
  }

  function load(url) {
    statusEl.textContent = tx('loading');
    resultsEl.classList.add('ds-loading');
    apiGet(url).then(function (d) {
      resultsEl.classList.remove('ds-loading');
      render(d);
      currentUrl = url;
      setPager();
    }).catch(function (e) {
      resultsEl.classList.remove('ds-loading');
      nextUrl = '';
      if (isNotFound(e)) {
        statusEl.dataset.total = '0';
        updateCount();
        resultsEl.innerHTML = emptyState(tx('none'), tx('noneHint'));
      } else {
        statusEl.textContent = '';
        statusEl.dataset.total = '';
        resultsEl.innerHTML = emptyState(tx('err') + (e.message || e));
      }
      setPager();
    });
  }

  function resolveSynergy(name) {
    var key = name.toLowerCase();
    if (synergyCache[key]) return Promise.resolve(synergyCache[key]);
    return apiGet('https://api.scryfall.com/cards/named?exact=' + encodeURIComponent(name)).then(function (c) {
      var terms = [], bits = [], subtypes = [], keywords = [];
      var typeLine = String(c.type_line || (c.card_faces && c.card_faces[0] && c.card_faces[0].type_line) || '');
      var subs = typeLine.split('—')[1] || '';
      var subList = subs.split(/[^A-Za-z\u00C0-\u017F']+/).filter(function (w) { return w.length > 2 && w.toLowerCase() !== 'and'; }).slice(0, 2);
      subList.forEach(function (s) { var l = s.toLowerCase(); subtypes.push(l); terms.push('t:' + l); terms.push('o:' + q(s)); });
      if (subList.length) bits.push(subList.join('/'));
      keywords = (c.keywords || []).slice(0, 3).map(function (k) { return String(k).toLowerCase(); });
      keywords.forEach(function (k) { terms.push('kw:' + q(k)); });
      if (keywords.length) bits.push(keywords.join('/'));
      var axes = bits.slice();
      var full = String(c.oracle_text || (c.card_faces && c.card_faces[0] && c.card_faces[0].oracle_text) || '').toLowerCase();
      var effectMatch = full.match(/(?:whenever|when|at the beginning of)[^,.]*[,.]\s*([\s\S]*)/i);
      var effect = (effectMatch ? effectMatch[1] : full).toLowerCase();
      var payoff = /(?:whenever|when)\s+(?:you|a|an|one or more|another)[^.]*(?:gain life|draw|discard|sacrifice|mill|scry|surveil|cast|dies|enters|attacks|counters?)/i.test(full);
      var enabler = /(?:you gain|draw a card|create .*token|put .*counter|proliferate|sacrifice|mill|scry|surveil|add \{|search your library)/i.test(effect);
      var dir = payoff && !enabler ? 'payoff' : (enabler && !payoff ? 'enabler' : (payoff && enabler ? 'both' : 'theme'));
      var themes = [];
      if (/gain life|lifelink/.test(full)) themes.push('life');
      if (/\+1\/\+1 counter|proliferate|counters? on/.test(full)) themes.push('counter');
      if (/token/.test(full)) themes.push('token');
      if (/sacrifice|dies/.test(full)) themes.push('sac');
      if (/draw a card/.test(full)) themes.push('draw');
      if (/discard/.test(full)) themes.push('discard');
      if (/mill/.test(full)) themes.push('mill');
      if (/scry|surveil/.test(full)) themes.push('top');
      if (/landfall|land enters|lands? you control/.test(full)) themes.push('land');
      var roleDefs = {
        life: {
          enabler: [['o:/you gain (\\d+|X) life/', 'vida generada', /\byou gain (?:\d+|x) life\b/i], ['o:"you gain life equal"', 'vida igual', /you gain life equal/i]],
          payoff: [['o:"whenever you gain life"', 'pago de vida', /whenever you gain life/i]]
        },
        counter: {
          enabler: [['o:"+1/+1 counter"', 'contadores', /\+1\/\+1 counter/i], ['o:proliferate', 'proliferar', /proliferate/i]],
          payoff: [['o:"whenever a +1/+1 counter"', 'pago de contadores', /whenever a \+1\/\+1 counter/i], ['o:"for each +1/+1 counter"', 'pago de contadores', /for each \+1\/\+1 counter/i], ['o:"+1/+1 counter"', 'contadores', /\+1\/\+1 counter/i]]
        },
        token: {
          enabler: [['o:"create a token"', 'fichas', /create .*token/i], ['o:"create two"', 'fichas', /create two/i]],
          payoff: [['o:"whenever a creature token"', 'pago de fichas', /creature token/i], ['o:"for each token"', 'pago de fichas', /for each token/i]]
        },
        sac: {
          enabler: [['o:sacrifice', 'sacrificio', /sacrifice/i]],
          payoff: [['o:"whenever you sacrifice"', 'pago de sacrificio', /whenever you sacrifice/i], ['o:"whenever a creature dies"', 'pago de muertes', /whenever a creature dies/i]]
        },
        draw: {
          enabler: [['o:"draw a card"', 'robar', /draw a card/i]],
          payoff: [['o:"whenever you draw"', 'pago de robo', /whenever you draw/i]]
        },
        discard: {
          enabler: [['o:discard', 'descarte', /discard/i]],
          payoff: [['o:"whenever you discard"', 'pago de descarte', /whenever you discard/i]]
        },
        mill: {
          enabler: [['o:mill', 'molino', /mill/i]],
          payoff: [['o:"whenever you mill"', 'pago de molino', /whenever you mill/i]]
        },
        top: {
          enabler: [['o:scry', 'scry', /scry/i], ['o:surveil', 'surveil', /surveil/i]],
          payoff: [['o:"whenever you scry"', 'pago de scry', /whenever you scry/i], ['o:"whenever you surveil"', 'pago de surveil', /whenever you surveil/i]]
        },
        land: {
          enabler: [['o:landfall', 'tierras', /landfall/i]],
          payoff: [['o:landfall', 'pago de tierras', /landfall|land enters/i]]
        }
      };
      var wanted = dir === 'payoff' ? 'enabler' : (dir === 'enabler' ? 'payoff' : null);
      var roleTerms = [], roleLabels = [], roleHints = [];
      themes.forEach(function (t) {
        var defs = roleDefs[t]; if (!defs) return;
        var arr = wanted ? (defs[wanted] || []) : (defs.enabler || []).concat(defs.payoff || []);
        arr.forEach(function (r) {
          if (roleTerms.length < 4 && roleTerms.indexOf(r[0]) < 0) {
            roleTerms.push(r[0]); roleLabels.push(r[1]); roleHints.push(r[2]);
          }
        });
      });
      roleTerms.forEach(function (t) { terms.push(t); });
      if (roleLabels.length) bits.push(roleLabels.slice(0, 2).join('/'));
      var uniq = terms.filter(function (t, i) { return terms.indexOf(t) === i; }).slice(0, 12);
      if (!uniq.length) uniq.push('o:' + q(typeLine.split(' ')[0]));
      var dirBit = dir === 'payoff' ? 'pago' : (dir === 'enabler' ? 'genera' : (dir === 'both' ? 'pago/genera' : 'tema'));
      var note = dirBit + (roleLabels.length ? ' → ' + roleLabels.slice(0, 2).join(' + ') : '');
      var info = { q: '(' + uniq.join(' or ') + ') -!' + q(c.name), label: axes.slice(0, 4).join(', '), note: note, subtypes: subtypes, keywords: keywords, roleHints: roleHints };
      synergyCache[key] = info;
      return info;
    });
  }

  function synergyScore(c) {
    if (!synergyInfo) return 0;
    var type = String(c.type_line || '').toLowerCase();
    var oracle = String(c.oracle_text || (c.card_faces && c.card_faces[0] && c.card_faces[0].oracle_text) || '').toLowerCase();
    var kws = (c.keywords || []).map(function (k) { return String(k).toLowerCase(); });
    var s = 0;
    if (synergyInfo.subtypes.some(function (x) { return type.indexOf(x) >= 0; })) s += 5;
    if (synergyInfo.keywords.some(function (x) { return kws.indexOf(x) >= 0; })) s += 4;
    if (synergyInfo.roleHints.some(function (re) { return re.test(oracle); })) s += 6;
    return s;
  }

  function search(page) {
    var synName = String(form.querySelector('[name=synergy]').value || '').trim();
    if (!synName) { synergyQ = ''; synergyInfo = null; if (synNoteEl) synNoteEl.hidden = true; return runSearch(page); }
    statusEl.textContent = tx('synergyAnalyzing');
    resultsEl.classList.add('ds-loading');
    resolveSynergy(synName).then(function (info) {
      synergyQ = info.q; synergyInfo = info;
      if (synNoteEl) { synNoteEl.hidden = false; synNoteEl.textContent = tx('synergyNote') + ' · ' + synName + (info.note ? ' (' + info.note + ')' : '') + (info.label ? ' · ' + info.label : ''); }
      runSearch(page);
    }).catch(function (e) {
      resultsEl.classList.remove('ds-loading'); statusEl.textContent = '';
      resultsEl.innerHTML = '<p class="ds-empty">' + esc(tx('synergyErr')) + esc(synName) + '</p>';
    });
  }

  function runSearch(page) {
    var query = buildQuery() || '-is:digital';
    var order = form.querySelector('[name=order]').value || 'edhrec';
    var unique = form.querySelector('[name=unique]').value || 'cards';
    var dir = (order === 'released' || order === 'usd' || order === 'rarity') ? 'desc' : 'auto';
    var url = 'https://api.scryfall.com/cards/search?q=' + encodeURIComponent(query) +
      '&unique=' + encodeURIComponent(unique) + '&order=' + encodeURIComponent(order) + '&dir=' + dir + '&page=' + (page || 1);
    nextUrl = ''; prevUrls = [];
    load(url);
  }

  function render(d) {
    var cards = (d && d.data) || [];
    nextUrl = d && d.has_more ? d.next_page : '';
    var onlyImg = form.querySelector('[name=onlyImg]').checked;
    if (onlyImg) cards = cards.filter(function (c) { return c.image_uris || (c.card_faces && c.card_faces[0].image_uris); });
    if (synergyInfo) cards = cards.slice().sort(function (a, b) { return synergyScore(b) - synergyScore(a); });
    statusEl.dataset.total = d && d.total_cards != null ? d.total_cards : cards.length;
    updateCount();
    resultsEl.innerHTML = cards.length ? cards.map(function (c) {
      var im = c.image_uris || (c.card_faces && c.card_faces[0].image_uris) || {};
      var src = im.normal || im.large || im.small || '';
      var mana = c.mana_cost || (c.card_faces && c.card_faces[0].mana_cost) || '';
      var pt = (c.power != null && c.toughness != null) ? (c.power + '/' + c.toughness) : '';
      return '<button type="button" class="ds-card" data-name="' + esc(c.name) + '" title="' + esc(c.name) + '">' +
        (src ? '<img loading="lazy" src="' + esc(src) + '" alt="">' : '<span class="ds-noimg">' + esc(c.name) + '</span>') +
        '<span class="ds-cmeta"><b>' + esc(c.name) + '</b><span>' + esc(c.type_line || '') + '</span>' +
        '<em>' + esc(mana) + (pt ? ' · ' + esc(pt) : '') + ' · ' + esc(String(c.set || '').toUpperCase()) + '</em></span>' +
        '<span class="ds-add">+</span></button>';
    }).join('') : emptyState(tx('none'), tx('noneHint'));
    setPager();
    resultsEl.scrollTop = 0;
  }

  function loadSets() {
    if (setsLoaded) return;
    setsLoaded = true;
    apiGet('https://api.scryfall.com/sets').then(function (d) {
      var dl = modal && modal.querySelector('#dsSets');
      if (!dl) return;
      dl.innerHTML = (d.data || []).slice(0, 900).map(function (s) {
        return '<option value="' + esc(s.code) + '">' + esc(s.name) + ' (' + esc(String(s.code).toUpperCase()) + ')</option>';
      }).join('');
    }).catch(function () { setsLoaded = false; });
  }

  function open() {
    if (!modal) buildModal();
    modal.classList.add('on');
    document.documentElement.classList.add('ds-open');
    refreshLabels();
    loadSets();
    setTimeout(function () { var i = modal.querySelector('[name=name]'); if (i) i.focus(); }, 40);
  }
  function close() {
    if (!modal) return;
    modal.classList.remove('on');
    document.documentElement.classList.remove('ds-open');
  }

  function addLauncher() {
    var ed = document.getElementById('edSearch');
    if (!ed || document.getElementById('dsOpen')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'dsOpen';
    b.className = 'btn ds-launch';
    b.textContent = tx('open');
    b.title = tx('title');
    b.addEventListener('click', open);
    var row = ed.parentNode;
    if (row) row.appendChild(b);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLauncher);
  else addLauncher();
  window.__deckSearchOpen = open;
})();
