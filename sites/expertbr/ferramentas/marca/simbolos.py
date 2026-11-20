"""Símbolo da ExpertBR, "Rumo" (aprovado pelo Francis em 20/11/2026; confirmado com print às 12h26), desenhado em
coordenadas numa caixa de 240 x 240.

Mesma família do símbolo do ObraFácil: linha aberta, sem placa, duas cores, a fita laranja afinada nas pontas que
sobe e termina em seta, e as linhas azuis interrompidas onde a fita passa.

- O globo de linhas azul: o mundo (os apps são para o mundo inteiro, em 29 idiomas).
- O ponto laranja no hemisfério sul: o Brasil, de onde a marca sai (o "BR").
- A fita laranja que sai do ponto, corta o globo e termina em seta: o rumo, o crescimento.

Duas versões: `rumo` (a aprovada, para tamanhos a partir de uns 40 px) e `rumo_favicon` (16 a 32 px: o mesmo desenho
com traço grosso, só o meridiano dentro do globo, o ponto do Brasil maior e a seta maior; ver a função).
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


def circulo(cx, cy, rx, ry, n=240):
    """Pontos de uma volta fechada (círculo ou elipse em pé)."""
    pts = [(cx + rx * math.cos(2 * math.pi * k / n), cy + ry * math.sin(2 * math.pi * k / n)) for k in range(n + 1)]
    return pts + [pts[1]]


def rumo():
    """O símbolo aprovado (o mesmo desenho da prancha da rodada 2, opção 1)."""
    d = Desenho()
    cx, cy, R = 114, 128, 84
    d.azul.append((circulo(cx, cy, R, R), 14))
    d.azul.append((circulo(cx, cy, 34, R), 10))                       # o meridiano
    par = amostrar([((cx - R * 0.87, cy - R * 0.45), (cx - 30, cy - R * 0.62),
                     (cx + 30, cy - R * 0.62), (cx + R * 0.87, cy - R * 0.45))])
    d.azul.append((par, 10))                                          # um paralelo no hemisfério norte
    bx, by = cx - 34, cy + 40                                         # o Brasil: no sul, à esquerda do meridiano
    f = fita(amostrar([((bx, by), (bx + 40, by + 10), (bx + 64, by - 44), (198, 50))]), 9, 19, 16, seta=(38, 20))
    d.laranja.append(f)
    d.cortes.append((f, 6))
    d.cortes.append(('c', bx, by, 11 + 6))
    d.circulos.append((bx, by, 11, 'acento'))
    return d


def rumo_favicon():
    """Versão para 16 a 32 px (favicon). Em 32 px as três linhas finas do globo empastavam, e só o anel com a seta (a
    versão pequena da rodada 2) perdia o globo e lembrava o símbolo do masculino. Aqui: o anel e o meridiano em traço
    grosso (o paralelo sai, é o único corte), o ponto do Brasil maior e a seta maior, saindo do globo."""
    d = Desenho()
    cx, cy, R, rxm = 108, 134, 90, 42
    d.azul.append((circulo(cx, cy, R, R), 20))
    d.azul.append((circulo(cx, cy, rxm, R), 14))
    bx, by = cx - rxm, cy + 42
    f = fita(amostrar([((bx, by), (bx + 44, by + 8), (bx + 70, by - 50), (210, 40))]), 14.4, 24, 22.8, tm=0.45,
             seta=(66, 40))
    d.laranja.append(f)
    d.cortes.append((f, 9))
    d.cortes.append(('c', bx, by, 19 + 9))
    d.circulos.append((bx, by, 19, 'acento'))
    return d
