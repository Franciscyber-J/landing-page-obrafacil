// A conversa com o Max no site, sem React e sem Firebase: o servidor entra como parâmetro (servidor.js no site,
// simulado.js no "npm run dev" e nos testes). Testada em conversa.test.js com o servidor simulado.
//
// Regras (pedido do Francis, 18/11/2026):
//   - texto de 1 a 1000 caracteres depois de tirar os espaços das pontas, conferido antes de enviar;
//   - uma mensagem por vez: enquanto o Max responde, nada sai (o botão fica desligado e um segundo envio é ignorado);
//   - a mesma mensagem logo em seguida (10 minutos, como no servidor) não sai de novo;
//   - erro: a mensagem volta para o campo, com o aviso traduzido, e nada se perde;
//   - as mensagens ficam só na memória da página (nada no localStorage, no console nem no analytics).

export const TEXTO_MAXIMO = 1000;
export const REPETIDA_MS = 10 * 60 * 1000;
export const MOTIVOS = ['limite', 'desligado', 'teto', 'ocupada', 'pais_whatsapp'];

// Caracteres de controle (menos quebra de linha e tabulação) saem, como no servidor.
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// O texto que pode ir para o servidor, ou null (vazio ou longo demais).
export function textoParaEnviar(bruto) {
    if (typeof bruto !== 'string') return null;
    const texto = bruto.replace(CONTROLE, '').trim();
    if (texto.length < 1 || texto.length > TEXTO_MAXIMO) return null;
    return texto;
}

// Comparação da mensagem repetida, a mesma do servidor: sem diferença de maiúsculas, espaços e pontuação do fim.
export function resumoDaMensagem(texto) {
    return String(texto).toLocaleLowerCase('und').replace(/\s+/g, ' ').replace(/[\s.!?…。！？,;:]+$/u, '').trim();
}

// Erro do servidor → o aviso que a pessoa vê. Os códigos são os do protocolo das functions chamáveis (onCall).
export function tipoDoErro(erro) {
    const codigo = String(erro?.code ?? '').replace(/^functions\//, '');
    if (codigo === 'unavailable' || codigo === 'deadline-exceeded' || erro?.semInternet) return 'rede';
    if (codigo === 'resource-exhausted') return 'limite';
    return 'geral';
}

let proximoId = 0;
const novoId = () => `m${++proximoId}`;

// servidor.enviar({ texto, idioma, pais }) → { conversaId, resposta, motivo? } ou lança erro.
// aoMudar(estado) é chamado a cada mudança (o componente redesenha).
export function criarConversa({ servidor, idioma, pais = null, agora = () => Date.now(), aoMudar = () => {} }) {
    let estado = { mensagens: [], esperando: false, erro: null, motivo: null };
    let ultima = null; // { resumo, em }

    const mudar = (parcial) => {
        estado = { ...estado, ...parcial };
        aoMudar(estado);
    };

    // Devolve { enviado: true } ou { enviado: false, devolver: texto } (o texto volta para o campo).
    async function enviar(bruto) {
        if (estado.esperando) return { enviado: false, ignorado: true };
        const texto = textoParaEnviar(bruto);
        if (!texto) return { enviado: false, devolver: typeof bruto === 'string' ? bruto : '', ignorado: true };
        const resumo = resumoDaMensagem(texto);
        if (ultima && ultima.resumo === resumo && agora() - ultima.em < REPETIDA_MS) {
            mudar({ erro: 'repetida' });
            return { enviado: false, devolver: bruto };
        }

        const minha = { id: novoId(), autor: 'pessoa', texto };
        mudar({ mensagens: [...estado.mensagens, minha], esperando: true, erro: null, motivo: null });
        try {
            const saida = await servidor.enviar({ texto, idioma, pais });
            ultima = { resumo, em: agora() };
            const motivo = MOTIVOS.includes(saida?.motivo) ? saida.motivo : null;
            const resposta = typeof saida?.resposta === 'string' && saida.resposta.trim() ? saida.resposta : null;
            if (motivo) {
                // Limite, Max desligado, teto, outra resposta em andamento ou país do WhatsApp: a mensagem não foi
                // respondida e volta para o campo (dá para mandar de novo depois, ou copiar para o WhatsApp).
                ultima = null;
                mudar({ mensagens: estado.mensagens.filter((m) => m.id !== minha.id), esperando: false, motivo });
                return { enviado: false, devolver: bruto };
            }
            if (!resposta) throw Object.assign(new Error('resposta vazia'), { code: 'internal' });
            mudar({ mensagens: [...estado.mensagens, { id: novoId(), autor: 'max', texto: resposta }], esperando: false });
            return { enviado: true };
        } catch (erro) {
            mudar({
                mensagens: estado.mensagens.filter((m) => m.id !== minha.id),
                esperando: false,
                erro: tipoDoErro(erro),
            });
            return { enviado: false, devolver: bruto };
        }
    }

    return {
        enviar,
        estado: () => estado,
        limparAviso: () => mudar({ erro: null, motivo: null }),
    };
}
