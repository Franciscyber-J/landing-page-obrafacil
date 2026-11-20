"""Símbolo da ExpertBR, "Órbita" (aprovado pelo Francis em 20/11/2026, 11h45), desenhado em coordenadas numa
caixa de 240 x 240.

Mesma família do símbolo do ObraFácil: linha aberta, sem placa, duas cores, a fita laranja afinada nas pontas que
sobe e termina em seta, e a linha azul interrompida onde a fita e os pontos passam.

- O centro laranja: a origem (o Brasil, o "BR").
- A órbita inclinada: a família de apps em volta; o ponto azul é um app em órbita.
- A frente da órbita escapa para cima em seta: o crescimento.

Duas versões: `orbita` (a aprovada, para tamanhos a partir de uns 40 px) e `orbita_favicon` (16 a 32 px: o mesmo
desenho com traço grosso, o ponto azul maior e separado da linha, a órbita aberta e a seta maior; em 32 px a versão
anterior, com a órbita fechada e o ponto no meio, lembrava um olho).
"""
import math

CAIXA = 240


def _n(v):
    s = f"{v:.1f}".rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def ponto(p):
    return f"{_n(p[0])},{_n(p[1])}"


def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


def amostrar(segs, n=120):
    pts = []
    for i, s in enumerate(segs):
        for k in range(n + 1):
            if i > 0 and k == 0:
                continue
            pts.append(bez(*s, k / n))
    return pts


def suave(a, b, t):
    t = max(0.0, min(1.0, t))
    t = t * t * (3 - 2 * t)
    return a + (b - a) * t


def simplificar(pts, tol=0.12):
    """Tira pontos que não mudam o desenho (Ramer-Douglas-Peucker): o arquivo fica bem menor, igual na tela."""
    if len(pts) < 3:
        return list(pts)
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1e-9
    maior, idx = -1, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L if L > 1e-9 else math.dist(p, a)
        if d > maior:
            maior, idx = d, i
    if maior <= tol:
        return [a, b]
    return simplificar(pts[:idx + 1], tol)[:-1] + simplificar(pts[idx:], tol)


def fita(pts, w0, wm, w1, tm=0.55, seta=None):
    """Fita afinada: largura w0 no começo, wm em tm, w1 no fim. seta=(comprimento, meia_largura) põe a ponta."""
    if seta:
        a, b = pts[-3], pts[-1]
        L = math.dist(a, b)
        ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        pts = list(pts) + [(b[0] + ux * k, b[1] + uy * k) for k in (3, 6, 9)]
    acc = [0.0]
    for a, b in zip(pts, pts[1:]):
        acc.append(acc[-1] + math.dist(a, b))
    tot = acc[-1]
    esq, dir_ = [], []
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        t = acc[i] / tot
        w = suave(w0, wm, t / tm) if t < tm else suave(wm, w1, (t - tm) / (1 - tm))
        esq.append((p[0] + nx * w / 2, p[1] + ny * w / 2))
        dir_.append((p[0] - nx * w / 2, p[1] - ny * w / 2))
    contorno = simplificar(esq)
    if seta:
        comp, meia = seta
        a, b = pts[-4], pts[-1]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        nx, ny = -uy, ux
        base = (b[0] - ux * comp * 0.12, b[1] - uy * comp * 0.12)
        contorno += [(base[0] + nx * meia, base[1] + ny * meia), (b[0] + ux * comp * 0.88, b[1] + uy * comp * 0.88),
                     (base[0] - nx * meia, base[1] - ny * meia)]
    contorno += simplificar(list(reversed(dir_)))
    return contorno


def caminho_fechado(pts):
    return 'M' + ' L'.join(ponto(p) for p in pts) + 'Z'


def linha(pts):
    return 'M' + ' L'.join(ponto(p) for p in simplificar(pts))


def _elipse(cx, cy, rx, ry, rot, th):
    c, s = math.cos(rot), math.sin(rot)
    x, y = rx * math.cos(th), ry * math.sin(th)
    return (cx + x * c - y * s, cy + x * s + y * c)


class Desenho:
    """As peças de um símbolo, para montar o SVG e medir a caixa visível."""

    def __init__(self):
        self.azul = []      # (pontos, largura do traço)
        self.laranja = []   # contornos preenchidos
        self.circulos = []  # (cx, cy, r, 'linha' | 'acento')
        self.cortes = []    # (pontos do contorno, folga) e ('c', cx, cy, r): onde a linha azul abre

    def caixa(self):
        xs, ys = [], []
        for pts, w in self.azul:
            for x, y in pts:
                xs += [x - w / 2, x + w / 2]
                ys += [y - w / 2, y + w / 2]
        for pts in self.laranja:
            for x, y in pts:
                xs.append(x)
                ys.append(y)
        for cx, cy, r, _ in self.circulos:
            xs += [cx - r, cx + r]
            ys += [cy - r, cy + r]
        return min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)

    def svg(self, cores, uid):
        """Corpo do SVG (sem a tag <svg>). Só atributos de apresentação, sem <style>: a política de segurança do
        site não interfere e o desenho é o mesmo em qualquer programa."""
        corte = ''
        for c in self.cortes:
            if c[0] == 'c':
                corte += f'<circle cx="{_n(c[1])}" cy="{_n(c[2])}" r="{_n(c[3])}"/>'
            else:
                corte += (f'<path d="{caminho_fechado(c[0])}" stroke="#000" stroke-width="{_n(c[1] * 2)}" '
                          f'stroke-linejoin="round"/>')
        mascara = (f'<mask id="{uid}" maskUnits="userSpaceOnUse" x="-40" y="-40" width="{CAIXA + 80}" height="{CAIXA + 80}">'
                   f'<rect x="-40" y="-40" width="{CAIXA + 80}" height="{CAIXA + 80}" fill="#fff"/><g fill="#000">{corte}</g></mask>')
        azuis = ''.join(f'<path d="{linha(p)}" stroke-width="{_n(w)}"/>' for p, w in self.azul)
        laranjas = ''.join(f'<path d="{caminho_fechado(p)}"/>' for p in self.laranja)
        circ = ''.join(f'<circle cx="{_n(cx)}" cy="{_n(cy)}" r="{_n(r)}" fill="{cores[cor]}"/>'
                       for cx, cy, r, cor in self.circulos)
        return (f'<defs>{mascara}</defs>'
                f'<g mask="url(#{uid})" fill="none" stroke="{cores["linha"]}" stroke-linecap="round" stroke-linejoin="round">{azuis}</g>'
                f'<g fill="{cores["acento"]}">{laranjas}</g>{circ}')


CX, CY, ROT = 108, 134, math.radians(-30)


def _frente_e_saida(rx, ry, fim):
    """A frente da órbita (laranja): do extremo esquerdo, por baixo, até a direita; dali escapa para cima."""
    a_ini, a_fim = 178, 76
    frente = [_elipse(CX, CY, rx, ry, ROT, math.radians(a_ini - (a_ini - a_fim) * k / 90)) for k in range(91)]
    p0 = frente[-1]
    p1 = _elipse(CX, CY, rx, ry, ROT, math.radians(a_fim - 1))
    tx, ty = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(tx, ty)
    tx, ty = tx / L, ty / L
    saida = amostrar([(p0, (p0[0] + tx * 62, p0[1] + ty * 62), (fim[0] - 50, fim[1] + 62), fim)], 60)
    return frente + saida[1:]


def orbita():
    """O símbolo aprovado (o mesmo desenho da prancha de 20/11, 11h45)."""
    d = Desenho()
    rx, ry = 94, 52
    ini, fimz = math.radians(-166), math.radians(36)
    arco = [_elipse(CX, CY, rx, ry, ROT, ini + (fimz - ini) * k / 160) for k in range(161)]
    d.azul.append((arco, 14))
    f = fita(_frente_e_saida(rx, ry, (220, 36)), 4, 18, 15, tm=0.45, seta=(38, 20))
    d.laranja.append(f)
    d.cortes.append((f, 6))
    sx, sy = _elipse(CX, CY, rx, ry, ROT, math.radians(-118))
    d.cortes.append(('c', sx, sy, 18))
    d.circulos.append((sx, sy, 12, 'linha'))
    d.circulos.append((CX, CY, 20, 'acento'))
    return d


def orbita_favicon():
    """Versão para 16 a 32 px (favicon). As mesmas peças, mais fortes: o ponto azul (o app) grande e solto na ponta
    da órbita, a órbita aberta dos dois lados e a seta maior e mais para fora."""
    d = Desenho()
    rx, ry = 92, 56
    sat = -128
    ini, fimz = math.radians(sat + 30), math.radians(30)
    arco = [_elipse(CX, CY, rx, ry, ROT, ini + (fimz - ini) * k / 160) for k in range(161)]
    d.azul.append((arco, 24))
    f = fita(_frente_e_saida(rx, ry, (222, 30)), 8, 28, 26, tm=0.45, seta=(74, 44))
    d.laranja.append(f)
    d.cortes.append((f, 9))
    sx, sy = _elipse(CX, CY, rx, ry, ROT, math.radians(sat))
    d.cortes.append(('c', sx, sy, 30))
    d.circulos.append((sx, sy, 20, 'linha'))
    d.circulos.append((CX, CY, 25, 'acento'))
    return d
