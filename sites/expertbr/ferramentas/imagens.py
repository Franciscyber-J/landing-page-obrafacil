"""Imagens da marca do site da ExpertBR (gravadas em sites/expertbr/public e versionadas).

Como usar (na raiz do repositório, depois do npm ci):
    py sites/expertbr/ferramentas/imagens.py        (Windows)
    python3 sites/expertbr/ferramentas/imagens.py   (Linux/Mac)
Precisa do Python com Pillow e Playwright (python -m playwright install chromium).

O logotipo ("Órbita", aprovado pelo Francis em 20/11/2026, 11h45) nasce em ferramentas/marca/desenhar.py, que grava
os SVG (public/logo/*.svg e public/favicon.svg). Este script só fotografa esses SVG para os PNG:
    apple-touch-icon.png   o símbolo sobre fundo branco, 180 x 180 (o iPhone arredonda os cantos sozinho)
    logo.png               o logotipo horizontal sobre fundo branco, 1200 x 300: logotipo dos dados estruturados
                           (Organization.logo)
    og.png                 prévia do link (WhatsApp, redes sociais), 1200 x 630: o logotipo e os apps da casa, sem
                           texto de idioma (vale para os 29)
    marcas/obrafacil.webp  símbolo do ObraFácil, 128 x 128, reduzido de public/favicon.png do site do ObraFácil
Nada vem de banco de imagens nem de outro site. Fonte do og.png: pacote @fontsource do node_modules (licença OFL).
"""

import tempfile
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

PASTA = Path(__file__).resolve().parent.parent
RAIZ = PASTA.parent.parent
PUBLICO = PASTA / "public"
FONTES = RAIZ / "node_modules" / "@fontsource"

NOITE = "#08172a"


def fonte(pacote, arquivo):
    return (FONTES / pacote / "files" / arquivo).as_uri()


ESTILO = f"""
@font-face {{ font-family: 'Manrope'; font-weight: 700; src: url('{fonte('manrope', 'manrope-latin-700-normal.woff2')}'); }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ width: var(--l); height: var(--a); overflow: hidden; }}
"""


def svg(nome):
    return (PUBLICO / nome).as_uri()


ICONE = f"""<html><head><style>{ESTILO}
body {{ --l: 180px; --a: 180px; background: #ffffff; display: grid; place-items: center; }}
img {{ width: 150px; height: 150px; }}
</style></head><body><img src="{svg('logo/simbolo.svg')}"></body></html>"""

LOGO = f"""<html><head><style>{ESTILO}
body {{ --l: 1200px; --a: 300px; background: #ffffff; display: grid; place-items: center; }}
img {{ height: 196px; }}
</style></head><body><img src="{svg('logo/expertbr.svg')}"></body></html>"""

OG = f"""<html><head><style>{ESTILO}
body {{ --l: 1200px; --a: 630px; background:
  radial-gradient(700px 520px at 88% 0%, rgba(31,111,209,.45), transparent 70%),
  radial-gradient(560px 420px at 0% 100%, rgba(232,129,31,.22), transparent 70%), {NOITE};
  color: #eef3f9; padding: 0 96px; display: flex; flex-direction: column; justify-content: center; gap: 72px; }}
.logo {{ height: 200px; align-self: flex-start; margin-inline-start: -8px; }}
.apps {{ display: flex; gap: 20px; font-family: 'Manrope'; font-weight: 700; font-size: 34px; }}
.app {{ display: flex; align-items: center; gap: 16px; padding: 18px 30px; border-radius: 999px;
  border: 2px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); }}
.app img {{ width: 52px; height: 52px; border-radius: 12px; }}
.ponto {{ width: 14px; height: 14px; border-radius: 50%; background: #ff7a66; }}
.ponto.ar {{ background: #3ecf7a; }}
</style></head><body>
<img class="logo" src="{svg('logo/expertbr-escuro.svg')}">
<div class="apps">
  <div class="app"><img src="{svg('marcas/obrafacil.webp')}"><span>ObraFácil</span><span class="ponto ar"></span></div>
  <div class="app"><span>Orbit</span><span class="ponto"></span></div>
</div>
</body></html>"""


def principal():
    (PUBLICO / "marcas").mkdir(parents=True, exist_ok=True)
    simbolo = Image.open(RAIZ / "public" / "favicon.png").convert("RGB").resize((128, 128), Image.LANCZOS)
    simbolo.save(PUBLICO / "marcas" / "obrafacil.webp", "WEBP", quality=90, method=6)
    for nome in ["logo/simbolo.svg", "logo/expertbr.svg", "logo/expertbr-escuro.svg", "favicon.svg"]:
        if not (PUBLICO / nome).exists():
            raise SystemExit(f"Falta {nome}: rode antes ferramentas/marca/desenhar.py")

    with sync_playwright() as p:
        navegador = p.chromium.launch()
        def foto(html, largura, altura, destino):
            pagina = navegador.new_page(viewport={"width": largura, "height": altura})
            # Arquivo de verdade (file://): uma página em branco não pode ler as fontes e o símbolo do disco.
            with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as arquivo:
                arquivo.write(html)
            pagina.goto(Path(arquivo.name).as_uri())
            pagina.evaluate("document.fonts.ready")
            pagina.wait_for_timeout(200)
            pagina.screenshot(path=str(destino), clip={"x": 0, "y": 0, "width": largura, "height": altura})
            pagina.close()
            Path(arquivo.name).unlink(missing_ok=True)
        foto(ICONE, 180, 180, PUBLICO / "apple-touch-icon.png")
        foto(LOGO, 1200, 300, PUBLICO / "logo.png")
        foto(OG, 1200, 630, PUBLICO / "og.png")
        navegador.close()

    for nome in ["apple-touch-icon.png", "logo.png", "og.png"]:
        caminho = PUBLICO / nome
        Image.open(caminho).convert("RGB").save(caminho, "PNG", optimize=True)
        print(f"{nome}: {caminho.stat().st_size // 1024} KB")


if __name__ == "__main__":
    principal()
