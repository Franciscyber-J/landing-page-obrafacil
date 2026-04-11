import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HelpCenter.module.css';


const MODULOS = [
    'Primeiros Passos',
    'Canteiro de Obras',
    'Financeiro',
    'Portal VIP',
    'Configurações',
];

// Tutoriais hardcoded — para adicionar um novo vídeo, basta preencher link_pt/en/es
const TUTORIAIS = [
    // ── Primeiros Passos ──────────────────────────────────────────────────────
    {
        ordem: 1,
        modulo: 'Primeiros Passos',
        titulo_pt: 'Como Fazer o Cadastro Básico no App',
        titulo_en: 'How to Create a Basic Account on the App',
        titulo_es: 'Cómo Hacer el Registro Básico en la App',
        link_pt: 'https://youtu.be/hnrcpuV7erY',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 2,
        modulo: 'Primeiros Passos',
        titulo_pt: 'Como convidar um Membro Equipe',
        titulo_en: 'How to Invite a Team Member',
        titulo_es: 'Cómo Invitar a un Miembro del Equipo',
        link_pt: 'https://youtu.be/klXYzq36ILY',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 3,
        modulo: 'Primeiros Passos',
        titulo_pt: 'Como convidar um Membro Engenheiro',
        titulo_en: 'How to Invite an Engineer Member',
        titulo_es: 'Cómo Invitar a un Miembro Ingeniero',
        link_pt: 'https://youtu.be/B2sKxbAAlgU',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 4,
        modulo: 'Primeiros Passos',
        titulo_pt: 'Como convidar e entender o Portal do Cliente.',
        titulo_en: 'How to Invite and Understand the Client Portal.',
        titulo_es: 'Cómo Invitar y Entender el Portal del Cliente.',
        link_pt: 'https://youtu.be/NWjTeWJG2t8',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 5,
        modulo: 'Primeiros Passos',
        titulo_pt: 'Como criar e configurar a sua primeira Obra.',
        titulo_en: 'How to create and set up your first Project.',
        titulo_es: 'Cómo crear y configurar tu primera Obra.',
        link_pt: 'https://youtu.be/Mla4RZYpxI4',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 6,
        modulo: 'Primeiros Passos',
        titulo_pt: 'Entendendo o Dashboard e os atalhos rápidos.',
        titulo_en: 'Understanding the Dashboard and quick shortcuts.',
        titulo_es: 'Entendiendo el Dashboard y los atajos rápidos.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    // ── Canteiro de Obras ─────────────────────────────────────────────────────
    {
        ordem: 7,
        modulo: 'Canteiro de Obras',
        titulo_pt: 'Como preencher o Diário de Obra (RDO) na prática.',
        titulo_en: 'How to fill out the Daily Work Report (RDO) in practice.',
        titulo_es: 'Cómo completar el Diario de Obra (RDO) en la práctica.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 8,
        modulo: 'Canteiro de Obras',
        titulo_pt: 'Upload de fotos e organização da Galeria.',
        titulo_en: 'Photo upload and Gallery organization.',
        titulo_es: 'Carga de fotos y organización de la Galería.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 9,
        modulo: 'Canteiro de Obras',
        titulo_pt: 'Atualizando o Cronograma e as Etapas da Obra.',
        titulo_en: 'Updating the Schedule and Project Stages.',
        titulo_es: 'Actualizando el Cronograma y las Etapas de la Obra.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 10,
        modulo: 'Canteiro de Obras',
        titulo_pt: 'Gestão de Suprimentos: Do pedido à entrega.',
        titulo_en: 'Supply Management: From order to delivery.',
        titulo_es: 'Gestión de Suministros: Del pedido a la entrega.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 11,
        modulo: 'Canteiro de Obras',
        titulo_pt: 'Registrando Ocorrências e controle de qualidade.',
        titulo_en: 'Registering Incidents and quality control.',
        titulo_es: 'Registro de Incidencias y control de calidad.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 12,
        modulo: 'Canteiro de Obras',
        titulo_pt: 'Controle de presença e Mão de Obra.',
        titulo_en: 'Attendance control and Workforce management.',
        titulo_es: 'Control de asistencia y Mano de Obra.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    // ── Financeiro ────────────────────────────────────────────────────────────
    {
        ordem: 13,
        modulo: 'Financeiro',
        titulo_pt: 'Como lançar despesas, receitas e anexar comprovantes.',
        titulo_en: 'How to post expenses, income, and attach receipts.',
        titulo_es: 'Cómo registrar gastos, ingresos y adjuntar comprobantes.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 14,
        modulo: 'Financeiro',
        titulo_pt: 'Entendendo os gráficos e o Fluxo de Caixa.',
        titulo_en: 'Understanding charts and Cash Flow.',
        titulo_es: 'Entendiendo los gráficos y el Flujo de Caja.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 15,
        modulo: 'Financeiro',
        titulo_pt: 'Como gerenciar o centro de custos por etapa.',
        titulo_en: 'How to manage the cost center by stage.',
        titulo_es: 'Cómo gestionar el centro de costos por etapa.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 16,
        modulo: 'Financeiro',
        titulo_pt: 'Gerando relatórios financeiros em PDF.',
        titulo_en: 'Generating financial reports in PDF.',
        titulo_es: 'Generación de informes financieros en PDF.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 17,
        modulo: 'Financeiro',
        titulo_pt: 'Gestão de pagamentos e Folha do RH.',
        titulo_en: 'Payment management and HR Payroll.',
        titulo_es: 'Gestión de pagos y Nómina de RRHH.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    // ── Portal VIP ────────────────────────────────────────────────────────────
    {
        ordem: 18,
        modulo: 'Portal VIP',
        titulo_pt: 'Como configurar o acesso e as permissões do seu Cliente.',
        titulo_en: 'How to configure access and permissions for your Client.',
        titulo_es: 'Cómo configurar el acceso y los permisos de tu Cliente.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 19,
        modulo: 'Portal VIP',
        titulo_pt: 'Visão do Cliente: O que ele realmente vê no app?',
        titulo_en: 'Client View: What do they actually see in the app?',
        titulo_es: 'Visión del Cliente: ¿Qué ve realmente en la app?',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 20,
        modulo: 'Portal VIP',
        titulo_pt: 'Como enviar convites e notificações para o Cliente.',
        titulo_en: 'How to send invitations and notifications to the Client.',
        titulo_es: 'Cómo enviar invitaciones y notificaciones al Cliente.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 21,
        modulo: 'Portal VIP',
        titulo_pt: 'Aprovando downloads de documentos e fotos no Portal.',
        titulo_en: 'Approving downloads of documents and photos in the Portal.',
        titulo_es: 'Aprobando descargas de documentos y fotos en el Portal.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    {
        ordem: 22,
        modulo: 'Portal VIP',
        titulo_pt: 'Como o cliente cria ocorrências e acompanha o feed, medições e financeiro.',
        titulo_en: 'How the client creates tickets and tracks the feed, measurements, and financials.',
        titulo_es: 'Cómo el cliente crea incidencias y sigue el feed, mediciones y finanzas.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
    // ── Configurações ─────────────────────────────────────────────────────────
    {
        ordem: 23,
        modulo: 'Configurações',
        titulo_pt: 'Como personalizar a sua Identidade Visual e Gerenciar seu Plano.',
        titulo_en: 'How to customize your Visual Identity and Manage your Plan.',
        titulo_es: 'Cómo personalizar tu Identidad Visual y Gestionar tu Plan.',
        link_pt: '',
        link_en: '',
        link_es: '',
    },
];

function getTitulo(tutorial, lang) {
    if (lang === 'en' && tutorial.titulo_en) return tutorial.titulo_en;
    if (lang === 'es' && tutorial.titulo_es) return tutorial.titulo_es;
    return tutorial.titulo_pt;
}

// Retorna o link APENAS no idioma selecionado — sem fallback para PT.
// Se não houver link no idioma, o vídeo mostra "Em Breve".
function getLink(tutorial, lang) {
    if (lang === 'en') return tutorial.link_en;
    if (lang === 'es') return tutorial.link_es;
    return tutorial.link_pt;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

export default function HelpCenter() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language?.split('-')[0] || 'pt';
    const [moduloAtivo, setModuloAtivo] = useState('Primeiros Passos');

    const tutoriaisFiltrados = TUTORIAIS.filter(t => t.modulo === moduloAtivo);
    const moduloIndex = MODULOS.indexOf(moduloAtivo) + 1;

    const moduloLabel = (mod) => {
        const idx = MODULOS.indexOf(mod) + 1;
        const nomes = {
            'Primeiros Passos': t('helpCenter.modPrimeirosPassos'),
            'Canteiro de Obras': t('helpCenter.modCanteiro'),
            'Financeiro': t('helpCenter.modFinanceiro'),
            'Portal VIP': t('helpCenter.modPortalVIP'),
            'Configurações': t('helpCenter.modConfiguracoes'),
        };
        return `${t('helpCenter.modPrefix')} ${idx} - ${nomes[mod] || mod}`;
    };

    return (
        <main className={styles.helpCenter}>
            <div className="container">
                {/* Header */}
                <motion.div
                    className={styles.headerBlock}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.iconBadge}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                            <polyline points="17 2 12 7 7 2" />
                        </svg>
                    </div>
                    <h1 className={styles.title}>{t('helpCenter.title')}</h1>
                    <p className={styles.subtitle}>{t('helpCenter.subtitle')}</p>
                </motion.div>

                {/* Module Dropdown Selector — all screen sizes */}
                <div className={styles.mobileSelectWrapper}>
                    <select
                        id="module-select"
                        className={styles.mobileSelect}
                        value={moduloAtivo}
                        onChange={(e) => setModuloAtivo(e.target.value)}
                    >
                        {MODULOS.map((mod) => (
                            <option key={mod} value={mod}>
                                {t('helpCenter.modPrefix')} {MODULOS.indexOf(mod) + 1} — {{
                                    'Primeiros Passos': t('helpCenter.modPrimeirosPassos'),
                                    'Canteiro de Obras': t('helpCenter.modCanteiro'),
                                    'Financeiro': t('helpCenter.modFinanceiro'),
                                    'Portal VIP': t('helpCenter.modPortalVIP'),
                                    'Configurações': t('helpCenter.modConfiguracoes'),
                                }[mod]}
                            </option>
                        ))}
                    </select>
                    <svg className={styles.selectArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>

                {/* Module title */}
                <motion.div
                    key={moduloAtivo}
                    className={styles.moduloTitle}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {moduloLabel(moduloAtivo)}
                </motion.div>

                {/* Video Cards */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={moduloAtivo}
                        className={styles.videoList}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                    >
                        {tutoriaisFiltrados.map((tutorial) => {
                            const titulo = getTitulo(tutorial, lang);
                            const link = getLink(tutorial, lang);
                            const disponivel = link.trim() !== '';

                            return (
                                <motion.div
                                    key={tutorial.ordem}
                                    className={styles.videoCard}
                                    variants={itemVariants}
                                >
                                    {/* Thumbnail */}
                                    <div className={styles.thumbnail}>
                                        {disponivel ? (
                                            <div className={styles.ytIcon}>
                                                <div className={styles.ytPlay}>
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.comingSoonIcon}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className={styles.cardInfo}>
                                        <p className={styles.cardOrdem}>
                                            {t('helpCenter.modPrefix')} {moduloIndex} · #{tutorial.ordem}
                                        </p>
                                        <h3 className={styles.cardTitle}>{titulo}</h3>

                                        <div className={styles.cardAction}>
                                            {disponivel ? (
                                                <a
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.watchBtn}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                    {t('helpCenter.assistir')}
                                                </a>
                                            ) : (
                                                <span className={styles.comingSoonBadge}>
                                                    {t('helpCenter.emBreve')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
