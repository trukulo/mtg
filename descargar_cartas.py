#!/usr/bin/env python3
"""Descarga los paquetes OFICIALES de Foundations Jumpstart (J25: 121 paquetes)
y de la Caja de Iniciación de Foundations (10 paquetes) con sus cartas e imágenes,
en inglés (o en español si cambias IDIOMA = "es" al principio del script).

Uso (Python 3.8+, sin dependencias):   python descargar_cartas.py
Déjalo junto a mtg-jumpstart-vs-ia.html. Crea la carpeta "cartas/" con las
imágenes y "datos.js", que la web usa automáticamente. Se puede interrumpir y
repetir: reanuda donde se quedó (tarda unos minutos la primera vez).
"""
import json, os, re, time, urllib.error, urllib.parse, urllib.request
from html.parser import HTMLParser

API = "https://api.scryfall.com"
HEAD = {"User-Agent": "MTG-Jumpstart-Local/1.0", "Accept": "application/json;q=0.9,*/*;q=0.8"}
HEAD_WEB = {"User-Agent": "Mozilla/5.0 (MTG-Jumpstart-Local)", "Accept": "text/html,*/*"}
PAGINAS = [("j25", "https://magic.wizards.com/en/news/announcements/foundations-jumpstart-booster-themes"),
           ("fdn", "https://magic.wizards.com/en/news/feature/foundations-beginner-box-contents")]
IDIOMA = "en"  # "en" = cartas en inglés (más rápido); "es" = español cuando exista en Scryfall
BASICAS = {"Plains": "W", "Island": "U", "Swamp": "B", "Mountain": "R", "Forest": "G"}
BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "cartas")
IMG = os.path.join(OUT, "img")
CACHE = os.path.join(OUT, "cache_%s.json" % IDIOMA)
os.makedirs(IMG, exist_ok=True)


def get(url, modo="json", headers=HEAD):
    for intento in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=40) as r:
                datos = r.read()
            time.sleep(0.1)  # Scryfall pide 50-100 ms entre peticiones
            return {"json": lambda: json.loads(datos), "bin": lambda: datos,
                    "txt": lambda: datos.decode("utf-8", "replace")}[modo]()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(1 + intento)
        except Exception:
            time.sleep(1 + intento)
    return None


def buscar(q):
    url = API + "/cards/search?" + urllib.parse.urlencode({"q": q, "unique": "cards"})
    while url:
        r = get(url)
        if not r:
            return
        yield from r.get("data", [])
        url = r.get("next_page")


def version_es(nombre):
    q = '!"%s" lang:es' % nombre
    r = get(API + "/cards/search?" + urllib.parse.urlencode({"q": q, "order": "released", "dir": "desc"}))
    for c in (r or {}).get("data", []):
        if c.get("image_uris") or c.get("card_faces", [{}])[0].get("image_uris"):
            return c
    return None


# ---------- listas de paquetes (páginas de Wizards) ----------
class Texto(HTMLParser):
    BLOQUE = {"p", "div", "br", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6", "table", "section", "hr", "article"}

    def __init__(s):
        super().__init__()
        s.t, s.skip = [], 0

    def handle_starttag(s, tag, a):
        if tag in ("script", "style"):
            s.skip += 1
        if tag in s.BLOQUE:
            s.t.append("\n")
        if tag == "img":
            alt = dict(a).get("alt") or ""
            if "_MTG" in alt:
                s.t.append("\n" + alt + "\n")

    def handle_endtag(s, tag):
        if tag in ("script", "style"):
            s.skip -= 1
        if tag in s.BLOQUE:
            s.t.append("\n")

    def handle_data(s, d):
        if not s.skip:
            s.t.append(d)


MARCA = re.compile(r"\d{4}_MTG(?:J25|FDN)_(?:Theme|BBThemes): (.+?) Theme Card")
COLA = re.compile(r"(?:\s+(?:\d+\s+)?(?:Plains|Island|Swamp|Mountain|Forest))+\s*$")


def texto_de(h):
    p = Texto()
    p.feed(h)
    return "".join(p.t).replace("\xa0", " ").replace("’", "'")


def segmentar(texto, dic):
    """Separa 'Carta A Carta B ...' en nombres usando el diccionario de Scryfall."""
    w = texto.split()
    n, mx = len(w), max(len(k) for k in dic)
    best = [None] * (n + 1)
    best[0] = []
    for i in range(n):
        if best[i] is None:
            continue
        for j in range(i + 1, min(n, i + mx) + 1):
            nombre = dic.get(tuple(w[i:j]))
            if nombre and (best[j] is None or len(best[i]) + 1 < len(best[j])):
                best[j] = best[i] + [nombre]
    return best[n]


def extraer(texto, setc, dic):
    res = []
    for m in MARCA.finditer(texto):
        resto = texto[m.end():]
        sig = MARCA.search(resto)
        if sig:
            resto = resto[:sig.start()]
        lineas = [l.strip(" |") for l in resto.split("\n") if l.strip(" |")]
        if not lineas:
            continue  # marcador duplicado (alt + texto)
        tema, cuenta = m.group(1), {}
        if lineas[0].startswith("Tutorial decks"):
            nombres = []
            for l in lineas[1:]:
                if l.startswith("Back to top"):
                    break
                nombres.append(l)
        else:
            linea = lineas[0]
            cola = COLA.search(linea)
            tierras = []
            if cola:
                for k, b in re.findall(r"(?:(\d+)\s+)?(Plains|Island|Swamp|Mountain|Forest)", cola.group(0)):
                    tierras += [b] * int(k or 1)
                linea = linea[:cola.start()]
            nombres = segmentar(linea, dic)
            if nombres is None:
                print("  ! No se pudo interpretar el paquete", tema, "(se omite)")
                continue
            nombres += tierras
        for n in nombres:
            cuenta[n] = cuenta.get(n, 0) + 1
        if sum(cuenta.values()) != 20:
            print("  ! %s tiene %d cartas (se esperaban 20)" % (tema, sum(cuenta.values())))
        cols = [BASICAS[n] for n in cuenta if n in BASICAS]
        res.append({"set": setc, "tema": tema, "c": cols[0] if len(set(cols)) == 1 else "M",
                    "cartas": [[n, k] for n, k in cuenta.items()]})
    return res


# ---------- cartas ----------
def imagen(url, nombre):
    ruta = os.path.join(IMG, nombre)
    if not os.path.exists(ruta):
        datos = get(url, "bin")
        if not datos:
            return None
        with open(ruta, "wb") as f:
            f.write(datos)
    return "cartas/img/" + nombre


def reducir(c, es):
    f = (c.get("card_faces") or [{}])[0]
    fuente = es or c
    uris = fuente.get("image_uris") or (fuente.get("card_faces") or [{}])[0].get("image_uris") or c.get("image_uris") or f.get("image_uris")
    if not uris:
        return None
    ident = fuente["id"]
    pequena, normal = imagen(uris["small"], ident + "_s.jpg"), imagen(uris["normal"], ident + "_n.jpg")
    if not (pequena and normal):
        return None
    r = {
        "name": c["name"], "printed_name": (es or {}).get("printed_name") or ((es or {}).get("card_faces") or [{}])[0].get("printed_name"),
        "type_line": c.get("type_line", ""), "oracle_text": c.get("oracle_text") or f.get("oracle_text", ""),
        "mana_cost": c.get("mana_cost") or f.get("mana_cost", ""), "cmc": c.get("cmc", 0),
        "power": c.get("power") or f.get("power"), "toughness": c.get("toughness") or f.get("toughness"),
        "keywords": c.get("keywords", []), "colors": c.get("colors") or f.get("colors", []),
        "produced_mana": c.get("produced_mana", []), "image_uris": {"small": pequena, "normal": normal},
    }
    if c["name"] in BASICAS:
        r["basic"] = BASICAS[c["name"]]
    return r


def main():
    cache = json.load(open(CACHE, encoding="utf-8")) if os.path.exists(CACHE) else {}
    print("Descargando diccionario de cartas de Scryfall (J25 y FDN)...")
    por_nombre = {}
    for s in ("j25", "fdn"):
        for c in buscar("e:" + s):
            por_nombre.setdefault(c["name"], c)
    dic = {}
    for n in por_nombre:
        for v in {n, n.split(" // ")[0]}:
            dic[tuple(v.replace("’", "'").split())] = n
    for b in BASICAS:
        dic[(b,)] = b
    paquetes = []
    for setc, url in PAGINAS:
        print("Leyendo paquetes oficiales:", url)
        h = get(url, "txt", HEAD_WEB)
        if not h:
            print("  ! No se pudo descargar la página")
            continue
        ps = extraer(texto_de(h), setc, dic)
        total = {}
        for p in ps:
            total[p["tema"]] = total.get(p["tema"], 0) + 1
        vistos = {}
        for p in ps:
            vistos[p["tema"]] = vistos.get(p["tema"], 0) + 1
            p["n"] = p["tema"] if total[p["tema"]] == 1 else "%s %d" % (p["tema"], vistos[p["tema"]])
            p["id"] = "%s-%d" % (setc, len(paquetes) + 1)
            paquetes.append(p)
        print("  %d paquetes" % len(ps))
    nec = []
    for p in paquetes:
        for n, _ in p["cartas"]:
            if n not in nec:
                nec.append(n)
    print("%d cartas distintas. Descargando datos, traducciones e imágenes..." % len(nec))
    cartas = []
    for i, n in enumerate(nec, 1):
        r = cache.get(n)
        if r is None:
            c = por_nombre.get(n) or get(API + "/cards/named?exact=" + urllib.parse.quote(n))
            if c:
                r = reducir(c, version_es(n) if IDIOMA == "es" else None)
                if r:
                    cache[n] = r
        if r:
            cartas.append(r)
        print("[%d/%d] %s%s" % (i, len(nec), (r or {}).get("printed_name") or n,
                                "" if IDIOMA == "en" or (r and r.get("printed_name")) else "  (sin versión en español)"))
        if i % 25 == 0:
            json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    with open(os.path.join(OUT, "datos.js"), "w", encoding="utf-8") as f:
        f.write("window.CARTAS=%s;window.PAQUETES=%s;" % (json.dumps(cartas, ensure_ascii=False), json.dumps(paquetes, ensure_ascii=False)))
    print("Listo: %d paquetes y %d cartas guardados en %s" % (len(paquetes), len(cartas), OUT))


if __name__ == "__main__":
    main()
