# Instrucciones del proyecto · Magic TCG

Juego de cartas en HTML plano, sin build ni dependencias. Se abre con doble clic o con un
servidor estático (`python -m http.server 8124 --bind 127.0.0.1`).

## Regla principal: los tres tableros van al día a la vez

Hay **tres** webs jugables y todas están vivas:

| Archivo | Formato |
|---|---|
| `commander.html` | Commander · 100 cartas, 40 vidas |
| `brawl.html` | Brawl · 60 cartas, 30 vidas |
| `captain.html` | Captain Jumpstart · dos sobres de 20, 40 singleton, 20 vidas |
| `standard.html` | Standard · 60 cartas, 20 vidas, sin comandante |

**Toda mejora de jugabilidad, interfaz, accesibilidad o arreglo de bug se aplica a las tres
en la misma tanda.** No se da una tarea por terminada con el cambio en un solo archivo:
si algo se aplica solo a una, se dice explícitamente por qué (p. ej. una regla que solo
existe en Commander) y se deja anotado abajo.

`commander.html` y `brawl.html` son hermanos casi idénticos (mismo tablero `#jTable`,
mismo motor, mismas capas `arena-*`): un parche escrito para uno suele entrar literal en el
otro. `captain.html` es **otra generación** del tablero (sin `#jTable`, sin `#jrail`, sin
`arena-v15-final`, sin `playmat`), así que sus parches hay que escribirlos aparte contra su
propio DOM, aunque el comportamiento deba ser el mismo.

## Cómo trabajar

- **Nada de commits, push ni despliegues** salvo petición explícita.
- `commander-v1.html` … `commander-v4.html` están **congeladas**: no se tocan. Son archivos
  de comparación, no destino de trabajo.
- `taller.html` es la app antigua «Taller de mazos» (constructor/generador), conservada tal cual.
  `index.html` es la portada que enlaza a los cuatro formatos y a `taller.html`.
- La portada está pensada **sin scroll a 1920×1080**: `.wrap` es una columna flex de `100svh`,
  `.grid` crece (`flex:1`) y las cuatro tarjetas van en una sola fila desde 1240 px
  (`grid-template-columns:repeat(4,1fr)`), con la imagen de cada tarjeta estirándose hasta
  305 px de alto y el botón pegado abajo. Hay dos tramos compactos: `max-height:920px`
  (encabezado y textos más juntos) y `max-height:830px` (h1 mínimo y `.lede` oculta) para que
  también quepa a 1536×864 y 1280×720. Si se añade una quinta tarjeta o más texto, hay que
  volver a medir `document.documentElement.scrollHeight <= innerHeight` en esos tres tamaños.
- `PLAN.md` documenta el trabajo del tablero Arena (v1…v4) y sus verificaciones.
- Editar con **scripts en `tmp/`** cuando el cambio es repetido en varios archivos: un
  reemplazo literal en tres copias a mano se desincroniza solo.
- Saltos de línea: `commander.html` y `brawl.html` usan **CRLF**, `captain.html` usa **LF**.
  Leer con `newline=''` y escribir con el salto original para no ensuciar el archivo entero.
- Antes de tocar un tablero, copia a `tmp/<archivo>_before_<cambio>.html`: es la reversión.
- Escribir archivos grandes con `write_file` sobre un HTML existente de ~1 MB puede fallar:
  crear el nuevo en `tmp/` y moverlo con `mv`.

## Verificación

- Sintaxis y arranque: abrir la página en el navegador y comprobar que la partida empieza y
  que la consola no da errores nuevos (los 404 de imágenes de Scryfall son normales).
- Comportamiento: `preview_evaluate` despachando eventos sintéticos sobre el DOM real
  (`mouseover`, clics) y leyendo el estado del tablero; script reproducible en `tmp/`.
- Nada de capturas ni clics por toda la interfaz si no se han pedido: un vistazo y a cerrar.
- Decir siempre qué se comprobó de verdad y en qué archivo; no dar por probado lo que solo
  se cargó.

## Multijugador (capa `mp-layer`)

`commander.html` y `brawl.html` llevan una capa de multijugador P2P al final del archivo
(`<script id="mp-layer">`, fuente en `tmp/mp_layer.js`, inyección con `python tmp/inject_mp.py`).

- **Transporte**: WebRTC con dos códigos copiados a mano (sin servidor). Solo se necesita STUN
  para jugar entre redes distintas; en LAN basta con los candidatos locales.
- **Arquitectura**: el anfitrión es la autoridad y ejecuta las reglas; su `G.ai` es el invitado.
  El invitado recibe el estado **cambiado de lado** (`G.you` = él mismo), así que el tablero
  existente funciona sin tocar nada, y sus clics se convierten en órdenes que envía al anfitrión.
- **Información oculta**: al invitado le llegan la mano y la biblioteca del rival como huecos
  (solo la cantidad) y `cards` con los datos de las cartas que sí puede ver (su mano, ambos
  tableros, cementerios, exilio, zona de mando). Sin ese `cards` el invitado no reconoce sus
  propias cartas y las trata a todas como tierras.
- **Clics del invitado**: `bindBoardEvents` los vuelve a atar en cada repintado y llama a
  `castFromHand`, que es interno; por eso la capa reengancha `#jYouHand .hcard` y `#jCastCmd`
  después de cada `renderBoard`.
- **Sin mulligan** en multijugador: ambos se quedan la mano inicial.
- Modo de prueba entre dos pestañas del mismo navegador: abrir con `?mplocal=1` (BroadcastChannel)
  y usar los botones «Local: alojar / Local: unirme». Para automatizar el intercambio de códigos
  en pruebas existe `tmp/mp_relay.py` (HTTP en 8199) — es solo herramienta de test, no forma
  parte del juego.
- **Pendiente**: `captain.html` no la tiene (su tablero es otra generación: sin `#jTable`, sin
  `#jrail`); no hay reconexión tras una caída ni espectadores; durante el turno del invitado el
  raíl del anfitrión sigue diciendo «la IA piensa».

## Standard (sin comandante)

`standard.html` es una **copia de `brawl.html`** con el comandante fuera (`tmp/make_standard.py` hace
todos los retoques de una pasada; la copia de partida está en `tmp/standard_from_brawl.html`).
Lleva las mismas capas que brawl (`mull-arena`, `arena-mat`, `board-mix`) más una última,
`<style id="standard-css">`, que oculta todo lo del comandante (`#jCmd`, `.jcmdbox`, `#jMyCmd`,
`#jAiCmd`, `#jCmdDmg`).

- Reglas: **60 cartas en la biblioteca** (se rellena con básicas si el mazo trae menos),
  **20 vidas** (`cmdStartLife()` fijado a 20) y **ningún comandante**.
- `mkPlayer` usa una copia del mazo con `captain:null`: la carta que el constructor marcó como
  comandante pasa a ser **una carta más de la biblioteca**, así que `p.cmd` es `null`, no hay
  zona de mando, ni impuesto, ni daño de comandante (los `>=21` nunca se alcanzan).
- Textos cambiados en ES/EN/FR: título, meta, portada (`home.*`), `cm.title` y `game.startLine`.
- **Sin comandante en ninguna parte** (pasada de `tmp/standard_nocmd*.py`, copia previa en
  `tmp/versions/standard_before_nocmd.html`): reescritos los textos ES/EN/FR de portada, «El formato»,
  constructor, mesa e impresión; el logo dice «Standard» y ya no se nombra al comandante ni el
  bracket, el singleton o la zona de mando.
- Lo que se **oculta** (clase `standard-nocmd-css`, al final del archivo para ganar a `board-mix`):
  pestaña «Por comandante» y «Sets Kit», campo de comandante/format/bracket de los cuatro
  formularios (`#edCmd`, `#vBracket`, `#oBracket`, `#kBracket`, `#fBracket`), chip de mando del raíl,
  pilas `#jMyCmd`/`#jAiCmd`, selector de capitán de la partida (`.row:has(#jCap)`) y panel de
  brackets de «El formato» (`.panel:has(#homeBrackets)`). El botón «Sets Kit» de la portada se
  quita del JS que lo pinta (`data-q="kit"`).
- Contadores a 60 (`#edCount`, tarjeta del mazo, chips de análisis): `/100` no debe volver; y
  `cmdFmtPill()` devuelve «Standard» mientras `cmdBrPill()` devuelve vacío.
- La portada de los proxies sella «STANDARD · 60 CARTAS» (antes «COMMANDER · B3») y `pr.backTip`
  habla del emblema de la app, no del de Commander.
- **Opción de construcción «Solo Cimientos · Foundations (FDN)»** en el generador (los cuatro
  tableros, `tmp/add_fdn.py`): opción `set:fdn` en el selector `#vSource` (clave `v.srcFdn`), así el
  pool de cartas es el set completo de Foundations y nada más. No va como `<optgroup>` porque
  `fillUbSets()` borra todos los grupos al cargar los sets de Scryfall. Comprobado generando un
  sobre real: todas las cartas salieron de FDN.
- **Y construye mazos completos**, no sobres de 20: con «Solo Cimientos» el generador llama a
  `genFDN()` (capa `<script id="fdn-deck">`, `tmp/fdn_full_deck.py`) en vez de `genVirtual()`.
  Tamaños por formato: commander 99 + comandante de FDN = **100** · brawl 59 + comandante = **60** ·
  standard **60** sin comandante · captain **40** (dos sobres de 20, su modelo). El mazo es bicolor
  (las dos copias de color con más cartas de FDN), ~24/38/17 tierras, singleton salvo básicas y
  todas las cartas del set FDN. Comprobado en partida real en standard: 60 cartas, biblioteca 53
  tras robar 7, 20 vidas.
- **Un set entero necesita todas las páginas**: `searchCards()` pedía 2-3 páginas (350-525 cartas)
  y Foundations tiene **517 cartas únicas** (771 impresiones), así que se perdían las últimas
  (Beginner Box, Starter Kit, Jumpstart). Ahora, si la consulta lleva `set:xxx`, pide hasta
  `RULES_SET_PAGES` (12) páginas (`tmp/fix_set_pages.py`, los cuatro tableros). Comprobado en el
  navegador: `searchCards('game:paper set:fdn',2)` devuelve 517 de 517, con las cartas de los
  tramos altos (Sire of Seven Deaths #292, Arahbo #294, Adamant Will #488, Dive Down #588,
  Cryptic Caves #771) y las cinco básicas.
- **Pendiente**: el motor del constructor sigue siendo el de brawl y exige singleton (una copia)
  en vez del límite oficial de 4 copias, y la descripción del generador dice «populares de
  Scryfall» sin filtro de legalidad. Los ids y claves internas (`captain`, `#jCap`, `cm.*`) se
  quedan como están: no se ven.
- `index.html` tiene ya su tarjeta (clase `fmt`, claves `std.*`) con la imagen `img/standard.jpg`.

## Reglas de carta (capa `rules-core`)

Al final de los **cuatro** tableros: `<style id="rules-core-css">` + `<script id="rules-core">`
(fuentes `tmp/rules_core.css` y `tmp/rules_core.js`). La capa hermana `rules-more` (amasar,
proliferar, preparada, estímulo, convocar…) se enlaza justo después con
`python tmp/add_more_layer.py`; sus fuentes son `tmp/rules_more.css` y `tmp/rules_more.js`
y se publican con `python tmp/sync_shared.py`. Instalación y fotos de versión:

    python tmp/install_rules.py --label rules4        # inyecta y copia tmp/versions/*_rules4.html
    python tmp/install_rules.py --label x --test-all  # además pone el banco de pruebas
    python tmp/install_rules.py --notest              # quita el banco (dejar así el juego)

El banco vive en `tmp/rules_test.js` y se llama desde la consola con `__rulesTest()`; devuelve
`[{n, ok, i}]`. Comprueba 28 casos sobre una partida real (necesita `G.you`).

Qué añade la capa (todo envuelve funciones del motor, sin tocar el tablero):

- **Sacrificio**: efectos (`sacrifice a creature`, «cada jugador sacrifica», «cada oponente
  sacrifica», «target/that player sacrifices»), `sacrifice this creature` como efecto, **costes
  adicionales** al lanzar y **habilidades activadas con coste de sacrificio**. Indestructible no
  salva del sacrificio. «you may sacrifice» y «unless you sacrifice» no se fuerzan (pendiente).
- **Scry y surveil** de verdad: se miran las N de arriba y el jugador elige carta a carta qué
  queda arriba (en orden) y qué va al fondo o al cementerio; la IA usa heurística de tierras y
  coste. El texto se quita del oracle antes de pasar al motor para no aplicarlo dos veces.
- **Habilidades activadas generales** (`{2}: Roba una carta`, `{T}, paga 2 vidas: …`): botón
  «◈» en tus permanentes, selector con coste y efecto. Las de maná (`{T}: Add {G}`), las de
  descarte/exilio (`adv-rules-2`) y las de cementerio (`gyReturnAbility`) no se duplican.
- **Destreza** (prowess): se deja a `cm-ux-v2` si está (`window.__setRules.castTriggers`); la
  capa solo la aplica en tableros que no la tengan, para no dar +2/+2.
- **Combate**: `can't be blocked`, `unblockable`, `fear`/`intimidate` (artefacto o negro / color
  compartido) y criaturas con «can't block», tanto al elegir bloqueos la IA como en la lista del
  jugador (`#jBlockList`).
- **Contadores**: +1/+1 a cada criatura propia, -1/-1 a un objetivo o a todas, y «reparte N»
  entre tus criaturas.
- **Exilio** de artefacto, encantamiento, tierra o «nonland permanent» (el motor solo tenía
  criatura/permanente).
- **Coste reducido** (`costs {N} less`, con la condición «if you control a …» si la lleva) y
  **fichas de Tesoro/Pista/Comida** con su habilidad real: el Tesoro produce maná de cualquier
  color (se gira; no se sacrifica, desviación conocida), Pista roba y Comida gana 3 vidas.

Lo que la capa **no** cubre (a día de hoy): destello (el motor juega por turnos y no hay ventana
para lanzar en el turno rival), copias de hechizo/permanente, «gana el control», prevención de
daño, y el coste de sacrificio de hechizos con modo o con X (los lanza otra vía).

Versiones guardadas de cada iteración: `tmp/versions/<tablero>_rules1|rules2|rules3*.html` y sus
`*_before_rulesN.html` para revertir.

## Mulligan estilo Arena (capa `mull-arena`)

Los tres tableros llevan al final `<style id="mull-arena-css">` + `<script id="mull-arena">`
(fuentes en `tmp/mull_arena.css` y `tmp/mull_arena.js`, inyección con `python tmp/inject_mull2.py`).
Es solo presentación: no cambia ids ni lógica, así que `mullRender`, `mullOpen` y los botones
siguen haciendo lo mismo.

- Pantalla completa con viñeta, título grande («Tú juegas primero»), subtítulo, la mano en arco
  (rotación y altura por carta, con relevo por `:nth-child` si el JS no llega) y los dos botones
  grandes abajo.
- Cabecera con el jugador y su comandante, y «Ver campo de batalla» (clase `peek`: fondo
  transparente, `pointer-events:none` y la mano oculta, para mirar la mesa sin salir).
- **Ojo con el inyector**: no convertir a CRLF dos veces (deja `\r\r\n` y el bloque deja de
  localizarse). `inject_mull2.py` normaliza, borra el bloque previo, inyecta uno y escribe limpio.

## Mesa estilo Arena (capa `arena-mat`)

Al final de los tres tableros: `<style id="arena-mat-css">` + `<script id="arena-mat">`
(fuentes `tmp/arena_mat.css` y `tmp/arena_mat.js`, inyección `python tmp/inject_layer.py arena-mat tmp/arena_mat.css tmp/arena_mat.js`).
La capa **solo actúa con `body.arena-mat-on`**, clase que el script pone cuando hay partida y el
`#jTable` está visible: en «Mis mazos» o en los sobres no cambia nada.

- Mesa de madera a sangre: `img/mesa-madera.jpg` (tablón cálido con veta, junta central y
  garabatos dibujados) como fondo de `body` (`cover fixed`), y paneles transparentes
  (`#jTable`, `.jmain`, `.jzone`…) para que se vea la mesa por debajo. Los raíles quedan como
  cristal ahumado. `img/mesa-arena.jpg` (el muelle sobre agua) queda guardado como alternativa:
  basta cambiar la URL de la regla `body.arena-mat-on`.
- Mientras baja la imagen de una carta se pinta un degradado de dorso, no un hueco negro.
- Cartas del tablero con el arte protagonista: la imagen se recorta con
  `transform:scale(2.7);transform-origin:50% 12%` (solo se ve la ilustración), barra de nombre
  arriba y burbuja de F/R abajo a la derecha. Las claves (`Vuela`, `Arrolla`…) van como
  etiquetas doradas legibles a 8 px sobre la carta, en fila al pie y por encima de la burbuja de
  F/R (`.kws` con `bottom:22px`, sin recortar el texto: nada de 3 letras ni mayúsculas forzadas).
  **Ojo**: la capa de tablero antigua hace `display:none` en `.nm`, hay que reactivarlo.
- Vida en gema redonda (54 px) con el retrato del comandante en círculo encima (`.am-id`, lo
  inyecta el script con `cardImg` del comandante del mazo).
- Píldora de turno fija abajo a la derecha (`#jTurnPill`) que copia el texto de `#jTurn`.
- La mano del rival se ve: `#jAiHand` va arriba del todo de su mitad con los dorsos (33 px de ancho)
  y una píldora «N en mano» al lado. Ojo: el fondo con el dorso va en el `style` inline de la
  carta, así que la capa no puede poner `background` a secas ahí (`background-color` o
  `:not([style*="background"])`, o se come el dibujo del reverso).

Si algún día hay que retocar la mesa, editar los dos archivos de `tmp/` y volver a lanzar el
inyector; nunca pegar el bloque a mano en los HTML.

## Mesa partida en dos (capa `board-mix`)

Solo en `commander.html` y `brawl.html`: `<style id="board-mix-css">` + `<script id="board-mix">`
(fuentes `tmp/board_mix.css` y `tmp/board_mix.js`,
`python tmp/inject_layer.py board-mix tmp/board_mix.css tmp/board_mix.js commander.html brawl.html`).
**No va en `captain.html`** porque su tablero ya es así (es la referencia) y no tiene `#jTable`.

- El JS crea dos contenedores `.mix-half` dentro de `.jbody` y **mueve ahí las zonas**
  (`#jAiLand`, `#jAiBf`, `#jYouBf`, `#jYouLand`, `#jYouHand` y las filas `.jplayer-utility`).
  Los ids no cambian, así que el motor sigue pintando igual; las cajas `.jplayer-zone`
  originales quedan vacías y se ocultan. Se hizo moviendo nodos porque las capas antiguas
  pisaban los `order` de CSS con `!important`.
- Reparto: rival = mano · vida/datos · tierras · campo; tú = campo · tierras · **banda inferior**.
- **Banda inferior de tu mitad** (`.mix-bottom`): tres zonas en fila — `[retrato + gema de vida + maná]`
  · `mano centrada` · `[pilas + chip de comandante]`. Las pilas (biblioteca, cementerio, exilio,
  comandante) **no se apilan sobre la mano**: usan el hueco lateral derecho, y el retrato con la vida
  el izquierdo. La fila del rival hace lo mismo (`retrato+vida` a la izquierda, `pilas` a la derecha).
  Los grupos `.jside` son solo agrupadores: tienen que quedar sin fondo, borde, sombra ni relleno
  (la piel antigua de `.jplayer-utility > div` les ponía panel y se veía como una caja oscura).
- **Vida visible**: la gema es `.jlifectl .jdice` (`#jLifeYou` / `#jLifeAi`). La capa anterior la
  ocultaba con `display:none!important` sobre `.jlifectl`; ahora es una moneda dorada de 42 px con
  los botones ± pequeńos al lado (aparecen al pasar el ratón). Si vuelve a desaparecer, mirar la
  especificidad: la regla que la apaga usa `#jTable .mix-half .jplayer-utility .jinfo .jlifectl`.
- En `standard.html` el chip de mando se apaga con `html body.arena-mat-on #jTable .jcmdbox`
  (con `body.arena-mat-on #jTable .jcmdbox` perdía contra el `display:flex!important` de esta capa).
  Las dos mitades son `flex:1 1 0`, así que la franja `.jmid` cae **exactamente en la mitad**.
  Comprobado: 324 px y 324 px con el centro del `.jmid` en el centro del `.jbody`.
- Datos de brawl que se conservan: gema de vida + `jmeta` (mano, maná), pilas de
  biblioteca/cementerio/exilio/comandante con sus dorsos, e **impuesto de mando**.
- La caja «Zona de mando» **sale del raíl** y pasa a ser un chip al final de tu fila
  (carta + «Lanzar» + impuesto ajustable). El daño de comandante y «Poner a cero» se ocultan.
- El chip y las cartas de comandante llevan `data-nm`, así que abren la vista grande
  (`#cardZoom`); antes no iba en ellas.
- En pantallas bajas (`max-height:820px`) las cartas bajan de tamaño para que quepan las cuatro
  filas; la mano no debe crecer por encima de su contenido (`flex:0 0 auto`) o se come el campo.
## Estado de sincronización (24 nov 2026)

- [x] Zoom de carta (`#cardZoom`) estable: anclado a la carta y con 180 ms de gracia.
      Aplicado y unificado en **los tres** (`tmp/fix_zoom.py`, copias en `tmp/*_before_zoom.html`).
- [x] Multijugador P2P en `commander.html` y `brawl.html` (capa `mp-layer`), probado en
      commander con dos navegadores reales por WebRTC.
- [x] Pantalla de mulligan estilo Arena en los tres (capa `mull-arena`). Verificada en partida
      real en `commander`; en `captain` solo la presentación (ese perfil no tenía sobres).
- [x] Reparto simétrico del tablero en `commander` y `brawl` (capa `board-mix`), con los datos de
      brawl (impuesto, pilas, cartas de comandante con zoom) y sin la caja de zona de mando en el raíl.
      Verificado en partida real en `commander`; en `brawl` solo carga (esa pestaña no tenía mazos).
- [x] Reglas de carta (`rules-core` v3) en los cuatro tableros: sacrificio, scry/surveil,
      habilidades activadas, desbloqueable/miedo, contadores, exilio de tipos y fichas de Tesoro.
      28 casos del banco en verde en commander, brawl, standard y captain (partida real).
- [x] `standard.html` sin rastro del comandante (textos ES/EN/FR, pestañas, campos del editor,
      chip y pilas de la mesa, portada de proxies) y a 20 vidas. Verificado con partida real
      (20/20 en `#jLifeYou` y `#jLifeAi`) y recorriendo las cinco secciones y las cuatro pestañas
      del constructor con `document.body.innerText`: cero menciones, consola sin errores nuevos.
- [ ] `captain.html` no tiene la piel Arena del tablero (`#arena-v15-final`, `#arena-paint-js`,
      `cm-ux-v2`, `#jrail`, `jplayer-piles`, `playmat`). Es la deuda grande pendiente:
      su mesa sigue con el diseño anterior, y por eso tampoco tiene multijugador todavía.

## Daño de comandante: solo en Commander (25 nov 2026)

- `commander.html` **conserva** la regla de 21 (acumula `cmdDmg`, pierde a 21 en combate y en
  `checkLife`, medidor `.cmczdmg` y badge `⚔ n/21`). No tocar.
- `brawl.html` y `standard.html`: **sin regla de 21**. Se quitó la acumulación en `toPlayerHit`,
  las dos comprobaciones `>=21` (fin de combate y `checkLife`) y el medidor se oculta
  (`style="display:none"` en `.cmczdmg`). `cmdDmg` ya no se escribe nunca, así que el badge
  `#jCmdDmg` tampoco aparece.
  - Textos ES/EN/FR de brawl reescritos: `fmt.r4t` («30 vidas»), `fmt.r4p`, `fmt.zoneW`,
    `game.startLine`, `gp.setupP`, `gp.fmtEdhOn`, `gp.fmtEdhLog`, `print.footer`, `home.f4p` y
    `cm.cmdKill`/`cm.winCmd`/`cm.loseCmd` (mensajes neutros, ya no se disparan). También los
    respaldos estáticos del HTML (`data-i18n`).
  - Standard: respaldos estáticos `home.f2p`, `home.f4p`, `home.s5p`, `fmt.r4t`, `fmt.r4p`,
    `fmt.zoneW` a 20 vidas sin comandante.
- `captain.html`: nunca tuvo la regla (`grep cmdDmg` = 0) y su texto ya lo dice
  (`fmt.zoneW`: «El capitán no hace daño de comandante»). Nada que hacer.
- Scripts: `tmp/no_cmd_damage.py` (mecánica) y `tmp/no_cmd_damage_txt.py` (textos).
  Copias: `tmp/versions/*_before_nocmdmg.html` y `tmp/versions/*_nocmddmg.html`.
- Verificado: brawl y standard con `G.you.cmdDmg=30; G.ai.cmdDmg=30; checkLife()` → `G.over`
  sigue en `false` (30/30 y 20/20 vidas), cero menciones al 21 en el texto de la página.
  Commander intacto (5 referencias `>=21`).

## Versiones con fecha y hora (`versions/`)

`tmp/stamp_version.py "YYYY-MM-DD HH:MM" [archivos…]` (por defecto los cuatro tableros):
escribe la marca dentro del HTML (`<meta name="app-version">` en el `<head>` y un comentario
`<!-- versión … -->` tras `<html>`) y deja una copia en `versions/<tablero>_<fecha>_<hora>.html`.
Es idempotente: borra las marcas anteriores antes de poner la nueva, y respeta CRLF/LF.

Ritmo acordado con el usuario: **una versión nueva cada hora**, con la marca de fecha y hora en
el propio fichero. `versions/` es el histórico (distinto de `tmp/versions/`, que son las
reversiones puntuales antes de cada parche).

## Standard: reglas de construcción reales (25 nov 2026, 11:51)

- **Hasta cuatro copias** de cualquier carta no básica (`STD_COPIES=4` en `standard.html`) y
  básicas sin límite, como el formato de verdad. Antes el motor exigía singleton (herencia de
  brawl) aunque los textos ya hablaban de cuatro copias.
  - `cmdSanitize100` cuenta copias con un `Map` y corta al llegar a 4 (antes descartaba
    cualquier repetición).
  - Editor: `addCardByName` y el alta desde el buscador dejan añadir hasta la cuarta copia y avisan
    con `ed.copiesMax` (ES/EN/FR).
  - `cmdAudit` solo marca `dupes` cuando se pasa de cuatro, y el chip dice «Hasta 4 copias ✓»
    (`anaLbl.single`, ES/EN/FR).
  - El generador de Cimientos (`fdnAssemble`, capa `fdn-deck`) monta cuatro pasadas sobre el
    pool: playsets de las mejores cartas en vez de singleton, 60 cartas en standard.
- **Bug arreglado: el mazo era de 59 cartas.** `CMD_LIB=59` venía de que en brawl el comandante
  ocupa el hueco 60; en standard no hay comandante, así que el constructor se paraba en 59 y la
  biblioteca rellenaba con una básica extra. Ahora `CMD_LIB=60` y el contador, el límite del
  editor, la auditoría (`total===CMD_TOTAL`) y `cmdLibraryFor` cuadran con las 60 cartas.
- Textos corregidos: `fmt.r2p` («La app arma el mazo con hasta cuatro copias…»), `ed.helpW`.
- Scripts: `tmp/std_four_copies.py`, `tmp/std_sixty.py`. Reversión: `tmp/versions/standard_before_copies4.html`.
- Verificado en `standard.html` en el navegador: `fdnBuild()` → 60 cartas, máximo 4 copias,
  `cmdAudit` con `total 60` y `dupes 0`; el editor corta la quinta copia y deja cinco básicas;
  partida real con mazo de 60 → biblioteca 53 tras robar 7 y 20 vidas.
- ~~Pendiente~~ **Ya no**: el generador virtual sin FDN monta playsets de hasta 4 copias desde el
  25 nov (ver «Standard: playsets de verdad»). `cmdTakeCurved` pertenece al constructor antiguo,
  que dejó de ser el vivo.

## Cola de trabajo (siguiente iteración)

1. ~~**Bug encontrado**~~ **Hecho (25 nov 2026)**: `cardOfSafe(n)` devolvía un sustituto `{type:'Basic Land', basic:true}`
   para nombres que aún no están en la caché de Scryfall. Efecto: cualquier carta desconocida
   cuenta como tierra básica. **Resuelto**: el sustituto es `stubCard()` (`stub:true`, `basic:false`,
   `land:false`) y las básicas por nombre siguen resolviéndose; ver la sección
   «cardOfSafe: el sustituto ya no es una tierra básica».
2. ~~Generador «virtual» (sin FDN): playsets de 4 en standard~~ **Hecho (25 nov 2026)**: el
   constructor vivo ya reparte hasta cuatro copias; ver «Standard: playsets de verdad».
3. `captain.html` sigue sin la piel Arena (`#arena-v15-final`, `#jrail`, multijugador): deuda grande.
4. `rules-core`: «you may sacrifice» y «unless you sacrifice» se aplican siempre; deberían ser
   opcionales.

## Portada sin scroll a 1920×1080 (capa `home-fit`)

Los cuatro tableros llevan al final del body `<style id="home-fit">` (`tmp/home_fit.py`), con
`@media (min-width:1400px)`. Antes la landing medía 1191 px (standard) y 1265 px (brawl/commander)
y 1447 px (captain) a 1920×1080: había que hacer scroll para ver las tarjetas y el pie.

Qué hace, solo con la portada visible (`#inicio`):

- `main:has(>#inicio.on){padding-bottom:10px}` — el relleno inferior de 90 px solo se quita en la
  portada; las demás secciones (mesa, sobres, impresión) quedan igual.
- `#inicio{min-height:calc(100svh - 196px)}` para que el pie caiga al borde inferior aunque la
  portada sea corta (standard dejaba 145 px de aire).
- Versión compacta del héroe: `h1` 40 px (antes 56 en brawl/standard y **88 en captain**),
  `.lede` 15,5 px, héroe con 8/2 px de relleno, rejilla de características con 10 px de hueco,
  tarjetas a 10×12 px con textos de 14/12,5 px y panel del formato a 10×12 px.

Medido a 1920×1080 en los cuatro (chromium del preview, tras `document.getAnimations().finish()`):
`document.documentElement.scrollHeight` = 1080, sin desbordamiento, con el pie entre 1066 y 1079 px.
Brawl/commander quedan justos; captain y standard con algo de aire. Verificado también que
`#jugar` conserva su `padding-bottom:90px`.

**Truco de medición (importante)**: la portada tiene transiciones CSS de 100 ms sobre `font-size`,
`line-height` y márgenes; en una pestaña oculta las transiciones no avanzan y `getComputedStyle`
devuelve el valor inicial, así que cualquier medida sale mal. Antes de medir hay que llamar a
`document.getAnimations().forEach(a=>a.finish())` (o inyectar `*{transition:none}`).

Reversión: `tmp/versions/<tablero>_before_homefit.html`.

## Etiqueta y ancho de «Solo Foundations (FDN)» (25 nov 2026)

- Etiqueta única en los cuatro tableros (`tmp/fdn_label.py`): ES «Solo Foundations (FDN)»,
  EN «Foundations only (FDN)», FR «Fondations uniquement (FDN)». Antes el español decía
  «Solo Cimientos · Foundations (FDN)» (mezcla y demasiado largo, se cortaba) y el inglés y el
  francés repetían el nombre del set («Foundations · Foundations (FDN)»).
- El selector ya no se sale de su celda: en commander/brawl/standard el campo «Cartas» ocupa dos
  columnas de la rejilla `.cmrow` (`grid-column:span 2`) y `#vSource` va a `width:100%` (capa
  `fdn-label-css`, `tmp/fdn_label_width.py`). Antes el `min-width:250px` lo hacía desbordar sobre
  el campo «Set exacto», que lo tapaba.
- `captain.html` (fila flex, no rejilla): `#vSource` con `min-width:290px;max-width:340px;flex:0 0 auto`.
  Era el único que se había quedado con `max-width:250px`, que no ensanchaba nada.
- Medido en el navegador con la pestaña del generador abierta:
  commander 337 px y brawl 337 px (etiqueta más larga 196 px), standard 395 px (celda doble, 395),
  captain 340 px (etiqueta más larga 209 px a su tipografía). Ninguno solapa el campo siguiente ni
  saca scroll horizontal. Cambiando de idioma con `setLang()` la opción pasa por las tres etiquetas.
- Reversión: `tmp/versions/<tablero>_before_fdnlabel.html`.
## Limpieza de la opción FDN (revisión a ojos frescos, 25 nov 2026)

**Bug grave encontrado y arreglado**: la capa `fdn-deck` hacía `genVirtual = …` y luego
`$('#vGo').onclick = genVirtual`, pero `genVirtual` **no** es el generador actual en
commander/brawl/standard (allí el botón usa `cmdGenVirtual`, que sí lee formato, tema, plantilla
y bracket). Efecto: con cualquier fuente distinta de FDN, el botón generaba con el motor viejo de
5 sobres monocolor y perdía formato/tema/plantilla en silencio. Ahora la capa solo envuelve
`cmdGenVirtual` y desvía a `genFDN()` cuando `#vSource` es `set:fdn`; el resto de fuentes sigue
por el camino de siempre. Comprobado con un doble de `cmdBuildDeck`: con la fuente en «Cualquier
carta» el botón lo llamó 5 veces (n=5) y no tocó el motor viejo.
En `captain.html` el botón sí apunta a `genVirtual`, así que ahí se envuelve esa función **y se
reengancha el botón**: si solo se envuelve, el botón conserva la referencia vieja y FDN no hace
nada (pasó en la primera pasada).

**Duplicidad con «Sets Kit» eliminada**: el kit construía mazos de FDN con `cmdBuildDeck`
(singleton, otra calidad) mientras la fuente `set:fdn` usaba `fdnAssemble`. Ahora
`CMD_KIT_SETS=['ORI','M19','M20','M21']`: FDN tiene **una sola entrada**, «Solo Foundations
(FDN)» en el selector de cartas, y el kit se queda con los cuatro core sets clásicos. Textos
`kit.desc` ES/EN/FR actualizados (ya no nombran Foundations). El kit existe en commander, brawl
y standard; captain nunca lo tuvo.

**Nombres y textos unificados**: `FDN_NAME='Foundations'` (antes «Cimientos»), `fdn.ok` en los
tres idiomas, y la etiqueta de origen del mazo `src.fdn` = «Foundations (FDN)» (`srcLabel` ya no
lo degrada a «manual»). Los mazos generados se llaman «Foundations WR · #n».

**Código que sobraba, fuera**: `window.genFDN` (nadie lo usaba; se queda `window.fdnBuild` para
las pruebas de consola) y el tope de 20 mazos de `genFDN`, alineado con los 10 del generador.

Script: `tmp/fdn_cleanup.py`. Reversión: `tmp/versions/<tablero>_before_fdnclean.html`.
Verificado en brawl/commander/standard (`go.onclick === cmdGenVirtual`, el envoltorio llama a
`_cmdGenVirtual`), kit sin FDN, `t('fdn.ok')` y `srcLabel('fdn')` correctos, y en captain una
generación FDN real con `searchCards` simulado: 2 sobres de 20 llamados «Foundations G · #n»
(su modelo). Los mazos de prueba se borraron del almacén.
## Standard: el generador ya no pide comandante (25 nov 2026)

Síntoma: al generar en standard el motor elegía una criatura legendaria como comandante
(`cmdPickCommander`), con sets fijos lanzaba `kit.noCmd` si no encontraba leyendas, bloqueaba la
identidad de color a la del comandante y ponía su nombre al mazo.

Arreglo (solo `standard.html`, `tmp/std_nocmd_live.py`):

- `STD_NO_CMD=true` + `cmdStdIdentity(sel)`: identidad de color a partir de `opts.identity`
  (una letra, un par, o aleatoria 50 % mono / 50 % bicolor).
- El constructor que se usa de verdad es el **segundo** `cmdBuildDeck` (`window.cmdBuildDeck`,
  línea ~11790), que pisa al primero: el bloque del comandante (`setQ` + `cmdPickCommander`) solo
  se ejecuta si `!STD_NO_CMD`. Con `STD_NO_CMD`, `cc={name:'',ci:identity}`.
- Sin comandante: no se busca sinergia de tribu (`cmdSyn`), no ocupa hueco en `used`, no suma
  símbolos de maná dobles y el mazo se llama por colores («W · #7», «WR · #8»).
- El editor y la tarjeta del mazo ya contaban sin comandante (`60/60`, `length/60`).

Comprobado en el navegador con generaciones reales:
- Fuente «Cualquier carta»: 60 cartas, `commander:''`, mono W, 24 tierras, ninguna carta
  no básica repetida; partida real → 20 vidas, mazo de 60, biblioteca 53 tras robar 7, `cmd:null`.
- Con `sets:'M21'`: 60 cartas sin comandante y **sin error `kit.noCmd`** (antes exigía leyenda).
- Consola: solo los 404 de imágenes de Scryfall.

**Ya no pendiente**: el generador «virtual» monta playsets de cuatro copias desde el 25 nov (ver
«Standard: playsets de verdad»); `cmdTakeCurved` se quedó en el constructor antiguo.

Reversión: `tmp/versions/standard_before_nocmdgen.html`.
## Pilas del tamaño de las tierras jugadas (25 nov 2026)

Antes: biblioteca, cementerio, exilio y mando se dibujaban a 42×59 (30×42 en la capa de mezcla),
mientras una tierra jugada mide 68×95 a 1920 de ancho. Se veían como miniaturas.

Arreglo (`tmp/piles_land_size.py`, `tmp/piles_land_size2.py`, `tmp/piles_land_size3.py`; en
`commander.html`, `brawl.html` y `standard.html`, que son los que tienen estas capas):

- La medida efectiva de una tierra jugada en este diseño es
  `body.arena-mat-on #jTable .mix-half .jzone.jlands .bcard{width:clamp(48px,3.7vw,68px)}` con
  proporción 745/1040 → **68×95** a 1920 (a 1366 baja a ~50×70).
- Las pilas usan ahora exactamente la misma fórmula: `width:clamp(48px,3.7vw,68px)`,
  `height:auto`, `min-height:0` y `aspect-ratio:745/1040`. Se cambió en las dos capas que competían:
  `arena-v15-final` (la que ganaba con `width:42px!important`) y `board-mix-css`
  (la de `width:30px!important` de la capa de mezcla), más el contador `.cnt` a escala (10 px).
- **Clave**: cada pila vive dentro de un `.pile-unit` que es un flex en fila con ancho fijo; la
  tarjeta encogía a 42 aunque el CSS dijera 68. Se añadió
  `body.arena-mat-on #jTable .pile-unit{width:auto!important;flex:0 0 auto!important}` y
  `body.arena-mat-on #jTable .pmini{flex:0 0 auto!important}`.

Medido en partida real a 1920×1080 (tierra de referencia insertada en la zona de tierras):

| tablero   | tierra | biblioteca | cementerio | exilio | mando | página |
|-----------|--------|------------|------------|--------|-------|--------|
| brawl     | 68×95  | 68×95      | 68×95      | 68×95  | 68×95 | sin scroll (1080) |
| commander | 68×95  | 68×95      | 68×95      | 68×95  | 68×95 | sin scroll (1080) |
| standard  | 68×95  | 68×95      | 68×95      | 68×95  | — (sin comandante) | sin scroll (1080) |

El campo de batalla cede altura (brawl 289 px, commander 271 px) pero ninguna zona se desborda ni
se solapa con la mano; las captions de las pilas siguen ocultas en modo arena.

Ojo con las pestañas ocultas: en una pestaña en segundo plano Chromium no avanza transiciones y una
pila ya existente puede seguir midiendo su tamaño viejo. Para medir, recargar o insertar un nodo
nuevo; `renderBoard()` no sustituye los nodos de las pilas.

Reversión: `tmp/versions/standard_before_piles.html`, `tmp/versions/commander_before_piles.html` y
`versions/brawl_2026-11-25_1306.html` (anterior a este cambio).
## Standard: sin mulligan gratis (25 nov 2026)

Antes: el mulligan de Londres de standard tenía la primera tirada gratis (se ponía carta al fondo
solo a partir del segundo), y los textos lo prometían en la sección «El formato», en la pantalla
de mulligan y en el panel de la partida.

Cambios (`tmp/std_mull_no_free.py`, solo `standard.html`; brawl/commander conservan su tirada
gratis porque su formato y sus textos así lo dicen):

- `playerMulligan`: `nb = Math.max(0,_mullN)` (antes `_mullN-1`) → **cada mulligan**, incluido el
  primero, devuelve una carta al fondo.
- `aiMulligan`: `nb = Math.max(0,k)` (antes `k-1`) → la IA sufre la misma penalización.
- Botón: siempre `t('game.mullDoN',{n:_mullN+1})`; ya no existe el estado «Mulligan gratis»
  (`game.mullFree` queda sin uso).
- Textos ES/EN/FR: `fmt.r6t` («Mulligan de Londres»), `fmt.r6p`, `gp.fmtHint`, `game.mullSub`,
  `game.mullHint` (fuera «el primero no cuenta») y el respaldo estático del HTML de la regla y del
  botón. `game.startLine` de standard ya no dice «Comandante: {c}. 30 vidas…»: ahora es «Veinte
  vidas y mulligan de Londres: cada cambio de mano devuelve una carta al fondo» (EN/FR igual).

Comprobado en partida real en el navegador (standard, mazo de 60):
- Pantalla inicial: botón «Mulligan (al fondo 1)», «Mantener 7», pista nueva; sin «gratis» en el
  texto de la página.
- Tras un mulligan: el botón pasa a «Mulligan (al fondo 2)» y el registro dice «Jugador hace
  mulligan (1)». Al mantener, la pantalla pide **1 carta al fondo** («Al fondo (0/1)», el botón
  deshabilitado hasta elegir).
- Elegida Kodama's Reach y confirmado: mano **6**, biblioteca **54** (la carta quedó la última de
  la biblioteca), `mulligans:1`, 20 vidas y tablero en juego. La IA con 2 mulligans acabó con mano
  5 y biblioteca 55 (60 en total).
- `t()` en los tres idiomas devuelve los textos nuevos y el registro no tiene ninguna mención a
  comandante. Consola: solo los 404 de imágenes de Scryfall.

Reversión: `tmp/versions/standard_before_mullnofree.html`.
## cardOfSafe: el sustituto ya no es una tierra básica (25 nov 2026)

Bug de la cola de trabajo nº1: `cardOfSafe(n)` devolvía `basicCard(n)` para cualquier nombre que aún
no estuviera en la caché de Scryfall. Una carta desconocida se comportaba como **tierra básica**:
copias ilimitadas en el saneador, contaba como tierra en la auditoría y en los recuentos
(`isLandN`, curva/`spells`), y la IA la veía como tierra en la mano.

Arreglo (`tmp/fix_stub_card.py`, en **los cuatro** tableros):

    function cardOfSafe(n){
      const c=cardOf(n);if(c)return c;
      if(isBasicName(n))return basicCard(n);   /* básica por nombre, aunque falte la caché */
      return stubCard(n);
    }
    function stubCard(n){ return {name:n,type:'',stub:true,basic:false,land:false,…} }

- Las 11 básicas de `BASIC_NAMES` (incluidas las Snow-Covered y Wastes) siguen resolviéndose como
  básicas de verdad: mazos guardados con 20 «Forest» se cargan completos antes de resolver nada.
- Guardas explícitas de `stub` en el saneador, la auditoría y las tierras
  (`tmp/fix_stub_card.py` + reemplazos): `basic=isBasicName(nm)||!!(c&&c.basic&&!c.stub)`,
  `isLandN` = `isBasicName(n)||!!(c&&!c.stub&&(c.land||c.basic))`, y lo mismo en `cmdRepair`.
  `captain.html` no tiene esas funciones (su editor es singleton por nombre, sin saneador ni
  auditoría): allí solo cambia `cardOfSafe`.

Comprobado en el navegador:
- standard: `cardOfSafe('Cartulina Inexistente XYZ')` → `{stub:true,basic:false,land:false}`;
  `'Forest'` sigue `{basic:true,land:true}`; `'Lightning Bolt'` resuelta sin `stub`.
  Saneador con 20 Plains + 6 copias de la desconocida + 4 Bolt → **20 / 4 / 4** (antes la
  desconocida era ilimitada). Auditoría: `lands 52`, `spells 8`, `dupes 0` (la desconocida ya no
  suma como tierra).
- brawl: 2 copias de una desconocida → 1 (singleton), 5 Forest intactos, 1 Llanowar Elves, sin
  duplicados falsos.
- commander: mazo sin resolver (79 nombres fantasma únicos + 20 Forest) → 99 cartas conservadas,
  `lands 20`, `spells 79`, `dupes 0`, auditoría 100. Los dos mazos reales siguen a 99+1 = 100 y con
  cero stubs (todas sus cartas están en caché).
- Partida real en standard (mazo de 60): 20 vidas, biblioteca correcta, sin errores nuevos en
  consola (solo los 404 de imágenes de Scryfall). `captain.html`: partida arranca igual y las
  básicas por nombre se resuelven bien.

Efecto conocido: mientras una carta no esté resuelta, el tablero la pinta sin imagen y sin tipo
(antes se hacía pasar por tierra), y la curva la cuenta con coste 0 en vez de contarla como tierra.

Reversión: `tmp/versions/<tablero>_before_stub.html`.
## Linter de coherencia entre tableros (`tmp/lint_boards.py`, 25 nov 2026)

    python tmp/lint_boards.py            # falla solo por problemas nuevos (0,6 s)
    python tmp/lint_boards.py --strict   # falla también por los pendientes de BASE
    python tmp/lint_boards.py -v         # enseña cada comprobación, aunque pase

Solo biblioteca estándar de Python, sin dependencias. Falla con **código 1** y una línea por
problema:`✗ [tipo] archivo  qué pasa y qué se esperaba`. Comprueba:

1. **Capas**: cada tablero tiene exactamente las capas `<style id>`/`<script id>` que le tocan
   (`LAYER_GROUPS` + `BOARD_GROUPS` + `BOARD_LAYERS`). Falta o sobra una → error (y el mensaje dice
   dónde declararla). También detecta ids de capa repetidos.
2. **Ids de HTML**: los hermanos (commander, brawl, standard) deben tener los mismos ids de marcado
   (se lee solo el HTML anterior al primer `<script>`, sin las capas `<style>`, y se descuentan
   `ID_EXTRAS`). captain queda fuera: es otra generación, y el linter lo dice.
3. **i18n por tablero**: ES, EN y FR definen exactamente las mismas claves (se leen el bloque
   `const I18N={…}` y todos los `Object.assign(I18N.<lang>,{…})`). Falta una traducción → error con
   la clave y el idioma.
4. **i18n entre hermanos**: commander/brawl/standard comparten juego de claves; lo propio de cada
   uno se declara en `cross_extra` (`cm.an.brT`, `ed.copiesMax`).
5. **Tamaños por formato** (`SIZES`): `CMD_LIB`/`CMD_TOTAL`/`STD_COPIES`/`STD_NO_CMD`,
   `cmdStartLife()` (commander 40 · Duel 20, brawl 30, standard 20) y en captain `life:20` y
   `CMD_TOTAL:40`.
6. **Selector**: `#vSource` debe ofrecer `['all','noUB','core','set:fdn']` en los cuatro, y
   `CMD_KIT_SETS` existir en los tres que tienen kit.
7. **Palabras prohibidas** (`FORBIDDEN`), sobre claves que el código usa de verdad
   (`data-i18n`/`t('clave')`):
   - standard: nada de comandante, bracket, singleton ni zona de mando, en los textos del formato y
     de la mesa (`FORMAT_TEXT`: nav/home/fmt/gp/game/pr/footer/std/src/toast/deck). Los paneles
     heredados de brawl (kit, importar, brackets, editor) quedan fuera a propósito.
   - brawl: no puede nombrar el daño de comandante salvo para negarlo (`NEGATION`: sin, no hay,
     without, sans, pas, ne…).

**`BASE`** es la lista de pendientes conocidos: no hacen fallar el linter (salen como «conocidos»),
pero un problema **nuevo** sí. Si una entrada de BASE ya no salta, el linter avisa de que sobra para
que se quite.

Primera pasada (lo que encontró y se arregló):
- standard: `fmt.r4p` decía «Se empieza a **30**» y hablaba de daño de comandante → 20 vidas, sin
  mención; `fmt.zoneW` («Tu comandante es un líder más del mazo») y `gp.setupP` («cada comandante
  empieza en la zona de mando…») reescritos; `footer.left` decía **Brawl** en ES/FR y **Commander**
  en EN → «Standard» en los tres.
- brawl: la portada prometía daño de comandante (`home.f2p`, `home.s5p`) → reescritas.

Pendientes en BASE (41 en `--strict`): 7 claves ES sin traducir en commander/brawl/standard
(`cm.regenFail`, `cm.shuffleLog`, `ed.sets`, `ed.setsHint`, `r.counters`, `r.exile`, `r.costLess`)
y 3 en captain; restos de texto de captain/commander en paneles ocultos de standard (`game.cap*`,
`game.started`, `game.castCount`, `gp.cmdZone`); la etiqueta `cm.dmgT` de brawl; y la capa
`arena-v11-separated-player-halves` inyectada dos veces en los tres mayores.

Autoprueba: se copiaron los cuatro tableros a `tmp/linttest/`, se inyectaron cinco fallos (standard
a 59 cartas, `home-fit` renombrada en brawl, clave solo en ES en commander, «comandante» en
`fmt.r1p` de standard y `set:fdn` cambiada en captain) y el linter devolvió **7 problemas y código
1**, cada uno nombrando archivo, capa/clave y valor esperado.
## Deshacer · recuperar la partida · replay (capa `undo-layer`)

Capa nueva en los **cuatro** tableros (`undo-layer-css` + `undo-layer`, inyectadas antes de
`</body>`): `tmp/undo_layer.css` y `tmp/undo_layer.js`, con
`python tmp/inject_layer.py undo-layer tmp/undo_layer.css tmp/undo_layer.js commander.html brawl.html standard.html captain.html`
(y añadidas a `LAYER_GROUPS['todos']` del linter).

**Cómo se guarda el estado.** `G.log` solo tiene `{t,c}` (texto), así que no se puede re-ejecutar
el registro para reconstruir la partida. En vez de eso la capa envuelve `renderBoard()` (el motor
repinta después de cada acción) y guarda una foto del estado: `turn`, `turnNo`, `phase`, `over`,
`diff`, `you`, `ai`, `pending` y las últimas 80 líneas del registro. Las fotos se serializan con un
clonado propio (`clone(v, stack)`) que corta ciclos y convierte `Set` en array; el motor se
refiere a las cartas por id, así que las referencias compartidas pueden guardarse como copias.

**Deshacer / rehacer.** `#undoBar` (abajo, centrada) con ↶, ↷ y un contador `n/total`. Deshacer
retrocede a la foto anterior **en la que era tu turno** (las de la IA se saltan), así el botón
siempre devuelve a una decisión tuya; rehacer avanza por la misma línea de tiempo. Se manejan con
`Ctrl+Z` y `Ctrl+Y`/`Ctrl+Shift+Z` además de con los botones. Cada foto lleva como etiqueta la
última línea del registro, así que los botones sirven además como **replay paso a paso** de lo que
ha pasado. El historial guarda hasta **40** fotos (`MAX`) y las más viejas se descartan.

La capa **no toca el motor, ni los ids, ni las reglas**: restaurar una foto escribe el estado
guardado y repinta (`renderLog`, `renderPhase`, `renderCommand`, `renderBoard`) con `applying` para
no volver a apilar fotos. Si la capa falla, la partida sigue igual.

**Partida guardada.** La partida viva se guarda en `localStorage` (`tcg_game_v1`) con una sola
copia, sin historial. Al recargar, si hay una partida guardada aparece `#undoResume` («Partida
guardada · <mazo> · turno N · HH:MM») con **Continuar** y **Descartar**; al continuar se restaura el
estado y, si tocaba turno de la IA, se relanza. Empezar una partida nueva borra la guardada.

**Comprobado**: la capa carga en los cuatro tableros sin errores nuevos en consola y el linter
`--strict` la reconoce como capa de todos. (La anterior redacción de esta sección se perdió al
reconstruir el archivo; ver la nota de reconstrucción al final.)

## Traducciones EN/FR completas y linter en verde (25 nov 2026)

**El problema no era que faltaran textos, sino dónde estaban.** En commander, brawl y standard las
traducciones existían, pero pegadas **dentro del bloque `Object.assign(I18N.es,{…})`**: primero las
francesas, luego las inglesas y al final las españolas, repitiendo la misma clave tres veces. Como
en un objeto literal gana la última, el español se veía bien y EN/FR nunca recibían esas claves
(`cm.regenFail`, `cm.shuffleLog`, `ed.sets`, `ed.setsHint`). Lo mismo dentro de `rules-core` con
`r.counters`, `r.exile` y `r.costLess` (en captain solo esas tres).

- Las líneas se **movieron tal cual** a su bloque `I18N.en` / `I18N.fr` (no se reescribió ni una
  cadena, ni española ni traducida): se quitan del bloque ES y se insertan tras `'cm.kitBadge'` en
  su bloque (o tras `'r.cost'` en rules-core). También se corrigió la fuente `tmp/rules_core.js`
  para que un futuro `install_rules.py` no lo deshaga.
- Reversión: `tmp/versions/<tablero>_before_i18nlangs.html`.

**Linter**: `BASE` y `DUPLICATE_LAYER_BASE` quedan **vacíos** (con un comentario que lo explica).
`python tmp/lint_boards.py --strict` sale en verde **sin pendientes** (41 → 27 → 0).

**La capa `arena-v11` "duplicada" no era una capa.** Las dos apariciones de
`<style id="arena-v11-separated-player-halves">` están dentro de plantillas de impresión
(`printList()` y la hoja), no en el DOM: el tablero se pinta con otras capas. Se quitó el id de la
copia de la hoja de impresión (ese documento no lo usa) y queda una sola aparición.

**Bug real encontrado de paso: faltaba `<meta charset>`.** Ninguno de los cuatro tableros declaraba
la codificación, así que servidos por HTTP (`python -m http.server`) el navegador decodificaba como
windows-1252 y **todos los acentos salían rotos**. Se añadió `<meta charset="utf-8">` justo después
de `<html lang="es">` en los cuatro. Comprobado: `document.characterSet` = `UTF-8` y ningún «Ã» en
`document.body.innerText`.

**Comprobado**: `--strict` y normal en verde; `t()` en **es/en/fr** para las 7 claves en commander,
brawl y standard y las 3 de captain (ninguna devuelve la clave ni texto roto); partida real en
standard (20 vidas, 7 en mano, overlay de mulligan con acentos correctos) y en commander (40 vidas).
Consola sin errores nuevos.

## Reglas de construcción por formato: auditoría y arreglos (25 nov 2026)

Repaso de las cuatro webs con pruebas en vivo (`cmdDeckIssues`, `cmdPickCommander`,
`combinePacks`) y parcheo de lo que no cuadraba.

| formato | tamaño | comandante | copias | vidas | planeswalker |
|---|---|---|---|---|---|
| commander | 100 = 1 + 99 | **obligatorio** | singleton (básicas libres) | 40 (Duel 20) | solo con «can be your commander» |
| brawl | 60 = 1 + 59 | **obligatorio** | singleton | 30 | **cualquiera** (regla de Arena) |
| standard | 60 | no existe | hasta **4** | 20 | n/a |
| captain | 40 = 2 sobres de 20 | no (el capitán sale de los sobres) | singleton | 20 | n/a |

**Fallo 1 · brawl rechazaba planeswalkers.** Los textos ya prometían «any legendary creature and
any planeswalker» (`fmt.brP`, `home.s2p`, `of.desc`), pero `cmdPickCommander` buscaba con
`is:commander` y filtraba «solo criatura legendaria o can be your commander»: al escribir «Jace
Beleren» el editor contestaba que no vale. Arreglo (`tmp/brawl_planeswalker.py`): helper
`cmdCmdOk(c,fmt)` (legendaria, «can be your commander» o, fuera de Duel, cualquier planeswalker),
búsqueda extra `t:legendary t:planeswalker`, y kit y Foundations eligiendo también planeswalkers.
Comprobado: Jace Beleren aceptado en brawl (mazo 59 + Jace = 60, identidad U, sin avisos), en
commander sigue rechazado y Teferi, Temporal Archmage (que sí puede ser comandante) aceptado.

**Fallo 2 · standard marcaba todos los mazos con «sin comandante».** `cmdDeckIssues` exigía
comandante también en standard, así que cada mazo llevaba el aviso `cm.is.nocmd`. Ahora el bloque
del comandante va bajo `if(!STD_NO_CMD)` (`tmp/std_issues_fix.py`).

**Fallo 3 · standard contaba duplicados por singleton.** Avisaba `cm.is.dup` a partir de **2**
copias cuando el formato permite 4; ahora salta a partir de `STD_COPIES+1` (5). Comprobado: 4
copias de Lightning Bolt no avisan, 5 sí.

**Fallo 4 · los mazos de Foundations de standard nacían sin identidad.** `genFDN` no pasaba
`identity` y `cmdIdentityOf` solo miraba `identity` o el comandante: en un mazo WR la identidad
salía **vacía** y la auditoría marcaba 39 cartas «fuera de identidad». Arreglo
(`tmp/std_identity_fix.py`): `genFDN` guarda `identity:d.pair` (standard y captain) y en standard
`cmdIdentityOf` cae a la unión de las identidades de las cartas cuando no hay comandante.
Comprobado: mazo FDN regenerado → `identity:['W','R']`, 0 cartas fuera, avisos restantes solo
`cm.is.roles` (consejo de estructura, no una regla).

**Fallo 5 · la auditoría de commander aceptaba cualquier planeswalker** como comandante (regla de
Brawl). Ahora `cm.is.cmd` exige criatura legendaria o «can be your commander»
(`tmp/cmd_issue_planeswalker.py`). Comprobado: Jace → aviso; Teferi → sin aviso; criatura → sin aviso.

**Comprobado además**: standard 60 cartas / 20 vidas / `STD_NO_CMD:true`; commander 99 + comandante
= 100 / 40 vidas; brawl 59 + comandante = 60 / 30 vidas; captain `PACK_SIZE=20` y `CMD_TOTAL=40`,
dos sobres de 20 se combinan en **exactamente 40** cartas sin repetidas (singleton automático) y
con su capitán. Linter `--strict` en verde.

## «Solo tierras de Star Trek»: caché de pools sin la fuente (25 nov 2026)

**Síntoma**: tras elegir un set UB (o cualquier set) en el generador, los mazos siguientes salían
**casi todo tierras** y con cartas de otro set (Star Trek), aunque en el selector ya hubiera otro
set. En captain no pasaba: su generador de sobres no cachea pools.

**Causa doble, en commander/brawl/standard:**

1. **La clave de la caché no incluía la fuente.** `cmdPool` y `cmdLandPool` cachean por
   `formato|identidad`; el filtro de `#vSource`/`#vSet` entraba en la *consulta* pero no en la
   clave. El primer mazo de una identidad fijaba el pool (p. ej. `set:trk`) y los siguientes lo
   reutilizaban aunque cambiaras el set → «siguen saliendo cartas de Star Trek».
2. **El mazo corto se completaba con básicas.** Cuando el pool de hechizos no llegaba a
   `spellsTarget`, el constructor de la capa hacía `all.push(...cmdBasicCycle(CMD_LIB-all.length,…))`
   (y `cmdLibraryFor` hace lo mismo al jugar): un set con pocas cartas para esa identidad producía
   un «mazo» de 99 cartas con 51-60 tierras.

**Arreglo** (scripts `tmp/fix_poolcache.py` y `tmp/fix_landpad.py`, copias previas
`tmp/versions/*_before_poolcache.html` y `*_before_landpad.html`):

- Clave de caché: `f+'|'+(identity||'C')+'|'+(setQ||sourceFilter()||'')` en las **tres** definiciones
  de cada tablero (la original y la que redefine la capa de análisis).
- Guarda antes del relleno: si `chosen.length < floor(spellsN*0.95)` se lanza `v.needCards` (toast
  «Pas assez de cartes… / No hay cartas…») en vez de fabricar el montón de tierras. El constructor
  original lleva la misma guarda con `spellsTarget`.
- captain no necesita cambios (no tiene caché de pools; ya lanzaba `v.needCards` con pools vacíos).

**Comprobado en partida real** (standard, commander, brawl, `#vSet` cambiado sin recargar):
`set:trk` → mazo del set correcto (standard 60 con 24 tierras; brawl 59+comandante con 24;
commander 99 con 37); cambio a `set:j25` → mazo **solo** de j25 (antes seguía saliendo trk);
commander con `set:trk` e identidad corta → toast de error y **ningún** mazo de tierras. En captain,
`set:bot` (2 cartas) → toast de error, `set:msh` → 5 sobres de 20 con 8 tierras. Linter
`python tmp/lint_boards.py` en verde. No se tocó el kit FDN (su ensamblador tiene su propio relleno).

## Contador de mazo y regenerar con el set original (25 nov 2026)

**Síntoma (brawl)**: la tarjeta del mazo decía «60/100» (y el editor «60/100») en un formato de
60 cartas; algunos mazos se veían como «20/100» y, al pulsar «Regenerar», se quedaban igual,
sobre todo si en el generador había un set estrecho seleccionado.

**Causas:**

1. Los contadores estaban a mano: `+(p.cards||[]).length+1}/100` en la tarjeta del mazo,
   `total+'/100'` en `renderEditor` y `a.total+'/100'` en los chips de auditoría (brawl, heredado
   de commander). Standard tenía `/60` fijo y además sumaba el comandante heredado de los mazos
   viejos (61/60).
2. `cmdRegen` **no guardaba la fuente** con la que se creó el mazo: el constructor leía
   `sourceFilter()` del formulario de la pantalla. Si allí había un set UB (p. ej. Star Trek), el
   pool de esa identidad no llegaba y el constructor lanzaba `v.needCards`: el mazo quedaba como
   estaba (20 cartas) y el toast solo decía que no se pudo regenerar.
3. Las cachés de pool (`CMD_POOLS`/`CMD_LAND_POOLS`) indexan con `sourceFilter()`, así que aunque
   el constructor recibiera la fuente del mazo, la clave seguía leyendo el formulario.

**Arreglo** (`tmp/fix_regen_src.py`, `tmp/fix_regen_src2.py`, `tmp/fix_regen_src3.py`; copias
`tmp/versions/*_before_regensrc*.html`):

- Contadores con `CMD_TOTAL` en commander/brawl/standard (tarjeta del mazo, `#edCount` y chips).
  En brawl el respaldo estático pasa a `0/60`. En standard el total es `cards.length` sin sumar el
  comandante heredado (`tmp/fix_regen_src3.py`).
- El mazo guarda su fuente: `cmdBuildDeck` acepta `opts.src` (si no llega, usa `sourceFilter()`) y
  devuelve `srcQ`; `cmdNormDeck`/`cmdSerDeck` lo conservan y `cmdRegen` lo pasa de vuelta.
- `cmdRegen` sustituye `sourceFilter()` por `p.srcQ` mientras dura la reconstrucción (y lo restaura
  en `finally`), así que cachés y consultas usan el set del mazo, no el del formulario.
- Los mazos viejos sin `srcQ` se regeneran con «cualquier carta» (`src:''`), nunca heredando el
  selector abierto.
- Los mazos de Foundations (`source:'fdn'` o `srcQ` con `set:fdn`) se rehacen con
  `window.fdnBuild()`, así que siguen siendo FDN.

**Comprobado en partida real** (navegador, `cmdRegen` sobre los mazos de verdad):

| tablero | contador | regenerar con el formulario en otro set | resultado |
|---|---|---|---|
| brawl | 60/60 | mazo `srcQ=set:trk`, formulario en `set:j25` | sigue **trk**, 59 cartas |
| brawl | 60/60 | mazo viejo sin `srcQ`, formulario en `set:trk` | se rehace con cualquier carta, sin error |
| brawl | 60/60 | mazo FDN | 59 cartas, **todas fdn**, `sets:'FDN'` |
| brawl | 60/60 | mazo de 20 cartas (prueba) | rellena a 59 |
| commander | 100/100 | `srcQ=set:j25`, formulario en `set:trk` | sigue **j25**, 99 + comandante |
| standard | 60/60 | `srcQ=set:j25`, formulario en `trk` | sigue **j25**, 60 cartas |

Linter `python tmp/lint_boards.py --strict` en verde. `captain` no se toca: no tiene `cmdRegen`
ni contador `/100` (sus mazos son dos sobres de 20, modelo propio).

## Auditoría de generadores y número de cartas (25 nov 2026)

Repaso de los cuatro formatos con generación real en el navegador (una de cada fuente).

| formato | constantes | virtual | Foundations | Sets Kit | partida |
|---|---|---|---|---|---|
| commander | `CMD_LIB=99`, `CMD_TOTAL=100` | 99 + comandante = **100** | 99 + comandante = **100**, todo `fdn` | 99 + comandante = **100**, no básicas del set | 40 vidas (Duel 20) |
| brawl | `CMD_LIB=59`, `CMD_TOTAL=60` | 59 + comandante = **60** | **60**, todo `fdn` | **60**, no básicas del set | 30 vidas |
| standard | `CMD_LIB=60`, `CMD_TOTAL=60`, `STD_NO_CMD`, `STD_COPIES=4` | **60**, `commander:''` | **60** sin comandante, hasta 2-4 copias | **60**, solo el set | 20 vidas |
| captain | `PACK_SIZE=20`, `CMD_TOTAL=40` (nuevos) | sobres de **20** | 2 sobres × 20 = **40**, todo `fdn` | no tiene kit | 20 vidas |

Lo comprobado, mazo a mazo (`state.packs` + `cardOfSafe`): longitudes exactas, comandante
aparte de la biblioteca sólo en commander/brawl, `commander:''` en standard, y en captain
40 cartas por mazo repartidas en dos sobres de 20. Los set-filtros dan sólo cartas del set
(en los mazos de FDN aparecen «Rogue's Passage» y «Evolving Wilds» con impresión de ORI, pero
las dos existen en FDN: es la impresión resuelta, no una carta de otro set).

**Dos agujeros de verificación, ya tapados** (`tmp/audit_sizes.py`):

1. `captain.html` **no declaraba su total**: `FDN_TOTAL` caía en el respaldo `:40` del ternario
   `(typeof CMD_TOTAL==='number')?CMD_TOTAL:40`. El linter «comprobaba» 40 con la regex
   `CMD_TOTAL:(\d+)`, que casaba con ese mismo ternario: daba por bueno un valor que no existía.
   Ahora captain declara `PACK_SIZE=20` y `CMD_TOTAL=PACK_SIZE*2`, y el linter busca
   `\bCMD_TOTAL\s*=\s*(\d+|PACK_SIZE\s*\*\s*\d+)` esperando `PACK_SIZE*2`.
2. Los contadores de cartas estaban a mano en varios sitios. `HARDCODED_COUNT` del linter falla
   si vuelve un `textContent=total+'/N'`, un `chip(a.total…,'/N')` o un `length+1}/N` en
   commander/brawl/standard (autoprobado: los tres patrones detectan el código viejo y dejan
   pasar el nuevo).

**Ya no**: el generador virtual de standard monta playsets de cuatro copias (ver «Standard:
playsets de verdad»). `cmdTakeCurved` quedó en el constructor antiguo, que ya no se usa.

## Foundations: set completo, mazos distintos y marca visible (25 nov 2026)

**Lo que pedía el usuario**: los mazos hechos con FDN tienen que quedar marcados y poder usar
**todas** las cartas del set, se repitan o no en otros mazos.

**Lo que había.** El pool ya era el set entero (`searchCards('game:paper set:fdn')` devuelve
**517** cartas únicas: `searchCards` sube a `RULES_SET_PAGES` cuando la consulta lleva `set:`) y
el `used` de `fdnAssemble` es **local a cada tirada**, así que nunca hubo exclusión entre mazos.
El problema era otro: el generador era **determinista**. `fdnPair()` devolvía siempre la pareja
de colores con más cartas, `fdnAssemble` recorrido el pool en el orden de Scryfall y el comandante
era siempre `leg[0]` (el de más texto). Resultado: dos mazos FDN seguidos salían **idénticos**
(comparados carta a carta, `JSON.stringify` iguales), y parecía que el set estaba limitado.

**Arreglo** (`tmp/fdn_variety.py` y `tmp/fdn_variety2.py`, copias
`tmp/versions/*_before_fdnvariety.html` y `*_before_fdnmark.html`), en los **cuatro** tableros:

- `fdnShuffle()` dentro de la capa `fdn-deck`; `fdnAssemble` baraja candidatos y tierras no básicas
  (en standard se baraja el `plan` de playsets). El pool sigue siendo el set completo: cualquier
  carta de FDN puede caer en cualquier mazo.
- `fdnPair(pool,need)` elige la pareja **al azar entre las que tienen cartas de sobra** para el mazo
  (`need` = huecos de hechizos, calculado con las tierras de `fdnBuild`), mono incluidas; si no hay
  pareja viable cae al orden por cantidad. Un color solo se nombra una vez (`W`, no `WW`).
- El comandante sale al azar entre los **12 leyendas** con más texto de la identidad.
- **Marca**: la tarjeta del mazo ya pintaba `srcLabel(p.source)` → «Foundations (FDN)», así que la
  insignia añadida de más se quitó (salía dos veces). En captain también salía ya.
- **Editor**: «Sets del mazo» no ofrecía FDN y un mazo FDN abierto en el editor mostraba «cualquier
  set» (y al tocar el campo perdía la marca). Ahora el selector lleva la opción
  `<option value="FDN">Foundations (FDN)</option>` en commander/brawl/standard, y al guardar el mazo
  conserva `sets:'FDN'` (comprobado: abrir + Guardar deja `sets:'FDN'`).

**Comprobado en el navegador** (dos mazos FDN por tablero, comparados):

| tablero | mazos | cartas | ¿idénticos? | en común | set |
|---|---|---|---|---|---|
| commander | `Foundations UB · #12`, `#13` | 99 + comandante = 100 | no | 53 | solo fdn |
| brawl | `Foundations WU · #113`, `Foundations RR→W · #115/116` | 59 + comandante = 60 | no | 12-35 | solo fdn |
| standard | `Foundations G · #19`, `Foundations WG · #20` | 60 | no | 30 | solo fdn, hasta 2 copias |
| captain | 5 mazos = 10 sobres (`BG`, `BR`, `WG`, `G`…) | 20 por sobre, 40 por mazo | no | 9 | solo fdn |

Antes del cambio, los dos mazos de FDN de brawl eran **exactamente iguales**. La insignia sale una
vez por tarjeta y el editor muestra y conserva la marca. Linter `--strict` en verde.

## Standard: playsets de verdad (25 nov 2026)

El generador virtual de standard (`cmdBuildDeck` de `standard.html`, el que usa
`cmdGenVirtual`) elegía ~36 cartas **distintas** y rellenaba hasta 60 con básicas: una copia
por carta, cuando el formato permite cuatro. Ahora monta playsets como Cimientos
(`tmp/std_playsets.py`):

- el plan se ordena primero por roles y luego se reparte en rondas entre ellos (resto, ramp,
  robo, removal, barridos y cuerpos), así las cuatro copias de una carta no se comen el mazo;
- se juegan hasta `STD_COPIES` (4) copias de cada una de las ~9-12 cartas distintas del plan;
- tope de **2** copias para cartas de 5+ maná y para los barridos (no se quieren 4 Wraths);
- las 60 cartas y el máximo de cuatro copias se mantienen (`cmdSanitize100` sigue cortando en 4).

Comprobado con un mazo real generado desde el botón («Generar», cantidad 1): 60 cartas, sin
comandante, 24 tierras, 36 hechizos con 3-4 copias (2 en las caras y en Wrath of God), ningún
aviso de `cmdDeckIssues` y `identity` correcta.

## Los sets crossover (Star Trek, Marvel…) fuera de los mazos (25 nov 2026)

Síntoma: los mazos y el tablero insistían en tierras con arte de **Star Trek**. Motivo: Scryfall,
con `unique=cards`, devuelve la impresión **más reciente** de cada carta. Star Trek Commander
(`trc`, 13/11/2026) reimprimió Command Tower, Exotic Orchard, Spire of Industry, Path of
Ancestry…, y como el pool de tierras pedía esa impresión, el arte crossover entraba en el mazo
y en la mesa. Las básicas ya estaban protegidas (`BASIC_PRINT_SETS`), por eso el problema se veía
sobre todo en las no básicas.

Arreglo (`tmp/ub_lands_fix.py`, `tmp/unub_art_fix.py`):

- `UB_SET_CODES` + `UB_SET_EXCL`: lista estática de los sets Universes Beyond con cartas
  (trk/trc/sds, hob/hoc, msh/msc, tmnt, tla, spm, fin, acr, pip, who, ltr, 40k, mdd… y sus
  promos) y exclusión `-set:` en las búsquedas de pool, tierras, temas y tribu. Solo se aplica
  cuando **no** se pide un set concreto: si eliges Star Trek a mano, sale Star Trek.
- los pools cacheados estrenan clave (`|ub1`) para no reutilizar los que traían arte crossover;
- `unUbSweep()` repinta con la impresión clásica las cartas que ya estaban en caché con arte
  crossover, así los mazos viejos también dejan de enseñarlo en la lista.

Comprobado en commander/brawl/standard: el pool de tierras de W ya no trae ninguna impresión
crossover (Command Tower sale de `frc`, no de `trc`) y un mazo generado tiene cero cartas de set
crossover.

## Sagas y planeswalkers: reglas de verdad (25 nov 2026)

Ninguna de las dos cosas funcionaba: `grep -c saga` daba **0** en los cuatro tableros (una saga
era un encantamiento mudo) y los planeswalkers solo «existían» en commander/brawl/standard por
la capa `adv-rules`; en `captain` entraban sin lealtad, sin habilidades y sin poder morir.

Capa nueva `saga-pw` en los cuatro tableros (`tmp/saga_pw.css`, `tmp/saga_pw.js`):

    python tmp/inject_layer.py saga-pw tmp/saga_pw.css tmp/saga_pw.js commander.html brawl.html standard.html captain.html

Añadida a `LAYER_GROUPS['todos']` del linter.

**Sagas**

- Entra con **1 contador de relato** y resuelve el capítulo I en el acto.
- Al empezar tu fase principal (primer repintado de cada turno) suma un contador y resuelve **ese**
  capítulo; los capítulos múltiples («I, II — …») y la raya tipográfica se leen bien.
- Al llegar al último capítulo se resuelve y la saga **se sacrifica** (al cementerio).
- Contador visible en la carta (`.loy.lore`), y la IA también las lleva (el disparo es del jugador
  activo, no solo del humano).
- Los efectos pasan por `applySpell`; además la capa resuelve dos casos que el motor no entendía:
  «las criaturas/caballeros que controlas obtienen +N/+M» (se aplica a **todas** las que coinciden,
  no a una) y «cada jugador roba N» / «el jugador objetivo roba N» (el motor solo reconoce
  «draw a card»).

**Planeswalkers**

- Entran con su lealtad (una sola vez: si `adv-rules` ya la puso, la capa no repite el aviso) y
  muestran el contador en la carta.
- **Panel propio de habilidades** (`#swPanel`) con +N / −N por cada línea de lealtad: una por
  turno, sin bajar de 0, solo en tus fases principales. Se usa cuando el panel del motor no existe
  o está oculto (pasa en `captain` y en `standard`, donde `#jCmd` está en `display:none`), así que
  las habilidades son usables en los cuatro.
- Si la lealtad llega a 0, el planeswalker muere (al cementerio) también en `captain`.
- `loyalty` y `loy` se mantienen sincronizados para que el ataque de la IA a planeswalkers que ya
  traía `captain` (`x.pw && x.loy`) siga viendo la lealtad real.
- Ganchos de prueba: `window.__sagaChapters`, `window.__sagaMax`, `window.__pwAbs`.

**Verificado en partida real** (mazo inyectado en el navegador, `startGame` + `playFromHand`):

| tablero | saga (History of Benalia) | planeswalker (Jace Beleren) |
|---|---|---|
| captain | relato 1 + ficha, relato 2 + ficha, relato 3: +2/+1 a las dos fichas y se sacrifica | entra con 3, panel `+2 / -1 / -10`, +2 → lealtad 5, roban los dos, botones apagados el resto del turno |
| standard | igual (1 ficha, 2 fichas, +2/+1, sacrificio) | entra con 3, `#swPanel` visible (el panel del motor está oculto) |
| brawl | igual | entra con 3, panel visible |
| commander | igual, textos en español correctos | igual; +2 → lealtad 5 y robo de ambos |

**Fallo de fondo encontrado de paso: los cuatro tableros no tenían `<meta charset>`.** Servidos por
HTTP el navegador caía en windows-1252 (`document.characterSet` lo delataba) y todos los acentos y
las rayas salían mal; por eso la primera versión de la capa no reconocía «I, II — …». Añadido
`<meta charset="utf-8">` tras `<html lang="es">` en los cuatro (`tmp/add_charset.py`). Comprobado:
`document.characterSet` = UTF-8 y los textos de la capa salen con acentos.

**Limitaciones conocidas**: no hay transformación de sagas que se convierten en criatura, las
habilidades de lealtad con X o con costes raros se resuelven como texto normal, y el «hasta el
final del turno» de los bonos lo limpia el motor a su manera.

**Ojo con el perfil del navegador**: en el perfil con mazos guardados, `commander.html` se queda
con el hilo principal bloqueado al cargar (`preview_evaluate` no responde). No es de esta capa:
también pasa con `versions/commander_2026-11-25_2105.html`, anterior a todos los cambios de hoy, y
en una pestaña de incógnito (sin `localStorage`) carga bien. Queda anotado como pendiente de
investigar (probablemente el repintado de la lista de mazos con muchos nombres sin resolver).

**Reversión**: `tmp/versions/<tablero>_before_sagapw.html` y `*_before_charset.html`.

## Tierras básicas: nada de arte crossover (25 nov 2026)

Scryfall, cuando le pides una carta **por nombre**, devuelve la impresión **más
reciente**. Para «Isla»/«Island» eso es hoy un set de Universes Beyond (Star Trek,
Marvel…), así que en la mesa y en la lista de mazos salía esa tierra aunque el mazo
fuera de Foundations, y aunque eligieras Foundations en el generador. Lo que se veía era
la caché (`CARD['Isla']`, set `trk` o `mdd`) tirada por `cardImg` cuando el mazo no tenía
arte propio de básicas (`captain` no lo tenía nunca: no tiene `ensureDeckBasics`).

Capa `basics-art` en los cuatro tableros (`tmp/basics_art.css`, `tmp/basics_art.js`):

    python tmp/inject_layer.py basics-art tmp/basics_art.css tmp/basics_art.js commander.html brawl.html standard.html captain.html

Añadida a `LAYER_GROUPS['todos']` del linter. Hace tres cosas:

1. **Caché**: si una básica cacheada viene de un set crossover, `cardImg` devuelve el arte
   de **m21** (clásico) y, cuando llega, repinta mesa y lista de mazos. La lista de sets UB
   es estática (trk, mdd, spm, fin, acr, ltr, who…) y además usa `isCrossoverSet` donde exista.
2. **Mazos**: al pintar la lista se borra el arte de básicas guardado de un set crossover
   (`deck.basicArt` / `basicPrints`) y se guarda el mazo.
3. **Set elegido**: si un mazo pide un set (`deck.sets`, p. ej. `fdn`) y le faltan artes de
   básicas, se los rellena con el arte **de ese set** y lo guarda.

Los nombres pueden venir localizados («Isla»): Scryfall pone el del idioma en `printed_name`,
así que el arte se indexa por `printed_name` **y** `name`, y si no aparece se busca por color
(`BASIC`) o por el tipo de la carta. Las peticiones se reintentan (Scryfall corta en ráfaga
con 429 sin cabeceras, que en el navegador se ve como «Failed to fetch») y no se reintroducen
durante 60 s si el set falla.

**Verificado** en `captain` y en `standard`, con `cardOf('Isla')` cacheada de `trk`:
`cardImg` devuelve la imagen de m21 (uuid `fc9a66a1-…`, arte clásico) en vez de la de Star
Trek, y un mazo de prueba con `sets:'fdn'` recibió arte `fdn` para «Isla», «Bosque» y
«Montaña» (set y `basicPrints` correctos). Los mazos de prueba se borraron después.

**No cubierto**: si eliges a mano un arte de un set crossover como arte de básica, la capa lo
descarta (es justo el caso que se quería evitar). El símbolo de la carta en el buscador
sigue mostrando la impresión más reciente; la capa actúa al pintar cartas.

**Reversión**: `tmp/versions/<tablero>_before_basicart.html`.

## Tipo de generación de cada mazo (capa `deck-gen`, 25 nov 2026)

En «Mis mazos» todo caía en la misma rejilla sin decir de dónde salía cada mazo: un mazo del
generador virtual, uno de Foundations, uno del kit de sets y uno importado se veían igual (solo
`commander`/`brawl`/`standard` llevaban una píldora de formato y plantilla; `captain` sí enseñaba
`srcLabel`, pero siempre en el mismo gris).

Capa `deck-gen` en los cuatro tableros: `<style id="deck-gen-css">` + `<script id="deck-gen">`
(`tmp/deck_gen.css`, `tmp/deck_gen.js`), inyectada antes de `</body>` y añadida a
`LAYER_GROUPS['todos']` del linter:

    python tmp/inject_layer.py deck-gen tmp/deck_gen.css tmp/deck_gen.js commander.html brawl.html standard.html captain.html

- **Etiqueta de color** en la fila de datos de cada tarjeta (`.cmdeckmeta` en
  commander/brawl/standard, `.meta` en captain): `🎲 Generador`, `🧱 Foundations`, `🧰 Kit de sets`,
  `🏛 Precons oficiales`, `📋 Importado`, `✍ Manual`, `🃏 Mi colección`. Cada tipo con su color, y
  `title` con el mismo texto.
- **Chips de filtro** encima de la rejilla (solo si hay más de un tipo): `🗂 Todos (n)` más un
  chip por tipo con su cuenta. La lista sigue siendo **una sola** (los mazos no se separan en
  secciones): el chip solo oculta las tarjetas que no tocan.
- **Cómo se deduce el tipo** (`genOf(p)`), sin migrar datos guardados: `source` `fdn` → Foundations,
  `physical` → Mi colección, `oficial` → precons, `importado` → importado, `manual` → manual y
  `kit` (o `source:'virtual'` con todos los `sets` dentro de `CMD_KIT_SETS`) → Kit de sets; el resto
  → Generador. Los mazos viejos que no traen `source` —o que lo tienen a «manual» porque se
  lo puso el saneador al cargarlos— se **deducen** con `inferOf(p)` por lo que llevan dentro:
  sets del kit → Kit de sets; `FDN` en `sets`/`setCode` o nombre que empieza por «Foundations»
  → Foundations; nombre «Nombre · COD #n» con 20 cartas → precons; «Sobre importado N» /
  «Imported pack N» / «Booster importé N» → importado; y nombre acabado en « #n» con
  comandante, tema, color o identidad («W · #7») → Generador. Sin una señal fuerte se queda en
  manual. Para que la deducción sea posible, `cmdNormDeck`, `cmdSerDeck` y la carga de mazos ya
  **no rellenan** `source` con «manual» (`tmp/deck_gen_infer.py`): lo dejan vacío. La píldora gris
  de `srcLabel` también sale de la tarjeta del mazo, porque el chip de color la sustituye (antes
  un mazo deducido habría enseñado «manual» en gris al lado de «Generador»).
- La capa **no toca** `renderPacks`, el guardado ni el motor: envuelve `renderPacks()` y decora el
  DOM ya pintado (busca `.pack[data-pack]` y cruza el id con `state.packs`), y escucha los clics de
  los chips para volver a pintar. Si la lista ya estaba pintada al entrar la capa, decora igual.

**Textos** ES/EN/FR (`gen.all`, `gen.virtual`, `gen.fdn`, `gen.kit`, `gen.official`, `gen.imported`,
`gen.manual`, `gen.collection`, `gen.hint`) añadidos tras `I18N.es['src.fdn']` con
`tmp/deck_gen_i18n.py`; las mismas nueve claves en los cuatro tableros, como pide el linter.

**Comprobado en el navegador** (pestañas de incógnito, sin tocar el perfil):
- standard con seis mazos de prueba (virtual, fdn, kit por `sets`, oficial, importado, manual):
  seis etiquetas correctas (`manual`, `imported`, `official`, `kit`, `fdn`, `virtual`) y siete chips
  (Todos + 6). Clic en «Foundations» → 1 tarjeta visible; clic en «Todos» → 6, con las etiquetas
  intactas tras cada repintado.
- captain con tres mazos (virtual, fdn, manual): etiquetas dentro de `.meta`, chips
  `Todos 3 / Generador 1 / Foundations 1 / Manual 1`, filtro → 1 visible.
- Linter `--strict` en verde. Los mazos eran de prueba y vivían solo en esas pestañas.

**Reversión**: `tmp/versions/<tablero>_before_deckgen.html`.

## Revisión a ojos frescos de `deck-gen` (25 nov 2026)

- **Un mazo guardado sin `source` ya no se presenta como manual**: `genOf(p)` llama a `inferOf(p)`
  cuando no hay fuente (o cuando la fuente es el `manual` que ponía el saneador) y deduce el tipo
  por sets, nombre y forma del mazo. `inferOf` está expuesta en `window.__deckGen` para probarla.
- **El dato ya no se pierde al cargar**: `cmdNormDeck`, `cmdSerDeck` y la carga de `state.packs`
  dejan `source` vacío en vez de rellenarlo con «manual» (antes `ensureSeq()` volvía a guardar
  ese «manual» y el origen se perdía para siempre). Script `tmp/deck_gen_infer.py`, reversión
  `tmp/versions/<tablero>_before_geninfer.html`.
- **Sin etiqueta duplicada**: la píldora gris de `srcLabel` sale de la tarjeta del mazo (el chip de
  color la sustituye). En la lista de sobres de 20 cartas se queda como estaba.
- **Comprobado** en `standard.html` (incógnito, sin tocar el perfil): `cmdNormDeck({name:'X'}).source`
  devuelve `''`; `inferOf` da `virtual` para «Krenko · #12» con comandante, `fdn` para «Foundations WR
  · #4», `manual` para un nombre escrito a mano, `official` para «Sacred Cat · J22 #9»; con cuatro
  mazos de prueba sin `source` la rejilla pinta `🎲 Generador` / `🧱 Foundations` / `📋 Importado` /
  `✍ Manual`, sin píldora gris, con chips `Todos 4` + uno por tipo y el filtro Foundations dejando 1
  visible. Linter `--strict` en verde en los cuatro.

## Qué necesita cada tipo de mazo y en qué tablero vive (25 nov 2026)

Cada etiqueta de `deck-gen` se corresponde con un creador distinto del motor. Esto es lo que pide
cada uno y dónde tiene sentido que exista:

| Tipo (`gen.*`) | Lo crea | Necesita | Tableros |
|---|---|---|---|
| `virtual` 🎲 | `cmdGenVirtual` → `cmdBuildDeck` (el último, dentro del IIFE final) | pools de Scryfall por identidad, formato, plantilla y bracket; en standard añade `STD_COPIES` y no pide comandante | los cuatro (en `captain` es su `genVirtual` de sobres de 20, sin comandante) |
| `fdn` 🧱 | `genFDN` + `fdnAssemble` (capa `fdn-deck`) | pool `set:fdn` completo (517 cartas, 12 páginas), `FDN_TOTAL` del formato y su modelo (100 / 60 / 60 / 2×20) | los cuatro |
| `kit` 🧰 | `cmdGenKit` + `cmdGenKit`/`cmdKitLegendList` | `CMD_KIT_SETS` (ORI/M19/M20/M21), leyendas del set y `cmdBuildDeck` | commander, brawl y standard; **no** en captain (no existe `CMD_KIT_SETS` y su mazo son dos sobres de 20) |
| `official` 🏗 | `genJumpstart` (`genOfficial`) | índice Jumpstart real (`loadJumpstartIndex`) y las listas de 20 del set | los cuatro |
| `imported` 📋 | `parseLists` + `#oImport` | texto pegado; recorta a 20 cartas | los cuatro |
| `manual` ✍ | editor de mazos | nada externo | los cuatro |
| `collection` 🃏 | `cmdBuildFromCollection` / `regenPhysical` | colección cargada (`source:'physical'`) | commander, brawl y standard; captain no tiene importador de colección |

Con eso, el reparto correcto es el que ya hay: `captain` no debe ofrecer Kit de sets ni Mi
colección; FDN es el único tipo que cambia de forma según el tablero (mazo completo o dos sobres).
Un mazo sin `source` se deduce en cualquiera de los cuatro, porque `inferOf` solo usa campos que
todos guardan (`name`, `cards`, `sets`, `commander`, `themeId`, `color`).

## Standard: el generador virtual ya monta playsets (revisión del 25 nov 2026)

La nota de «pendiente» que quedaba en tres sitios de este archivo era **falsa**: el constructor
vivo de `standard.html` es el último `cmdBuildDeck` (el del IIFE que asigna `window.cmdBuildDeck`;
en un `<script>` clásico eso sustituye el binding global, que es el que resuelve `cmdGenVirtual`).
Su bloque de playsets (comentario «Standard permite cuatro copias», ~línea 12047) hace:

- ordena el plan por roles (él resto, ramp, robo, removal, barridos y cuerpos) y lo corta a
  `ceil(spellsN/4)+3` cartas distintas;
- da hasta `STD_COPIES` (4) pasadas; tope de 2 para maná 5+ y barridos (`copiesCap`);
- `cmdSanitize100` después corta en 4 y `cmdRepair` reequilibra curva y tierras.

Comprobado en el navegador (`standard.html`, incógnito, botón Generar cantidad 1): 60 cartas,
`commander:''`, `source:'virtual'`, máximo **4** copias, 22 cartas no básicas distintas, 14 básicas,
`cmdAudit` con `total 60` y `dupes:[]`. Tarda ~5 s.

Lo que **sí** faltaría para que los playsets sean de formato real (nada de esto está hecho):

1. **Legalidad de Standard**: el pool sigue siendo «populares de Scryfall» con el filtro UB, no
   `f:standard` ni una rotación concreta. Habría que añadir `legal:standard` (y un fallback si el
   pool se queda corto) o el mazo tendrá cartas que no son del formato.
2. **Plan estable entre regeneraciones**: el plan sale del orden por roles con ruido; regenerar
   cambia las cuatro copias. Para jugar de verdad conviene fijar un núcleo (guardar el plan en el
   mazo) y rotar solo un ~30 %.
3. **Puro playset**: `cmdRepair` reequilibra después y puede bajar copias (en la prueba salieron 22
   distintas, no 12); si se quieren 4 copias exactas de 9 cartas, la reparación tiene que respetar
   el multiplicador o hacerse antes del reparto.
4. **Variedad**: 9-12 cartas distintas a 4 copias es correcto pero muy plano; el tope de 2 para
   caras ya ayuda, se podría bajar a 3 copias + singletons de complemento.
5. **Limpieza**: el constructor viejo (`cmdTakeCurved` con su `Set`) y `genVirtual` siguen en el
   archivo aunque ya no se ejecutan; conviene borrarlos para que nadie los «arregle» por error.

## Nota de reconstrucción (25 nov 2026)

`AGENTS.md` se quedó a 0 bytes por un fallo del script `tmp/doc_geninfer.py` (abría el archivo
en modo escritura antes de fallar al serializar un emoji). Se reconstruyó desde la copia que se
había leído en la propia sesión (`tmp/agents_base1..3.md`) y desde los literales `SEC` de los
scripts `tmp/doc_*.py` y `tmp/agents_section.md`, que son los textos originales de cada sección.
El contenido es el mismo, pero la redacción de «Deshacer · recuperar la partida · replay» no es
literal (esa parte quedó cortada en la copia leída). A partir de ahora los scripts de
documentación escriben en `AGENTS.md.tmp` y lo mueven con `os.replace`.

## AGENTS.md blindado contra vaciados (25 nov 2026)

`AGENTS.md` se quedó una vez a 0 bytes porque un script de documentación lo abría
en `'w'` y fallaba después (un emoji suelto, `UnicodeEncodeError: surrogates not
allowed`): el archivo ya estaba truncado cuando el error saltó.

**Todos los scripts de `tmp/doc_*.py` escriben ahora por `tmp/agents_doc.py`**, que
nunca abre `AGENTS.md` en modo escritura:

- compila el texto nuevo en memoria y lo valida **antes** de tocar el disco: tiene que
  codificar en UTF-8, pesar al menos 20 000 bytes, no repetir encabezados `## `, no
  dejar secciones vacías y conservar las secciones base (`REQUIRED`);
- escribe en `AGENTS.md.tmp`, relee y compara, y solo entonces lo mueve con
  `os.replace` (si algo falla, `AGENTS.md` queda intacto y el script sale con 1);
- `append_section(__file__, SEC)` es idempotente: si el encabezado ya está, dice
  «ya estaba» y no escribe.

    python tmp/agents_doc.py            # valida AGENTS.md (bytes, secciones, duplicados)
    python tmp/agents_doc.py --list     # lista cada sección con su número de líneas
    python tmp/harden_doc_scripts.py    # reescribe el pie de los doc_*.py (idempotente)

**El linter también lo vigila**: `tmp/lint_boards.py` comprueba en cada pasada que
`AGENTS.md` pese más de 20 000 bytes, no tenga secciones `## ` repetidas, conserve las
secciones base y que **ningún script de `tmp/` abra `AGENTS.md` con modo `w` o `a`**
(`check_docs`). Si vuelve un `open('AGENTS.md','w')`, el linter falla con el nombre del
script.

**Comprobado**: lanzar los nueve `doc_*.py` deja el md5 de `AGENTS.md` igual; un texto
con un surrogate, un recorte a 514 bytes y una sección duplicada se rechazan con salida 1
y el archivo intacto (sin restos `.tmp`).

**Revisión de integridad del reconstruido**: los 38 encabezados `## ` de `AGENTS.md`
salen de 34 secciones de las fuentes (`tmp/agents_base1..3.md`, `tmp/agents_section.md` y
los literales `SEC` de los nueve `doc_*.py`) más las tres de `doc_geninfer.py` y esta
misma nota: **ninguna sección perdida y ninguna repetida**.

## Etiquetas de mazo revisadas con el perfil real (25 nov 2026)

Repaso de `deck-gen` con el **perfil normal** del navegador (el de los mazos de verdad, sin
incógnito), comparando `genOf(p)` con el `source` guardado de cada mazo:

| tablero | mazos guardados | `source` real | etiqueta pintada | ¿coincide? |
|---|---|---|---|---|
| standard | `brawl_decks_v1`: «Arasta of the Endless Web · #5» | `virtual`, 60 cartas | `🎲 Generador` | sí |
| brawl | `brawl_decks_v1`: el mismo mazo | `virtual`, 59 + comandante | `🎲 Generador` | sí |
| captain | ninguno (`cj2_packs` vacío) | — | — | nada que comprobar |
| commander | `cmd_decks_v1`: «Small» (99 cartas, Adeline) | `manual` | no comprobable (ver abajo) | — |

También salen como `manual` el mazo de 3 cartas de `cmd_decks_small` (sin `source` y con nombre
propio: la deducción no se inventa una fuente) y, quitando `source` al mazo real, `inferOf` sigue
devolviendo `virtual` con su nombre de verdad («Nombre · #n» + comandante).

**`commander.html` sigue colgándose en el perfil normal** (el hilo principal se bloquea al cargar y
`preview_evaluate` no responde): es el fallo ya anotado en «Sagas y planeswalkers», anterior a
`deck-gen`; en incógnito carga bien. Sin poder leer `state.packs` ahí, la etiqueta de commander no
está comprobada con el perfil real.

**Caso límite encontrado (no ocurre con ningún mazo real):** en `inferOf`, la señal de precon exige
`!p.commander`. Un objeto con nombre «X · J22 #9», 20 cartas **y** comandante saldría `virtual` en vez
de `official`. No es alcanzable hoy: `genJumpstart` guarda `commander:''` y `source:'oficial'`, y
`cmdNormDeck` no inventa comandante, así que ningún mazo oficial pierde la etiqueta. Queda anotado
por si alguna vez se rellena el comandante al cargar.

Linter `--strict` y `python tmp/agents_doc.py` en verde tras la revisión; no se tocó ningún tablero.

## Secciones obligatorias de AGENTS.md: una sola lista (25 nov 2026)

La lista de secciones que `AGENTS.md` no puede perder estaba **duplicada**: en
`tmp/agents_doc.py` (`REQUIRED`, junto al tamaño mínimo `MIN_BYTES`) y otra vez como
`DOC_REQUIRED` dentro de `tmp/lint_boards.py`. Un cambio en una dejaba la otra mintiendo.

Ahora la fuente es **solo** `tmp/agents_doc.py`: el linter hace
`import agents_doc` (mismo directorio) y usa `agents_doc.REQUIRED` y
`agents_doc.MIN_BYTES`. Si el módulo no estuviera, el linter se para con un mensaje claro
en vez de comprobar la documentación con una lista vieja.

Comprobado: `lint_boards.DOC_REQUIRED is agents_doc.REQUIRED` → `True`, los mínimos
coinciden, y añadir una sección inexistente a `agents_doc.REQUIRED` hace que
`check_docs()` la denuncie (fuente única de verdad). `--strict` en verde.

De paso, el linter cuenta ahora **también el H1** (`# …`) al buscar secciones: antes solo
miraba `## ` y daba por perdida «Instrucciones del proyecto», que es el título del archivo.
Se usan todos los encabezados, igual que `agents_doc.headings`.

## commander.html se cuelga al cargar con mazos guardados (investigación, 25 nov 2026)

**Qué pasa**: en el perfil normal del navegador, `commander.html` no responde al cargar
(el hilo principal se queda bloqueado; `preview_evaluate` caduca). El mismo perfil abre
`brawl.html` y `standard.html` sin problema, y `commander.html` en incógnito (sin
`localStorage`) carga bien. **No es una regresión de `deck-gen`**: la versión
`versions/commander_2026-11-25_2105.html`, anterior a todas las capas de hoy, también se
cuelga.

**Lo reproducido** (todo en incógnito, sembrando `localStorage` a mano):

| mazo sembrado | tablero | resultado |
|---|---|---|
| ninguno | commander / brawl / standard | carga bien |
| 99 `Plains` + Adeline, EDH (el «Small» real) | commander | **se cuelga** |
| 59 `Plains` + Adeline, brawl | brawl | **se cuelga** |
| 59 `Lightning Bolt` + Adeline | brawl | **se cuelga** |
| 59 `Plains` sin comandante | brawl | **se cuelga** |
| 60 `Plains`, sin comandante | standard | **se cuelga** |

Es decir: **basta con que haya un mazo guardado** (el contenido da igual: básicas, no
básicas, con o sin comandante), así que el disparador es el camino de carga que toca los
mazos, no la deck-gen ni una carta concreta.

**Lo descartado con pruebas**:

- **No es la red**: con `window.fetch` sustituido por un rechazo inmediato desde el `<head>`
  se cuelga igual.
- **No es el CSS**: quitando los 26 bloques `<style>` se cuelga igual.
- **No es una capa concreta**: quitando *todas* las capas `<script id>` se cuelga; y el
  tablero sin ninguna de las capas sigue igual. (Quitar una sola de las capas UX no cambia
  nada; quitar las cuatro juntas sí, lo que apunta a un efecto acumulativo de tiempos.)
- **No es el arranque**: `cmdBoot` y sus pasos medidos uno a uno son rápidos
  (loadPacks, ensureSeq, renderPacks, renderEditor, fillGameSelects, fillCaptains,
  anaRoleOf, cmdPadTo100/cmdSanitize100: todos por debajo de 1 ms). Termina (`DONE`).
- **No es el backfill de arte de básicas**: quitando el
  `setTimeout(cmdBackfillBasicArt,80)` se cuelga igual.
- **No es la restauración de pestaña** (`cx_sec`/`cx_tab`): con `#inicio` en la URL y esas
  claves borradas, se cuelga igual.

**Dónde queda**: el bloqueo empieza **después** del arranque. La última marca fiable que se
ve antes del cuelgue es el inicio del bloque «Sets Kit: chips de set» (UX LAYER 4), pero las
marcas por título/consola no son concluyentes porque el resto de capas reescriben el título
y Chromium descarta los mensajes pendientes cuando el hilo se bloquea.

**Siguiente paso recomendado** (no hecho): abrir el perfil con DevTools → *Performance* y
grabar la carga de `commander.html`, o lanzarlo con `--trace-startup` y mirar el nodo más
caliente. Con el stack de la función que gira se localiza en un minuto; a ciegas, bisecando
un archivo de 1 MB, no.

**Herramienta que queda en el repo**: `tmp/probe/make_probe.py <tablero> <salida> [ids de
capa…]` genera copias del tablero sin las capas indicadas (o sin ninguna) para bisecar. Sirve
desde `/tmp/probe/...` en el mismo origen, así que comparte el `localStorage` del perfil que
se esté usando. **Ojo**: no insertar nada reemplazando el primer `</body>`; el archivo lo
lleva dentro de una plantilla de impresión y se trunca el script entero (así se perdieron dos
pruebas de esta investigación).

## Capas playmat de captain.html declaradas en el linter (25 nov 2026)

`captain.html` creció 33 KB después de la copia sellada de las 23:58: ahora lleva diez capas
`playmat-*` / `commander-playmat-ux` de su propia piel (y volvió a saltos de línea LF). El
linter las marcaba como «capas inesperadas» y tumbaba `--strict`. Se declaran en
`BOARD_LAYERS['captain.html']`: son capas reales del tablero, no restos.

Con eso `python tmp/lint_boards.py --strict` vuelve a verde (4 tableros, 0 problemas).

## Vida a la derecha y sin carta de capitán suelta (`captain.html`)

Petición: «mueve la vida del tablero de captain a la derecha» y «quita la carta de capitán que sale
volando aislada en el tablero, ahora sobra con las zonas de mando».

Lo que había: `#jLifeAi` estaba arriba a la derecha (`.jinfo.ai{top:5px;right:8px}`) pero `#jLifeYou`
seguía abajo a la **izquierda** (`.jinfo.me{bottom:5px;left:8px}`). Además los dos nodos
`#jAiCommander` y `#jYouCommander` (clase `.jcmdslot`) estaban posicionados en el **mismo punto** del
tapete (`#jugar.playing .jcmdslot{position:absolute;top:50%;right:7px}`), así que se pintaban uno
encima del otro: una única carta de capitán flotando en el borde derecho del campo. La banda de
tierras reservaba `68px` a cada lado para esa carta (`padding:8px 68px`).

Cambio (capa nueva al final de `captain.html`, `id="captain-life-right-no-flying-commander"`):

- `#jugar.playing .jinfo.me{bottom:5px;right:8px;left:auto;justify-content:flex-end}`: la vida del
  jugador queda abajo a la derecha, espejo de la de la IA.
- `#jugar.playing #jAiCommander,#jugar.playing #jYouCommander{display:none}`: las cartas de capitán
  del tapete desaparecen. No se pierde funcionalidad porque las zonas de mando laterales
  (`#jAiCmdPanel` / `#jYouCmdPanel`) ya muestran el capitán y el botón de lanzarlo (`#jCastCmd`,
  generado en `renderCommand()`); los `.jcmdslot` solo eran decorativos.
- `#jugar.playing .jzone.jlands{padding-left:10px!important;padding-right:10px!important}`: se
  cierra el hueco lateral que estaba reservado a esa carta.

Comprobado en el navegador con una partida de prueba (40 Plains por bando, capitán Plains):
`#jLifeYou` pasa de `x=227` a `x=858` con el campo acabando en `913`; `.jinfo.me` con
`right:8px/left:auto`; `#jAiCommander` y `#jYouCommander` con `display:none` y caja `0×0`; la banda
de tierras con `padding-left/right:10px`. `python tmp/lint_boards.py --strict` en verde (la capa está
declarada en `BOARD_LAYERS['captain.html']`). Reversión: `tmp/versions/captain_before_liferight.html`.

## Tablero de captain en standard, brawl y commander (26 nov 2026)

Los tres tableros hermanos dejan de tener su mesa propia: `#jTable` pasa a tener **el mismo
marcado que `captain.html`** y su misma piel, en una capa final `<style id="captain-board-css">`.

    python tmp/build_board_port_css.py                      # extrae la cascada de captain
    python tmp/port_captain_board.py standard.html brawl.html commander.html

Reversión: `tmp/versions/<tablero>_before_captainboard.html`.

### Marcado (igual en los tres)

`#jTable > .jgrid > (.jmain > #jPhaseBar + .jbody > (.jpiles + .jplay) + aside.jside)`:

- `.jpiles`: dos `.pstack` (IA arriba, tú abajo) con biblioteca, cementerio, exilio y mando.
- `.jplay`: `jinfo` de la IA arriba a la derecha, mano del rival, tierras, campo, `.jmid`
  (`#jStatus`, `#jNext`, `#jCoach`), campo y tierras propios, `jinfo` tuyo **abajo a la derecha**
  y tu mano. Las vidas van superpuestas en las esquinas del tapete, como en captain.
- `aside.jside`: herramientas, panel «Zona de mando» (`#jCmdPanel` > `#jCmd`) y registro.
- `#jBlockWrap` sigue fuera de `.jgrid`.
- Todos los ids del motor se conservan (`#jAiLib`…`#jYouHand`, `#jLifeAi`/`#jLifeYou`,
  `#jAiMeta`/`#jYouMeta`, `#jCmd`, `#jLog`, `#jTurn`, `#jNext`, `#jStatus`, `#jCoach`).
- **No** se portan `#jAiCommander`/`#jYouCommander` (las cartas sueltas del tapete de captain):
  en estos tableros esos ids no existen y el motor no los pinta.
- **No** se porta el panel `.jcmdbox-ai` (`#jAiCmdDetails`): allí lo rellena el motor de captain;
  en estos tres la zona de mando solo tiene el panel del jugador (`#jCmd`) y la pila `#jAiCmd`.
  Con una carta de comandante el panel mide 250×251 (y 271 con el daño de comandante), dentro de
  la columna de 280 px. La carta va a **52 px** —la piel vieja la subía a 88 px con `!important`
  y en la columna parecía un cartón— y el renglón del impuesto (`Impuesto − +{N} +`) queda
  siempre dentro del panel, en oro y en una sola línea: los botones siguen sumando y restando
  de dos en dos y el panel se repinta al momento.
- En `standard.html` el marcado es el mismo (el linter exige ids iguales entre hermanos) y la
  capa apaga lo del comandante: `.jcmdbox` y `.pmini.cmd` a `display:none`.

### Qué se apaga del tablero viejo

Las capas del tablero anterior siguen en el archivo pero con `media="not all"`, que las deja
inertes y se revierte borrando el atributo. Son las que pisaban la geometría portada con
`!important` (`grid-template-columns` de 142/156/200/212 px, `height:100%`, filas fijas de
`.jbody`, el raíl de fases, el reparto `.mix-half` y el tilt 3D):

    arena-v11-separated-player-halves · v3-mat · playmat-v12 · playmat-v13-arena
    playmat-v14-fit · cm-ux-v2-style · arena-v15-final

(`board-mix-css` estaba en esa lista y se retiró del todo el 26 nov: ver la sección del CSS
compartido.)

Se quedan encendidas, porque también sirven a la mesa portada: `arena-mat-css` (mesa de madera,
cartas con el arte recortado, `.am-id`, `#jTurnPill`), `arena-v16-feedback` (daño marcado y aro
de prioridad), `mull-arena`, `rules-core`, `saga-pw`, `undo-layer`, `basics-art`, `deck-gen`,
`home-fit`, `fdn-label-css` y `standard-css`/`standard-nocmd-css` en standard.

Además, dentro del `<script>` sin id de la capa `cm-ux-v2`, `cmdRail()` queda como función vacía
(`cmdRailOld` conserva el código): creaba un `aside.jrail-left` y se llevaba allí `#jPhaseBar` y
`#jNext`, justo lo que el tablero portado deja en `.jmain` y `.jmid`. El resto de esa capa
(salir de la mesa deja la página limpia) se mantiene.

### Cómo se construye la piel

`tmp/extract_board_css.py` recorre **todas** las capas `<style>` de `captain.html` en orden y
recorta las reglas que tocan el tablero (`jgrid`, `jmain`, `jbody`, `jpiles`, `pmini`, `jplay`,
`jzone`, `jhand`, `jlands`, `jinfo`, `jdice`, `jside`, `jcmdbox`, `jAiHand`, `jBf`…). El orden es
el de captain, así que la cascada se resuelve igual. `tmp/build_board_port_css.py` añade el pie:
fuera los rótulos heredados `OPPONENT BATTLEFIELD` / `YOUR LANDS` (captain no rotula campos ni
tierras; la mano conserva «TU MANO» / «MANO · CPU») y el hueco `/*__PER_BOARD__*/` que el
inyector rellena con lo propio de standard.

### Verificado en partida real (1920×1080)

Mazos de prueba de 60 Plains por bando, mulligan mantenido, consola sin errores nuevos:

| tablero | mesa | `.jplay` | columna | vida IA / tú | página |
|---|---|---|---|---|---|
| standard | 1618×785 | 1510 | 280 | x 1389 / x 1532, y 122 / 802 | 1080 (sin scroll) |
| brawl | 1601×993 | 1493×930 | 280×993 | x 1372 / x 1515 | 1089 |
| commander | 1601×1009 | 1493×946 | 280×1009 | x 1336 / x 1515 | 1105 |

- Rejilla `.jgrid` de dos columnas (mesa + 280 px), `.jbody` de `72px + resto`, fases arriba en
  `.jmain`, `.jpiles` a la izquierda de la mesa, mano al pie y vidas en las esquinas derechas.
- Mano del rival visible en abanico arriba (4-5 dorsos en la prueba): ya no hay píldora «N en
  mano», que era de `board-mix`.
- Rótulos de campo y tierras: `content:none` en los tres; la mano sigue rotulada.
- standard: `#jCmdPanel`, `#jMyCmd` y `#jAiCmd` a `display:none`; brawl/commander: panel de mando
  visible en la columna (65 px con «—», 290 px con carta de prueba y controles de impuesto).
- La página vuelve a desplazarse como en captain (brawl 9 px y commander 25 px de más a
  1080): la mesa ya no está clavada a la ventana.

### Lo que no se tocó

Motor, reglas, mulligan, deshacer/replay y multijugador (`mp-layer`) siguen igual: la capa P2P
engancha `#jYouHand .hcard` y `#jCastCmd`, y ambos ids siguen existiendo. `cm-table-fit-js` sigue
midiendo `#jYouBf`/`#jAiBf` y escribiendo `--bh`, que la piel portada no usa. No se revisó el
aspecto con capturas: la comprobación fue de geometría y rótulos sobre partidas reales.

## Sagas y planeswalkers: repaso y huecos tapados (26 nov 2026)

Repaso de la capa `saga-pw` en una partida real (cartas de prueba inyectadas en `CARD`, con la
forma que da `normCard`). Lo que ya iba bien: la saga entraba con su contador y su capítulo,
sumaba uno por turno y se sacrificaba en el último; el planeswalker entraba con su lealtad, el
panel del motor ofrecía sus +N/−N (una por turno) y moría a 0. Lo que **no** iba:

1. **La saga lanzada en el primer repintado de un turno nacía con dos contadores y sin capítulo I.**
   El motor repinta dentro de `playFromHand` y el contador del turno corría antes de que la capa
   pusiera el suyo. Ahora cada saga lleva `_sagaTurn` y el contador del turno se salta las sagas
   que acaban de entrar; si el capítulo I no ha salido, `tick` tampoco la toca.
2. **De «I, II — …» solo se resolvía el primero.** Ahora se resuelven todos los capítulos de esa
   línea (`sagaFire` recorre los que comparten número).
3. **El contador de relato no se repintaba** cuando era lo único que cambiaba en la carta: la
   firma de la carta (`permSig`) no lo incluía. Añadido `|lore`.
4. **Una saga o un planeswalker que llega por un efecto** (reanimar, buscar, copiar) se quedaba
   sin relato o sin lealtad: las marcas solo se ponían al lanzarlas a mano. Ahora un barrido
   (`seed`, antes del repintado) siembra lo que falte en el campo, con su capítulo I incluido.
5. **Las habilidades «−X» se perdían** al leer el texto (`[−X]: …` no casaba con el número) y no
   había forma de elegir la X. Ahora se leen con su signo, el panel de la capa manda sobre el del
   motor cuando el planeswalker tiene alguna (el del motor no las conoce), ofrece `−X` y una fila
   de 0..lealtad; la X se cambia por el número en el efecto (valor absoluto: el signo es del
   coste) y no se puede bajar de 0. La IA no elige X: usa solo habilidades de coste fijo.
6. **«Draw N cards» con cifra no robaba** (el motor solo entiende el número con letras): era justo
   lo que deja una X resuelta. La capa lo dibuja ahora (`Robo de N carta(s)`).

**Verificado en el navegador**, con reloj de turno real (`renderBoard`, `renderCommand` y clics
sobre los botones del panel):

| qué | commander | brawl | standard | captain |
|---|---|---|---|---|
| saga al lanzarla | lore 1, cap. I (+2 vidas), insignia «1» | igual | igual | igual |
| contador al turno siguiente | lore 2, cap. II (roba 1) | — | — | — |
| cap. III | ficha y **sacrificio** (al cementerio) | — | — | — |
| saga puesta por efecto | lore 1 + cap. I | — | — | — |
| planeswalker al entrar | lealtad 4, aviso en el registro | igual | igual | igual |
| −2 del panel | lealtad 4→2, roba 2, una por turno | — | — | — |
| «−X» (X=3) | lealtad 5→2, roba 3, registro «−3» | — | X=2: 5→3, roba 2 | X=2: 5→3, roba 2 |
| «−X» con X = lealtad | permitido; nunca por debajo de 0 | — | — | — |
| lealtad 0 | muere y va al cementerio | — | — | — |
| IA con saga y planeswalker | entra, cap. I, +1 de lealtad, y al turno siguiente lore 2 | — | — | — |

Consola limpia en los cuatro (solo los 404 de imágenes de Scryfall). El linter
`python tmp/lint_boards.py --strict` sigue en verde.

Reversión: `tmp/versions/<tablero>_before_sagapw2.html`. La capa se reinstala con
`python tmp/inject_layer.py saga-pw tmp/saga_pw.css tmp/saga_pw.js commander.html brawl.html standard.html captain.html`;
el CSS no cambió.

Queda fuera (a propósito): las sagas que **se transforman** al cerrar el último capítulo, los
planeswalkers con lealtad de entrada distinta de la impresa, y las habilidades de lealtad con
condición («si controlas…»), que se aplican siempre.

## La carta de la pila de mando en commander (26 nov 2026)

Síntoma: en `commander.html` la carta de la zona de mando que se pinta en la columna de pilas
(arriba a la izquierda del tablero) salía a tamaño natural, se comía la columna y descolocaba la
mesa. En `brawl.html` se veía bien.

**Causa.** `renderPiles` (capa `commander-upgrade-logic`) mete `<img class="pile-art">` en cada
pila. Quien le daba tamaño era `arena-v15-final`
(`body.playing #jTable .pmini .pile-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}`),
y esa capa se apaga en el porte del tablero de captain (`media="not all"`). `brawl.html` se
salvaba porque **su** copia de `commander-upgrade-style` trae además
`#jTable .pmini .pile-art{width:52px;height:73px;object-fit:cover}`; la de `commander.html` nació
sin esa regla. Resultado en commander: imagen de 1392×752 dentro de una caja de 72 px (la caja
quedaba en 72×31 y la columna se desbordaba).

**Arreglo** (pie de la capa `captain-board-css`, en el generador `tmp/build_board_port_css.py`):

    #jugar.playing .jpiles .pmini .pile-art{width:52px!important;height:73px!important;
      object-fit:cover!important;border-radius:4px!important;…}
    #jugar.playing .jpiles .pmini img{max-width:100%!important;max-height:100%!important}

La segunda regla es la red de seguridad: ninguna imagen de una pila puede salir de su caja,
pase lo que pase con las capas.

Para retocar solo esa capa **sin volver a portar el tablero** (portar otra vez pisaría el marcado
y perdería los ids ya verificados):

    python tmp/patch_board_css.py standard.html brawl.html commander.html

Regenera `tmp/captain_board_port.css` desde captain y sustituye únicamente el bloque
`<style id="captain-board-css">…</style>`. **Ojo con los saltos de línea**: la primera versión del
script normalizaba el archivo a LF y escribía los 18 000 saltos sin `\r` (32 KB menos y todo el
archivo cambiado); ahora trabaja sobre el texto tal cual y el bloque nuevo se escribe con el salto
del archivo. Comprobado: `crlf 18088`, `loneLF 0`, y el mismo número de capas `<style id>` y
`<script id>` antes y después.

**Medido en `commander.html`** (partida real, comandante de prueba con una imagen de 1392×752):
pila `#jMyCmd` 72×99, arte 52×73 recortado, columna `.jpiles` 72×946, `scrollWidth` 1264 con
`innerWidth` 1281 (sin desbordamiento horizontal). En `brawl.html` queda igual que estaba
(52×73 en caja de 72×99) y en `standard.html` no hay pila de mando que enseñar.

Reversión: `tmp/versions/<tablero>_before_pileart.html`.

## La barra de fases, encima del tablero y no sobre la mano (26 nov 2026)

Síntoma: en los tres tableros portados, «Principal 1 · Combate · Principal 2 · Fin» aparecía
pegada a la mano del rival, como flotando sobre la zona de arriba, y quedaba una banda vacía
grande entre el borde de la mesa y el contenido.

**Causa.** `#jPhaseBar` (clase `.jphase`) arrastraba de la piel vieja
`position:sticky;top:46px` (y `top:42px` en otra capa). Su hueco en el flujo empezaba a 80 px y la
barra se pintaba a 127 px, justo encima de `#jAiHand` (122), así que se mezclaba con la mano y su
banda quedaba vacía: ese era el «margen desde arriba de la mesa».

**Arreglo** (pie de `captain-board-css`, `tmp/build_board_port_css.py` + `tmp/patch_board_css.py`):

    #jugar.playing #jTable .jphase{position:relative!important;top:auto!important;
      bottom:auto!important;margin:0 0 4px!important;padding-top:2px!important;z-index:3!important}

La barra vuelve al flujo: ocupa su banda, arriba del todo del tablero, y se va con la mesa al
desplazar la página (antes se quedaba pegada flotando sobre la mano).

**Medido a 1920×1080 en `commander.html`** (partida real): mesa desde y=70, barra 81..116,
`#jAiHand` 120..214 → **sin solape** (antes 127..162 sobre la mano); página 1103 px.
En `standard.html` y `brawl.html`: barra 77..112 y mano del rival desde 116, también sin solape.

Reversión: `tmp/versions/<tablero>_before_pileart.html` (`commander`, `brawl`, `standard`), que
es la copia anterior a las dos reglas del pie de la capa (pila y barra de fases).

## Zoom de la carta de comandante en captain (26 nov 2026)

El zoom grande (`#cardZoom`) funciona en `captain.html` con un único oyente global: cualquier
elemento con `data-nm` abre la vista de carta al pasar el ratón. La caja `#jCmd` / `#jAiCmdDetails`
(«Zona de mando», con Impuesto, Lanzar y el arte) pintaba su `<img class="jcmd-art">` **sin**
`data-nm`, así que la carta del comandante era lo único de la zona que no ampliaba; la del hueco
`.jcmdslot` sí lo hacía ya.

Arreglo en `renderCommand` → `renderPanel` (`captain.html`):

- el arte lleva `data-nm` (y `title`) con el nombre de la carta;
- el nombre (`b.jcmd-name`) lleva también `data-nm`, así que amplía igual al pasar por el texto;
- `.jcmd-art` con `cursor:zoom-in` y un punto de brillo al pasar por encima.

**Comprobado en partida real** en `captain.html` con un comandante de prueba: `mouseover` sobre
`#jCmd .jcmd-art` abre `#cardZoom` (248×346) con la imagen correcta, el nombre hace lo mismo, y el
arte del panel de la IA (`#jAiCmdDetails .jcmd-art`) y el del hueco (`.cmdcard img`) siguen
ampliando. `python tmp/lint_boards.py --strict` en verde.

Reversión: `tmp/versions/captain_before_cmdzoom.html`. Solo se tocó `captain.html` (en los otros
tres tableros la zona de mando ya ampliaba).

## Foundations a fondo: búsquedas, cementerio y auras (capa `lib-gy`, 26 nov 2026)

Inventario hecho con el propio caché de la app (`searchCards('game:paper set:fdn', 12)` → **517
cartas**), contando las que usan cada mecánica y comparándolo con lo que ya hacían `rules-core`,
`adv-rules`, `adv-rules-2` y `saga-pw`. Lo que faltaba de verdad: **buscar en la biblioteca** (19
cartas), **mirar las N de arriba** (25), **recuperar del cementerio** (38) y **elegir el objetivo
de un aura** (13 auras). Capa nueva `lib-gy` en los cuatro tableros:

    python tmp/inject_layer.py lib-gy tmp/lib_gy.css tmp/lib_gy.js commander.html brawl.html standard.html captain.html

Añadida a `LAYER_GROUPS['todos']` del linter. No toca el motor: envuelve `applySpell` y
`playFromHand`.

**Ventana de elección** (`#lgPick`, `tmp/lib_gy.css`): rejilla de cartas con arte, nombre y tipo, y
un pie con la pista y «Cancelar» cuando el texto dice «hasta N». Las peticiones se **encolan**, así
que un mismo hechizo puede pedir dos («muele 3, luego devuelve un instantáneo o conjuro»). La IA y
el invitado de una partida P2P no ven ventana: eligen solas (la IA, lo más caro que cumpla).

**Qué resuelve**

- **Buscar en la biblioteca**: tipo (tierra/básica, criatura, artefacto, encantamiento,
  instantáneo, conjuro, planeswalker, permanente o cualquiera), «valor de maná N o menos» y «hasta
  N». Destino según el texto: a la mano, al campo (girada si lo dice) o arriba de la biblioteca;
  después se baraja. La carta sale de `P.lib` y se registra.
- **Mirar las N de arriba**: ventana con esas N; la elegida va a la mano y el resto **al fondo o al
  cementerio** según el texto (y «put them into your hand» se lleva todas).
- **Cementerio**: «return/put target … card from your graveyard to the battlefield/your hand»
  (criatura, instantáneo o conjuro, permanente, artefacto…), con la carta elegida en ventana; y
  «exile … card from a graveyard» (tuya o del rival) que la manda al exilio.
- **Auras**: al lanzar una se elige el huésped legal («enchant creature», «… you control»,
  «enchant land/planeswalker/permanente»). Si no hay ninguno **no se puede lanzar** (aviso), y si el
  motor había anexado a otro, se mueve el aura y sus palabras clave al elegido (+4/+4 y volar de
  *Angelic Destiny* comprobados).

El texto que la capa ya ha resuelto se **quita** de la línea antes de pasar el resto al motor, así
que «Mill three cards, then return …» muele y devuelve en la misma resolución (comprobado).

**Comprobado en el navegador** (brawl, con las 517 cartas de FDN en caché, y las mismas pruebas en
commander y captain):

| prueba | resultado |
|---|---|
| Expedition Map (tierra a la mano) | ventana con 49 tierras → mano 7→8, biblioteca 52→51, «Se baraja» |
| Evolving Wilds (tierra al campo girada) | entra `tapped:true`, `summoning:false`, registro «Va al campo · girada» |
| «Look at the top three…» | ventana de 3 → mano +1, biblioteca −1 (2 al fondo) |
| Inspiration from Beyond (muele 3 y devuelve instantáneo/conjuro) | muele 3 (49→46), ventana con las 2 del cementerio, devuelve a la mano |
| «Exile target creature card from a graveyard» | ventana → cementerio 1→0, exilio 0→1 |
| Angelic Destiny sobre 2 criaturas | ventana con las 2; la elegida queda 7/7 con volar y el aura `attachTo` correcto |
| aura sin objetivos | no se lanza y sale «No hay objetivo legal para el aura» |
| tutor de la IA | sin ventana: mano 5→6, biblioteca 54→53 |

Consola sin errores nuevos (solo los 404 de imágenes de Scryfall) y
`python tmp/lint_boards.py --strict` en verde.

**Lo que sigue faltando de Foundations** (contado sobre las 517): *flashback* (3 cartas),
copiar hechizo/permanente (10), ganar el control (1), prevención de daño (3) y contrarrestar
hechizos («counter target spell», 2). Lo demás del set ya está cubierto por las capas existentes (palabras
clave, contadores, fichas, Tesoro/Comida, sacrificios, scry/surveil, descarte, milagro de daño…).

Reversión: `tmp/versions/<tablero>_before_libgy.html`.

## Zoom de la vista grande: pilas de la zona de mando y marco que no colapsa (26 nov 2026)

Dos fallos distintos detrás del «no se ve la carta en grande»:

1. **Las cartas de las pilas no tenían `data-nm`.** `showPile()` (zona de mando, cementerio,
   exilio, tierras) pinta `.bcard` con su `<img>` pero sin el atributo que escucha el zoom global,
   así que pasar el ratón por el comandante dentro de esa ventana no hacía nada. Ahora cada carta
   lleva `d.dataset.nm = n` con el nombre tal cual está en las listas (es la clave de `CARD`, no el
   nombre traducido). Arreglado en los cuatro tableros.
2. **En captain el zoom quedaba detrás de la ventana de la pila.** `#cardZoom` estaba en
   `z-index:9600` y `#jPileView` en `9996`; se sube a **9997**, como en los otros tres tableros.
3. **El marco del zoom colapsaba mientras la imagen cargaba.** La regla base fija `width` pero no
   `aspect-ratio`, y el cargador perezoso global (`img:not([data-f])` → `loading="lazy"`) también
   afectaba al propio `#cardZoom`: sin tamaño intrínseco el `<img>` medía **0 de alto** y la vista
   grande salía como una franja de 2 px hasta que la imagen decodificaba. Se añade
   `height:auto;aspect-ratio:.716;min-height:120px` a la regla y `data-f="1"` al elemento, así que
   el marco ya tiene proporción de carta antes de que llegue el arte.

Scripts: `tmp/fix_pile_zoom.py` (puntos 1 y 2) y `tmp/fix_zoom_frame.py` (punto 3), ambos sobre los
cuatro tableros.

**Comprobado en el navegador**

| dónde | prueba | resultado |
|---|---|---|
| captain | clic en la zona de mando (`#jMyCmd`) y hover en la carta de la pila | `#cardZoom` 248×346, `z-index` 9997 sobre la pila (9996) |
| captain | hover en `.jcmd-art` del panel de mando | zoom 248×346 abierto |
| commander | hover en una carta de la pila | zoom 500×**698** (antes 500×2 por el colapso) |

`python tmp/lint_boards.py --strict` en verde. Reversión: `tmp/versions/<tablero>_before_pilezoom.html`
y `tmp/versions/<tablero>_before_zoomframe.html`.

## Vista grande en cualquier ventana de cartas (capa `zoom-any`, 26 nov 2026)

**Síntoma**: el zoom `#cardZoom` solo funcionaba con las cartas del tablero y las de las pilas. En el
cementerio y en las ventanas con listados de cartas (la de búsquedas/cementerio de `lib-gy`, la mano
del mulligan, listas del constructor, previsualizaciones) se pasaba el ratón por encima y no pasaba
nada, porque esas ventanas pintan `<img>` de cartas **sin `data-nm`** y el oyente del tablero solo
atiende ese atributo.

**Solución de raíz** (no ventana por ventana): capa nueva en los cuatro tableros,
`<style id="zoom-any-css">` + `<script id="zoom-any">` (fuentes `tmp/zoom_any.css` y
`tmp/zoom_any.js`):

    python tmp/inject_layer.py zoom-any tmp/zoom_any.css tmp/zoom_any.js commander.html brawl.html standard.html captain.html

y añadida a `LAYER_GROUPS['todos']` del linter.

- Construye un índice `src -> nombre` con `CARD` (todas las caras, `img` y `sm`) y las básicas de
  `BASIC_NAMES`; se rehace solo si cambia el tamaño de la caché.
- Un oyente `mouseover` **en captura** (llega antes que el del tablero) identifica la imagen, le pone
  `data-nm` y llama a `showZoom()`; a partir de ahí esa imagen ya la gestiona el código de siempre,
  sin duplicar posición ni temporizador.
- `img[data-nm]{cursor:zoom-in}` como pista visual.
- No toca el motor, ni ids, ni el zoom existente: si no reconoce la imagen, no hace nada.

Además, las cartas de la ventana de `lib-gy` (`#lgPick`) llevan ya `data-nm` en su tarjeta
(`tmp/lib_gy.js`), así que se abre la vista grande aunque la imagen aún no esté en el índice.

**Comprobado en el navegador** (`mouseover` sintético sobre el DOM real; `#cardZoom` arriba de la
ventana, `z-index` 9997 frente a 9996 de la pila y 9700 de `#lgPick`):

| tablero | prueba | resultado |
|---|---|---|
| brawl | `<img>` suelto sin `data-nm` con el arte de *Inspiration from Beyond* | identificado y zoom 500×698 |
| brawl | carta de la ventana de búsqueda (`#lgPick`) | `data-nm` = «Plains», zoom 500×698 |
| standard | `<img>` suelto de *Essence Channeler* | zoom 500×698 |
| captain | `<img>` suelto de una básica | resuelto como «Plains», zoom 248×346 |
| captain | carta de la ventana de búsqueda | `data-nm` = «Plains», zoom 248×346 |
| commander | `<img>` suelto de *Ragavan, Nimble Pilferer* | zoom 500×698 |

`python tmp/lint_boards.py --strict` en verde. Reversión: `tmp/versions/<tablero>_before_zoomany.html`.

## Elegir varias cartas y confirmar (ventanas de `lib-gy`, 26 nov 2026)

Antes las ventanas de la capa `lib-gy` resolvían **al primer clic** y, cuando el texto decía «hasta
dos», encadenaban una ventana por carta. Ahora la ventana es de **selección múltiple**:

- Clic en una carta la **marca** (borde dorado, fondo verde y número de orden en la esquina); volver
  a pulsarla la **desmarca** y renumera. No se puede pasar del máximo del texto.
- El pie muestra el contador «k/máx elegidas» y la pista («Elige 2 cartas» / «Elige hasta 2 cartas»).
- **Aceptar** resuelve; está deshabilitado hasta llegar al mínimo. Si el texto es «hasta N» (o «you
  may»), se puede confirmar con menos, e incluso con cero, y hay **Cancelar**; si hay que coger
  exactamente N, no hay Cancelar y Aceptar solo se activa con N.
- Con **una sola** carta el clic sigue resolviendo al instante (sin botón), como antes.
- La IA no ve ventana: elige las N cartas más caras que cumplan el filtro.

Qué cuenta como «varias» y de dónde sale el número:

| texto | ventana |
|---|---|
| «Search your library for up to two basic land cards, put them onto the battlefield tapped» | multi, mín 0 · máx 2 |
| «Search your library for a land card, reveal it, put it into your hand» | una carta, un clic |
| «Look at the top four cards … Put two of them into your hand and the rest on the bottom» | multi, mín 2 · máx 2 (4 cartas a la vista) |
| «Exile two target creature cards from a graveyard» | multi, mín 2 · máx 2 |
| «Look at the top three … put one into your hand» | una carta, un clic |

Detalle de implementación: el «cards» de la frase lo consume la propia expresión de búsqueda, así que
el número se cuenta sobre la **frase coincidente** (`countIn(m[0])`) y en las miradas se lee aparte
«put two … into your hand», que no lleva la palabra «cards» (era el fallo de la primera pasada: todo
salía como una sola carta).

**Comprobado en el navegador** (`mouseover`/clics sintéticos, partidas reales):

| tablero | prueba | resultado |
|---|---|---|
| brawl | «up to two basic land cards» | «Elige hasta 2 cartas», 0/2 → 2/2 → desmarcar 1/2 → el tercer clic no pasa de 2; Aceptar → 2 tierras al campo **giradas**, biblioteca −2 |
| brawl | «Look at the top four … Put two of them into your hand» | 4 cartas, «Elige 2 cartas», Aceptar bloqueado con 1; con 2 → mano +2, biblioteca −2 |
| brawl | «Exile two target creature cards from a graveyard» | cementerio 2→0, exilio +2 |
| brawl | «Search your library for a land card …» | una carta: sin botón Aceptar; un clic resuelve |
| standard | «Look at the top four … Put two of them» | «Choose 2 cards», 4 cartas; con 2 → mano +2 |
| captain | «up to two basic land cards» | «Elige hasta 2 cartas», 2/2 → 2 tierras giradas al campo |

Hooks de prueba: `__lg.pick()` devuelve la petición en curso y `__lg.pending()` la cola.
`python tmp/lint_boards.py --strict` en verde. Reversión:
`tmp/versions/<tablero>_before_multipick.html`.

## Mecánicas en un solo sitio: capas compartidas `js/` y `css/` (26 nov 2026)

Antes cada mecánica estaba **copiada dentro de los cuatro HTML** (~1,2 MB cada uno). Cualquier
arreglo había que hacerlo cuatro veces y las copias ya se habían separado (en `captain.html` cada
capa era la misma salvo saltos de línea, pero nada lo garantizaba). Ahora hay **un archivo por
capa** y cada tablero solo lo enlaza:

    <style id="lib-gy-css">@import url("css/lib_gy.css");</style>
    <script id="lib-gy" src="js/lib_gy.js"></script>

Se mantienen los `id` de capa (los usa el linter), el **orden del documento** (el mismo que antes,
así que el cascado y el orden de ejecución no cambian) y **no hay build ni dependencias**: sigue
abriéndose con doble clic o con `python -m http.server 8124 --bind 127.0.0.1` (son `<script src>` y
`@import` clásicos, no módulos).

Capas compartidas (las llevan los cuatro tableros):

| capa | archivos | qué es |
|---|---|---|
| `rules-core` | `js/rules_core.js` · `css/rules_core.css` | reglas de carta (sacrificio, scry, contadores, fichas…) |
| `rules-more` | `js/rules_more.js` · `css/rules_more.css` | amasar, proliferar, preparada, empoderar a Jace, estímulo, convocar, ciclar, disturbio… |
| `saga-pw` | `js/saga_pw.js` · `css/saga_pw.css` | sagas y planeswalkers |
| `lib-gy` | `js/lib_gy.js` · `css/lib_gy.css` | búsquedas, cementerio y auras (con selección múltiple) |
| `zoom-any` | `js/zoom_any.js` · `css/zoom_any.css` | vista grande en cualquier carta |
| `undo-layer` | `js/undo_layer.js` · `css/undo_layer.css` | deshacer, rehacer y partida guardada |
| `mull-arena` | `js/mull_arena.js` · `css/mull_arena.css` | mulligan estilo Arena |
| `home-fit` | `css/home_fit.css` | portada sin scroll (cuatro tableros) |
| ~~`board-mix`~~ | archivado en `tmp/versions/board_mix_retired.*` | **retirada** el 26 nov: su `!important` rompía la rejilla del tablero |

**Se quedan dentro de cada tablero** las que no son idénticas o son de un formato: `arena-mat`
(el CSS de captain muestra la mano de la CPU, el de los hermanos la oculta), `fdn-deck`,
`captain-board-css`, `standard-css` y las capas antiguas `arena-*`.

**Flujo de trabajo nuevo**

- Editar la capa: en `js/<x>.js` / `css/<x>.css`. Recargar la página y ya está en los cuatro.
- Si se trabaja sobre la fuente de `tmp/`: `python tmp/sync_shared.py` la publica en `js/` y `css/`
  (`--check` dice si están desincronizados, código 1). Ahora mismo los 12 archivos están al día.
- **No** volver a inyectar estas capas con `tmp/inject_layer.py`: dejaría el bloque otra vez dentro
  del HTML. Ese inyector sigue siendo el bueno para capas de un solo tablero.
- `tmp/share_layers.py` fue la migración de ida (extrajo los bloques y dejó las referencias); solo
  se toca lo que es idéntico módulo saltos de línea y salta lo que difiere de verdad.

**Linter**: `tmp/lint_boards.py` ahora **lee también los archivos compartidos** de cada tablero
(`bundle()`), así que las comprobaciones de i18n y de textos prohibidos siguen viendo toda la app
—las claves por idioma subieron de ~700 a 944 justo por eso— y avisa si falta un archivo enlazado.
Probado metiendo una clave solo en ES dentro de `js/lib_gy.js`: el linter da **4 problemas, uno por
tablero**, nombrando la clave; al revertir vuelve a verde.

**Comprobado en el navegador** (las cuatro webs recargadas, partidas reales y eventos sintéticos):

| tablero | capas cargadas | mecánica probada | CSS compartido | resultado |
|---|---|---|---|---|
| commander | `__lg`, `__zoomAny`, `#undoBar` | sacrificio (rules-core) + «hasta dos tierras» | 25 reglas `#lgPick`, 23 `.mix-half`, 49 mulligan, 5 `#undoBar` | `Probe Bear` 1→0 en campo y +1 en cementerio; ventana multi 2/2 y dos tierras giradas |
| brawl | igual | sacrificio + multi | sí | campo 1→0, cementerio +1; 2/2 elegidas |
| standard | igual | sacrificio + multi | sí | campo 1→0, cementerio +1; «2/2 chosen» |
| captain | igual | sacrificio + multi | sí | campo 1→0, cementerio +1; 2/2 elegidas |

Tamaño de los tableros tras la extracción: commander 1.202.538 → **1.074.539** bytes, brawl
1.217.919 → **1.089.920**, standard 1.219.154 → **1.091.155**, captain 747.403 → **642.329**.

**Pendiente / avisos**

- No se pudo probar abrir el archivo con `file://` desde el navegador del chat (la herramienta solo
  admite http/https); los `<script src>` y `@import` clásicos funcionan desde `file://`, pero está
  **sin verificar** en esta máquina.
- `board-mix` está **dormido** en los tableros actuales: `build()` exige `.jplayer-zone`, que el
  porteo del tablero de captain ya no deja en el DOM (su reparto en dos mitades lo hace ahora
  `captain-board-css`). No es una regresión de esta tanda; la capa se puede retirar algún día.
- Si alguien copia un HTML suelto a otra carpeta, necesita `js/` y `css/` al lado.

Reversión: `tmp/versions/<tablero>_before_sharedjs.html` (los cuatro, con las capas dentro).

## Los estilos en un solo sitio: `css/` compartido (26 nov 2026)

Lo mismo que se hizo con el JS, ahora con el CSS. Ya no queda **ningún** `<style>` con reglas
dentro de los cuatro tableros: cada bloque vive en `css/` y en el HTML solo queda una referencia
clásica, en el mismo sitio del documento donde estaba el bloque (el orden importa: es el que
decide el cascado).

    <style id="lib-gy-css">@import url("css/lib_gy.css");</style>

- Se conservan los `id` de capa porque el linter los usa para exigir que los hermanos lleven
  las mismas capas (`<style id>` cuenta igual que `<script id>`).
- Nada de módulos ni de build: `@import` clásico, así el tablero sigue abriéndose con doble clic
  o con un servidor estático.
- **Tamaños ahora**: commander 889.375 · brawl 890.004 · standard 889.599 · captain 543.614 · 41 archivos en `css/`.

### Cómo se hizo y cómo se rehace

`tmp/share_css.py` recorre cada tablero, saca cada bloque `<style>` y lo publica en `css/`:

- La clave del archivo sale del `id`; los bloques anónimos van a `board.css`, `board2.css` y
  `board3.css` (los tres primeros del documento, que son la cabecera del tablero).
- Solo comparte lo **idéntico**: si el mismo `id` trae cuerpos distintos según el tablero, saca
  una variante por tablero (`arena_mat.css` y `arena_mat_captain.css`, `standard.css`, …).
- Salta los `<style>` que están dentro de `<script>` (plantillas de impresión) y los `@import`.
- Es idempotente: si ya está externalizado no toca nada. `--dry` dice qué haría.

`tmp/sync_shared.py` sigue siendo el que publica `tmp/*.css` en `css/` (`--check` para saber si
hay desfase). El linter lee también los archivos enlazados (`bundle()`), así que las claves de
i18n y los textos prohibidos se siguen comprobando dentro de `css/` y `js/`.

### Dos trampas que costaron una tarde

1. **`media="not all"` no se hereda al `@import`.** Siete capas viejas están desactivadas con
   `<style id="…" media="not all">` (el tablero portado no las quiere). Al externalizarlas, el
   `@import` se aplica *igual* y el tablero se rompe: `.jbody` pasa de rejilla a
   `flex-direction:column` y la partida mide 1.792 px de alto en una ventana de 1.080.
   Solución: repetir la condición **dentro** del import —

       <style id="arena-v15-final" media="not all">@import url("css/arena_v15_final.css") not all;</style>

   `share_css.py` ya lo hace solo (`guard`).
2. **Las `url()` son relativas al archivo CSS.** Dentro de `css/` hay que escribir
   `url(../img/mesa-madera.jpg)`; si no, el navegador pide `css/img/mesa-madera.jpg` y la mesa
   de madera da 404. `share_css.py` reescribe las rutas al escribir (`fix_urls`) saltándose
   `data:`, `http`, `/`, `#` y las que ya empiezan por `../`.

### `board-mix` se retiró

`board_mix.js` no hace nada desde que el tablero de captain se portó a los hermanos (`build()`
exige `.jplayer-zone`, que ya no existe). Su CSS, en cambio, seguía activo y contenía

    body.arena-mat-on #jTable .jbody{display:flex!important;flex-direction:column!important}

que competía con la rejilla buena de `captain_board.css`. Al pasar los estilos a archivos
compartidos ese `!important` pasó a ganar y el tablero se estiraba. Se quitaron las dos
etiquetas de `commander.html`, `brawl.html` y `standard.html` (`python tmp/retire_board_mix.py`),
se sacó el grupo `mix` de `tmp/lint_boards.py` y los archivos quedan archivados en
`tmp/versions/board_mix_retired.js` y `tmp/versions/board_mix_retired.css`.

### Comprobado

- Geometría medida en partida, comparada con el respaldo `tmp/versions/*_before_sharecss.html`
  medido en la misma pestaña y ventana: **commander** idéntico (`.jbody` en rejilla de 72 px,
  `.jmain` 1.601×1.007 en y=70, mano en y=972, página 1.103 px); **brawl** idéntico (743×985,
  página 1.553 px a 772 px de ancho, que es como ya estaba); **standard** en rejilla (724×781);
  **captain** sin tocar (no tenía `board-mix`).
- Red: todas las hojas y scripts en 200/304, `img/mesa-madera.jpg` en 200. Los únicos 404 que
  salieron eran de abrir un respaldo dentro de `tmp/versions/`, que apunta a rutas que allí no
  existen.
- `python tmp/lint_boards.py --strict` en verde y `python tmp/sync_shared.py --check` al día.
- La vista grande sigue abriendo: en commander `showZoom` sobre una mano deja `#cardZoom` a
  520×726 con el arte de la Llanura.

### Pendiente / avisos

- **No verificado** abrir los tableros con `file://` (la herramienta del navegador solo acepta
  http/https). `@import` y `<script src>` clásicos deberían funcionar, pero no está probado.
- `@import` carga **después** de parsear, así que cualquier movimiento de CSS hay que cerrarlo
  midiendo geometría en partida; comparar el texto concatenado no basta (el CSS puede ser
  idéntico byte a byte y el tablero salir distinto por el orden/`media`).
- Si algún día se toca `media` en una capa de las desactivadas, acordarse del `guard`: el
  atributo del `<style>` no basta.

## Que la IA elija en las ventanas de selección (26 nov 2026)

Las ventanas de `lib-gy` (buscar en la biblioteca, mirar las N de arriba, cementerio, exilio y
aura) llevan ahora un botón **«Elige la IA»** en el pie, entre el contador y «Aceptar». Al
pulsarlo la ventana se resuelve con la misma heurística que usa la IA cuando le toca a ella
(las cartas de más valor de maná que quepan, `bestOf`), sin que el jugador tenga que marcar
nada. Queda anotado en el registro («La IA elige por ti.») y la reproducción de la partida
sigue mostrando el resultado.

- Vale para los tres casos de la ventana: una sola carta (el botón sustituye al clic), «elige N»
  y «hasta N» (ahí elige el máximo permitido; para confirmar con menos sigue estando «Aceptar»
  y el × / «Omitir»).
- La elección automática vive en `autoSel(req, auto)` y la usan **los dos** caminos: la IA
  cuando es ella la que elige (sin ventana) y el botón. Antes esa lógica estaba dentro de
  `ask()`; ahora es una sola función, así que el botón no puede elegir distinto de la IA.
- Claves nuevas en los tres idiomas: `lg.aiPick` y `lg.aiDid`. Estilo del botón en
  `#lgPick .lgft button.lgai`.
- Como `lib-gy` es capa compartida (`tmp/lib_gy.js` + `tmp/lib_gy.css` → `js/` y `css/` con
  `python tmp/sync_shared.py`), sale en los **cuatro** tableros de una vez.

Comprobado en el navegador (pestaña limpia, porque el navegador servía `js/lib_gy.js` de la
caché y el botón no aparecía): en commander, brawl, standard y captain, con
«mira las cuatro de arriba y pon dos en la mano», el botón dice «Elige la IA», al pulsarlo la
mano sube 2, el cementerio sube 2 y la ventana se cierra; en la ventana de una sola carta el
botón también resuelve y «Aceptar» sigue oculto. Las selecciones de la propia IA siguen sin
ventana (`__lg.pending()` = 0 y la carta pasa a su mano).
**Ojo al probar**: sin `?v=` en el `<script src>` el navegador puede reutilizar la copia vieja
de la capa; para verificar un cambio de `js/` conviene una pestaña en incógnito.

## La elección automática elige con criterio, no «las más caras» (26 nov 2026)

Con el botón «Elige la IA» quedó a la vista que la heurística era `bestOf`: ordenar por valor de
maná y cortar. Ahora `scoreCard(card, ctx)` puntúa según el contexto de cada ventana:

| contexto (`ctx.dest`) | qué elige |
|---|---|
| `hand` (buscar a la mano, mirar las N y poner en la mano) | la mejor carta: maná + tipos (planeswalker > criatura > instantáneo) |
| `field` (al campo) | permanentes; un instantáneo o conjuro al campo no hace nada (−8) |
| `top` (arriba de la biblioteca) | la mejor, igual que a la mano |
| `gy` (al cementerio) | lo peor: es donde tiras lo que no sirve |
| `exile` (exiliar de un cementerio) | **del rival, lo mejor** (`mine:false`); **del tuyo, lo peor** (`mine:true`) |
| `host` (huésped de un aura) | la criatura más grande (fuerza ×1, resistencia ×0,6) |

Y las tierras tienen su propia escala: `0,8 + 0,5 × colores que produce (máx. 2) − 0,45 si es
básica`, leyendo `prod` (una básica del color correcto sigue ganando a una tierra incolora, y una
tierra que arregla dos colores gana a la básica). Las ventanas pasan el contexto que ya conocen:
el destino sale del texto del hechizo y `mine` de quién es el cementerio (`owner === P`).

**Bug de paso (importante)**: `costOf(card)` no devuelve un número, devuelve
`{colors, generic, raw}`. La versión anterior restaba esos objetos, todas las puntuaciones salían
`NaN`, y con un comparador que devuelve `NaN` el `sort` no ordena nada: «las más caras» estaba
eligiendo **las primeras de la lista**. Ahora `mvOf(card)` compone `generic + suma(colors)` y cae a
`cmc` si hace falta. También se leen `pow`/`tou` (las cartas de la caché no traen `pt`).

Prueba reproducible: `tmp/test_ai_pick.js`, ocho casos con cartas reales de la caché del tablero
(la no básica que más colores produce contra la básica; criatura+hechizo contra tierra; tierra
contra instantáneo al campo; exiliar del rival / del tuyo; devolver del cementerio; mandar al
cementerio; huésped del aura). En la consola, con partida y `searchCards('game:paper set:fdn',2)`:

    fetch('tmp/test_ai_pick.js').then(r=>r.text()).then(eval).then(()=>__testAiPick())

Comprobado en los **cuatro** tableros (pestañas en incógnito, para no coger `js/` de la caché):
8/8 casos en commander, brawl, standard y captain, y en los cuatro la ventana real («mira las
cuatro de arriba y pon dos en la mano» con `Island`, `Ghalta, Primal Hunger`,
`An Offer You Can't Refuse` y `Evolving Wilds`) deja en la mano a Ghalta y a Offer y manda las dos
tierras al cementerio al pulsar «Elige la IA».

## Con «Piloto: SÍ» las ventanas las resuelve la IA (26 nov 2026)

El botón **Piloto** (`#jAuto`, `G.auto`, también la tecla `A`) pone el turno del jugador en
automático. Hasta ahora, si el piloto lanzaba una carta con elección («busca en tu biblioteca»,
«mira las cuatro de arriba»…), la ventana de `lib-gy` se abría y se quedaba esperando un clic: el
piloto se paraba en seco.

Arreglo en la capa (`tmp/lib_gy.js` → `js/lib_gy.js`), sin tocar los tableros:

- `human(P)` ahora también exige que el piloto esté apagado:
  `P === G.you && !isGuest() && !(G && G.auto)`. Con `G.auto` encendido, `ask()` no encola nada y
  resuelve en el acto con la elección automática de siempre (`autoSel` + `scoreCard`, la del botón
  «Elige la IA»).
- Encender el piloto **con una ventana ya abierta** la cierra y la resuelve: la capa escucha el
  clic en `#jAuto` y, si queda encendido, llama a `autoNow()` (la misma elección, y anota «La IA
  elige por ti.»). Apagarlo no toca nada.
- Las auras también: con el piloto encendido el aura se anexa sola al mejor huésped
  (`bestBy(…, {dest:'host'})`) en vez de al primero de la lista.
- Ganchos nuevos en `window.__lg`: `autoNow()` y `human(P)`.

Comprobado en el navegador (pestaña en incógnito) en los **cuatro** tableros: con una ventana
abierta, pulsar «Piloto: NO» → «Piloto: SÍ» la cierra, la mano sube 2, el cementerio sube 2 y el
registro dice «La IA elige por ti.» (commander, brawl, standard y captain). Con el piloto ya
encendido, la misma tirada no abre ventana (`__lg.pending()` = 0, mano +2, cementerio +2) en los
cuatro. En captain, además, `autoPlayYou()` con el piloto encendido juega la Llanura, avanza
`main1 → end` y pasa el turno a la IA sin dejar ninguna petición pendiente.

Ojo al medir: con el piloto encendido el motor también juega cartas de tu mano, así que el número
de cartas de la mano puede bailar; lo estable es el registro, el cementerio y `__lg.pending()`.

## Que se vea lo que elige la IA: un segundo en pantalla (26 nov 2026)

Decidir en silencio estaba bien para el motor y mal para el jugador: no se veía qué carta había
cogido la IA. Ahora cada elección automática se enseña en la propia ventana durante `AI_PAUSE`
(1 s) antes de cerrarla.

- `markAi(req, sel)` deja la ventana en modo «solo mirar» (clase `.ai`): las cartas elegidas
  quedan marcadas con su número de orden, el pie pasa a «La IA elige: Ghalta, Primal Hunger,
  An Offer You Can't Refuse» (`lg.aiShow`, o `lg.aiNone` si no coge ninguna) y el puntero se
  desactiva sobre la rejilla y los botones (`pointer-events:none`), así no se puede tocar nada
  por accidente. El marco se pone dorado.
- **La IA (o el piloto) decidiendo**: `ask()` aplica la elección **en el acto** —el motor es
  síncrono (`parts.forEach(s=>applySpell(...))`) y no puede esperar un `setTimeout` sin romper
  el orden— y la ventana se queda 1 s enseñando lo elegido antes de desaparecer.
- **El jugador pulsando «Elige la IA»** (o encendiendo «Piloto: SÍ» con una ventana abierta):
  primero se marca la elección, se anota «La IA elige por ti.» en el registro y **después** de
  1 s se confirma. Ahí sí se puede esperar, porque el flujo lo ha iniciado el jugador.
- Si el jugador ya tiene una ventana abierta (`busy`), las elecciones de la IA se aplican sin
  pintar nada encima: no se le roba la ventana.
- Claves nuevas `lg.aiShow` / `lg.aiNone` (ES/EN/FR) y estilos `#lgPick.ai` en `css/lib_gy.css`.

Comprobado en el navegador en los **cuatro** tableros (pestaña en incógnito), con «mira las
cuatro de arriba y pon dos en la mano»:

| caso | a los 250 ms | a los ~1,35 s |
|---|---|---|
| piloto encendido | ventana con `.ai`, 2 cartas marcadas, puntero desactivado, pista con los dos nombres | cerrada, mano +2, cementerio +2 |
| botón «Elige la IA» | ventana con `.ai` y las 2 marcadas, **mano +0** (aún sin confirmar) | cerrada, mano +2, cementerio +2 |
| la IA para sí misma | ventana con `.ai` y su elección, **mano de la IA +2 ya aplicada** | cerrada |
| ventana del jugador abierta + la IA eligiendo | la ventana del jugador no se toca (mismo título, `.ai` apagado) y la IA cobra su carta | el jugador la cierra con «Omitir» sin problema |

Al medir: con el piloto encendido el motor también juega cartas de la mano, así que lo estable es
la pista de la ventana, el cementerio y `__lg.pending()`, no el tamaño de la mano.

## Captain: zoom en la zona de mando y en la portada de los mazos (26 nov 2026)

Dos huecos del zoom `#cardZoom` en `captain.html` —los otros tres tableros ya lo hacían bien—.

**1. La zona de mando no abría la vista grande.** El panel (`renderCommand`, `#jCmd` /
`#jAiCmdDetails`) y el chip (`#jYouCommander` / `#jAiCommander`) ponían `data-nm` con el nombre
**localizado**: `data-nm="${esc(cardName(card))}"`, es decir «Llanura», «Pescador de mercurio»…
`cardOf` indexa `CARD` por el nombre canónico, así que `cardOf('Llanura')` devolvía `null`,
`showZoom` no encontraba imagen y se cerraba solo. Ahora `data-nm` lleva `card.name` (la clave de
`CARD`); el `alt`, el `title` y el texto visible siguen en el idioma del jugador.

**2. La portada del mazo no tenía `data-nm`.** Commander, brawl y standard marcan la portada con
`data-nm="${esc(p.commander)}"`; captain no tiene comandante y se quedaba sin atributo, de modo
que pasar el ratón por la carta que representa el mazo no hacía nada. Se añade `packArtCard(p)`
(la carta que ya elegía `packArt`, devuelta como objeto) y la portada se pinta con
`<div class="art" data-nm="…">`. `packArt` sigue devolviendo la URL como antes.

**Comprobado en el navegador** (`captain.html?v=9251`, `mouseover` sintético sobre el DOM real):

| dónde | antes | después |
|---|---|---|
| `#jCmd .jcmd-art` (zona de mando, nombre localizado) | `data-nm="Llanura"`, `cardOf` → `null`, sin zoom | `data-nm="Plains"`, `#cardZoom` 248×346 |
| chip `#jYouCommander img` | igual, sin zoom | `#cardZoom` 248×346 |
| portada `#packGrid .art` | sin `data-nm` | `data-nm` con la clave canónica y `#cardZoom` 248×346 |

Linter `--strict` en verde y `sync_shared --check` sin desfase (no se tocaron capas compartidas).

## Forja de mazos: web dedicada de deckbuilding (26 nov 2026)

`deckbuilder.html` es una página **independiente** (no toca los cuatro tableros) pensada para
construir mazos, no para jugarlos. Se enlaza desde el pie de `index.html` («Forja de mazos»,
claves `foot.builder` en ES/EN/FR) y comparte la estética y las fuentes de la portada.

La construcción está **partida en dos talleres** que no se mezclan:

### 1. Mazo virtual (cualquier carta)

- Formato (Commander 100 / Brawl 60 / Captain 40 / Standard 60), identidad de color y **sets múltiples**:
  el selector `#setInput` se resuelve contra `/sets` de Scryfall (669 sets guardados 7 días en
  `mtgb_sets_v1`) y los sets elegidos se ven como fichas. La consulta añade
  `(set:a or set:b)`; sin sets se busca en todo Magic.
- Buscador libre (nombre, tipo, texto) con los filtros de formato (`f:commander|brawl|standard`),
  identidad (`id<=WUBRG`, o `id<=c` con comandante incoloro) y sets ya aplicados.
- Cada resultado ofrece «+ Mazo» y, si la carta puede ser comandante, «★». Sin comandante ni
  colores, el generador elige un comandante popular (top 8, al azar) o una pareja de colores.
- **Generar mazo completo**: pide 3 páginas de hechizos (`-t:land -t:token`), reparte por roles
  (removal / robo / ramp / criaturas, con objetivos por formato), completa por `edhrec_rank`,
  añade hasta un 35 % de tierras no básicas y reparte las básicas por pips de maná. Si el pool
  no llega al 70 % de los hechizos necesarios, avisa en vez de inventarse un mazo de tierras.

### 2. Colección física (solo lo que tienes)

- Se pega una lista (`4 Lightning Bolt`, `Nombre x4`, `(SET) 123`, CSV con Qty/Name) o se sube
  un `.txt`/`.csv`. Los nombres se resuelven con `POST /cards/collection` en lotes de 75 y se
  guardan en `localStorage` (`mtgb_coll_v1`: cantidades + miniatura de cada carta).
- Las **tierras básicas se suponen ilimitadas**; el resto exige copias propias. Añadir al mazo
  una carta de la que no hay copias se bloquea con aviso; el botón «Tengo esta» la suma a la
  colección primero (también se puede ajustar con ± en la lista de la colección).
- **Generar con lo que tengo** usa solo cartas propias legales e identidad-compatibles, elige el
  mejor comandante poseído y monta los mismos roles. Si la colección no llega al tamaño del
  formato, **no rellena con 37 tierras**: las tierras se limitan en proporción a los hechizos
  elegidos (mínimo 15) y el panel avisa de cuántas cartas faltan.
- La búsqueda de Scryfall en este modo sirve para **marcar cartas que faltan** en la colección,
  no para meterlas en el mazo sin tenerlas.

### Panel del mazo (siempre visible)

Nombre, comandante, contador `n / tamaño`, hechizos, tierras, coste medio, curva 0–6+, avisos
(tamaño, copias, identidad, legalidad de Scryfall, copias que faltan) y lista agrupada con
controles de cantidad. Guarda hasta 40 mazos en `mtgb_decks_v1` (cargar/borrar), copia la lista,
la descarga en `.txt` y la importa detectando «Comandante:» o la primera criatura legendaria.

### Comprobado en el navegador (26 nov 2026)

- Commander virtual con solo Foundations: comandante Krenko, **100/100** (62 hechizos, 37
  tierras), sin avisos.
- Standard virtual sin filtros: pareja GB elegida, **60/60** (36 + 24), máximo 2 copias.
- Colección: importadas 43 únicas / 62 copias desde una lista real; «Generar con lo que tengo»
  en Standard dio 60/60 sin avisos, y en Commander 35 cartas con aviso de las 65 que faltan
  (19 hechizos → 15 tierras, sin el mazo de tierras absurdo).
- Guardar/cargar un mazo de 60 conserva las 60; el intento de añadir Sol Ring sin tenerlo se
  bloquea («Solo tienes 0 de Sol Ring») y tras «Tengo esta» entra en el mazo.
- `python tmp/lint_boards.py --strict` sigue en verde (los tableros no se han tocado).

### Límites conocidos

Solo español. Captain Jumpstart ya está dentro como cuarto formato jugable (40 singleton +
capitán; ver «La Forja y los cuatro formatos jugables»). No hay sideboard,
precios ni filtro de legalidad más allá de `legalities` de Scryfall. `resolveDeckNames()` carga
las cartas que falten de un mazo guardado en segundo plano.

## Forja de mazos: qué copiamos de otras apps (26 nov 2026)

Repaso de Moxfield, Archidekt, ManaBox, Deckbox y TappedOut para decidir cómo separar «carta
virtual» de «colección física» sin obligar a cambiar de herramienta.

**Lo que hace cada una**

| App | Patrón que nos interesa |
|---|---|
| ManaBox | «Collection filter» en el buscador y vista **Missing / Partially missing**; exporta la lista de faltantes. Es la referencia más clara de «construir desde la caja». |
| Archidekt | «Filter to my collection», estadísticas fijables junto al mazo y vista de carta grande al pasar el ratón. |
| Moxfield | Marcas por carta en la lista: azul = tienes esa impresión, gris = otra o pocas copias, sin marca = no la tienes. |
| TappedOut | «Restrict Search to Cards» y *acquireboard* para lo que falta comprar. |
| EDHREC | Elegir comandante por ranking y colores antes de rellenar el resto. |
| Scryfall | Filtros por tipo, coste, rareza, legalidad y sintaxis (`t:`, `mv<=`, `f:`, `id<=`). |

**Decisiones tomadas en `deckbuilder.html`**

- **La propiedad se ve siempre, no solo en el modo colección.** Cada resultado lleva
  `✓ N en tu colección` o `✗ no la tienes`; cada fila del mazo avisa `te faltan N` si no hay
  copias suficientes. Las básicas cuentan como ilimitadas.
- **Lista de compra** en el panel del mazo (estilo ManaBox/TappedOut): contador de copias que
  faltan, detalle desplegable y «Copiar lista de compra». Si no hay colección cargada, se dice
  en vez de mostrar cien faltantes.
- **«Solo cartas que tengo»** en el buscador virtual y en el generador. La generación elige la
  pareja de colores con más cartas propias (antes probaba una al azar y podía no llegar).
- **Filtros rápidos + sintaxis**: tipo (criatura, instantáneo, conjuro, artefacto,
  encantamiento, planeswalker, tierra), coste máximo y orden (más jugadas, nombre, coste,
  recientes) se suman a lo que escribas; la sintaxis de Scryfall sigue disponible.
- **Vista previa grande** al pasar el ratón por resultados y filas del mazo (imagen normal,
  tipo, coste y texto), oculta por debajo de 1200 px.
- **Autoguardado** del borrador (`mtgb_draft_v1`) y restauración al recargar, como el autosave
  de Archidekt, sin sustituir a los mazos guardados (`mtgb_decks_v1`).
- **Sugerir comandantes** desde el hueco del comandante (ranking de Scryfall dentro de los
  filtros), y atajos `/` o `Ctrl/Cmd+K` para buscar y `Esc` para cerrar la vista previa.

**Lo que se descartó a propósito**

- Escaneo con cámara y seguimiento de impresión/foil exactos (ManaBox/Moxfield): fuera del
  alcance de una web sin app ni backend.
- Reservar copias entre mazos y «dónde está cada carta» (ManaBox): exige inventario por
  ubicaciones; aquí la colección es un mapa nombre → copias.
- Presupuesto máximo y precios: Scryfall ya devuelve precios, pero fijarlos como restricción
  del generador es otra función, no una mejora de la UX de construcción.
- Sideboard y legalidad de torneo: el formato se comprueba con `legalities` de Scryfall.

**Comprobado en el navegador**

- Resultados con `✓/✗` y vista previa (imagen cargada, nombre, tipo y texto) al hacer `mouseover`.
- Filtros `t:creature` + `mv<=2` + orden por nombre: los tres primeros resultados son criaturas
  de coste ≤ 2; `filterQ()` devuelve `t:creature mv<=2`.
- Standard con «Solo cartas que tengo»: pareja elegida por la colección (BU), **60/60** y
  «✓ Tienes todas las cartas del mazo». Antes, con una pareja al azar, se quedaba en un error
  de 18 cartas.
- Autoguardado: recargar conserva el mazo de 60 y la lista de faltantes.
- «Sugerir» comandantes devuelve 40 resultados con estrella; `lint_boards.py --strict` sigue en
  verde porque los tableros no se tocan.

## Forja de mazos: segunda pasada, con datos (26 nov 2026)

Segunda revisión con el generador y el panel medidos en partida real. Los fallos que aparecieron
no eran de estilo, eran de calidad del mazo:

**1. El generador montaba una colección de rocas caras.** Con un comandante mono blanco salieron
**36 artefactos** y un precio de **$1.571** (Mox Opal, Chrome Mox, Mana Vault, The One Ring…),
porque el relleno final cogía lo primero por `edhrec_rank` sin límite de tipo. Ahora:

- Objetivo de criaturas reales: 22 en Commander, 18 en Brawl/Standard. Se cuentan criaturas de
  verdad (una criatura con removal cuenta como removal y luego se rellena el hueco de criatura).
- Tope de artefactos no criatura: 10 en Commander, 6 en 60 cartas, tanto en el generador virtual
  como en el físico y en «Completar huecos».
- **Presupuesto por carta** (`#budget`): ≤ $5, ≤ $20 (por defecto) o sin límite. Se aplica al pool,
  a las tierras y al comandante automático; el precio de cada carta se ve en el buscador y el total
  en el panel del mazo y en la lista de compra.
- El mismo comandante Kutzil pasó de 36 artefactos y $1.571 a **25 criaturas, 10 artefactos y
  $242,93**.

**2. Las fuentes de maná mentían.** `landSources()` contaba todos los colores que produce una tierra,
así que Command Tower/Exotic Orchard daban 10 fuentes de U/B/R/G en un mazo mono blanco. Ahora solo
cuenta colores dentro de la identidad del mazo; un mono W muestra W 37 y el resto 0. El aviso de
«pocas fuentes» pasó a exigir 6 pips y menos del 60 % de fuentes (antes saltaba con 4 pips y 70 %,
que marcaba mazos de dos colores perfectamente jugables).

**3. La selección de tierras no miraba la demanda.** Las no básicas se ordenaban por popularidad.
Ahora `landScore()` suma la demanda de pips de los colores que produce y penaliza los que sobran,
así que en un mazo GW entran tierras que arreglan W y G antes que una de cinco colores.

**4. Faltaba lo básico de un editor.**

- **Deshacer** de hasta 40 pasos (`Ctrl+Z` y botón), también para «Vaciar»: antes era irreversible
  y el autoguardado sellaba el mazo vacío. Comprobado: 52 cartas → vaciar → 0 → `Ctrl+Z` → 52.
- **Completar huecos**: rellena el mazo sin borrarlo, por roles y con la base de maná ajustada;
  si no hay comandante ni colores elige una pareja (o la de más cartas propias con el filtro).
- **Sugerir cartas**: 320 candidatas populares con los filtros puestos, excluyendo lo que ya está
  en el mazo; útil cuando no sabes qué buscar.
- **Ver más** en los resultados (40 → 80…) y contador real («350 cartas»), en vez de cortar en 40
  sin avisar; **×4** añade un playset de una vez en formatos de cuatro copias.
- **Filtrar el mazo** por nombre o tipo para no bucear entre 100 filas.
- **Arrastrar** un `.txt`/`.csv` de colección al cuadro de texto.

**5. Precio y composición visibles.** Cuarto dato en las estadísticas (precio total, incluido el
comandante), chips de composición por tipo, fuentes por color con aviso si no cuadran con los pips,
y el comandante entra en la lista de faltantes si no lo tienes.

**Comprobado en el navegador**

- Commander virtual (Kutzil): 100/100, 25 criaturas · 13 instantáneos · 10 conjuros · 10 artefactos ·
  4 encantamientos · 37 tierras, $242,93; fuentes W 20 / G 30 y sin avisos de maná tras el ajuste.
- Standard con «Completar huecos» y colores WU: 60/60, 22 criaturas, 3 artefactos, 24 tierras,
  fuentes W 18 / U 14, sin avisos.
- Físico Standard con la colección corta: 52/60, 15 criaturas, 6 artefactos, 21 tierras, todas las
  cartas en propiedad y avisos honestos de las 8 que faltan y de las fuentes U/B.
- «Ver más»: 350 resultados, 40 → 80; «×4» deja 4 copias; sugerencias 320 sin repetir el mazo.
- Sin desbordamiento horizontal a 390 px (antes 93 px por el `min-width` del hueco del comandante),
  ni a 1280 px; consola limpia en las pruebas.
- `lint_boards.py --strict` en verde: los tableros siguen sin tocarse.

**Límite conocido**: los precios vienen de Scryfall en USD y las cartas de una colección importada
antes de este cambio no traen precio, así que en modo físico el total puede salir «—».

## Jugar los mazos de la Forja (26 nov 2026)

El taller servía para construir, no para probar. La solución no es reimplementar reglas ni un
«modo goldfish» aparte: los tableros ya tienen el motor completo, la IA y la mesa. Lo que faltaba
era **entregarles el mazo**.

### Un clic: «▶ Probar en el tablero»

En el pie del panel del mazo, `#deckTest` (`testDeck()` en `deckbuilder.html`) serializa el mazo
en una lista de nombres (incluido el comandante) y abre el tablero del formato:

    commander.html?play=1&d=<json>     (100 cartas + comandante)
    brawl.html?play=1&d=<json>         (60 cartas + comandante)
    standard.html?play=1&d=<json>      (60 cartas, sin comandante)
    captain.html?play=1&d=<json>       (40 cartas + capitán)

El JSON es `{v:1, format, name, commander, cards[]}`. Va en la URL, no en `localStorage`: así
funciona también con `file://`, no depende del origen y no deja mazos pegados entre pruebas.

### Qué hace el tablero (`js/play_bridge.js`)

La capa compartida se escribe en `tmp/play_bridge.js` y se publica con `tmp/sync_shared.py`
(`python tmp/sync_shared.py`). Se enlaza en los cuatro tableros para que el linter de capas siga
cuadrado. El rival se monta **en local**, sin pedir nada a Scryfall: primero un mazo guardado
del propio tablero y, si la biblioteca está vacía, el espejo del mazo que vienes a probar.

1. Valida `play=1`, `d` y que el `format` coincida con el tablero; si no, se retira en silencio.
2. Borra `play`/`d` de la URL con `history.replaceState`, para que recargar no reinicie la partida.
3. Muestra un overlay traducido (ES/EN/FR), espera a que existan `startGame`/`resolveNames` y
   resuelve los nombres contra Scryfall.
4. Monta el rival sin red: elige un mazo guardado de `state.packs` (el de tamaño más cercano
   al formato y distinto del tuyo) y, si no hay ninguno, juega un espejo. Solo se piden a
   Scryfall los nombres del rival que falten en la caché `CARD` (una tanda de `collection`).
5. Llama a `startGame(mazo, rival)` y retira el overlay cuando la mesa está montada.

No guarda nada en la biblioteca del tablero: el mazo sigue viviendo en la Forja (borrador y
«Guardar»). Al recargar el tablero, vuelve a su portada normal.

### Formato y tamaño

- Commander: la Forja manda 100 cartas contando al comandante; el tablero lo separa de la
  biblioteca y lo deja en la zona de mando.
- Brawl: 60 con comandante; el tablero juega 59 en biblioteca y el comandante aparte.
- Captain: 40 con capitán; la Forja manda 39 cartas + capitán y el tablero lo deja en la
  zona de mando. El rival sigue la misma regla local (mazo guardado o espejo).
- Standard: 60 sin comandante. Si el mazo viene corto, el tablero lo completa con básicas hasta
  el tamaño del formato (así una prueba parcial no se queda sin biblioteca).
- El rival no añade espera: cero peticiones a Scryfall en el camino crítico.

### Qué se probó en el puente

- Standard, mazo de 52 cartas: partida montada, mano de 7, biblioteca 53, rival de 60, sin errores
  de consola; el mulligan y el turno 1 funcionan.
- Brawl, 59 cartas + Selvala: mano 7, biblioteca 52, 30 vidas, rival con comandante (Goreclaw) y
  52 cartas.
- Commander, 99 cartas + Selvala: mano 7, biblioteca 92, 40 vidas, Selvala en la zona de mando y
  rival con comandante (Marvin, Murderous Mimic).
- `python tmp/lint_boards.py --strict` en verde tras añadir la capa `play-bridge` a los cuatro
  tableros; `python tmp/sync_shared.py --check` al día.

### Un choque previo en Commander

El tablero de Commander puede quedarse bloqueado al arrancar si la biblioteca guardada contiene
un mazo sintético de **99 Plains + Adeline, Resplendent Cathar** («Small»): ocurre también sin la
capa `play-bridge`, así que es un problema previo del análisis de ese mazo, no del puente. En un
perfil limpio (incógnito o sin ese mazo) Commander arranca y juega con normalidad. Queda pendiente
localizar ese bucle en el tablero.

## Modo Horda en el taller (`deckbuilder.html`)

La Horda es un **modo cooperativo de mesa**, no un formato de tablero: no hay motor de Horda ni
quinta web. Vive solo en `deckbuilder.html` como quinto formato del taller
(`FORMATS.horde`), con generación virtual/física, panel de análisis y PDF. Los cuatro tableros
no se han tocado para esto.

- **Qué genera**: 99 criaturas, coste 1–3, sin tierras, sin comandante y sin decisiones. La
  biblioteca es el propio mazo; no hay mano, maná ni turnos de la Horda como en un tablero.
- **Copias**: hasta 2 de cada carta (`copies:2`). La lista curada tiene **79 únicas**; las 20
  restantes son copias de las mejores criaturas de 1 y 2 maná. El análisis muestra únicas,
  repetidas, curva, roles, F/R media y avisos.
- **Lista**: `HORDE_SEED` en `deckbuilder.html` (79 nombres). No se genera al azar desde
  Scryfall: se validó carta a carta y se descartaron las que piden objetivos, elecciones,
  «puedes», sacrificios, habilidades activadas, coste X o efectos inútiles en Horda (vida,
  robo, maná, tierras, hechizos que no son criatura, tribus estrechas).
- **Validador**: `hordeInfo(c)` lee el oracle real (sin el texto recordatorio entre paréntesis)
  y devuelve `{ok, role, score, reasons, tags, narrow}`. `HORDE_BAD` contiene las palabras que
  implican decisión/activación; además se exige criatura, CMC 1–3, una cara y un efecto que se
  dispare al entrar, atacar, morir, combatir o lanzar hechizos. `hordeRole()` clasifica en
  fichas al atacar/entrar/morir, daño, himnos/contadores, combate, cast o cuerpo duro.
- **Roles de la lista**: ~49 fichas, ~15 fuentes de daño, 14 himnos/contadores, 12 de combate,
  2 de cast y 7 cuerpos duros (con las copias incluidas). La curva queda 24/29/46 (1/2/3).
- **Generación**: `hordeGenerate(false)` usa la lista curada; `hordeGenerate(true)` usa solo
  cartas de `COLL` que pasen `hordeInfo`, con tope de 2 copias y de lo que el usuario posee.
  `hordeAutoFill()` completa huecos en el modo activo. Si la colección no llega a 99, avisa y
  no inventa cartas.
- **Análisis**: el panel `#panelHorde` (visible solo con `FORMATS.horde`) pinta `#hordeSummary`,
  `#hordeWarn` y `#hordeTable`. Cada carta aparece con cantidad, coste, F/R, rol, efecto
  resumido y etiquetas (fichas, daño, himno, tribu, resiliente…). Los avisos comprueban tamaño,
  cartas no válidas, pocas fichas/daño/himnos, curva baja y repeticiones.
- **PDF**: `hordePrint()` abre una pestaña con un documento imprimible (A4): reglas de Horda,
  resumen, reparto por rol, avisos, lista/análisis de las 99 cartas y, opcionalmente, proxies
  3×3 a 63×88 mm (99 cartas = 11 hojas). El navegador abre el diálogo de impresión; se guarda
  como PDF con «Guardar como PDF». No hay generador de PDF binario ni dependencias.
- **Modos**: el selector «Mazo virtual / Mi colección» sigue funcionando. En virtual se usan las
  79 curadas; en colección solo lo que el usuario tiene. El buscador permite añadir cartas
  sueltas y `canAdd()` rechaza las que no pasan `hordeInfo` con el motivo.
- **Reglas de referencia**: sin vida, maná infinito, una carta por turno, todas las criaturas
  tienen prisa y atacan, el daño recibido se convierte en mill, los supervivientes tienen 20
  vidas y 3 turnos de preparación; escalado 45/60/75/99 según jugadores (el mazo del taller es
  el de 99).

**Comprobado en el navegador** (26 nov 2026): `hordeSeed()` devuelve 79 válidas y 0 no válidas;
generación virtual 99/99 con 79 únicas y 20 repetidas; generación física con 60 únicas ×2 da
99 y máximo 2 copias; `canAdd()` rechaza Lightning Bolt, Counterspell y Llanowar Elves con el
motivo correcto; `deckText()`/`parseList()` conservan 99 cartas y 79 nombres; el HTML del PDF
sale con 99 proxies, 11 hojas, reglas y análisis. No se ha pulsado «Guardar como PDF» en el
diálogo del navegador: se verificó el documento generado y que `hordePrint()` lo abre.

Scripts: `tmp/horde_deck.py` (integración), `tmp/horde_curated.py`/`tmp/horde_pick.py`
(selección y validación), `tmp/horde_doc.py` (esta sección). Reversión:
`tmp/versions/deckbuilder_before_horde.html`. El linter `python tmp/lint_boards.py --strict`
sigue en verde porque no se ha tocado ningún tablero.

## La Forja y los cuatro formatos jugables (26 nov 2026)

Faltaba el cuarto tablero: la Forja construía Commander, Brawl y Standard, pero **Captain
Jumpstart** (40 cartas singleton + capitán) solo existía dentro de `captain.html`. Ahora la
Forja lo trata como un formato más y el puente lo juega con las reglas del tablero.

### Qué añade `FORMATS.captain`

- `size:40`, `copies:1` (singleton real), `lands:16`, `cmd:true`, `leg:''` (Captain es casual: no
  hay legalidad de Scryfall que aplicar) y la marca `captain`.
- **Capitán = cualquier criatura**, no solo legendaria: `canCommand()` devuelve `isCreature(c)`
  cuando el formato es Captain, igual que el analizador del tablero. Al cambiar de formato se
  valida el comandante y se limpia si no vale (p. ej. un planeswalker de Brawl).
- **Reparto de roles** para 23 hechizos: 4 removal, 3 robo, 2 ramp y 14 criaturas; 16 tierras
  (hasta 6 no básicas y el resto básicas repartidas por pips). El contador incluye al capitán:
  40 = 23 hechizos + 16 tierras + capitán.
- **Etiquetas**: el hueco, la ficha del mazo, los avisos, la lista exportada y el botón de probar
  dicen «capitán»/«Capitán» en este formato. `deckText()` escribe `Capitán:` y `parseList()`
  entiende tanto `Capitán: Nombre` como la cabecera suelta seguida de `1 Nombre` (y sigue
  aceptando `Comandante:`).
- **Sugerir comandantes** busca `t:creature` en Captain (en Brawl mantiene
  `is:commander or t:planeswalker`), y la generación automática elige una criatura popular.

### El puente (`js/play_bridge.js`)

`testDeck()` abre `captain.html?play=1&d=<json>` con `format:'captain'`. El puente acepta
cualquier tablero cuyo nombre coincida con el formato. El rival ya no se genera ahí: antes se
creaban dos sobres de 20 con `buildPackFrom` y se fusionaban con `combinePacks` (varios segundos
de Scryfall antes de montar la mesa). Ahora sale de un mazo guardado del propio tablero o, si la
biblioteca está vacía, del espejo, sin pedir nada a la red: ver «Rival inmediato en el puente de
la Forja (26 nov 2026)». En Captain, un mazo guardado de 40 se juega tal cual con su capitán, y
el espejo conserva el capitán del mazo que vienes a probar.

### Comprobado en el navegador (Captain, 26 nov 2026)

- Generación virtual Captain: **40/40**, 16 tierras, singleton (`canAdd()` bloquea la segunda
  copia de Beast Within), capitán criatura (Elvish Mystic) y avisos solo de colección.
- Ida y vuelta de la lista: `deckText()` → `parseList()` recupera el capitán y 39 cartas + capitán
  = 40; la cabecera antigua `Comandante:` sigue funcionando.
- Partida real desde el puente: mesa montada, mazo del jugador 40 (Elvish Mystic en la zona de
  mando) y rival generado 40 con Tireless Provisioner; bibliotecas 32 tras la mano inicial, sin
  errores de consola.
- `node --check` de la Forja y del puente, y `python tmp/lint_boards.py --strict` en verde (los
  tableros no se han tocado; solo se editó la capa compartida del puente).

### Límites de Captain

- La Forja no replica el modelo de dos sobres: genera un mazo Captain directo de 40. Los sobres
  siguen siendo cosa de `captain.html`.
- Captain no tiene legalidad de formato en Scryfall; la única restricción es singleton y que el
  capitán sea criatura.
- La Horda sigue sin tablero: se construye, analiza e imprime en la Forja.

## Enlaces a la portada y la Forja con más peso (26 nov 2026)

**Cada web lleva camino de vuelta al portal.** En los cuatro tableros:

- El **logo** es ahora un enlace a `index.html`
  (`<a class="logo" href="index.html" title="Portada · Magic TCG">`); antes era un `div`
  con `data-go="inicio"`. Funciona a cualquier ancho y no cambia el alto de la cabecera.
  La sección «Inicio» del tablero sigue en el primer botón de la nav.
- La **nav** lleva un elemento más, «← Portal» (`data-i18n="nav.portal"`: ES/EN «Portal»,
  FR «Portail»), como primer elemento de `#nav`. En móvil (≤700 px) entra en la barra
  inferior con `flex:1` (seis elementos caben a 375 px sin scroll horizontal).
- **Única excepción**: entre 701 y 860 px el enlace de la nav se oculta
  (`@media (min-width:701px) and (max-width:860px){nav .navportal{display:none}}`),
  porque con él la nav más los dos selectores de idioma ya no caben en una fila y la
  cabecera pasaba de 50 a 99 px de alto. En esa franja se llega al portal por el logo.
- CSS en `css/board.css` y `css/board_captain.css` (`nav .navportal`, `a.logo` y la regla
  de la franja). Scripts: `tmp/add_portal_links.py` (enlace + claves i18n + CSS),
  `tmp/move_portal_link.py` (lo mete en la nav) y `tmp/portal_logo.py` (logo enlazado).
  Reversión: `tmp/versions/<tablero>_before_portal.html`.
- `taller.html` (la app antigua) lleva «← Volver a la portada» bajo la entradilla del menú.

**La Forja ya no es un enlace del pie en la portada**: `index.html` tiene un banner ancho
`.forge` entre la rejilla de formatos y el pie (marca ⚒, título, descripción, tres hechos y
CTA), con textos `forge.*` en ES/EN/FR. Para no romper el «sin scroll»:

- a 1920×1080 el banner mide 145 px y la rejilla de tarjetas cede altura;
- con `max-height:920px` pasa a tira compacta (sin descripción; hechos y CTA en fila) y la
  tarjeta de formato aprieta relleno y huecos;
- con `max-height:830px` se ocultan los hechos de la tarjeta **y** los del banner, y el arte
  de la tarjeta cede altura (`.shot{min-height:0}`, `.fmt .facts{display:none}`).

Medido en el navegador tras `document.getAnimations().forEach(a=>a.finish())`:
`documentElement.scrollHeight` = **1080** a 1920×1080, **864** a 1536×864 y **720** a 1280×720.

Comprobado además: `python tmp/lint_boards.py --strict` en verde (4 tableros); `t('nav.portal')`
pasa por Portal/Portal/Portail y el logo es `<a>` en los cuatro; cabecera de una fila a 771,
1281 y 1920 px; en standard a 375 px la barra inferior tiene los seis elementos sin scroll
horizontal. Partidas cargadas sin errores nuevos en consola (solo los 404 de imágenes de
Scryfall) en standard, brawl y captain; `commander.html` **no** se pudo comprobar en vivo por
el bloqueo de arranque que ya tenía (mazo guardado «Small»), ajeno a este cambio.

## Rival inmediato en el puente de la Forja (26 nov 2026)

**Síntoma**: al pulsar «Probar en …» en la Forja, el overlay se quedaba en «Buscando un rival…»
entre 10 y 20 s. **Causa**: `js/play_bridge.js` generaba el rival con el propio `cmdBuildDeck` del
tablero (bracket 3 en los colores del mazo), que encadena varias búsquedas de Scryfall
(`cmdPickCommander`, `cmdPool` con 2-12 páginas, sinergia de tribu) **antes** de llamar a
`startGame`; en `captain.html` hacía lo mismo con `searchCards` + `buildPackFrom` + `combinePacks`.

**Arreglo** (`tmp/play_bridge.js`, publicado con `python tmp/sync_shared.py`; reversión en
`tmp/versions/play_bridge_before_fastrival.js`):

1. `libraryOpponent()` elige, **en memoria**, un mazo ya guardado en el tablero (`state.packs`):
   descarta el que sea exactamente el mismo que traes y puntúa por cercanía al tamaño del formato
   (commander 99 · brawl 59 · standard 60 · captain 40) y por tener capitán.
2. Si la biblioteca está vacía, el rival es el **espejo** de tu mazo (que ya está resuelto).
3. Solo se llama a `resolveNames` para los nombres del rival que no estuvieran ya en la caché
   `CARD` (que se persiste en `localStorage.cj2_cards`), así que lo normal es **cero peticiones**.
4. Se quitó todo el bloque de generación (`cmdBuildDeck`, `searchCards`, `buildPackFrom`).

Medido en `standard.html` con el mismo mazo de 60 y la misma caché: **22,0 s → 8,8 s** hasta ver
`#jTable` (y con un mazo guardado en la biblioteca el rival es ese mazo real —«Arasta of the
Endless Web · #5», 60 cartas, 0 stubs—). El resto del tiempo ya no es el rival: es el arranque del
propio tablero (`ensureBasics`, `ensureDeckLands` y arte de fichas), todo por red de Scryfall.

Comprobado: `node --check js/play_bridge.js`; `python tmp/sync_shared.py --check` al día;
`python tmp/lint_boards.py --strict` en verde; partida real en standard (tú 60 / rival 60, 7 en
mano, 53 en biblioteca, 0 stubs) y en captain (25 / 25 con capitán, sin errores nuevos en consola
más allá de los 404 de imágenes de Scryfall). Sin commit.

## Proyecto conjunto: análisis medido y capa de red compartida (26 nov 2026)

**Radiografía** (para no volver a discutirlo de memoria): 7 páginas, 50.822 líneas, 5,1 MB de HTML;
el 92–97 % del código de cada tablero va **en línea**. Comparados línea a línea, los tres hermanos
son casi el mismo archivo: commander ↔ brawl **98,25 %** (13.160 líneas comunes), brawl ↔ standard
**97,26 %**, commander ↔ standard **96,55 %**. Es decir, ~845 KB de motor están triplicados y cada
navegación los vuelve a descargar y compilar.

**Arquitectura objetivo** (documentada en el artefacto «Proyecto conjunto · Magic TCG»): un
`js/engine.js` único + `js/formats.js` (tamaño, vidas, copia, comandante, regla de 21) + i18n
aparte, y páginas de formato finas. Fases: (1) capa de red compartida —hecha—, (2) motor único,
(3) textos fuera del código, (4) piel de `captain.html`. No cambia la regla del proyecto: sin
build y sin dependencias; el linter sigue mandando.

### Capa `net-cache` (fase 1, hecha)

`js/net_cache.js`, fuente `tmp/net_cache.js`, publicada con `python tmp/sync_shared.py`. Se enlaza
en los cuatro tableros **justo antes de `play-bridge`**:

    <script id="net-cache" src="js/net_cache.js"></script>

Envuelve `api()`, el único punto por el que los tableros piden datos a Scryfall:

- **memoria**: toda respuesta de la sesión (hasta 400 entradas). Una búsqueda de set entero pesa
  ~1 MB y no cabe en disco, pero repetirla dentro de la sesión cuesta **0 ms**.
- **disco** (`localStorage.cj2_netcache_v2`, 30 días): solo respuestas de menos de 120 KB, que son
  la mayoría de las consultas repetidas (básicas, tierras, fichas, nombres sueltos, impresiones).
  Tope 1,2 MB; si se llena, se recorta por antigüedad y, si aun así no cabe, se vacía.
- **en vuelo**: dos peticiones iguales simultáneas comparten promesa.
- Los POST (`/cards/collection`) y las imágenes no se tocan.
- Si algo falla (cuota, modo privado), se sigue llamando a la red: la capa no puede romper el juego.
- Consola: `__netCacheInfo()` y `__netCacheClear()`.

Medido en `standard.html`: primer arranque de partida **34 peticiones** a `api.scryfall.com`;
segundo arranque idéntico **10 peticiones** y **13 aciertos**; una misma consulta repetida pasa de
1.660 ms a **0 ms**; la caché de disco se queda en 547 KB con 17 entradas (tope respetado).
En `captain.html` la partida arranca igual (25 cartas por bando) con la capa activa.

Scripts: `tmp/add_net_cache.py` (inyecta la capa, la declara en `tmp/lint_boards.py` y en
`tmp/sync_shared.py`). Reversión: `tmp/versions/<tablero>_before_netcache.html`.

Comprobado: `python tmp/lint_boards.py --strict` OK (la capa es obligatoria en los cuatro),
`python tmp/sync_shared.py --check` al día y `node --check js/net_cache.js`.

## Reglas de carta: inventario de los once sets

`REGLAS_CARTAS.md` (raíz) es la lista de trabajo de mecánicas: **11 sets y 3.323 cartas** pedidas a
Scryfall el 26-11-2026 (`m15`, `ori`, `m19`, `m20`, `m21`, `fdn`, `grn`, `rna`, `war`, `dom`, `fra`).
Tiene la tabla maestra (mecánica · sets · nº de cartas · qué hace · estado en el simulador), lo que
trae cada set, las **estructuras de carta** (doble cara, partidas, sagas, preparación, vehículos,
equipos, auras, planeswalkers), la matriz mecánica × set, las listas de cartas raras y las
mecánicas que **no** aparecen en estos sets (comprobadas en el texto de las 3.323 cartas: investigar,
fusionar, cascada, mutar, aventura, batalla, clase, energía, infectar, profetizar, meld, morph…).

Cómo se genera (no se edita a mano, se regenera):

- `tmp/harvest_sets.py` → `tmp/data/<set>.json` (respuesta completa de Scryfall, idempotente).
- `tmp/build_rules.py` → `data/cartas_reglas.json` (nombre, tipo, texto, coste, keywords, caras).
- `tmp/rules_doc.py` → `REGLAS_CARTAS.md`.

Para añadir un set: su código a `SETS` en los tres scripts y volver a ejecutarlos.

### Estado real de las mecánicas (27-11-2026)

El motor del tablero resuelve las evergreens de combate y evasión (volar, alcance, arrollar,
amenaza, intimidar, dañar primero/dos veces, toque mortal, vínculo vital, vigilancia, prisa,
defensor, antimaleficio, indestructible) y las condiciones de palabra de habilidad con `gateText`
(umbral, mórbido, incursión, maestría de hechizos), además de renombre y landfall. `rules-core`
añade adivinar, vigilar, habilidades activadas, sacrificios, contadores, «no se puede bloquear»,
tipos de exilio, reducción de costes y fichas de Tesoro.

La capa `rules-more` (`tmp/rules_more.js` → `js/rules_more.js`, 27-11-2026) añade lo que faltaba
de los once sets:

- **Amasar** (22 cartas): crece un Ejército o se crea una ficha 0/0.
- **Proliferar** (17): otro contador de cada tipo ya presente. Los bonus de turno comparten `a`/`b`
  con los contadores, así que también suben (aproximación conocida del motor).
- **Adaptar** (13): solo si la criatura no tiene contadores.
- **Empoderar a Jace** (35, nueva de FRA): ficha de planeswalker Jace con lealtad y sus dos
  habilidades («[−1]: Vigilar 1», «[−3]: Roba una carta»), reutilizada si ya hay un Jace.
- **Preparada** (24, nueva de FRA): el permanente es la cara frontal y un botón «✧» lanza una copia
  del conjuro de la cara trasera; al hacerlo se desprepara.
- **Disturbio** (13): elección al entrar (+1/+1 o prisa), con selector para el jugador.
- **Mentor** (14), **más allá** (10) y **sotobosque** (12, solo escalado de daño).
- **Espectáculo** (10): coste alternativo si el rival perdió vida en el turno.
- **Afinidad** (4): `{1}` menos por permanente del tipo indicado.
- **Pátina / estímulo** (34): coste adicional opcional y frases «si fue estimulado».
- **Convocar** (37): gira criaturas para pagar cuando falta maná (fuentes temporales que se retiran).
- **Ciclar y ciclaje de tierra** (5): botón «↻» en la mano; descarta y roba o busca una básica.
- **Contemplar a un Jace**: si no hay Jace, la tierra entra girada o el hechizo cuesta `{1}` más.
- **Retrospectiva y salto inicial**: el cementerio abre con `showPile`; las cartas con esos costes
  llevan un botón «↺» que las lanza, las exilia y, en salto inicial, descarta otra carta.
- **Cartas partidas** (20 de GRN/RNA): selector de mitad al lanzar; se paga solo esa mitad y se
  resuelve solo su texto (antes se resolvían las dos).
- **Regenerar**: escudo de reemplazo que se gasta en `killPermanent` o al recibir daño letal (se
  gira y sobrevive); «no se puede regenerar» lo anula.
- **Tripular**: botón «⚙» en tus Vehículos; gira criaturas con fuerza total ≥ N y el Vehículo es
  criatura hasta el final del turno.
- **Apéndice** (siempre en fase principal), **agotar** (una vez por partida) y **cambiante** (es de
  todos los tipos de criatura).
- **Clic humano**: el tablero llama a un `castFromHand` interno que se salta las capas; `paintHand`
  reengancha el clic de la mano solo para partidas y estímulo (modos, X y lo demás siguen igual).

Siguen en **pendiente** o **parcial**: destello, protección, dominio, feroz, formidable, histórico,
batallón, conjuro legendario, equipar completo y las estructuras de carta que faltan (sagas,
vehículos con tripulación de la IA y planeswalkers completos).

### Orden de implementación acordado

1. **Hecho · costes alternativos y adicionales**: pátina, ciclar y ciclar por tipo, espectáculo,
   convocar y afinidad (`rules-more`); destello y agotar siguen pendientes.
2. **Hecho · condiciones**: umbral, mórbido, incursión, landfall, maestría de hechizos y renombre
   (motor); sotobosque solo en daño; apéndice, dominio, feroz, formidable y batallón pendientes.
3. **Hecho · contadores y fichas**: proliferar, amasar, más allá, mentor, disturbio y Tesoro.
4. **Hecho · partidas (`split`, 20)**: elegir mitad al lanzar. **Siguiente**: doble cara
   (`transform`, 6), sagas (14), preparación (`prepare`, 21, ya con cara frontal y copia),
   vehículos con tripulación de la IA, equipos completos y planeswalkers (111).
5. **Hecho · Reality Fracture**: empoderar a Jace (35) y preparada (24).

La columna «estado» de `REGLAS_CARTAS.md` se corrige al abrir cada mecánica. El banco de la capa
nueva es `node tmp/test_rules_more.js` (21 grupos, sin navegador) y el linter exige `rules-more-css`
y `rules-more` en los cuatro tableros.

## Ventanas de montón líquidas (27 nov 2026)

Las ventanas de cementerio, exilio y zona de mando (`showPile`) ocupaban casi toda la pantalla
(`inset:6vh 4vw`) aunque hubiera una sola carta, con las cartas pegadas arriba a la izquierda y un
velo oscuro. Ahora el panel mide lo que ocupan las cartas y queda centrado.

- `tmp/liquid_pile.py` envuelve el contenido de `showPile` en un `.pv-panel` en los **cuatro**
  tableros (sin ese envoltorio, la cabecera estiraría el ancho del panel). Es idempotente;
  `--check` solo avisa.
- El CSS vive al final de `tmp/rules_core.css` y se publica con `python tmp/sync_shared.py`:
  - `#jPileView` pasa a ser un contenedor transparente que centra (`align-items`, `align-content`
    y `justify-content` a `center`); el fondo, el borde y la sombra se mudan a `.pv-panel`.
  - `.pv-panel`: `width:fit-content`, `min-width:240px`, `max-width:min(1180px,94vw)`,
    `max-height:min(86vh,920px)`, `overflow:auto` y cartas con `justify-content:center`.
  - La cabecera (`.pvh`) va en `position:absolute` para no estirar el panel, con `text-overflow`.
  - `#rulesPick` pierde el velo (`background:transparent`, sin `backdrop-filter`): solo se ve su
    caja, ahora `width:max-content` con mínimo de 260 px.
- `#lgPick` (buscar o elegir cartas, capa `lib-gy`) también es líquida: caja de 280 px a
  `min(880px,94vw)` según cuántas cartas caben en una fila (variable `--lg-n`, máximo 5), rejilla
  de 150 px centrada, cabecera y pie con `flex-wrap` y sin velo de fondo.
- **Caché**: `css/rules_core.css` lleva `?v=20261127c`, y `css/lib_gy.css` + `js/lib_gy.js` llevan
  `?v=20261127b`, en los cuatro tableros (`tmp/bust_rules_css.py`). Al tocar cualquiera de esos
  archivos hay que subir su versión o el navegador sigue usando la copia vieja; el JS va versionado
  porque el ancho del panel se calcula ahí. `tmp/lint_boards.py` ignora la query.

Medido en el navegador (viewport 772x932; y 390x740 en captain):

| caso | panel | filas | scroll |
|---|---|---|---|
| 5 cartas | 505x181, centrado | 1 | no |
| 1 carta | 240x181 (mínimo), centrada | 1 | no |
| 60 cartas | 707x802 | 10 | sí |
| captain, 4 cartas | 408x181, centrado | 1 | no |
| 390 px, 6 cartas | 353x260 | 2 | no |
| 390 px, 60 cartas | 353x681 | 15 | sí |
| 53 cartas (búsqueda) | 722x802, 4 columnas | 14 | sí |
| 2 cartas (búsqueda) | 348x353 | 1 | no |
| 390 px, 6 cartas (búsqueda) | 341x802, 1 columna | 6 | sí |

Comprobado además: el fondo de `#jPileView` es transparente y el panel conserva el fondo oscuro; el
clic en la cabecera y el clic fuera del panel lo cierran; la insignia de retrospectiva sigue
funcionando dentro del panel nuevo; y el selector de reglas queda sin velo y ajustado a su caja.

## Zoom de carta en pantallas bajas (27 nov 2026)

`placeZoom` (en los cuatro tableros) usaba `innerHeight` a secas y dejaba el
ancho del CSS si algo fallaba: en ventanas bajas la carta se salía por abajo y
el navegador la estiraba (`object-fit:fill`).

Ahora:

- `vh = Math.min(innerHeight, documentElement.clientHeight)` y el ancho es
  `min(520, innerWidth*0.42, (vh-24)*0.716)` (capitán: 248 / `innerWidth*.24`).
- Se fijan **ancho y alto** (`h = w/0.716`), así la proporción es siempre la de
  la carta y no hay deformación.
- `#cardZoom` en `css/rules_core.css` añade `max-width/max-height:calc(100vw/vh - 16px)`,
  `object-fit:contain` y fondo `#080d13`: aunque el JS se quede corto, la imagen
  se ajusta sin estirarse (puede quedar una franja del fondo).
- Versión de la hoja: `rules_core.css?v=20261127d` (`tmp/bust_rules_css.py`).

Medido en `captain.html` (viewport 771×932): caja 185×258, ratio 0.717 frente a
0.718 natural, `object-fit:contain`, dentro de la ventana. Con `vh` forzado a 420
la caja queda en 284×397, `top 8` y `bottom 405` (cabe con 24 px de margen).

`#lgPick` en partida real (misma ronda, mazos de prueba):

| tablero | cartas | caja | columnas | fondo |
|---|---|---|---|---|
| commander | 92 | 722×802, de y=65 a 867 | 4 | transparente |
| brawl | 52 | 722×802, de y=65 a 867 | 4 | transparente |
| captain | 33 | 722×802, de y=65 a 867 | 4 | transparente |

En los tres el pie («Elige una carta» / «Elige la IA») queda visible dentro de la
ventana y el tablero se ve por detrás. `commander.html` en el perfil normal se
queda colgado al cargar con los mazos guardados (problema previo, ajeno a este
cambio); la comprobación se hizo en una pestaña incógnito sin `localStorage`.

## Cuelgue al cargar con mazos guardados sin set (27 nov 2026)

Síntoma: `commander.html` se quedaba con la pestaña bloqueada (sin responder a
nada) al arrancar con el mazo guardado «Small» (99 Plains + Adeline), mientras
que en incógnito sin `localStorage` cargaba bien. No era la red: el bucle estaba
en la vista previa de impresión.

Causa, en `ensureBasicArt()` (los cuatro tableros):

- `renderPrintInfo()` llama a `hydratePreviewBasics()`, que pide
  `ensureBasicArt()` si el mazo tiene básicas y `basicArtLang` no coincide con
  el idioma de cartas.
- Si el mazo **no guarda set** (`setCode:''`, `prints:{}` y sin sets deducibles),
  `packSetOf(p)` devuelve `''` y `ensureBasicArt` hacía `continue` **sin marcar
  `basicArtLang`**.
- Al terminar, el `.then()` de `hydratePreviewBasics` vuelve a llamar a
  `renderPrintInfo()`, que ve la misma necesidad y repite → recursión infinita
  de promesas; el hilo principal se queda bloqueado.

Arreglo (`tmp/fix_basics_loop.py`, copias en
`tmp/versions/<tablero>_before_basicsloop.html`): cuando hay básicas pero no set,
se marca `p.basicArtLang=L` antes del `continue` (no hay arte que pedir y la
vista previa deja de reintentarlo).

Comprobado en partida real de carga (no en incógnito):
- `commander.html#inicio` con «Small»: `readyState complete`, 1 mazo, 99 cartas,
  `basicArtLang:'es'`, `renderPrintInfo()` en 1 ms, «1 mazo · 100 cartas ·
  12 hojas», sección «Imprimir» con 8 imágenes de vista previa y sin errores en
  consola.
- `brawl.html` y `standard.html` (mazos propios) y `captain.html` siguen
  cargando; `renderPrintInfo()` en 1-2 ms.
- `lint_boards.py --strict` verde y `sync_shared.py --check` 16/16.

El diagnóstico se hizo con copias instrumentadas (`tmp/debug_boot.py`,
`tmp/strip_layers.py`): se aisló `applyI18n → onLangChange → renderPrintInfo` y
dentro de esta `hydratePreviewBasics`; las copias `commander_dbg*.html` se
borraron al terminar.

## Habilidades de Ayli y Vito (27 nov 2026)

Ayli, Eternal Pilgrim y Vito, Thorn of the Dusk Rose no aplicaban sus
habilidades. En `tmp/rules_core.js` (capa `rules-core`, compartida por los
cuatro tableros) faltaban tres piezas:

- **Coste con el nombre de la carta**: `sacAbilities()` solo reconocía
  «Sacrifice this/it». Ahora también acepta «Sacrifice <nombre de la carta>»
  (escapando el nombre), así que el coste no se cobraba de más ni de menos.
- **Vida igual a la resistencia**: al sacrificar, `use()` guarda la víctima y
  sustituye «You gain life equal to the sacrificed creature's toughness» por
  «You gain N life» con `thOf(victim)`. (La impresión actual de Ayli usa
  «Sacrifice another creature», ya contemplado por `sacWhat`.)
- **Disparo al ganar vida**: se envuelve `applySpell()` para medir la vida
  ganada y aplicar «Whenever you gain life, target opponent loses that much
  life» al rival (una vez por Vito y por ganancia). Vale también para el rival.
- **Lifelink temporal**: `generalAbilities()` acepta «gain lifelink»; al
  activarlo se marca `_kwLifelinkTurn` en las criaturas y el `grantedKw()`
  envuelto devuelve lifelink ese turno.
- **Lifelink de combate**: el daño con vínculo vital suma vida directamente en
  `resolveCombat`; también se envuelve para medir la vida ganada y disparar a
  Vito.

Comprobado en `commander.html` con una partida real (`startGame` + mulligan) y
permisos con estadísticas como las de una permanente real:
- Ayli: se sacrifica el Centauro 3/3, la vida sube +3, Ayli sigue en mesa.
- Vito: `applySpell` con «You gain 4 life» deja al rival en −4 y el registro
  muestra «IA pierde 4 vidas» una sola vez; la habilidad de lifelink se activa
  y `grantedKw(perm,'lifelink')` es true.
- `rules_core.js` se publica con `tmp/sync_shared.py`; para que el navegador no
  sirva la copia vieja, los cuatro tableros enlazan
  `js/rules_core.js?v=20261127g` (y el CSS con la misma versión).

También se probó el lifelink de combate con `resolveCombat`: un 3/3 con
vínculo vital deja al jugador en +3 y al rival en −6 (3 de daño + 3 de Vito),
con un solo «IA pierde 3 vidas» en el registro.

No comprobado: la segunda habilidad de Ayli (exilio) más allá del parseo.

## Bloqueos estilo Arena (capa `block-arena`, 27 nov 2026)

Sustituye la presentación de los bloqueos por una mesa tipo Arena, sin tocar el
motor: `#jBlockWrap` y sus `<select data-blk>` siguen siendo la fuente de
verdad (también en multijugador, `askBlocks`), y «Aceptar bloqueos» rellena los
selects y pulsa el `#jBlockOk` original.

- `css/block_arena.css` (`?v=20261127g`) y `js/block_arena.js` (`?v=20261127e`),
  fuente en `tmp/`, publicados con `sync_shared.py` y enlazados en los cuatro.
- Los atacantes van arriba y tus criaturas legales abajo; se toca una criatura
  propia y luego el atacante. La asignación se marca con una flecha SVG y un
  círculo «×» para quitarla. Una criatura solo puede bloquear un atacante; las
  opciones que el motor no ofrece se rechazan con un temblor.
- El panel original (filas, selects y botón) se oculta cuando la mesa nueva se
  pinta; si no hay atacantes localizables (p. ej. un invitado sin la copia de
  las permanentes), no se oculta nada y queda la UI antigua como respaldo.
- **Mesa fija y centrada**: con la mesa nueva, `#jBlockWrap` pasa a
  `position:fixed` centrada (95vw, máximo 92vh, sombra de fondo) en vez de ser
  un bloque al final de la página. Como `#jugar` puede tener un ancestro con
  `transform`, un `fixed` dentro se colocaría respecto a ese ancestro (la mesa
  salía en y≈1740): el JS mueve el panel al `body` mientras dura la declaración
  y lo devuelve a su sitio al cerrarse.
- `#jBlockWrap` se fuerza a columna (`#jBlockList` al 100 %) para que la mesa
  use todo el ancho; antes, al ser un flex en fila, la mesa se quedaba en
  549 px y el botón no coincidía con el centro. El pie es una rejilla
  `1fr auto 1fr`: estado a la izquierda y **«Aceptar bloqueos» centrado**
  (`min-width:190px`).
- `scan()` se dispara con `MutationObserver` y usa `getClientRects()` (no
  `offsetParent`, que es null en `position:fixed`). El botón original se
  consulta en cada scan porque `startBlocks`/`askBlocks` rehacen el panel.

Comprobado en partida real de `commander.html` (mulligan cerrado, mesa nueva
abierta con `startBlocks` y criaturas con estadísticas reales):
- Captura en `tmp/shots/bloqueos_real.png`: panel centrado en la pantalla
  (733×472 en x=10,8, y=230; centro 377,5/466) con el botón exactamente en el
  mismo centro (377,5), flecha de Centauro a Centauro y estado «1/2».
- El panel se sale del flujo de la página, no hay scroll para verlo y las filas
  y el botón viejos quedan ocultos.

Multijugador real con dos pestañas `commander.html?mplocal=1` (BroadcastChannel):
- El invitado recibió el `blockReq`, se pintó la mesa (3 bloqueadores, 2
  atacantes), asignó con flecha y «Aceptar bloqueos» (captura
  `tmp/shots/bloqueos_mp.png`); el anfitrión resolvió el combate y el atacante
  bloqueado no hizo daño al jugador. Mismo centrado exacto (377/377).
- No comprobado: multijugador por WebRTC entre navegadores distintos (la ruta
  de red no cambia; solo se probó el canal local de dos pestañas).
## Buscador de cartas del constructor (capa `deck-search`, 27 nov 2026)

Botón «🔎 Buscador» junto a `#edSearch` en el editor de los cuatro tableros.
Abre un modal a pantalla casi completa con filtros de Scryfall y añade cartas
con `addCardByName()` (respeta límite, singleton e identidad del mazo).

- `css/deck_search.css` y `js/deck_search.js` (fuente en `tmp/`, publicados con
  `sync_shared.py`), enlazados con `?v=20261127c`.
- Filtros: nombre, texto de reglas, tipo libre, tipos (criatura, instantáneo,
  conjuro, artefacto, encantamiento, planeswalker, tierra, batalla), colores
  con modo contiene/exacto/identidad/dentro de identidad, identidad de color,
  coste mín/máx, fuerza y resistencia mínimas, rareza, set (con datalist de
  `/sets`), legalidad por formato, palabras clave (multiselección), precio USD,
  «solo con imagen» y «legal en este formato». Orden (EDHREC, nombre, coste,
  fecha, rareza, precio, fuerza, resistencia) y cartas únicas/impresiones.
- Resultados en rejilla con imagen, tipo, coste y set; clic para añadir, con
  contador «N en el mazo». Paginación anterior/siguiente y estado de resultados.
- Usa `api()`/`net_cache` si existen y, si no, `fetch`; por defecto busca
  `-is:digital` cuando no hay filtros para no pedir una consulta vacía.

Comprobado en `commander.html` (editor abierto): «Atraxa» + azul + criatura +
Commander devuelve 2 resultados; `fdn` + criatura devuelve 290 (175 en pantalla,
«siguiente» activo) y la página 2 empieza por otra carta; al pulsar una carta
aparece «1 en el mazo» y el mazo pasa de 0 a 1 (se deshizo el cambio). El modal
abre y cierra en los cuatro tableros.
No comprobado: todas las combinaciones de filtros una a una ni el límite de
mazo lleno.

## Modo local de dos pestañas arreglado (`mp-layer`, 27 nov 2026)

Al probar los bloqueos con dos pestañas `?mplocal=1`, el botón «Local: unirme»
no arrancaba la partida: el invitado enviaba `join`, pero el anfitrión lo
descartaba y todo se quedaba en «2 mazos disponibles».

Causa: `openLocal()` creaba el `BroadcastChannel`, asignaba `MP.dc = fakeDC` y
`MP.ready=true`, pero **nunca llamaba a `bindDC(fakeDC)`**. `bc.onmessage`
reenvía a `MP.dc.onmessage`, que era `undefined`; por eso el `join` se perdía.

Arreglo en `tmp/mp_layer.js`:

    bindDC(fakeDC);
    MP.role = asHost ? 'host' : 'guest';
    if (fakeDC.onopen) fakeDC.onopen();

`bindDC` instala el `onmessage` que interpreta los mensajes y `onopen` hace que
el invitado mande el `join` (el anfitrión solo queda a la espera). Se
reinyectó con `python tmp/inject_mp.py commander.html brawl.html standard.html`
(copias `tmp/versions/<tablero>_before_mplocal.html`).

Comprobado con dos pestañas reales del navegador: tras alojar/unir, ambos tienen
`G.you` con 40 vidas y 7 cartas, el anfitrión empieza en su turno, ataca al
invitado y este ve la mesa de bloqueos, confirma y el combate se resuelve en el
anfitrión. Consola sin errores.

No se tocó `captain.html` (no tiene `mp-layer`).

## Scry/surveil: selector lateral con la carta (27 nov 2026)

Síntoma: al resolver scry o surveil, la ventana de `rules-core` (`#rulesPick`)
aparecía **centrada encima del campo**, con una lista de texto y sin la carta;
tapaba las criaturas y el botón no dejaba ver qué se estaba decidiendo. Además,
el aspa permitía cerrar a mitad: las cartas ya sacadas de la biblioteca se
quedaban fuera para siempre.

Cambios en `tmp/rules_core.js` / `tmp/rules_core.css` (publicados como
`js/rules_core.js` y `css/rules_core.css`, ambos con `?v=20261127h`):

- El selector pasa a ser un **panel lateral derecho** de 340 px (42vw), centrado
  verticalmente, con fondo opaco y sombra; el campo y las cartas centrales
  quedan visibles. En pantallas de ≤700 px se convierte en hoja inferior
  (ancho completo, máximo 58vh).
- `picker()` acepta una imagen de carta (`art`) y la pinta en `.rpk-art`; scry y
  surveil le pasan `cardImg(c)` de la carta que toca decidir. Las opciones
  pueden llevar `img` y se dibujan con miniatura (`.rpk-th`); el sacrificio
  elegido por el jugador ya muestra la miniatura de cada criatura.
- Scry/surveil abren el selector con `noClose=true`: **sin aspa**, porque
  cerrarlo dejaría las N cartas fuera de la biblioteca. Hay que decidir cada
  carta (arriba / al fondo o al cementerio).
- El resto de selectores que comparten la ventana (habilidad activada ◈,
  sacrificio, split/kicker/riot de `rules_more`) heredan la posición lateral y
  dejan de tapar el centro del tablero. Los de `rules_more` muestran también la
  carta en `.rpk-art` (`?v=20261127a`).

Comprobado en partida real de `commander.html`:
- Scry 3: panel en x=412–737 (324 px), la carta se ve en `.rpk-art`, tres pasos
  con «Dejar arriba»/«Al fondo», sin aspa; al terminar el registro dice
  «Scry 3: 3 arriba, 0 al fondo» y las tres cartas siguen arriba.
- Surveil 2: arte visible y botón «Al cementerio»; al terminar el cementerio
  pasa de 0 a 2 cartas.
- Selector de sacrificio con dos criaturas: panel lateral, dos miniaturas,
  aspa disponible; elegir una la sacrifica.
- Capturas: `tmp/shots/scry_antes.png` (centrado, tapando el campo) y
  `tmp/shots/scry_despues.png` (panel lateral con la carta).

Comprobado después, ya con arte en el panel: `Fire // Ice` (split) muestra
las dos mitades y la carta, resuelve «Fire» con 2 de daño; `Into the Roil`
(kicker) ofrece pagar el estímulo y lo cobra; `Zhur-Taa Goblin` (riot) entra con
la elección +1/+1 o prisa. Scry 3 en una partida real de `captain.html` muestra
la carta, los pasos «1/3, 2/3, 3/3» y deja las tres arriba. Captura:
`tmp/shots/riot_picker.png`.

## Buscador de cartas: habilidades, coste y sinergia (27 nov 2026)

El buscador del constructor (`tmp/deck_search.js` / `tmp/deck_search.css`,
publicados con `?v=20261127h`) añade tres formas rápidas de filtrar sin salir de
la misma consulta:

- **Habilidad / función**: chips que se traducen a etiquetas de oráculo de
  Scryfall (`otag:ramp`, `otag:draw`, `otag:removal`, `otag:board-wipe`,
  `otag:tutor`, `otag:recursion`, `otag:protection`, `otag:evasion`,
  `otag:lifegain`, `otag:discard`, `otag:mill`, `otag:scry`, `otag:blink`,
  `otag:theft`, `otag:counter`, `otag:sacrifice-outlet`,
  `o:"+1/+1 counter"`, `otag:lands-matter`). Varias seleccionadas se unen
  con `or` dentro de un solo paréntesis. Se usan solo etiquetas comprobadas:
  `otag:tokens`, `otag:counters` o `otag:card-draw` dan 404 en Scryfall.
- **Coste mínimo y máximo**: los dos campos `cmcMin` / `cmcMax` salen de «Más
  filtros» a la rejilla principal, junto a tipo y formato. Se traducen a
  `cmc>=` y `cmc<=`. Los colores siguen en sus chips (contiene, exacto,
  identidad o dentro de la identidad).
- **Sinergia con otra carta**: campo con autocompletado de Scryfall. Al buscar,
  se pide **una sola vez** `/cards/named?exact=`, se guarda en caché y se
  construye una única consulta. Se extraen hasta dos subtipos y tres palabras
  clave, y se detecta la **dirección** de la carta:
  - **pago**: dispara al ocurrir algo (p. ej. «whenever you gain life»); se
    buscan **generadores** de ese recurso.
  - **genera**: produce el recurso (p. ej. «proliferate», «you gain 1 life»); se
    buscan **pagos** que lo aprovechen.
  - **pago/genera** o **tema**: se incluyen ambos lados.

  Los roles son frases precisas, no etiquetas amplias: para pagos de vida se
  usa `o:/you gain (\d+|X) life/` y `o:"you gain life equal"`; así Swords to
  Plowshares («gains life») ya no entra. Para contadores se usa
  `o:"+1/+1 counter"` y `o:"whenever a +1/+1 counter"`; para fichas,
  sacrificio, robo, descarte, molino, scry/surveil y tierras hay pares
  enabler/payoff equivalentes. La consulta final mezcla subtipos, palabras
  clave, roles y excluye la propia carta con `-!"Nombre"`; al pintar se puntúa
  subtipo (5), palabra clave (4) y rol (6), y se ordena la página para que las
  cartas de tipo/tribu y las del rol correcto queden por encima de las que solo
  comparten una palabra clave genérica. La nota bajo el campo dice la dirección
  y los rasgos usados. Repetir la búsqueda no vuelve a pedir la carta; como
  máximo son 2 peticiones (carta + búsqueda).

Comprobado en el navegador, en `commander.html`:
- `otag:ramp` + verde + coste 1–3: 546 resultados; primeros Cultivate,
  Farseek, Nature's Lore, Rampant Growth, Birds of Paradise.
- **Vito, Thorn of the Dusk Rose** (pago de vida): consulta
  `(t:vampire or o:"Vampire" or t:cleric or o:"Cleric" or
  o:/you gain (\d+|X) life/ or o:"you gain life equal") -!"Vito..."`,
  2513 resultados; nota «pago → vida generada + vida igual · Vampire/Cleric».
  Primeros Blood Artist, Soul Warden, Elas il-Kor, Archivist of Oghma, Cruel
  Celebrant; **Swords to Plowshares ya no aparece**.
- **Atraxa, Praetors' Voice** (genera contadores y vida): consulta con
  Phyrexian/Angel, deathtouch/flying/lifelink y los pagos
  `o:"whenever you gain life"`, `o:"+1/+1 counter"`,
  `o:"whenever a +1/+1 counter"`; 6571 resultados; nota «genera → pago de vida +
  pago de contadores · Phyrexian/Angel, deathtouch/flying/lifelink». Primeros
  K'rrik, Exemplar of Light, Shalai, Archangel of Thune (todos con contadores o
  vida); las cartas que solo comparten una palabra clave quedan debajo.
- Limpiar oculta la nota y vacía la consulta; consola sin errores.

Límites: es una heurística (probada con Vito y Atraxa) de sinergia, no una recomendación de EDHREC. La
dirección se deduce del texto y puede fallar en cartas con varias frases; el
orden es solo dentro de la página que devuelve Scryfall, no global. Para
afinarlo, combinar con colores, coste o identidad.

## Buscador: tipos de carta completos y localizados (27 nov 2026)

Los chips de **Tipos** del buscador (`tmp/deck_search.js`, publicado como
`js/deck_search.js?v=20261127l`) cubren todos los tipos de carta de Scryfall y
los casos compuestos habituales. Las consultas no cambiaron al localizar:

| valor | ES | EN | FR | consulta |
|---|---|---|---|---|
| creature | Criatura | Creature | Créature | `t:creature` |
| legendary creature | Criatura legendaria | Legendary creature | Créature légendaire | `(t:legendary t:creature)` |
| artifact | Artefacto | Artifact | Artefact | `t:artifact` |
| artifact creature | Criatura artefacto | Artifact creature | Créature-artefact | `(t:artifact t:creature)` |
| enchantment | Encantamiento | Enchantment | Enchantement | `t:enchantment` |
| enchantment creature | Criatura encantamiento | Enchantment creature | Créature-enchantement | `(t:enchantment t:creature)` |
| planeswalker | Planeswalker | Planeswalker | Planeswalker | `t:planeswalker` |
| legendary planeswalker | Planeswalker legendario | Legendary planeswalker | Planeswalker légendaire | `(t:legendary t:planeswalker)` |
| instant | Instantáneo | Instant | Éphémère | `t:instant` |
| sorcery | Conjuro | Sorcery | Rituel | `t:sorcery` |
| land | Tierra | Land | Terrain | `t:land` |
| basic land | Tierra básica | Basic land | Terrain de base | `(t:basic t:land)` |
| battle | Batalla | Battle | Bataille | `t:battle` |
| kindred | Kindred (tribal) | Kindred (tribal) | Kindred (tribal) | `t:kindred` |

Las etiquetas viven en `TX` como claves `ty.*` (una por tipo e idioma) y
`chips()` las pinta con `tx()`; `refreshLabels()` actualiza todos los chips y
leyendas marcados con `data-ds-i18n` cuando cambia el atributo `lang` de
`<html>`. Los valores de los inputs siguen siendo los mismos, por lo que el
FormData y las consultas no se tocan; la leyenda de tipos también se refresca
al cambiar de idioma. Las claves nuevas son `co.*`, `ra.*` y `ab.*`; los valores
de los chips y las etiquetas anteriores de español se mantienen.

Comprobado en el navegador, con el buscador abierto y cambiando ES → EN → FR →
ES: los 14 chips y la leyenda cambiaron en caliente, y volvieron a español.
Consultas verificadas:

- Criatura legendaria: `((t:legendary t:creature)) f:commander`, 3672
  resultados; las primeras fichas dicen «Legendary Creature — …».
- Planeswalker legendario: `((t:legendary t:planeswalker))`, 320 resultados;
  todas «Legendary Planeswalker — …».
- Criatura legendaria + Instantáneo: 7455 resultados, unión de ambos.
- `t:kindred` (78), `t:battle` (36) y `t:basic t:land` (12 básicas) responden
  200.

No se cambió el resto de etiquetas del modal (colores, rarezas, habilidades),
que siguen como estaban; esta pasada solo afecta a los tipos.


## Buscador: colores, rarezas y habilidades localizados (27 nov 2026)

Se localizaron también los chips y leyendas que quedaban en español
(`tmp/deck_search.js`, publicado como `js/deck_search.js?v=20261127l`). No se
cambió ni un valor de consulta: los `input` siguen enviando `W/U/B/R/G`,
`common/.../special` y `ramp/draw/.../lands-matter`.

- **Colores**: `co.W` … `co.G` → Blanco/Azul/Negro/Rojo/Verde ·
  White/Blue/Black/Red/Green · Blanc/Bleu/Noir/Rouge/Vert. Se usan tanto en
  «Colores» como en «Identidad»; el punto de color (`ds-pip`) queda fuera del
  span traducible para no borrarlo.
- **Rarezas**: `ra.common` … `ra.special` → Común/Infrecuente/Rara/Mítica/
  Especial · Common/Uncommon/Rare/Mythic/Special · Commune/Peu commune/Rare/
  Mythique/Spéciale.
- **Habilidades**: `ab.ramp`, `ab.draw`, `ab.removal`, `ab.boardWipe`,
  `ab.tutor`, `ab.recursion`, `ab.protection`, `ab.evasion`, `ab.lifegain`,
  `ab.discard`, `ab.mill`, `ab.scry`, `ab.blink`, `ab.theft`, `ab.counter`,
  `ab.sacrifice`, `ab.countersMatter`, `ab.landsMatter`. ES conserva las
  etiquetas anteriores; EN usa Ramp, Card draw, Removal, Board wipe, Tutor,
  Recursion, Protection, Evasion, Lifegain, Discard, Mill, Scry, Blink, Theft,
  Counterspell, Sacrifice, Counters, Lands; FR usa Accélération, Pioche, Retrait,
  Destruction de masse, Tutorat, Récursion, Protection, Évasion, Gain de vie, Défausse,
  Meule, Regard, Clignotement, Vol, Contresort, Sacrifice, Marqueurs, Terrains.
- **Leyendas**: «Colores · Modo de color», «Identidad», «Tipos»,
  «Habilidad / función» y «Rareza» llevan `data-ds-i18n` y se actualizan junto
  con los chips. El `MutationObserver` sobre `lang` llama a `refreshLabels()`;
  `open()` también lo hace por si el idioma cambió con el modal cerrado.

Comprobado en el navegador con el buscador abierto, cambiando **ES → EN → FR →
ES**: los 5 colores, las 5 rarezas, las 18 habilidades, los 14 tipos y las 5
leyendas cambiaron en caliente y volvieron a español. Consulta de control con
color blanco + rareza rara + habilidad rampa:

    q=c:W (r:rare) f:commander (otag:ramp)  → 89 resultados

La misma consulta que antes de localizar. `node --check`, `sync_shared.py
--check` y `lint_boards.py --strict` en verde. No se tocaron las etiquetas de
los campos de formulario (nombre, texto, coste, orden…), solo chips y leyendas.

## Buscador: pasada de etiquetas francesas y refresco completo del modal

Publicado como `js/deck_search.js?v=20261127n`. Se revisaron todas las etiquetas
visibles del buscador, no solo las habilidades. Los valores de los `input` y las
consultas a Scryfall no cambiaron.

- **Kindred/tribal**: FR pasa de `Kindred (tribal)` a **Clan**, el término
  oficial francés (regla 308, « Les cartes de clan »). La consulta sigue siendo
  `t:kindred`; ES y EN mantienen `Kindred (tribal)` como etiqueta explicativa.
- **Set**: FR pasa de `Set` a **Extension**.
- **Board wipe**: FR pasa de `Balayage` a **Destruction de masse**.
- **Impresiones**: FR pasa a **Éditions** / **Toutes les éditions**.
- **Palabras clave**: el desplegable ya no muestra los términos ingleses en FR.
  Se añadieron claves `kw.*` con las traducciones oficiales: Vol, Piétinement,
  Célérité, Vigilance, Lien de vie, Contact mortel, Initiative, Double
  initiative, Menace, Portée, Flash, Défense talismanique, Indestructible,
  Parade, Protection, Explorer, Surveiller, Regard, Convocation, Cascade,
  Prouesse, Toxique, Infection, Annihilateur, **Recyclage** (cycling), Kick,
  Flashback, Ascension, Partenariat y Commandant. El `value` de cada opción
  sigue siendo el término inglés que entiende Scryfall (`kw:"cycling"`, etc.).
- **Orden**: los ocho desplegables estaban en español en todos los idiomas. Ahora
  usan claves `sort.*` y se traducen a ES/EN/FR (Popularité, Nom, Valeur de mana,
  Plus récentes, Rareté, Prix, Force, Endurance).
- **Refresco en caliente**: título, subtítulo, etiquetas de campos, leyendas,
  «Más filtros», checkboxes, botones, paginador, placeholders traducibles y el
  lanzador «Buscador» llevan `data-ds-i18n`/`data-ds-i18n-ph`. `refreshLabels()`
  actualiza todos, no solo los chips, y `updateCount()` reconstruye el contador
  para que «resultados/résultats» no se quede en el idioma anterior.

Comprobado en el navegador con el modal abierto, cambiando **FR → EN → ES → FR**:
0 elementos vacíos o `undefined`; los 30 términos de palabras clave, los 8
órdenes, los 14 tipos, las etiquetas y los botones cambiaron. Consulta de control
con tipo Clan + palabra clave Recyclage:

    q=(t:kindred) (kw:"cycling")  → consulta sin cambios de valor

`node --check`, `sync_shared.py --check` (20/20), `lint_boards.py --strict` y
`agents_doc.py` en verde.

### Análisis UX pendiente (sin cambios de código en esta pasada)

- **Creación de mazos**: el contador de la forja puede decir «40/40» y a la vez
  «faltan 28 copias»; son dos conceptos (mazo completo vs copias en colección)
  y deben separarse. Hay demasiadas acciones primarias juntas (Generar mazo
  completo, Completar huecos, Sugerir cartas) y el capitán/formato deberían ir
  primero, con filtros avanzados plegados. A 900 px aparece desbordamiento
  horizontal por el botón «Quitar» del capitán; el panel del mazo debería pasar
  a off-canvas con un resumen fijo.
- **Tablero de juego**: a 771 px se recortan las zonas laterales, la mano queda
  bajo el pliegue y el tablero mantiene un ancho fijo con scroll horizontal. Hay
  dos contadores de vida y dos «PRINCIPAL 1» visibles, la etiqueta «MANO · CPU»
  se superpone al rival y el aviso de partida guardada tapa la barra inferior.
  Conviene un HUD único (turno/fase, vida, maná, mano), zonas con etiquetas
  legibles y acciones legales resaltadas; el impuesto de comandante muestra
  «+{0}» y necesita un rótulo claro.

## Buscador: limpieza y «sin resultados» ya no parece un fallo (27 nov 2026)

Publicado como `js/deck_search.js?v=20261127o` y `css/deck_search.css?v=20261127o` en los
cuatro tableros (`python tmp/sync_shared.py` + `python tmp/bump_deck_search.py 20261127o`).
Las consultas a Scryfall y los `value` de los campos no cambian.

**Bug del mensaje vacío.** Scryfall contesta **404** cuando una búsqueda no tiene
coincidencias («Your query didn’t match any cards…», «No cards found»), y `api()` del tablero
convierte cualquier respuesta no-2xx en `Error(j.details)`. El buscador lo pintaba como
`Échec de la recherche : Your query didn’t match any cards…`, que se lee como una avería.

- `isNotFound(e)` reconoce solo los textos de «sin coincidencias»
  (`match any cards`, `no cards found`, `not_found`); un 404 de paginación o un fallo de red
  siguen saliendo como error.
- Con esa señal, `load()` pinta el estado vacío, deja el contador en `0 resultados /
  résultats / resultados` y limpia el paginador.
- El estado vacío es ahora `<p class="ds-empty"><b>Aucun résultat.</b><span>hint</span></p>`,
  con clave nueva `noneHint` en ES/EN/FR («Prueba a quitar algún filtro…»,
  «Try removing a filter…», «Essayez de retirer un filtre…»).

**Lo que sobraba, fuera** (mismo comportamiento, sin tocar consultas):

- `lastQuery`: se asignaba en `runSearch()` y en «Limpiar» y no se leía nunca.
- El parámetro `isPrev` de `load(url, isPrev)`: no se usaba; ahora `load(url)` y las llamadas
  del paginador pierden el booleano.
- Código repetido de paginador: las cuatro copias de
  `pagerEl.querySelector('.ds-prev').disabled = !prevUrls.length` (+ `.ds-next`) son
  `setPager()`.
- Tres copias del párrafo vacío son `emptyState(texto, pista)`.
- La clave `added` («Añadida»/«Added»/«Ajoutée») no la usaba nadie: la confirmación visual es
  la clase `ds-added`.
- `dir` del orden: `(order === 'name') ? 'auto' : (… ? 'desc' : 'auto')` → la condición
  directa de `released|usd|rarity`; mismos valores enviados (`dir=auto|desc`).
- `encodeURIComponent(query || '')` → `encodeURIComponent(query)`: `query` ya no puede ser
  vacío porque cae en `-is:digital` (la consulta por defecto sigue igual).

**Verificado en el navegador** (`standard.html`, versión `o`):

- Búsqueda sin coincidencias (`name = zzzzqqqxyz`) en FR: `Aucun résultat.` + pista, contador
  `0 résultats`, botones Anterior/Siguiente desactivados. En ES: «Sin resultados.» + pista y
  `0 resultados`. El `<style id="deck-search-css">` sigue importando `css/deck_search.css`.
- Búsqueda con resultados (`type = creature`): 175 cartas y `3107 résultats`; «Siguiente»
  carga la página 2 (175 cartas, «Anterior» activo) y «Anterior» vuelve a la 1 (175 cartas).
- Consola: solo 404 de imágenes de Scryfall y el 404 esperado de la consulta vacía; ningún
  404 local.
- `node --check tmp/deck_search.js`, `python tmp/sync_shared.py --check` (20/20) y
  `python tmp/lint_boards.py --strict` (4 tableros) en verde.

**Ojo con el CSS**: `sync_shared.py` publica `tmp/deck_search.css` sobre `css/`; editar
`css/deck_search.css` a mano se pierde en la siguiente sincronización.

**Pendiente detectado** (no tocado): la nota de sinergia escribe en español el papel de la
carta (`pago`/`genera`/`tema` y etiquetas como «contadores», «fichas») en los tres idiomas.
