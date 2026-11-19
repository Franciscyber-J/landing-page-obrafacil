// Servidor simulado do Max: o mesmo formato da function maxChatSite (contrato em
// gestao_obras/docs/agencia_ia/ATENDIMENTO_CHAT.md), sem Firebase e sem internet. Usado nos testes
// (conversa.test.js) e no "npm run dev" com VITE_ATENDIMENTO_SIMULADO=sim, para ver o painel sem a function publicada.
// Nunca entra no site publicado (estado.js só o importa no modo de desenvolvimento).
//
// Palavras que mudam a resposta (para testar cada aviso no navegador): "limite", "desligado", "teto", "ocupada",
// "whatsapp" (motivo pais_whatsapp), "erro" (falha da function), "rede" (sem internet), "lento" (demora 4 s).

const esperar = (ms) => new Promise((pronto) => setTimeout(pronto, ms));

export function criarServidorSimulado({ espera = 900 } = {}) {
    let conversaId = null;
    return {
        async enviar({ texto }) {
            const t = texto.toLowerCase();
            await esperar(t.includes('lento') ? 4000 : espera);
            conversaId ??= 's_simulado';
            for (const motivo of ['limite', 'desligado', 'teto', 'ocupada']) {
                if (t.includes(motivo)) return { conversaId, resposta: null, motivo };
            }
            if (t.includes('whatsapp')) return { conversaId, resposta: null, motivo: 'pais_whatsapp' };
            if (t.includes('erro')) throw Object.assign(new Error('internal'), { code: 'functions/internal' });
            if (t.includes('rede')) throw Object.assign(new Error('unavailable'), { code: 'functions/unavailable' });
            return {
                conversaId,
                resposta: [
                    'Oi! Aqui é a resposta *simulada* do Max.',
                    '• O plano grátis não tem prazo\n• O PRO libera obras sem limite',
                    'Link de outro site (vira texto): https://exemplo.com/golpe',
                    '📖 *Criar um diário de obra*\nhttps://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo',
                    '💳 *Planos do ObraFácil*\nhttps://appobrafacil.expertbr.com/pt-br/#precos',
                ].join('\n\n'),
            };
        },
    };
}
