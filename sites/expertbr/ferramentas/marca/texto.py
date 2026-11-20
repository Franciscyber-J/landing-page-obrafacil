"""Converte texto em contorno (path SVG) com kerning, para o logotipo não depender de fonte instalada."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os

PASTA = os.environ.get('FONTES_MONTSERRAT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fontes'))


def _n(v):
    s = f"{v:.1f}".rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


class Fonte:
    def __init__(self, nome):
        caminho = os.path.join(PASTA, nome + '.ttf')
        if not os.path.exists(caminho):
            raise SystemExit(f'Falta a fonte {caminho} (Montserrat, licença OFL; ver desenhar.py)')
        self.tt = TTFont(caminho)
        self.gs = self.tt.getGlyphSet()
        self.upem = self.tt['head'].unitsPerEm
        self.cap = self.tt['OS/2'].sCapHeight
        self.ordem = self.tt.getGlyphOrder()
        self.hbfont = hb.Font(hb.Face(hb.Blob.from_file_path(caminho)))

    def medir(self, txt, tam, track=0.0):
        return self.texto(txt, tam, 0, 0, track)[1]

    def altura_maiuscula(self, tam):
        return self.cap * tam / self.upem

    def texto(self, txt, tam, x, y, track=0.0):
        """Devolve (d, largura). y é a linha de base; track em em (ex.: -0.02)."""
        buf = hb.Buffer()
        buf.add_str(txt)
        buf.guess_segment_properties()
        hb.shape(self.hbfont, buf, {"kern": True, "liga": True})
        esc = tam / self.upem
        cx = 0
        partes = []
        n = len(buf.glyph_infos)
        for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
            nome = self.ordem[info.codepoint]
            caneta = SVGPathPen(self.gs, ntos=_n)
            tp = TransformPen(caneta, (esc, 0, 0, -esc, x + (cx + pos.x_offset) * esc, y - pos.y_offset * esc))
            self.gs[nome].draw(tp)
            partes.append(caneta.getCommands())
            cx += pos.x_advance
            if i < n - 1:
                cx += track * self.upem
        return ' '.join(partes), cx * esc
