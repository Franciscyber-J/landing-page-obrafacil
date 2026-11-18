import { linkWhatsApp } from '../../links.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { abrirConversa, useAtendimento } from '../../atendimento/estado.js';

// Os pontos de contato da página (rodapé, perguntas frequentes, chamada final, Suporte, Central), conforme o grupo:
// { whatsapp: true/false, conversa: true/false, linkWhatsApp(mensagem), abrir() }.
export function useContato(origem) {
    const codigo = useIdioma();
    const { grupo, whatsapp } = useAtendimento(codigo);
    return {
        grupo,
        whatsapp: grupo !== 'so_chat',
        conversa: grupo !== 'so_whatsapp',
        linkWhatsApp: (mensagem) => linkWhatsApp(mensagem, whatsapp),
        abrir: () => abrirConversa(origem),
    };
}
