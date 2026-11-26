/* ============================================================
   zoom-any · la vista grande (#cardZoom) para TODA carta

   Problema: el zoom del tablero se dispara con `[data-nm]`, y solo lo ponían las
   cartas del tablero y de las pilas. Las ventanas de listado (búsquedas de la capa
   lib-gy, mano del mulligan, listas del constructor, previsualizaciones…) pintan
   `<img>` de cartas sin ese atributo, así que pasar el ratón por ellas no hacía nada.

   Solución: un índice `src -> nombre` construido a partir de `CARD` (y de las básicas),
   y un oyente en captura que, antes de que hable el oyente del tablero, identifica la
   imagen, le pone `data-nm` y abre el zoom. A partir de ahí la propia imagen ya lleva
   el atributo y la gestiona el código de siempre: no se duplica lógica.
   ============================================================ */
(() => {
  if (window.__zoomAny) return;
  if (typeof CARD === 'undefined' && typeof cardOf !== 'function') return;
  window.__zoomAny = true;

  const key = s => String(s || '').split('?')[0].split('#')[0];
  const srcOf = img => key(img.getAttribute('src') || img.getAttribute('data-src') || img.currentSrc);
  let idx = null, built = -1;

  function build() {
    idx = new Map();
    const add = (u, name) => { const k = key(u); if (k && name && !idx.has(k)) idx.set(k, name); };
    try {
      const C = (typeof CARD !== 'undefined' && CARD) || {};
      Object.keys(C).forEach(k => {
        const c = C[k]; if (!c) return;
        add(c.img, c.name || k);
        add(c.sm, c.name || k);
        add(c.imgBack, c.name || k);
        add(c.back, c.name || k);
        (c.faces || []).forEach(f => { if (f) { add(f.img, c.name || k); add(f.sm, c.name || k); } });
      });
      built = Object.keys(C).length;
    } catch (e) { }
    try {
      if (typeof BASIC_NAMES !== 'undefined' && typeof basicCard === 'function') {
        BASIC_NAMES.forEach(nm => { const c = basicCard(nm); if (c) { add(c.img, nm); add(c.sm, nm); } });
      }
    } catch (e) { }
  }

  function nameFor(src) {
    const k = key(src); if (!k) return '';
    const n = (typeof CARD !== 'undefined' && CARD) ? Object.keys(CARD).length : 0;
    if (!idx || n !== built) build();
    let v = idx.get(k);
    if (!v) { build(); v = idx.get(k); }
    return v || '';
  }

  /* Cualquier `[data-nm]` que aparezca lo atiende el oyente del tablero; aquí solo las
     imágenes que no lo llevan. En captura, para llegar antes. */
  document.addEventListener('mouseover', e => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || img.id === 'cardZoom') return;
    if (img.dataset && img.dataset.nm) return;
    const nm = nameFor(srcOf(img));
    if (!nm) return;
    img.dataset.nm = nm;
    if (typeof showZoom === 'function') showZoom(img);
  }, true);

  window.__zoomAny = { nameFor: nameFor, build: build, size: () => (idx ? idx.size : 0) };
})();
