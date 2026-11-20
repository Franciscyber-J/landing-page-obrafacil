// Aplicativo de mensagens do país de cada idioma: a conversa do "antes" na página inicial (Cliente.jsx) é desenhada
// com a cara do aplicativo que o cliente e o construtor usam lá (pedido do Francis, 20/11/2026). Único lugar que
// decide isso. Escolha pelos dados de uso de 2025/2026 de cada país (fontes no relatório da branch mockup-whatsapp e
// em DESIGN.md, "Conversa do antes"). Idioma novo entra aqui também (o teste acusa se faltar).
//
// whatsapp   WhatsApp                         line       LINE (Japão, Tailândia, Taiwan)
// kakao      KakaoTalk (Coreia)               zalo       Zalo (Vietnã)
// telegram   Telegram (Ucrânia)               viber      Viber (Grécia)
// messenger  Messenger (Hungria, Polônia)     mensagens  as mensagens de texto do celular (SMS/iMessage:
//                                                         Estados Unidos, Canadá e Austrália)
//
// Cada aplicativo é só uma aparência (cores, formas, onde ficam a hora e o "lido"), desenhada no site: nenhum
// logotipo, papel de parede, figurinha ou mascote dos aplicativos.

export const APLICATIVOS = ['whatsapp', 'line', 'kakao', 'zalo', 'telegram', 'viber', 'messenger', 'mensagens'];

export const APLICATIVO_DO_IDIOMA = {
    'pt-BR': 'whatsapp',
    'pt-PT': 'whatsapp',
    'en-US': 'mensagens',
    'en-GB': 'whatsapp',
    'en-AU': 'mensagens',
    'en-CA': 'mensagens',
    'es-ES': 'whatsapp',
    'es-MX': 'whatsapp',
    'fr-FR': 'whatsapp',
    'de-DE': 'whatsapp',
    'it-IT': 'whatsapp',
    'nl-NL': 'whatsapp',
    'pl-PL': 'messenger',
    'tr-TR': 'whatsapp',
    'ar-SA': 'whatsapp',
    'he-IL': 'whatsapp',
    'hi-IN': 'whatsapp',
    'id-ID': 'whatsapp',
    'ja-JP': 'line',
    'ko-KR': 'kakao',
    'zh-TW': 'line',
    'th-TH': 'line',
    'vi-VN': 'zalo',
    'ru-KZ': 'whatsapp',
    'uk-UA': 'telegram',
    'cs-CZ': 'whatsapp',
    'el-GR': 'viber',
    'hu-HU': 'messenger',
    'ro-RO': 'whatsapp',
};

// O que muda de um aplicativo para outro na marcação (o resto é CSS, em Cliente.module.css, e as cores, em
// design-tokens.css):
//   avatarNoCabecalho  a foto do contato no cabeçalho;
//   status             a linha embaixo do nome ("online"/"digitando..." do idioma);
//   digitandoNoTopo    o cabeçalho troca para "digitando..." enquanto o contato escreve;
//   avatarNaConversa   a foto ao lado do balão recebido (e o nome em cima, no KakaoTalk e no LINE);
//   hora               'dentro' (no canto do balão), 'fora' (ao lado do balão) ou 'nenhuma';
//   lido               'tiques' (dois tiques), 'texto' (a palavra "lido" do idioma), 'foto' (fotinho do contato) ou
//                      'nenhum';
//   desenho            o fundo com os desenhos de linha (só os que têm fundo desenhado);
//   icones             ícones do cabeçalho;
//   barra              ícones da barra de escrever: fora (antes do campo), inicio e fim (dentro do campo, antes e
//                      depois do "Mensagem") e depois (depois do campo).
export const FORMATO = {
    whatsapp: {
        avatarNoCabecalho: true, status: true, digitandoNoTopo: true, avatarNaConversa: false, hora: 'dentro',
        lido: 'tiques', desenho: true,
        icones: ['video', 'telefone', 'mais'], barra: { fora: [], inicio: ['emoji'], fim: ['clipe', 'camera'], depois: ['microfone'] },
    },
    line: {
        avatarNoCabecalho: false, status: false, digitandoNoTopo: false, avatarNaConversa: true, hora: 'fora',
        lido: 'texto', desenho: false,
        icones: ['busca', 'telefone', 'menu'], barra: { fora: ['adicionar', 'camera', 'imagem'], inicio: [], fim: ['emoji'], depois: ['microfone'] },
    },
    kakao: {
        avatarNoCabecalho: false, status: false, digitandoNoTopo: false, avatarNaConversa: true, hora: 'fora',
        lido: 'nenhum', desenho: false,
        icones: ['busca', 'menu'], barra: { fora: ['adicionarQuadrado'], inicio: [], fim: ['emoji'], depois: ['enviar'] },
    },
    zalo: {
        avatarNoCabecalho: false, status: true, digitandoNoTopo: true, avatarNaConversa: true, hora: 'dentro',
        lido: 'texto', desenho: false,
        icones: ['telefone', 'video', 'lista'], barra: { fora: ['emoji'], inicio: [], fim: [], depois: ['mais', 'microfone', 'imagem'] },
    },
    telegram: {
        avatarNoCabecalho: true, status: true, digitandoNoTopo: true, avatarNaConversa: false, hora: 'dentro',
        lido: 'tiques', desenho: true,
        icones: ['telefone', 'mais'], barra: { fora: [], inicio: ['emoji'], fim: ['clipe', 'microfone'], depois: [] },
    },
    viber: {
        avatarNoCabecalho: true, status: true, digitandoNoTopo: true, avatarNaConversa: false, hora: 'dentro',
        lido: 'tiques', desenho: false,
        icones: ['video', 'telefone', 'mais'], barra: { fora: ['adicionar'], inicio: [], fim: ['emoji'], depois: ['microfone'] },
    },
    messenger: {
        avatarNoCabecalho: true, status: true, digitandoNoTopo: false, avatarNaConversa: true, hora: 'nenhuma',
        lido: 'foto', desenho: false,
        icones: ['telefone', 'video'], barra: { fora: ['adicionarCirculo', 'camera', 'imagem', 'microfone'], inicio: [], fim: ['emoji'], depois: ['curtir'] },
    },
    mensagens: {
        avatarNoCabecalho: true, status: false, digitandoNoTopo: false, avatarNaConversa: false, hora: 'nenhuma',
        lido: 'texto', desenho: false,
        icones: ['video'], barra: { fora: ['adicionarCirculo'], inicio: [], fim: ['microfone'], depois: [] },
    },
};

export function aplicativoDoIdioma(codigo) {
    return APLICATIVO_DO_IDIOMA[codigo] ?? 'whatsapp';
}
