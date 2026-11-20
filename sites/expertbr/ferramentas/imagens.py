"""Imagens da marca do site da ExpertBR (gravadas em sites/expertbr/public e versionadas).

Como usar (na raiz do repositório, depois do npm ci):
    py sites/expertbr/ferramentas/imagens.py        (Windows)
    python3 sites/expertbr/ferramentas/imagens.py   (Linux/Mac)
Precisa do Python com Pillow e Playwright (python -m playwright install chromium).

O que gera, e de onde vem:
    favicon.svg            desenhado aqui (o "E" da ExpertBR em barras, a de baixo laranja), nas cores do site
    apple-touch-icon.png   o mesmo desenho, 180 x 180
    logo.png               o nome "ExpertBR" em letra (Bricolage Grotesque 800, a fonte dos títulos do site),
                           1200 x 300, fundo branco: logotipo PROVISÓRIO dos dados estruturados (Organization.logo)
                           até a ExpertBR ter um logotipo aprovado pelo Francis
    og.png                 prévia do link (WhatsApp, redes sociais), 1200 x 630: o nome em letra e os apps da casa,
                           sem texto de idioma (vale para os 29)
    marcas/obrafacil.webp  símbolo do ObraFácil, 128 x 128, reduzido de public/favicon.png do site do ObraFácil
Nada vem de banco de imagens nem de outro site. Fontes: pacotes @fontsource do node_modules (licença OFL).
"""

import tempfile
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

PASTA = Path(__file__).resolve().parent.parent
RAIZ = PASTA.parent.parent
PUBLICO = PASTA / "public"
FONTES = RAIZ / "node_modules" / "@fontsource"

AZUL = "#0f3a63"
NOITE = "#08172a"
LARANJA = "#f28a1f"

FAVICON = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="{AZUL}"/>
  <rect x="17" y="14" width="8" height="36" rx="2" fill="#ffffff"/>
  <rect x="17" y="14" width="30" height="8" rx="2" fill="#ffffff"/>
  <rect x="17" y="28" width="24" height="8" rx="2" fill="#ffffff"/>
  <rect x="17" y="42" width="30" height="8" rx="2" fill="{LARANJA}"/>
</svg>
"""


def fonte(pacote, arquivo):
    return (FONTES / pacote / "files" / arquivo).as_uri()


ESTILO = f"""
@font-face {{ font-family: 'Bricolage'; font-weight: 800; src: url('{fonte('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff2')}'); }}
@font-face {{ font-family: 'Bricolage'; font-weight: 700; src: url('{fonte('bricolage-grotesque', 'bricolage-grotesque-latin-700-normal.woff2')}'); }}
@font-face {{ font-family: 'Manrope'; font-weight: 700; src: url('{fonte('manrope', 'manrope-latin-700-normal.woff2')}'); }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ width: var(--l); height: var(--a); overflow: hidden; }}
.nome {{ font-family: 'Bricolage'; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }}
.br {{ color: {LARANJA}; }}
"""

LOGO = f"""<html><head><style>{ESTILO}
body {{ --l: 1200px; --a: 300px; background: #ffffff; display: grid; place-items: center; }}
.nome {{ font-size: 190px; color: #0d2136; }}
.br {{ color: #d9700f; }}
</style></head><body><div class="nome">Expert<span class="br">BR</span></div></body></html>"""

OG = f"""<html><head><style>{ESTILO}
body {{ --l: 1200px; --a: 630px; background:
  radial-gradient(700px 520px at 88% 0%, rgba(31,111,209,.55), transparent 70%),
  radial-gradient(560px 420px at 0% 100%, rgba(242,138,31,.28), transparent 70%), {NOITE};
  color: #eef3f9; padding: 88px 96px; display: flex; flex-direction: column; justify-content: space-between; }}
.nome {{ font-size: 164px; }}
.br {{ color: #ffb35c; }}
.apps {{ display: flex; gap: 20px; font-family: 'Manrope'; font-weight: 700; font-size: 34px; }}
.app {{ display: flex; align-items: center; gap: 16px; padding: 18px 30px; border-radius: 999px;
  border: 2px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); }}
.app img {{ width: 52px; height: 52px; border-radius: 12px; }}
.ponto {{ width: 14px; height: 14px; border-radius: 50%; background: #ff7a66; }}
.ponto.ar {{ background: #3ecf7a; }}
</style></head><body>
<div class="nome">Expert<span class="br">BR</span></div>
<div class="apps">
  <div class="app"><img src="{(PUBLICO / 'marcas' / 'obrafacil.webp').as_uri()}"><span>ObraFácil</span><span class="ponto ar"></span></div>
  <div class="app"><span>Orbit</span><span class="ponto"></span></div>
</div>
</body></html>"""


def principal():
    (PUBLICO / "marcas").mkdir(parents=True, exist_ok=True)
    simbolo = Image.open(RAIZ / "public" / "favicon.png").convert("RGB").resize((128, 128), Image.LANCZOS)
    simbolo.save(PUBLICO / "marcas" / "obrafacil.webp", "WEBP", quality=90, method=6)
    (PUBLICO / "favicon.svg").write_text(FAVICON, encoding="utf-8")

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
        # Ícone do iPhone sem os cantos arredondados (o aparelho arredonda sozinho).
        quadrado = FAVICON.replace('rx="14" ', '').replace('<svg ', '<svg width="180" height="180" ')
        foto(f"<html><body style='margin:0'>{quadrado}</body></html>", 180, 180, PUBLICO / "apple-touch-icon.png")
        foto(LOGO, 1200, 300, PUBLICO / "logo.png")
        foto(OG, 1200, 630, PUBLICO / "og.png")
        navegador.close()

    for nome in ["apple-touch-icon.png", "logo.png", "og.png"]:
        caminho = PUBLICO / nome
        Image.open(caminho).convert("RGB").save(caminho, "PNG", optimize=True)
        print(f"{nome}: {caminho.stat().st_size // 1024} KB")


if __name__ == "__main__":
    principal()
