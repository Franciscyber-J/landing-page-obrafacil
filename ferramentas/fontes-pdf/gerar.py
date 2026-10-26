"""Fontes dos PDFs do app (escritas que a Inter não cobre), servidas em public/fontes/pdf/.

O app ObraFácil baixa daqui, só na primeira vez que a pessoa gera um PDF num desses idiomas, a fonte da escrita e
guarda no aparelho. Ele confere o SHA-256 de cada arquivo (fixo no código do app, em
lib/services/pdf/escrita_do_pdf.dart do gestao_obras) antes de usar.

O que este script faz, para cada Noto Sans (variável, do repositório google/fonts):
  1. varLib.instancer: fonte estática no peso normal (400) e no negrito (700), largura 100. O pacote pdf do Dart
     só lê TrueType com contorno glyf e não lê fonte variável.
  2. subset do fontTools com TODOS os caracteres da fonte, tirando o que o pacote pdf não usa: GSUB, GPOS, GDEF,
     BASE, vhea/vmtx, gasp, STAT, as instruções de hinting e os glifos que só o GSUB alcança. O pacote pdf lê
     só head, hhea, maxp, OS/2, hmtx, cmap, loca, glyf, name e post (ttf_parser.dart/ttf_writer.dart).
  3. Grava <Família>-<Estilo>.<12 primeiros caracteres do SHA-256>.ttf, o OFL de cada família e lista.json.

Reproduzível: a data gravada na fonte é a da fonte de origem (não a de hoje), então o mesmo google/fonts gera os
mesmos bytes (o mesmo SHA-256). Arquivo novo = nome novo: o app antigo continua achando o arquivo dele.

Uso (Python 3 com fontTools 4.62 ou mais novo):
  git clone --depth 1 --filter=blob:none --sparse https://github.com/google/fonts google_fonts
  git -C google_fonts sparse-checkout set ofl/notosansjp ofl/notosanskr ofl/notosanstc ofl/notosansarabic \
      ofl/notosanshebrew ofl/notosansdevanagari ofl/notosansthai
  python3 ferramentas/fontes-pdf/gerar.py google_fonts public/fontes/pdf
"""
import hashlib
import io
import json
import os
import subprocess
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTES = {
    # família: (pasta no google/fonts, arquivo variável)
    'NotoSansJP': ('notosansjp', 'NotoSansJP[wght].ttf'),
    'NotoSansKR': ('notosanskr', 'NotoSansKR[wght].ttf'),
    'NotoSansTC': ('notosanstc', 'NotoSansTC[wght].ttf'),
    'NotoSansArabic': ('notosansarabic', 'NotoSansArabic[wdth,wght].ttf'),
    'NotoSansHebrew': ('notosanshebrew', 'NotoSansHebrew[wdth,wght].ttf'),
    'NotoSansDevanagari': ('notosansdevanagari', 'NotoSansDevanagari[wdth,wght].ttf'),
    'NotoSansThai': ('notosansthai', 'NotoSansThai[wdth,wght].ttf'),
}
PESOS = {'Regular': 400, 'Bold': 700}
TABELAS_DO_PACOTE_PDF = {'head', 'hhea', 'maxp', 'OS/2', 'hmtx', 'cmap', 'loca', 'glyf', 'name', 'post'}


def salvar(fonte):
    saida = io.BytesIO()
    fonte.save(saida)
    return saida.getvalue()


def estatica(caminho_variavel, peso):
    var = TTFont(caminho_variavel, recalcTimestamp=False)
    data = (var['head'].created, var['head'].modified)
    posicao = {'wght': peso}
    if 'wdth' in {a.axisTag for a in var['fvar'].axes}:
        posicao['wdth'] = 100
    fonte = instancer.instantiateVariableFont(var, posicao, updateFontNames=True)
    assert 'glyf' in fonte and 'CFF ' not in fonte and 'fvar' not in fonte and 'gvar' not in fonte
    fonte['head'].created, fonte['head'].modified = data
    return TTFont(io.BytesIO(salvar(fonte)), recalcTimestamp=False), data


def reduzida(fonte, data):
    unicodes = list(fonte.getBestCmap().keys())
    opcoes = subset.Options()
    opcoes.layout_features = []
    opcoes.layout_closure = False
    opcoes.drop_tables += ['GSUB', 'GPOS', 'GDEF', 'BASE', 'vhea', 'vmtx', 'gasp', 'STAT', 'MVAR', 'HVAR', 'VVAR',
                           'DSIG', 'meta', 'JSTF', 'MATH', 'kern', 'hdmx', 'LTSH', 'VDMX', 'PCLT']
    opcoes.hinting = False
    opcoes.glyph_names = False
    opcoes.notdef_outline = True
    opcoes.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]   # direitos, nomes e a licença OFL
    opcoes.name_languages = [0x409]
    opcoes.recalc_bounds = True
    opcoes.recalc_timestamp = False
    opcoes.prune_unicode_ranges = False
    sub = subset.Subsetter(opcoes)
    sub.populate(unicodes=unicodes)
    sub.subset(fonte)
    assert set(fonte.getBestCmap().keys()) == set(unicodes), 'o subset perdeu caractere'
    sobra = set(fonte.keys()) - TABELAS_DO_PACOTE_PDF - {'GlyphOrder'}
    assert not sobra, f'tabela a mais: {sobra}'
    fonte['head'].created, fonte['head'].modified = data
    return salvar(fonte), len(unicodes)


def commit_de(pasta):
    try:
        return subprocess.run(['git', '-C', pasta, 'rev-parse', 'HEAD'], capture_output=True, text=True,
                              check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def principal(origem, destino):
    os.makedirs(destino, exist_ok=True)
    lista = {'origem': 'https://github.com/google/fonts', 'commit': commit_de(origem), 'arquivos': []}
    for familia, (pasta, arquivo) in FONTES.items():
        with open(os.path.join(origem, 'ofl', pasta, 'OFL.txt'), 'rb') as f:
            ofl = f.read()
        with open(os.path.join(destino, f'{familia}-OFL.txt'), 'wb') as f:
            f.write(ofl)
        for estilo, peso in PESOS.items():
            fonte, data = estatica(os.path.join(origem, 'ofl', pasta, arquivo), peso)
            dados, caracteres = reduzida(fonte, data)
            sha = hashlib.sha256(dados).hexdigest()
            nome = f'{familia}-{estilo}.{sha[:12]}.ttf'
            with open(os.path.join(destino, nome), 'wb') as f:
                f.write(dados)
            lista['arquivos'].append({'arquivo': nome, 'familia': familia, 'peso': peso, 'bytes': len(dados),
                                      'sha256': sha, 'caracteres': caracteres, 'origem': f'ofl/{pasta}/{arquivo}'})
            print(f'{nome:48} {len(dados):>10,} bytes  {caracteres:>6} caracteres  {sha}')
    with open(os.path.join(destino, 'lista.json'), 'w', encoding='utf-8') as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
        f.write('\n')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit('uso: python3 ferramentas/fontes-pdf/gerar.py <pasta do google/fonts> <public/fontes/pdf>')
    principal(sys.argv[1], sys.argv[2])
