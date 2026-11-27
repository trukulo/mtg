# Reglas de carta · inventario completo de los 11 sets

Datos de la API de Scryfall descargados el **26 de noviembre de 2026** (texto de reglas y `keywords` de cada carta, contando las dos caras). **3323 cartas** en total. Esto es la lista de trabajo: lo que hay que implementar en el simulador, sin huecos y sin inventar.

## Los sets

| Código | Set | Cartas | Mecánicas nuevas / carácter |
|---|---|---:|---|
| `m15` | Magic 2015 | 269 | convocar (reimpresión), ciclo de slivers |
| `ori` | Magic Origins | 273 | Nuevas: renombre y maestría de hechizos. 5 planeswalkers que se transforman |
| `m19` | Core Set 2019 | 299 | Sin mecánicas nuevas; ciclo de planeswalkers y «Nicol Bolas» |
| `m20` | Core Set 2020 | 329 | Sin mecánicas nuevas; vuelve la protección, ciclo de «Chandra's» |
| `m21` | Core Set 2021 | 285 | Sin mecánicas nuevas; destreza, moler y «Triple» daño |
| `fdn` | Foundations | 517 | Reimpresiones: landfall, raid, umbral, retrospectiva, guardia, pátina, afinidad, cambiante |
| `grn` | Guilds of Ravnica | 268 | Nuevas: mentor, surveil, salto inicial (jump-start), sotobosque. Cartas partidas (split) |
| `rna` | Ravnica Allegiance | 268 | Nuevas: apéndice, adaptar, más allá (afterlife), disturbio (riot), espectáculo. Cartas partidas (split) |
| `war` | War of the Spark | 265 | Nuevas: amasar (amass) y proliferar. Planeswalkers con habilidades estáticas |
| `dom` | Dominaria | 265 | Vuelven las sagas; pátina (kicker), histórico, conjuros legendarios |
| `fra` | Reality Fracture | 285 | Nuevas: empoderar a Jace y cartas de preparación (criatura + conjuro copiable) |

## Cómo leer el inventario

- **Mecánica** — nombre en español y en inglés (el inglés es el que aparece en las cartas).
- **Sets** — en qué sets de los once aparece, por código.
- **Cartas** — cuántas cartas la tienen (campo `keywords` de Scryfall; si no es palabra clave, buscada en el texto de reglas). Es la medida del trabajo: lo que toca a pocas cartas puede esperar.
- **Estado** — qué hay hoy en el simulador: **ok** (hay código que lo aplica), **par** (hay algo, incompleto) o **todo** (pendiente; hoy el texto no se traduce en reglas).

Mecánicas del juego que **no aparecen en ninguno de estos once sets** (comprobado en el texto de las 3.323 cartas; no hace falta implementarlas por ahora): investigar (Investigate), fusionar (Fuse), cascada (Cascade), mutar (Mutate), aventura (Adventure), energía ({E}), infectar (Infect), profetizar (Foretell), perturbación (Disturb), casualidad (Casualty), ráfaga (Blitz), prototipo (Prototype), ensillar (Saddle), clase (Class), batalla (Battle), subir de nivel (Level up), suspender (Suspend), sobrecargar (Overload), entrelazar (Entwine), escalar (Escalate), demencia (Madness), otorgar (Bestow), despertar (Awaken), meld, día y noche, acompañante (Companion), mazmorra (Dungeon), incubar (Incubate), tóxico (Toxic), respaldo (Backup), ganga (Bargain), obsequio (Gift), cría (Offspring), inminente (Impending), manifestar (Manifest), metamorfosis (Morph), arranque (Dash).

## Inventario completo

| Mecánica | English | Tipo | Sets | Cartas | Qué hace | Estado |
|---|---|---|---|---:|---|---|
| **Volar** | Flying | Evasión | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 356 | No puede ser bloqueada salvo por criaturas con volar o alcance. | ok |
| **Alcance** | Reach | Evasión | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 49 | Puede bloquear criaturas con volar. | ok |
| **Arrollar** | Trample | Combate | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 99 | El daño sobrante al bloquear pasa al jugador o planeswalker atacado. | ok |
| **Amenaza** | Menace | Evasión | ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 29 | No puede ser bloqueada por una sola criatura (dos o ninguna). | ok |
| **Intimidar** | Intimidate | Evasión | m15 | 2 | Solo puede bloquearla un artefacto o una criatura que comparta color. | ok |
| **Caminar por X** | Landwalk | Evasión | m15 | 1 | No puede ser bloqueada si el defensor controla una tierra de ese tipo. | todo |
| **No se puede bloquear** | Can't be blocked | Evasión | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 156 | Regla directa: ningún bloqueo es legal. | ok |
| **Defensor** | Defender | Combate | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 41 | No puede atacar. | ok |
| **Dañar primero** | First strike | Combate | m15, ori, m20, m21, fdn, grn, rna, war, dom, fra | 31 | Hace su daño de combate antes que las criaturas sin esta habilidad. | ok |
| **Dañar dos veces** | Double strike | Combate | ori, m20, m21, fdn, grn, war, dom, fra | 12 | Hace daño en el paso de daño inicial y en el normal. | ok |
| **Toque mortal** | Deathtouch | Combate | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 42 | Cualquier cantidad de daño que haga a una criatura es letal. | ok |
| **Vínculo vital** | Lifelink | Combate | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 53 | Gana tantas vidas como daño haga. | ok |
| **Vigilancia** | Vigilance | Combate | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 83 | Atacar no la gira. | ok |
| **Prisa** | Haste | Combate | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 52 | Puede atacar y usar habilidades con {T} nada más entrar. | ok |
| **Antimaleficio** | Hexproof | Estática | m15, m19, m20, m21, fdn, grn, rna, war, dom | 21 | No puede ser objetivo de hechizos ni habilidades que controlen tus rivales. | ok |
| **Guardia** | Ward | Estática | fdn, fra | 11 | Contrarresta el hechizo o habilidad que la elige como objetivo salvo que su controlador pague el coste. | par |
| **Protección** | Protection | Estática | ori, m20, m21, fdn | 10 | DEBT: no puede ser dañada, encantada/equipada, bloqueada ni objetivo de lo que protege. | todo |
| **Indestructible** | Indestructible | Estática | m15, m19, m21, fdn, grn, dom | 8 | No muere por daño ni por «destruir». Sí por sacrificio, -X/-X o exilio. | ok |
| **Regenerar** | Regenerate | Estática | m15, ori | 5 | Escudo de reemplazo: si fuera a morir este turno, se gira y se quita del combate. | ok |
| **Cambiante** | Changeling | Estática | fdn | 2 | Es de todos los tipos de criatura a la vez. | ok |
| **Afinidad** | Affinity | Estática | fdn, rna | 3 | Cuesta {1} menos por cada permanente del tipo indicado que controles. | ok |
| **Destello** | Flash | Estática | m15, ori, m19, m20, m21, fdn, grn, rna, dom, fra | 66 | Se puede lanzar como instantáneo. | todo |
| **Destreza** | Prowess | Disparada | ori, m21, fdn, fra | 23 | +1/+1 hasta el final del turno cada vez que lanzas un hechizo que no sea criatura. | ok |
| **Convocar** | Convoke | Alternativa | m15, grn, fra | 36 | Puedes girar criaturas para pagar el maná; cada una paga {1} o un maná de su color. | ok |
| **Adivinar** | Scry | Acción | ori, m19, m20, m21, fdn, rna, war, dom | 73 | Mira las N de arriba y deja cada una arriba (en orden) o abajo. | ok |
| **Vigilar (surveil)** | Surveil | Acción | fdn, grn, fra | 70 | Mira las N de arriba y manda cada una al cementerio o la deja arriba. | ok |
| **Moler** | Mill | Acción | m15, ori, m19, m20, m21, fdn, grn, rna, war, dom, fra | 47 | Manda las N primeras cartas de una biblioteca al cementerio. | par |
| **Pelear** | Fight | Acción | m15, ori, m20, m21, fdn, grn, rna, war, dom, fra | 23 | Dos criaturas se hacen daño igual a su fuerza, a la vez. | par |
| **Amasar** | Amass | Acción | war | 22 | Crea o agranda un Ejército (Zombie Army) con N contadores +1/+1. | ok |
| **Proliferar** | Proliferate | Acción | war, fra | 17 | Elige permanentes/jugadores y dales otro contador de cada tipo que ya tengan. | ok |
| **Retrospectiva** | Flashback | Cementerio | fdn, fra | 12 | Se puede lanzar desde el cementerio por su coste de retrospectiva; luego se exilia. | ok |
| **Salto inicial** | Jump-start | Cementerio | grn | 10 | Se lanza desde el cementerio descartando una carta; luego se exilia. | ok |
| **Pátina** | Kicker | Coste adicional | fdn, dom | 34 | Coste adicional opcional que cambia el efecto («si fue patinado…»). | ok |
| **Ciclar** | Cycling | Coste alternativo | fra | 5 | Pagar el coste y descartar la carta para robar una. | ok |
| **Ciclar por tipo** | Typecycling | Coste alternativo | fra | 5 | Ciclar buscando una carta del tipo indicado en la biblioteca. | ok |
| **Espectáculo** | Spectacle | Coste alternativo | rna | 10 | Coste alternativo más barato si el rival perdió vida este turno. | ok |
| **Adaptar** | Adapt | Acción | rna | 12 | Si no tiene contadores +1/+1, ponle N. | ok |
| **Agotar** | Exhaust | Activada | fra | 1 | Habilidad que solo se puede activar una vez por partida. | ok |
| **Equipar** | Equip | Activada | m15, ori, m19, m20, m21, fdn, grn, rna, dom, fra | 46 | Paga y adjunta el equipo a una criatura que controlas, a velocidad de conjuro. | par |
| **Tripular** | Crew | Activada | fdn, war, dom | 5 | Gira criaturas con fuerza total ≥ N para convertir el Vehículo en criatura hasta el final del turno. | ok |
| **Renombre** | Renown | Disparada | ori | 19 | Cuando hace daño de combate a un jugador, si no tiene renombre, ponle N contadores +1/+1 y ya lo tiene. | ok |
| **Maestría de hechizos** | Spell mastery | Condición | ori | 17 | Se cumple si en el cementerio hay dos o más cartas de instantáneo o conjuro. | ok |
| **Landfall** | Landfall | Disparada | ori, m20, fdn, war, dom, fra | 16 | Se dispara cada vez que una tierra entra bajo tu control. | ok |
| **Incursión** | Raid | Condición | fdn | 10 | Se cumple si atacaste con una criatura este turno. | ok |
| **Umbral** | Threshold | Condición | fdn, fra | 10 | Se cumple si hay siete o más cartas en tu cementerio. | ok |
| **Mórbido** | Morbid | Condición | fdn | 5 | Se cumple si una criatura murió este turno. | ok |
| **Feroz** | Ferocious | Condición | fdn | 1 | Se cumple si controlas una criatura con fuerza 4 o más. | todo |
| **Formidable** | Formidable | Condición | fdn | 1 | Se cumple si las criaturas que controlas suman fuerza 8 o más. | todo |
| **Batallón** | Battalion | Disparada | m21, war | 2 | Al atacar con tres o más criaturas. | todo |
| **Mentor** | Mentor | Disparada | grn | 13 | Al atacar, pon un +1/+1 a una criatura atacante con fuerza menor. | ok |
| **Sotobosque** | Undergrowth | Condición | grn | 12 | Cuenta las cartas de criatura en tu cementerio. | par |
| **Apéndice** | Addendum | Condición | rna | 9 | Si lanzas el hechizo en tu fase principal, se aplica el efecto extra. | ok |
| **Más allá** | Afterlife | Disparada | rna | 10 | Cuando muere, crea N Espíritus 1/1 blancos con volar. | ok |
| **Disturbio** | Riot | Disparada | rna | 11 | Al entrar, elige: prisa o un +1/+1. | ok |
| **Dominio** | Domain | Condición | fra | 1 | Cuenta los tipos de tierra básica distintos entre tus tierras. | todo |
| **Contemplar** | Behold | Acción | fra | 2 | Revela una carta del tipo indicado o elige un permanente de ese tipo que controles. | par |
| **Alianza** | Alliance | Disparada | fdn | 1 | Se dispara cuando otra criatura entra bajo tu control. | todo |
| **Histórico** | Historic | Condición | dom | 23 | Artefacto, legendario o saga: una carta histórica. | todo |
| **Conjuro legendario** | Legendary sorcery | Restricción | dom | 6 | Solo se puede lanzar si controlas un planeswalker o una criatura legendaria. | todo |
| **Empoderar a Jace** | Empower Jace | Nueva (FRA) | fra | 35 | Pon N contadores de lealtad en una ficha de planeswalker Jace que controles; si no hay, crea una (0 lealtad, «[−1]: Vigilar 1», «[−3]: Roba una carta»). | ok |
| **Preparada** | Prepared | Nueva (FRA) | fra | 24 | Criatura con un conjuro detrás: mientras está preparada puedes lanzar una copia de ese conjuro; al hacerlo deja de estarlo. | ok |
| **Tesoro (ficha)** | Treasure | Ficha | m20, m21, fdn, rna, fra | 14 | Ficha de artefacto: «{T}, sacrificar: añade un maná de cualquier color». | ok |
| **Comida (ficha)** | Food | Ficha | fdn | 4 | Ficha de artefacto: «{2}, {T}, sacrificar: gana 3 vidas». | par |

## Qué mecánicas trae cada set

### Magic 2015 (`m15`) — 269 cartas

Volar (29), Alcance (2), Arrollar (5), Intimidar (2), Caminar por X (1), No se puede bloquear (23), Defensor (8), Dañar primero (3), Toque mortal (3), Vínculo vital (2), Vigilancia (4), Prisa (1), Antimaleficio (1), Indestructible (1), Regenerar (2), Destello (2), Convocar (21), Moler (3), Pelear (1), Equipar (6)

### Magic Origins (`ori`) — 273 cartas

Volar (28), Alcance (4), Arrollar (6), Amenaza (2), No se puede bloquear (22), Defensor (2), Dañar primero (3), Dañar dos veces (1), Toque mortal (2), Vínculo vital (2), Vigilancia (6), Prisa (4), Protección (1), Regenerar (3), Destello (5), Destreza (4), Adivinar (10), Moler (5), Pelear (1), Equipar (6), Renombre (19), Maestría de hechizos (17), Landfall (1)

### Core Set 2019 (`m19`) — 299 cartas

Volar (39), Alcance (4), Arrollar (9), Amenaza (3), No se puede bloquear (26), Defensor (6), Toque mortal (3), Vínculo vital (3), Vigilancia (9), Prisa (2), Antimaleficio (1), Indestructible (1), Destello (2), Adivinar (2), Moler (5), Equipar (3)

### Core Set 2020 (`m20`) — 329 cartas

Volar (49), Alcance (6), Arrollar (6), Amenaza (1), No se puede bloquear (21), Defensor (1), Dañar primero (1), Dañar dos veces (1), Toque mortal (6), Vínculo vital (6), Vigilancia (10), Prisa (7), Antimaleficio (1), Protección (5), Destello (5), Adivinar (10), Moler (2), Pelear (2), Equipar (6), Landfall (1), Tesoro (ficha) (1)

### Core Set 2021 (`m21`) — 285 cartas

Volar (19), Alcance (6), Arrollar (7), Amenaza (1), No se puede bloquear (5), Defensor (4), Dañar primero (1), Dañar dos veces (1), Toque mortal (2), Vínculo vital (8), Vigilancia (8), Prisa (3), Antimaleficio (4), Protección (3), Indestructible (1), Destello (7), Destreza (5), Adivinar (12), Moler (3), Pelear (2), Equipar (2), Batallón (1), Tesoro (ficha) (1)

### Foundations (`fdn`) — 517 cartas

Volar (67), Alcance (10), Arrollar (18), Amenaza (5), No se puede bloquear (15), Defensor (4), Dañar primero (9), Dañar dos veces (5), Toque mortal (9), Vínculo vital (11), Vigilancia (13), Prisa (7), Antimaleficio (4), Guardia (6), Protección (1), Indestructible (3), Cambiante (2), Afinidad (2), Destello (20), Destreza (5), Adivinar (14), Vigilar (surveil) (6), Moler (4), Pelear (3), Retrospectiva (7), Pátina (9), Equipar (10), Tripular (1), Landfall (9), Incursión (10), Umbral (5), Mórbido (5), Feroz (1), Formidable (1), Alianza (1), Tesoro (ficha) (9), Comida (ficha) (4)

### Guilds of Ravnica (`grn`) — 268 cartas

Volar (26), Alcance (4), Arrollar (9), Amenaza (2), No se puede bloquear (10), Defensor (7), Dañar primero (1), Dañar dos veces (1), Toque mortal (4), Vínculo vital (3), Vigilancia (9), Prisa (6), Antimaleficio (3), Indestructible (1), Destello (3), Convocar (14), Vigilar (surveil) (21), Moler (4), Pelear (4), Salto inicial (10), Equipar (1), Mentor (13), Sotobosque (12)

### Ravnica Allegiance (`rna`) — 268 cartas

Volar (25), Alcance (2), Arrollar (9), Amenaza (3), No se puede bloquear (10), Defensor (6), Dañar primero (1), Toque mortal (3), Vínculo vital (3), Vigilancia (6), Prisa (4), Antimaleficio (2), Afinidad (1), Destello (7), Adivinar (10), Moler (4), Pelear (3), Espectáculo (10), Adaptar (12), Equipar (1), Apéndice (9), Más allá (10), Disturbio (11), Tesoro (ficha) (1)

### War of the Spark (`war`) — 265 cartas

Volar (20), Alcance (3), Arrollar (10), Amenaza (4), No se puede bloquear (9), Defensor (1), Dañar primero (3), Dañar dos veces (1), Toque mortal (3), Vínculo vital (5), Vigilancia (5), Prisa (5), Antimaleficio (1), Adivinar (11), Moler (4), Pelear (2), Amasar (22), Proliferar (16), Tripular (3), Landfall (1), Batallón (1)

### Dominaria (`dom`) — 265 cartas

Volar (26), Alcance (2), Arrollar (10), Amenaza (2), No se puede bloquear (7), Defensor (1), Dañar primero (7), Dañar dos veces (1), Toque mortal (2), Vínculo vital (6), Vigilancia (5), Prisa (7), Antimaleficio (4), Indestructible (1), Destello (6), Adivinar (4), Moler (5), Pelear (2), Pátina (25), Equipar (7), Tripular (1), Landfall (1), Histórico (23), Conjuro legendario (6)

### Reality Fracture (`fra`) — 285 cartas

Volar (28), Alcance (6), Arrollar (10), Amenaza (6), No se puede bloquear (8), Defensor (1), Dañar primero (2), Dañar dos veces (1), Toque mortal (5), Vínculo vital (4), Vigilancia (8), Prisa (6), Guardia (5), Destello (9), Destreza (9), Convocar (1), Vigilar (surveil) (43), Moler (8), Pelear (3), Proliferar (1), Retrospectiva (5), Ciclar (5), Ciclar por tipo (5), Agotar (1), Equipar (4), Landfall (3), Umbral (5), Dominio (1), Contemplar (2), Empoderar a Jace (35), Preparada (24), Tesoro (ficha) (2)

## Estructuras de carta (más allá de las palabras clave)

| Estructura | Cartas | Sets | Qué exige del motor |
|---|---:|---|---|
| `transform` (doble cara) | 6 | m19, ori | Dos caras con sus propias características; girar la carta al transformar. |
| `split` (partidas) | 20 | grn, rna | Dos hechizos en una carta; elegir mitad al lanzar, o las dos si tiene fusionar. |
| `saga` | 14 | dom | Contadores de saga y capítulos que se disparan al entrar y en la fase principal; se sacrifica al final. |
| `prepare` (preparación) | 21 | fra | Cara delantera criatura + conjuro detrás; «preparada» permite lanzar una copia y lanzarla la desprepara. |

Por tipo de carta, además: **planeswalkers** con lealtad y habilidades +N/−N/estáticas, **vehículos** con tripular, **equipos** con equipar, **auras** con encantar, **fichas** (criatura, Tesoro, Comida, Pista, Jace) y **tierras** con habilidades de maná.

## Anexo A · Matriz mecánica × set

| Mecánica | m15 | ori | m19 | m20 | m21 | fdn | grn | rna | war | dom | fra | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---:|
| Volar | 29 | 28 | 39 | 49 | 19 | 67 | 26 | 25 | 20 | 26 | 28 | 356 |
| Alcance | 2 | 4 | 4 | 6 | 6 | 10 | 4 | 2 | 3 | 2 | 6 | 49 |
| Arrollar | 5 | 6 | 9 | 6 | 7 | 18 | 9 | 9 | 10 | 10 | 10 | 99 |
| Amenaza |  | 2 | 3 | 1 | 1 | 5 | 2 | 3 | 4 | 2 | 6 | 29 |
| Intimidar | 2 |  |  |  |  |  |  |  |  |  |  | 2 |
| Caminar por X | 1 |  |  |  |  |  |  |  |  |  |  | 1 |
| No se puede bloquear | 23 | 22 | 26 | 21 | 5 | 15 | 10 | 10 | 9 | 7 | 8 | 156 |
| Defensor | 8 | 2 | 6 | 1 | 4 | 4 | 7 | 6 | 1 | 1 | 1 | 41 |
| Dañar primero | 3 | 3 |  | 1 | 1 | 9 | 1 | 1 | 3 | 7 | 2 | 31 |
| Dañar dos veces |  | 1 |  | 1 | 1 | 5 | 1 |  | 1 | 1 | 1 | 12 |
| Toque mortal | 3 | 2 | 3 | 6 | 2 | 9 | 4 | 3 | 3 | 2 | 5 | 42 |
| Vínculo vital | 2 | 2 | 3 | 6 | 8 | 11 | 3 | 3 | 5 | 6 | 4 | 53 |
| Vigilancia | 4 | 6 | 9 | 10 | 8 | 13 | 9 | 6 | 5 | 5 | 8 | 83 |
| Prisa | 1 | 4 | 2 | 7 | 3 | 7 | 6 | 4 | 5 | 7 | 6 | 52 |
| Antimaleficio | 1 |  | 1 | 1 | 4 | 4 | 3 | 2 | 1 | 4 |  | 21 |
| Guardia |  |  |  |  |  | 6 |  |  |  |  | 5 | 11 |
| Protección |  | 1 |  | 5 | 3 | 1 |  |  |  |  |  | 10 |
| Indestructible | 1 |  | 1 |  | 1 | 3 | 1 |  |  | 1 |  | 8 |
| Regenerar | 2 | 3 |  |  |  |  |  |  |  |  |  | 5 |
| Cambiante |  |  |  |  |  | 2 |  |  |  |  |  | 2 |
| Afinidad |  |  |  |  |  | 2 |  | 1 |  |  |  | 3 |
| Destello | 2 | 5 | 2 | 5 | 7 | 20 | 3 | 7 |  | 6 | 9 | 66 |
| Destreza |  | 4 |  |  | 5 | 5 |  |  |  |  | 9 | 23 |
| Convocar | 21 |  |  |  |  |  | 14 |  |  |  | 1 | 36 |
| Adivinar |  | 10 | 2 | 10 | 12 | 14 |  | 10 | 11 | 4 |  | 73 |
| Vigilar (surveil) |  |  |  |  |  | 6 | 21 |  |  |  | 43 | 70 |
| Moler | 3 | 5 | 5 | 2 | 3 | 4 | 4 | 4 | 4 | 5 | 8 | 47 |
| Pelear | 1 | 1 |  | 2 | 2 | 3 | 4 | 3 | 2 | 2 | 3 | 23 |
| Amasar |  |  |  |  |  |  |  |  | 22 |  |  | 22 |
| Proliferar |  |  |  |  |  |  |  |  | 16 |  | 1 | 17 |
| Retrospectiva |  |  |  |  |  | 7 |  |  |  |  | 5 | 12 |
| Salto inicial |  |  |  |  |  |  | 10 |  |  |  |  | 10 |
| Pátina |  |  |  |  |  | 9 |  |  |  | 25 |  | 34 |
| Ciclar |  |  |  |  |  |  |  |  |  |  | 5 | 5 |
| Ciclar por tipo |  |  |  |  |  |  |  |  |  |  | 5 | 5 |
| Espectáculo |  |  |  |  |  |  |  | 10 |  |  |  | 10 |
| Adaptar |  |  |  |  |  |  |  | 12 |  |  |  | 12 |
| Agotar |  |  |  |  |  |  |  |  |  |  | 1 | 1 |
| Equipar | 6 | 6 | 3 | 6 | 2 | 10 | 1 | 1 |  | 7 | 4 | 46 |
| Tripular |  |  |  |  |  | 1 |  |  | 3 | 1 |  | 5 |
| Renombre |  | 19 |  |  |  |  |  |  |  |  |  | 19 |
| Maestría de hechizos |  | 17 |  |  |  |  |  |  |  |  |  | 17 |
| Landfall |  | 1 |  | 1 |  | 9 |  |  | 1 | 1 | 3 | 16 |
| Incursión |  |  |  |  |  | 10 |  |  |  |  |  | 10 |
| Umbral |  |  |  |  |  | 5 |  |  |  |  | 5 | 10 |
| Mórbido |  |  |  |  |  | 5 |  |  |  |  |  | 5 |
| Feroz |  |  |  |  |  | 1 |  |  |  |  |  | 1 |
| Formidable |  |  |  |  |  | 1 |  |  |  |  |  | 1 |
| Batallón |  |  |  |  | 1 |  |  |  | 1 |  |  | 2 |
| Mentor |  |  |  |  |  |  | 13 |  |  |  |  | 13 |
| Sotobosque |  |  |  |  |  |  | 12 |  |  |  |  | 12 |
| Apéndice |  |  |  |  |  |  |  | 9 |  |  |  | 9 |
| Más allá |  |  |  |  |  |  |  | 10 |  |  |  | 10 |
| Disturbio |  |  |  |  |  |  |  | 11 |  |  |  | 11 |
| Dominio |  |  |  |  |  |  |  |  |  |  | 1 | 1 |
| Contemplar |  |  |  |  |  |  |  |  |  |  | 2 | 2 |
| Alianza |  |  |  |  |  | 1 |  |  |  |  |  | 1 |
| Histórico |  |  |  |  |  |  |  |  |  | 23 |  | 23 |
| Conjuro legendario |  |  |  |  |  |  |  |  |  | 6 |  | 6 |
| Empoderar a Jace |  |  |  |  |  |  |  |  |  |  | 35 | 35 |
| Preparada |  |  |  |  |  |  |  |  |  |  | 24 | 24 |
| Tesoro (ficha) |  |  |  | 1 | 1 | 9 |  | 1 |  |  | 2 | 14 |
| Comida (ficha) |  |  |  |  |  | 4 |  |  |  |  |  | 4 |

## Anexo B · Listas de cartas

### Doble cara (transform)

- `m19` — Nicol Bolas, the Ravager // Nicol Bolas, the Arisen
- `ori` — Chandra, Fire of Kaladesh // Chandra, Roaring Flame
- `ori` — Jace, Vryn's Prodigy // Jace, Telepath Unbound
- `ori` — Kytheon, Hero of Akros // Gideon, Battle-Forged
- `ori` — Liliana, Heretical Healer // Liliana, Defiant Necromancer
- `ori` — Nissa, Vastwood Seer // Nissa, Sage Animist

### Cartas partidas (split)

- `grn` — Assure // Assemble
- `grn` — Connive // Concoct
- `grn` — Discovery // Dispersal
- `grn` — Expansion // Explosion
- `grn` — Find // Finality
- `grn` — Flower // Flourish
- `grn` — Integrity // Intervention
- `grn` — Invert // Invent
- `grn` — Response // Resurgence
- `grn` — Status // Statue
- `rna` — Bedeck // Bedazzle
- `rna` — Carnival // Carnage
- `rna` — Collision // Colossus
- `rna` — Consecrate // Consume
- `rna` — Depose // Deploy
- `rna` — Incubation // Incongruity
- `rna` — Repudiate // Replicate
- `rna` — Revival // Revenge
- `rna` — Thrash // Threat
- `rna` — Warrant // Warden

### Sagas

- `dom` — Chainer's Torment
- `dom` — Fall of the Thran
- `dom` — History of Benalia
- `dom` — Phyrexian Scriptures
- `dom` — Rite of Belzenlok
- `dom` — Song of Freyalise
- `dom` — The Antiquities War
- `dom` — The Eldest Reborn
- `dom` — The First Eruption
- `dom` — The Flame of Keld
- `dom` — The Mending of Dominaria
- `dom` — The Mirari Conjecture
- `dom` — Time of Ice
- `dom` — Triumph of Gerrard

### Cartas de preparación

- `fra` — Bloodline Recollector // Ancestral Craving
- `fra` — Blossom-Blessed Angel // Seed Suture
- `fra` — Carnivorous Cultivator // Enroot
- `fra` — Diviner of Victory // Unwind History
- `fra` — Emergency Phytomedic // Seed Suture
- `fra` — Fatehold Chronologist // Peer Review
- `fra` — Hallway Heckler // Vicious Verse
- `fra` — Heartwood Crafter // Soul Tether
- `fra` — Konstrari Improviser // Soul Tether
- `fra` — Paradox Shaper // Omit Variables
- `fra` — Pompous Battlemage // Improvised Act
- `fra` — Prudent Fateseer // Peer Review
- `fra` — Pyre Rhymer // Molten Tide
- `fra` — Semester Foreseer // Peer Review
- `fra` — Stingerquill Voxmancer // Vicious Verse
- `fra` — Theorix Metamage // Omit Variables
- `fra` — Variable Chaser // Arc of Fortune
- `fra` — Vigorbloom Vanguard // Seed Suture
- `fra` — Void Extrapolator // Omit Variables
- `fra` — Whiplash Wordsmith // Vicious Verse
- `fra` — Woodwork Prodigy // Soul Tether

### Planeswalkers por set

- `m15` (6): Ajani Steadfast, Jace, the Living Guildpact, Liliana Vess, Chandra, Pyromaster, Nissa, Worldwaker, Garruk, Apex Predator
- `ori` (5): Kytheon, Hero of Akros // Gideon, Battle-Forged, Jace, Vryn's Prodigy // Jace, Telepath Unbound, Liliana, Heretical Healer // Liliana, Defiant Necromancer, Chandra, Fire of Kaladesh // Chandra, Roaring Flame, Nissa, Vastwood Seer // Nissa, Sage Animist
- `m19` (11): Ajani, Adversary of Tyrants, Tezzeret, Artifice Master, Liliana, Untouched by Death, Sarkhan, Fireblood, Vivien Reid, Nicol Bolas, the Ravager // Nicol Bolas, the Arisen, Ajani, Wise Counselor, Tezzeret, Cruel Machinist, Liliana, the Necromancer, Sarkhan, Dragonsoul, Vivien of the Arkbow
- `m20` (12): Ajani, Strength of the Pride, Mu Yanling, Sky Dancer, Sorin, Imperious Bloodlord, Chandra, Acolyte of Flame, Chandra, Awakened Inferno, Chandra, Novice Pyromancer, Vivien, Arkbow Ranger, Ajani, Inspiring Leader, Mu Yanling, Celestial Wind, Sorin, Vampire Lord, Chandra, Flame's Fury, Vivien, Nature's Avenger
- `m21` (11): Ugin, the Spirit Dragon, Basri Ket, Teferi, Master of Time, Liliana, Waker of the Dead, Chandra, Heart of Fire, Garruk, Unleashed, Basri, Devoted Paladin, Teferi, Timeless Voyager, Liliana, Death Mage, Chandra, Flame's Catalyst, Garruk, Savage Herald
- `fdn` (5): Kaito, Cunning Infiltrator, Chandra, Flameshaper, Ajani, Caller of the Pride, Liliana, Dreadhorde General, Vivien Reid
- `grn` (4): Ral, Izzet Viceroy, Vraska, Golgari Queen, Ral, Caller of Storms, Vraska, Regal Gorgon
- `rna` (5): Domri, Chaos Bringer, Dovin, Grand Arbiter, Kaya, Orzhov Usurper, Dovin, Architect of Law, Domri, City Smasher
- `war` (39): Karn, the Great Creator, Ugin, the Ineffable, Gideon Blackblade, Teyo, the Shieldmage, The Wanderer, Jace, Wielder of Mysteries, Kasmina, Enigmatic Mentor, Narset, Parter of Veils, Davriel, Rogue Shadowmage, Liliana, Dreadhorde General, Ob Nixilis, the Hate-Twisted, Chandra, Fire Artisan, Jaya, Venerated Firemage, Sarkhan the Masterless, Tibalt, Rakish Instigator, Arlinn, Voice of the Pack, Jiang Yanggu, Wildcrafter, Nissa, Who Shakes the World, Vivien, Champion of the Wilds, Ajani, the Greathearted, Domri, Anarch of Bolas, Nicol Bolas, Dragon-God, Ral, Storm Conduit, Sorin, Vengeful Bloodlord, Tamiyo, Collector of Tales, Teferi, Time Raveler, Angrath, Captain of Chaos, Ashiok, Dream Render, Dovin, Hand of Control, Huatli, the Sun's Heart, Kaya, Bane of the Dead, Kiora, Behemoth Beckoner, Nahiri, Storm of Stone, Saheeli, Sublime Artificer, Samut, Tyrant Smasher, Vraska, Swarm's Eminence, Gideon, the Oathsworn, Jace, Arcane Strategist, Tezzeret, Master of the Bridge
- `dom` (5): Karn, Scion of Urza, Jaya Ballard, Teferi, Hero of Dominaria, Teferi, Timebender, Chandra, Bold Pyromancer
- `fra` (8): The Theorist, Jace Beleren, Ajani Resolute, Chandra, Chill of Compliance, Jace, Reality Sculptor, Garruk, Veiled Butcher, Ajani Unrelenting, Chandra, Torch of Defiance, Garruk, Curse Breaker

### Vehículos

- `fdn`: Cultivator's Caravan
- `war`: Parhelion II, Silent Submersible, Mizzium Tank
- `dom`: Weatherlight

### Cartas con «Empoderar a Jace» (las 35 de FRA)

Academic Ascent, Campus Crier, Hexhaven Battalion, Repurposed Enforcer, Countersculpt, Jace's Machinations, Mindseeker Oculus, Plan for All Outcomes, Protege's Awakening, Theorist's Proxy, Overwrite the Multiverse, Rewrite Regrets, Sanctum Lurker, Solve for Disappointment, Vraska's Final Mercy, No Admittance, Violent Echoes, Arcane Amphisbaena, Inspired Tethermage, Avatar of Burgeoning Echoes, Fatehold Charm, Tam's Resistance, Keeper of the Quiet Hour, Theorist's Sanctum, Way of the Healer, Way of the Mentor, Jace, Reality Sculptor, Way of the Cryomancer, Way of the Mind Sculptor, Way of the Deathbringer, Way of the Necromancer, Way of the Pyromancer, Way of the Warlord, Way of the Paradox, Way of the Wildspeaker

## Anexo C · Datos y cómo regenerarlo

- `tmp/harvest_sets.py` descarga las cartas completas a `tmp/data/<set>.json`.
- `tmp/build_rules.py` agrega y escribe `data/cartas_reglas.json` (nombre, tipo, texto, coste, keywords, caras y rareza de las 3.323 cartas).
- `tmp/rules_doc.py` genera este documento.

Para añadir un set nuevo: se agrega su código a `SETS` en los tres scripts y se vuelven a ejecutar.