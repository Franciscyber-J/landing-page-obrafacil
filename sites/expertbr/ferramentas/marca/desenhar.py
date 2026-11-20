"""Desenha os arquivos do logotipo da ExpertBR ("Órbita", aprovado pelo Francis em 20/11/2026, 11h45).

Grava em sites/expertbr/public (os arquivos são versionados; só rodar de novo se o desenho mudar):
    logo/expertbr.svg            logotipo horizontal para fundo claro (símbolo + "Expert" negrito azul + "BR" laranja)
    logo/expertbr-escuro.svg     o mesmo para fundo escuro (linha azul-clara, "Expert" branco)
    logo/simbolo.svg             só o símbolo, fundo claro
    logo/simbolo-escuro.svg      só o símbolo, fundo escuro
    favicon.svg                  a versão de 16-32 px do símbolo; no navegador em modo escuro a linha fica clara
Depois, `ferramentas/imagens.py` faz os PNG (apple-touch-icon, logo.png dos dados estruturados e og.png).

Letra: Montserrat (licença OFL), convertida em contorno: o logotipo não depende de fonte instalada. Os arquivos
montserrat-400.ttf e montserrat-700.ttf ficam numa pasta fora do repositório, indicada em FONTES_MONTSERRAT
(Google Fonts → Montserrat → baixar, pasta "static"; renomear Montserrat-Regular.ttf e Montserrat-Bold.ttf).

Uso (na raiz do repositório):
    pip install fonttools uharfbuzz
    FONTES_MONTSERRAT=/caminho/das/fontes python3 sites/expertbr/ferramentas/marca/desenhar.py
    (Windows: $env:FONTES_MONTSERRAT='D:\\fontes\\montserrat'; py sites\\expertbr\\ferramentas\\marca\\desenhar.py)
"""
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from simbolos import _n, orbita, orbita_favicon  # noqa: E402
from texto import Fonte  # noqa: E402

PUBLICO = os.path.join(AQUI, '..', '..', 'public')

AZUL = '#154F84'        # azul-marinho do logotipo do ObraFácil
LARANJA = '#E8811F'     # laranja do logotipo do ObraFácil
AZUL_CLARO = '#7FB3EA'  # linha da versão para fundo escuro (a mesma do ObraFácil)
BRANCO = '#FFFFFF'

CLARO = {'linha': AZUL, 'acento': LARANJA, 'expert': AZUL, 'br': LARANJA}
ESCURO = {'linha': AZUL_CLARO, 'acento': LARANJA, 'expert': BRANCO, 'br': LARANJA}


def simbolo(desenho, cores, uid, margem=6, titulo='ExpertBR'):
    x, y, w, h = desenho.caixa()
    lado = max(w, h) + 2 * margem
    vx, vy = x + w / 2 - lado / 2, y + h / 2 - lado / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{_n(vx)} {_n(vy)} {_n(lado)} {_n(lado)}" role="img">'
            f'<title>{titulo}</title>{desenho.svg(cores, uid)}</svg>\n')


def horizontal(cores, uid):
    """Símbolo à esquerda e o nome à direita, nas proporções do logotipo do ObraFácil ("Obra" negrito, "Fácil" normal)."""
    negrito, normal = Fonte('montserrat-700'), Fonte('montserrat-400')
    desenho = orbita()
    x, y, w, h = desenho.caixa()
    H = 100.0                       # altura do símbolo no desenho
    esc = H / h
    cap = 0.46 * H                  # altura das maiúsculas
    tam = cap / (negrito.cap / negrito.upem)
    tx = w * esc + 0.17 * H
    base = H / 2 + cap / 2
    d1, l1 = negrito.texto('Expert', tam, tx, base)
    d2, l2 = normal.texto('BR', tam, tx + l1 + tam * 0.01, base)
    largura = tx + l1 + tam * 0.01 + l2
    m = 4
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-m} {-m} {_n(largura + 2 * m)} {_n(H + 2 * m)}" role="img">'
            f'<title>ExpertBR</title>'
            f'<g transform="scale({esc:.5f}) translate({_n(-x)} {_n(-y)})">{desenho.svg(cores, uid)}</g>'
            f'<path d="{d1}" fill="{cores["expert"]}"/><path d="{d2}" fill="{cores["br"]}"/></svg>\n'), (largura + 2 * m, H + 2 * m)


def favicon():
    """Linha azul-marinho; com o navegador em modo escuro, azul-claro (a aba escura apagaria o azul-marinho)."""
    d = orbita_favicon()
    x, y, w, h = d.caixa()
    lado = max(w, h) + 4
    vx, vy = x + w / 2 - lado / 2, y + h / 2 - lado / 2
    corpo = d.svg(CLARO, 'f').replace(f'stroke="{AZUL}"', f'class="l" stroke="{AZUL}"', 1)
    corpo = corpo.replace(f'fill="{AZUL}"', f'class="p" fill="{AZUL}"')
    estilo = f'<style>@media (prefers-color-scheme: dark){{.l{{stroke:{AZUL_CLARO}}}.p{{fill:{AZUL_CLARO}}}}}</style>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{_n(vx)} {_n(vy)} {_n(lado)} {_n(lado)}">'
            f'{estilo}{corpo}</svg>\n')


def gravar(nome, conteudo):
    caminho = os.path.normpath(os.path.join(PUBLICO, nome))
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'w', encoding='utf-8', newline='\n') as f:
        f.write(conteudo)
    print(f'{nome}: {len(conteudo.encode()) // 1024} KB')


def principal():
    claro, tam = horizontal(CLARO, 'mc')
    escuro, _ = horizontal(ESCURO, 'me')
    gravar('logo/expertbr.svg', claro)
    gravar('logo/expertbr-escuro.svg', escuro)
    gravar('logo/simbolo.svg', simbolo(orbita(), CLARO, 'sc'))
    gravar('logo/simbolo-escuro.svg', simbolo(orbita(), ESCURO, 'se'))
    gravar('favicon.svg', favicon())
    print(f'proporção do logotipo horizontal: {tam[0] / tam[1]:.4f} (largura / altura)')


if __name__ == '__main__':
    principal()
