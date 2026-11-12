// Moldura de celular desenhada em volta dos prints da Central (decisão do Francis, 11/11/2026).
//
// Os prints novos trazem só a tela do app, sem a barra do sistema (a Apple recusou os prints com a barra do
// Android dentro do app do iPhone, regra 2.3.10). Quem dá a "cara de celular" é o site e o app: corpo do aparelho,
// uma faixa de status desenhada (hora e ícones) e a barra de gestos embaixo. São dois estilos, pelo aparelho de quem
// abre, e nenhum copia um modelo de marca:
//   pilula — recorte da câmera em pílula, no iPhone, no iPad e no Mac;
//   furo   — furo redondo da câmera no centro, no Android e nos outros.
// O app desenha a mesma moldura (gestao_obras, lib/ajuda/widgets/moldura_do_celular.dart): mudou lá, muda aqui.
// Sem React e sem navegador: os testes rodam no Node.

export const ESTILOS_DA_MOLDURA = ['pilula', 'furo'];

// Hora fixa da faixa de status (a mesma dos dois estilos; não é a hora de verdade nem a de nenhuma marca).
export const HORA_DA_MOLDURA = '12:00';

export function estiloDaMoldura(nav = typeof navigator === 'undefined' ? null : navigator) {
    if (!nav) return 'furo';
    const agente = String(nav.userAgent || '');
    if (/android/i.test(agente)) return 'furo';
    return /iphone|ipad|ipod|macintosh/i.test(agente) ? 'pilula' : 'furo';
}
