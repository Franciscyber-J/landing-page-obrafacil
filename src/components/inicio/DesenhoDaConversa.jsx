// Fundo da conversa simulada: desenhos de linha bem leves repetidos, no espírito do fundo de conversa dos aplicativos
// de mensagens, mas com arte própria do ObraFácil (casa, tijolos, capacete, trena, martelo, câmera, balão de conversa).
// Desenhado aqui mesmo, sem arquivo de terceiros. A cor vem do CSS (currentColor = --conversa-desenho), então o mesmo
// desenho serve no claro e no escuro. Decorativo: fica fora da leitura de tela.

const TRACO = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

// Cada desenho é feito em volta do ponto (0, 0) e colocado no ladrilho com posição e giro.
const DESENHOS = [
    // Casa
    { onde: 'translate(22 22) rotate(-8)', d: 'M-11 2 L0 -9 L11 2 M-8 -1 V10 H8 V-1 M-2.5 10 V4 H2.5 V10' },
    // Martelo
    { onde: 'translate(70 18) rotate(35)', d: 'M-8 -10 H5 L8 -7 L5 -4 H-8 Z M-2 -4 V11 H1 V-4' },
    // Balão de conversa
    { onde: 'translate(112 26) rotate(6)', d: 'M-9 -8 H9 A3 3 0 0 1 12 -5 V3 A3 3 0 0 1 9 6 H-2 L-7 10 V6 H-9 A3 3 0 0 1 -12 3 V-5 A3 3 0 0 1 -9 -8 Z M-6 -2 H6 M-6 2 H2' },
    // Tijolos
    { onde: 'translate(28 70) rotate(4)', d: 'M-12 -7 H12 V7 H-12 Z M-12 0 H12 M-3 -7 V0 M5 0 V7 M-9 0 V7' },
    // Estrela
    { onde: 'translate(72 64) rotate(12)', d: 'M0 -6 L1.5 -2.1 L5.7 -1.9 L2.5 0.8 L3.5 4.9 L0 2.6 L-3.5 4.9 L-2.5 0.8 L-5.7 -1.9 L-1.5 -2.1 Z' },
    // Trena
    { onde: 'translate(112 74) rotate(-14)', d: 'M-12 -4 H12 V4 H-12 Z M-8 -4 V-1 M-4 -4 V0 M0 -4 V-1 M4 -4 V0 M8 -4 V-1' },
    // Coração
    { onde: 'translate(20 114) rotate(-10)', d: 'M0 6 C-8 1 -9 -4 -6 -6 C-4 -8 -1 -7 0 -4 C1 -7 4 -8 6 -6 C9 -4 8 1 0 6 Z' },
    // Capacete
    { onde: 'translate(66 112) rotate(-6)', d: 'M-10 3 A10 10 0 0 1 10 3 M-13 3 H13 V6 H-13 Z M-2 -7 H2 V-2 H-2 Z' },
    // Câmera
    { onde: 'translate(112 116) rotate(10)', d: 'M-10 -5 H-4 L-2 -8 H2 L4 -5 H10 V8 H-10 Z M4 1.5 A4 4 0 1 1 -4 1.5 A4 4 0 1 1 4 1.5' },
    // Pontinhos soltos entre os desenhos
    { onde: 'translate(46 44)', d: 'M0 -1.6 A1.6 1.6 0 1 1 0 1.6 A1.6 1.6 0 1 1 0 -1.6' },
    { onde: 'translate(92 46)', d: 'M0 -1.2 A1.2 1.2 0 1 1 0 1.2 A1.2 1.2 0 1 1 0 -1.2' },
    { onde: 'translate(44 92)', d: 'M0 -1.2 A1.2 1.2 0 1 1 0 1.2 A1.2 1.2 0 1 1 0 -1.2' },
    { onde: 'translate(92 96)', d: 'M0 -1.6 A1.6 1.6 0 1 1 0 1.6 A1.6 1.6 0 1 1 0 -1.6' },
];

// Há uma conversa só na página, então o id do ladrilho pode ser fixo (o mesmo no build e no navegador).
const ID = 'conversa-desenho';

export default function DesenhoDaConversa({ className }) {
    return (
        <svg className={className} aria-hidden="true" focusable="false">
            <defs>
                <pattern id={ID} width="136" height="136" patternUnits="userSpaceOnUse">
                    {DESENHOS.map(({ onde, d }) => (
                        <path key={onde} transform={onde} d={d} {...TRACO} />
                    ))}
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${ID})`} />
        </svg>
    );
}
