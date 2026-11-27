/* ===== Caché de red compartida (los cuatro tableros) =====
   Envuelve `api()` —el único punto por el que los tableros piden datos a Scryfall— con:
     · caché en memoria para TODAS las respuestas de la sesión (una búsqueda de set entero
       pesa ~1 MB: guardarla en disco no cabe y no compensa),
     · caché en localStorage (30 días) solo para respuestas pequeñas, que son la mayoría de
       las consultas repetidas: básicas, tierras, fichas, nombres sueltos, impresiones,
     · deduplicación de peticiones iguales en vuelo.
   Las imágenes (cards.scryfall.io) no pasan por aquí: esas ya las cachea el navegador.
   Si algo falla, se sigue llamando a la red como siempre: la capa nunca rompe el juego. */
(function(){
  'use strict';
  if (window.__netCache || typeof api !== 'function') return;
  window.__netCache = true;

  var KEY = 'cj2_netcache_v2';
  var TTL = 30 * 24 * 3600 * 1000;      /* los datos de carta cambian poco */
  var SMALL = 120000;                   /* solo se persiste lo que pese menos que esto */
  var DISK_MAX = 1200000;               /* tope del JSON en localStorage */
  var MEM_MAX = 400;                    /* entradas en memoria por sesión */

  var orig = api;
  var inflight = {};
  var mem = read();
  var saves = 0;
  try { localStorage.removeItem('cj2_netcache_v1'); } catch(e){}   /* formato viejo, libera cuota */
  var hits = 0, misses = 0;

  function read(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return {};
      Object.keys(o).forEach(function(k){ if (o[k] && o[k].v) o[k].s = o[k].s || 0; });
      return o;
    } catch(e){ return {}; }
  }

  var saveT = null;
  function persist(){
    clearTimeout(saveT);
    saveT = setTimeout(function(){
      try {
        var out = {};
        var keys = Object.keys(mem);
        var total = 0;
        /* solo lo pequeño y reciente; lo grande se queda en memoria y ya está */
        keys.sort(function(a, b){ return (mem[b].t || 0) - (mem[a].t || 0); });
        for (var i = 0; i < keys.length; i++) {
          var rec = mem[keys[i]];
          if (!rec || !rec.s || rec.s > SMALL) continue;
          if (total + rec.s > DISK_MAX) continue;
          out[keys[i]] = { t: rec.t, s: rec.s, v: rec.v };
          total += rec.s;
        }
        localStorage.setItem(KEY, JSON.stringify(out));
        saves++;
      } catch(e){
        /* cuota llena o modo privado: se juega sin caché en disco */
        try { localStorage.removeItem(KEY); } catch(_){}
      }
    }, 400);
  }

  function trimMem(){
    var keys = Object.keys(mem);
    if (keys.length <= MEM_MAX) return;
    keys.sort(function(a, b){ return (mem[a].t || 0) - (mem[b].t || 0); });
    keys.slice(0, keys.length - MEM_MAX).forEach(function(k){ delete mem[k]; });
  }

  function isCacheable(url, opts){
    if ((opts && opts.method && String(opts.method).toUpperCase() !== 'GET')) return false;
    return String(url || '').indexOf('api.scryfall.com/cards/') >= 0;
  }

  api = function(url, opts){
    if (!isCacheable(url, opts)) return orig.apply(this, arguments);
    var key = String(url);
    var now = Date.now();
    var hit = mem[key];
    if (hit && hit.t && now - hit.t < TTL) {
      hit.t = now;                       /* se refresca el uso, no el dato */
      hits++;
      return Promise.resolve(hit.v);
    }
    if (inflight[key]) return inflight[key];
    misses++;
    var p = orig.apply(this, arguments).then(function(v){
      var size = 0;
      try { size = JSON.stringify(v).length; } catch(e){}
      mem[key] = { t: Date.now(), s: size, v: v };
      delete inflight[key];
      trimMem();
      if (size && size <= SMALL) persist();
      return v;
    }, function(e){
      delete inflight[key];
      throw e;
    });
    inflight[key] = p;
    return p;
  };

  /* utilidades para las pruebas de consola */
  window.__netCacheInfo = function(){
    var keys = Object.keys(mem);
    var disk = 0;
    try { disk = (localStorage.getItem(KEY) || '').length; } catch(e){}
    return { entradas: keys.length, aciertos: hits, fallos: misses, disco: disk, guardados: saves, enVuelo: Object.keys(inflight).length };
  };
  window.__netCacheClear = function(){
    mem = {}; hits = 0; misses = 0;
    try { localStorage.removeItem(KEY); } catch(e){}
    return true;
  };
})();
