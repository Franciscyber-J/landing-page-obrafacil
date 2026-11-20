// A conversa do "antes" (Cliente.jsx): o cliente perguntando da obra no aplicativo de mensagens do país do idioma,
// desenhado num celular. O aplicativo vem de src/i18n/aplicativoDeMensagens.js (WhatsApp, LINE, KakaoTalk, Zalo,
// Telegram, Viber, Messenger ou as mensagens de texto do celular); a marcação segue o FORMATO de cada um e as cores e
// formas ficam no CSS (ConversaSimulada.module.css, por data-app) e em design-tokens.css (--conversa-*). Nenhum logotipo:
// ícones de linha do lucide-react e o fundo desenhado aqui (DesenhoDaConversa.jsx).
// O texto é o mesmo em todos (chaves cliente.*). A animação (Cliente.jsx) procura os data-m: "conversa", "msg",
// "digitando" (balão dos três pontinhos, logo antes da mensagem), "online" e "status-digitando".
import {
    ArrowLeft, Camera, CheckCheck, ChevronLeft, CirclePlus, EllipsisVertical, Image, List, Menu, Mic, Paperclip, Phone,
    Plus, Search, SendHorizontal, Smile, SquarePlus, ThumbsUp, UserRound, Video,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FORMATO, aplicativoDoIdioma } from '../../i18n/aplicativoDeMensagens.js';
import DesenhoDaConversa from './DesenhoDaConversa.jsx';
import styles from './ConversaSimulada.module.css';

const ICONES = {
    video: Video, telefone: Phone, mais: EllipsisVertical, busca: Search, menu: Menu, lista: List,
    emoji: Smile, clipe: Paperclip, camera: Camera, microfone: Mic, imagem: Image, adicionar: Plus,
    adicionarQuadrado: SquarePlus, adicionarCirculo: CirclePlus, enviar: SendHorizontal, curtir: ThumbsUp,
};
// Voltar em seta (Android: WhatsApp, Telegram, Viber, Zalo, Messenger) ou em "<" (LINE, KakaoTalk, iPhone).
const VOLTAR_CHEVRON = new Set(['line', 'kakao', 'mensagens']);

function Icones({ nomes, className }) {
    return nomes.map((nome) => {
        const Icone = ICONES[nome];
        return <Icone key={nome} className={className} data-icone={nome} aria-hidden="true" />;
    });
}

function Foto({ className }) {
    return <span className={className} aria-hidden="true"><UserRound /></span>;
}

export default function ConversaSimulada({ codigo }) {
    const { t } = useTranslation();
    const app = aplicativoDoIdioma(codigo);
    const f = FORMATO[app];
    const Voltar = VOLTAR_CHEVRON.has(app) ? ChevronLeft : ArrowLeft;
    const lido = t('cliente.lido');

    // Hora do balão; no LINE o "lido" fica em cima da hora, do lado de fora do balão enviado.
    const hora = (texto, enviada) => {
        if (f.hora === 'nenhuma') return null;
        return (
            <span className={styles.hora}>
                {enviada && f.lido === 'texto' && app === 'line' && <span className={styles.lidoNaHora}>{lido}</span>}
                <span>{texto}</span>
                {enviada && f.lido === 'tiques' && <CheckCheck className={styles.tiques} aria-hidden="true" />}
            </span>
        );
    };

    return (
        <div className={styles.conversa} data-m="conversa" data-app={app} data-hora={f.hora}>
            <div className={styles.cabeca}>
                <Voltar className={`${styles.voltar} seta`} aria-hidden="true" />
                {f.avatarNoCabecalho && <Foto className={styles.avatar} />}
                <span className={styles.quem}>
                    <span className={styles.contato}>{t('cliente.nome')}</span>
                    {f.status && (
                        <span className={styles.status}>
                            <span data-m="online">{t('cliente.online')}</span>
                            {f.digitandoNoTopo && (
                                <span className={styles.statusDigitando} data-m="status-digitando">{t('cliente.digitando')}</span>
                            )}
                        </span>
                    )}
                </span>
                <span className={styles.acoes} aria-hidden="true"><Icones nomes={f.icones} /></span>
            </div>
            <div className={styles.tela}>
                {f.desenho && <DesenhoDaConversa className={styles.desenho} />}
                <p className={styles.dia}>{t('cliente.hoje')}</p>
                <span className={styles.digitando} data-m="digitando" aria-hidden="true"><i /><i /><i /></span>
                <p className={`${styles.recebida} ${styles.ponta}`} data-m="msg">
                    {f.avatarNaConversa && <Foto className={styles.fotoTopo} />}
                    {app === 'kakao' && <span className={styles.nomeNaConversa} aria-hidden="true">{t('cliente.nome')}</span>}
                    {t('cliente.msg1')}
                    {hora('07:42')}
                </p>
                <span className={styles.digitando} data-m="digitando" aria-hidden="true"><i /><i /><i /></span>
                <p className={`${styles.recebida} ${styles.ultima}`} data-m="msg">
                    {f.avatarNaConversa && <Foto className={styles.fotoBase} />}
                    {t('cliente.msg2')}
                    {hora('07:43')}
                </p>
                <p className={`${styles.enviada} ${styles.ponta} ${styles.ultima}`} data-m="msg" data-lado="enviada">
                    {t('cliente.msg3')}
                    {hora('11:58', true)}
                    {f.lido === 'texto' && app !== 'line' && <span className={styles.lidoAbaixo}>{lido}</span>}
                    {f.lido === 'foto' && <Foto className={styles.vistoFoto} />}
                </p>
            </div>
            <div className={styles.barra} aria-hidden="true">
                <Icones nomes={f.barra.fora} className={styles.iconeBarra} />
                <span className={styles.campo}>
                    <Icones nomes={f.barra.inicio} />
                    <span className={styles.dica}>{t('cliente.mensagem')}</span>
                    <Icones nomes={f.barra.fim} />
                </span>
                {f.barra.depois.length > 0 && (
                    <span className={styles.depois}><Icones nomes={f.barra.depois} /></span>
                )}
            </div>
        </div>
    );
}
