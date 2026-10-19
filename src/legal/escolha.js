// Qual versão dos Termos de Uso e da Política de Privacidade o site mostra.
// Funções puras (sem navegador): usadas pelo site e pela geração das páginas no build.
//
// No Firestore (gravado pelo projeto gestao_obras):
//   documentos_legais/{documento}            versoes: lista das versões LIBERADAS (botão Liberar do
//                                           painel), cada uma com versao, tipo e vigente_desde.
//   documentos_legais/{documento}/versoes/{v} textos (um por idioma), hashes, estado
//                                           ("preparada" ou "liberada") e vigente_desde.
//
// Regra:
//   - Em vigor: a maior versão liberada cuja data de vigência já chegou.
//   - Próxima: a primeira liberada com data no futuro (aviso de 30 dias): o site avisa e deixa ler.
//   - Nenhuma liberada ainda (só no começo, antes da primeira liberação): mostra a versão mais nova
//     que existe, sem data. Decisão do Francis em 18/10/2026: o site já mostra os textos 2.0
//     corretos antes da versão nova do app. Depois da primeira liberação essa regra não vale mais:
//     uma versão só preparada nunca aparece.

export function compararVersoes(a, b) {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

export function versaoValida(v) {
    return typeof v === 'string' && /^\d{1,4}(\.\d{1,4}){0,3}$/.test(v);
}

function emMs(valor) {
    if (valor == null) return null;
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
    const ms = Date.parse(valor);
    return Number.isNaN(ms) ? null : ms;
}

// liberadas: a lista do documento raiz (pode ser null/vazia).
// existentes: ids das versões na subcoleção (só usado quando nada foi liberado).
// Devolve { atual: { versao, vigenteDesde|null }, proxima: { versao, vigenteDesde } | null } ou null.
export function escolherVersao(liberadas, existentes, agora = Date.now()) {
    const lista = (Array.isArray(liberadas) ? liberadas : [])
        .map((v) => ({ versao: v?.versao, vigenteDesde: emMs(v?.vigente_desde ?? v?.vigenteDesde) }))
        .filter((v) => versaoValida(v.versao) && v.vigenteDesde != null)
        .sort((a, b) => compararVersoes(a.versao, b.versao));

    if (lista.length) {
        const emVigor = lista.filter((v) => v.vigenteDesde <= agora);
        const futuras = lista.filter((v) => v.vigenteDesde > agora).sort((a, b) => a.vigenteDesde - b.vigenteDesde);
        if (emVigor.length) return { atual: emVigor[emVigor.length - 1], proxima: futuras[0] ?? null };
        // Primeira liberação com aviso: até a data, a versão anterior não está no Firestore.
        return { atual: futuras[0], proxima: null };
    }

    const ids = (existentes ?? []).filter(versaoValida).sort(compararVersoes);
    if (!ids.length) return null;
    return { atual: { versao: ids[ids.length - 1], vigenteDesde: null }, proxima: null };
}
