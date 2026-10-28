// =====================================================================================
//  IDIOMAS DO SITE: é o único lugar para cadastrar um idioma.
// =====================================================================================
//
// Como funciona (o mesmo modelo do app):
//   - Idioma "base" (sem campo base): tem o arquivo de textos completo em textos/<codigo>.json.
//   - Variante regional (com campo base): o arquivo textos/<codigo>.json tem SÓ o que muda em
//     relação à base (ex.: en-GB só tem "Centre", "colour"...). O resto vem da base sozinho.
//   - Texto que faltar em qualquer idioma aparece no idioma "internacional" (inglês) e, por
//     último, no de referência (português do Brasil, onde os textos nascem).
//
// Para incluir um idioma novo (ex.: francês):
//   1. Acrescente uma entrada abaixo (código, nome, país da bandeira, moeda, palavras dos endereços).
//   2. Rode:  npm run idiomas -- novo fr-FR
//      (cria textos/fr-FR.json vazio e o arquivo a-traduzir/fr-FR.json com todos os textos em inglês)
//   3. Traduza os valores de a-traduzir/fr-FR.json e rode:  npm run idiomas -- importar fr-FR
//   4. Rode:  npm run idiomas   (confere tudo e refaz textos/PENDENCIAS.md)
// Nada mais precisa mudar: menu de idiomas, rodapé, endereços, preços e hreflang leem daqui.
//
// Campos:
//   codigo   BCP 47 com região (pt-BR, en-GB...). Vira o começo do endereço em minúsculas (/pt-br/).
//            Use só idioma de 2 letras + região de 2 letras: é o formato que o .htaccess entrega ao site.
//   nome     nome do idioma escrito no próprio idioma (é o que aparece no menu).
//   curto    rótulo curto do menu do celular.
//   pais     código do país da bandeira (ISO 3166, 2 letras).
//   moeda    moeda dos preços (tem de existir em pricing.js).
//   direcao  'ltr' (padrão) ou 'rtl' (árabe, hebraico).
//   base     só nas variantes regionais: o idioma base de onde vêm os textos que não mudam.
//   regioes  outras regiões que devem cair neste idioma quando o navegador pedir
//            (ex.: navegador em es-AR abre o espanhol do México, não o da Espanha).
//   rotas    palavras dos endereços. Na variante regional, só se forem diferentes da base.
//            Letras minúsculas, números e hífen; podem ter acento ou outro alfabeto (ex.: ヘルプ).
//            ajuda       → /pt-br/ajuda
//            assunto     → /pt-br/ajuda/assunto/<assunto>
//            termos      → /pt-br/termos-de-uso       (Termos de Uso)
//            privacidade → /pt-br/politica-de-privacidade (Política de Privacidade)
//            pagamento   → /pt-br/pagamento-confirmado/<compra> (volta do pagamento pelo navegador)
//            compras     → a palavra de cada compra nesse endereço: pro (assinatura PRO), acesso (Acesso
//                          Cliente da obra), downloads (pacote de downloads extras), armazenamento (+20 GB)
//            perfil      → /pt-br/perfil (onde ver a assinatura no app; link dos e-mails de cobrança)
//            suporte     → /pt-br/suporte (contato do suporte)
//            secoes  → âncoras da página inicial (/pt-br/#precos)

export const REFERENCIA = 'pt-BR';
export const INTERNACIONAL = 'en-US';

export const IDIOMAS = [
    {
        codigo: 'pt-BR', nome: 'Português (Brasil)', curto: 'PT-BR', pais: 'BR', moeda: 'brl',
        rotas: {
            ajuda: 'ajuda', assunto: 'assunto', termos: 'termos-de-uso', privacidade: 'politica-de-privacidade',
            pagamento: 'pagamento-confirmado',
            compras: { pro: 'pro', acesso: 'acesso-cliente', downloads: 'downloads-extras', armazenamento: 'mais-20-gb' },
            perfil: 'perfil', suporte: 'suporte',
            secoes: { sobre: 'sobre', recursos: 'recursos', equipe: 'equipe', precos: 'precos', faq: 'perguntas-frequentes' },
        },
    },
    {
        codigo: 'pt-PT', base: 'pt-BR', nome: 'Português (Portugal)', curto: 'PT-PT', pais: 'PT', moeda: 'eur',
        regioes: ['AO', 'MZ', 'CV', 'GW', 'ST', 'TL', 'MO'],
        rotas: { termos: 'termos-de-utilizacao', suporte: 'apoio', compras: { downloads: 'transferencias-extra' } },
    },
    {
        codigo: 'en-US', nome: 'English (US)', curto: 'EN-US', pais: 'US', moeda: 'usd',
        rotas: {
            ajuda: 'help', assunto: 'topic', termos: 'terms-of-use', privacidade: 'privacy-policy',
            pagamento: 'payment-confirmed',
            compras: { pro: 'pro', acesso: 'client-access', downloads: 'extra-downloads', armazenamento: 'plus-20-gb' },
            perfil: 'profile', suporte: 'support',
            secoes: { sobre: 'about', recursos: 'features', equipe: 'team', precos: 'pricing', faq: 'faq' },
        },
    },
    {
        codigo: 'en-GB', base: 'en-US', nome: 'English (UK)', curto: 'EN-GB', pais: 'GB', moeda: 'gbp',
        regioes: ['IE', 'IN', 'ZA', 'SG', 'HK', 'NG', 'KE'],
    },
    { codigo: 'en-AU', base: 'en-US', nome: 'English (Australia)', curto: 'EN-AU', pais: 'AU', moeda: 'aud', regioes: ['NZ'] },
    { codigo: 'en-CA', base: 'en-US', nome: 'English (Canada)', curto: 'EN-CA', pais: 'CA', moeda: 'cad' },
    {
        codigo: 'es-ES', nome: 'Español (España)', curto: 'ES-ES', pais: 'ES', moeda: 'eur',
        rotas: {
            ajuda: 'ayuda', assunto: 'tema', termos: 'terminos-de-uso', privacidade: 'politica-de-privacidad',
            pagamento: 'pago-confirmado',
            compras: { pro: 'pro', acesso: 'acceso-cliente', downloads: 'descargas-extra', armazenamento: 'mas-20-gb' },
            perfil: 'perfil', suporte: 'soporte',
            secoes: { sobre: 'acerca-de', recursos: 'funciones', equipe: 'equipo', precos: 'precios', faq: 'preguntas-frecuentes' },
        },
    },
    {
        codigo: 'es-MX', base: 'es-ES', nome: 'Español (México/LATAM)', curto: 'ES-MX', pais: 'MX', moeda: 'mxn',
        regioes: ['419', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'US', 'UY', 'VE'],
    },
    {
        codigo: 'fr-FR', nome: 'Français (France)', curto: 'FR-FR', pais: 'FR', moeda: 'eur',
        rotas: { ajuda: 'aide', assunto: 'sujet', termos: 'conditions-utilisation', privacidade: 'politique-confidentialite', pagamento: 'paiement-confirme', compras: { pro: 'pro', acesso: 'acces-client', downloads: 'telechargements-supplementaires', armazenamento: 'plus-20-go' }, perfil: 'profil', suporte: 'assistance', secoes: { sobre: 'a-propos', recursos: 'fonctionnalites', equipe: 'equipe', precos: 'tarifs', faq: 'questions-frequentes' } },
    },
    {
        codigo: 'de-DE', nome: 'Deutsch (Deutschland)', curto: 'DE-DE', pais: 'DE', moeda: 'eur',
        rotas: { ajuda: 'hilfe', assunto: 'thema', termos: 'nutzungsbedingungen', privacidade: 'datenschutz', pagamento: 'zahlung-bestaetigt', compras: { pro: 'pro', acesso: 'bauherrenzugang', downloads: 'zusatz-downloads', armazenamento: 'plus-20-gb' }, perfil: 'profil', suporte: 'support', secoes: { sobre: 'ueber-uns', recursos: 'funktionen', equipe: 'team', precos: 'preise', faq: 'haeufige-fragen' } },
    },
    {
        codigo: 'ar-SA', nome: 'العربية (السعودية)', curto: 'AR-SA', pais: 'SA', moeda: 'sar', direcao: 'rtl', escrita: 'arabe',
        rotas: { ajuda: 'مساعدة', assunto: 'موضوع', termos: 'شروط-الاستخدام', privacidade: 'سياسة-الخصوصية', pagamento: 'تأكيد-الدفع', compras: { pro: 'pro', acesso: 'وصول-العميل', downloads: 'تنزيلات-إضافية', armazenamento: 'مساحة-إضافية' }, perfil: 'الملف-الشخصي', suporte: 'الدعم', secoes: { sobre: 'من-نحن', recursos: 'الميزات', equipe: 'فريق-العمل', precos: 'الأسعار', faq: 'الأسئلة-الشائعة' } },
    },
    {
        codigo: 'it-IT', nome: 'Italiano (Italia)', curto: 'IT-IT', pais: 'IT', moeda: 'eur',
        rotas: { ajuda: 'assistenza', assunto: 'argomento', termos: 'termini-di-servizio', privacidade: 'informativa-privacy', pagamento: 'pagamento-confermato', compras: { pro: 'pro', acesso: 'accesso-cliente', downloads: 'download-extra', armazenamento: 'piu-20-gb' }, perfil: 'profilo', suporte: 'supporto', secoes: { sobre: 'chi-siamo', recursos: 'funzionalita', equipe: 'squadra', precos: 'prezzi', faq: 'domande-frequenti' } },
    },
    {
        codigo: 'tr-TR', nome: 'Türkçe (Türkiye)', curto: 'TR-TR', pais: 'TR', moeda: 'try',
        rotas: { ajuda: 'yardim', assunto: 'konu', termos: 'kullanim-kosullari', privacidade: 'gizlilik-politikasi', pagamento: 'odeme-onaylandi', compras: { pro: 'pro', acesso: 'musteri-erisimi', downloads: 'ek-indirilmeler', armazenamento: 'arti-20-gb' }, perfil: 'profil', suporte: 'destek', secoes: { sobre: 'hakkimizda', recursos: 'ozellikler', equipe: 'ekip', precos: 'fiyatlar', faq: 'sikca-sorulan-sorular' } },
    },
    {
        codigo: 'pl-PL', nome: 'Polski (Polska)', curto: 'PL-PL', pais: 'PL', moeda: 'pln',
        rotas: { ajuda: 'pomoc', assunto: 'temat', termos: 'regulamin', privacidade: 'polityka-prywatnosci', pagamento: 'potwierdzenie-platnosci', compras: { pro: 'pro', acesso: 'dostep-klienta', downloads: 'dodatkowe-pobrania', armazenamento: 'plus-20-gb' }, perfil: 'profil', suporte: 'wsparcie', secoes: { sobre: 'o-nas', recursos: 'funkcje', equipe: 'zespol', precos: 'cennik', faq: 'czeste-pytania' } },
    },
    {
        codigo: 'id-ID', nome: 'Bahasa Indonesia (Indonesia)', curto: 'ID-ID', pais: 'ID', moeda: 'idr',
        rotas: { ajuda: 'bantuan', assunto: 'topik', termos: 'ketentuan-layanan', privacidade: 'kebijakan-privasi', pagamento: 'pembayaran-berhasil', compras: { pro: 'pro', acesso: 'akses-klien', downloads: 'unduhan-tambahan', armazenamento: 'tambah-20-gb' }, perfil: 'profil', suporte: 'dukungan', secoes: { sobre: 'tentang-kami', recursos: 'fitur', equipe: 'tim', precos: 'harga', faq: 'tanya-jawab' } },
    },
    {
        codigo: 'ja-JP', nome: '日本語 (日本)', curto: 'JA-JP', pais: 'JP', moeda: 'jpy', escrita: 'japonesa',
        rotas: { ajuda: 'ヘルプ', assunto: 'トピック', termos: '利用規約', privacidade: 'プライバシーポリシー', pagamento: '決済完了', compras: { pro: 'pro', acesso: '施主アクセス', downloads: '追加ダウンロード', armazenamento: 'ストレージ追加' }, perfil: 'プロフィール', suporte: 'サポート', secoes: { sobre: '概要', recursos: '機能', equipe: 'チーム', precos: '料金', faq: 'よくある質問' } },
    },
    {
        codigo: 'hi-IN', nome: 'हिन्दी (भारत)', curto: 'HI-IN', pais: 'IN', moeda: 'inr', escrita: 'devanagari',
        rotas: { ajuda: 'सहायता', assunto: 'विषय', termos: 'नियम', privacidade: 'गोपनीयता', pagamento: 'भुगतान', compras: { pro: 'pro', acesso: 'क्लाइंट-एक्सेस', downloads: 'डाउनलोड', armazenamento: 'स्टोरेज' }, perfil: 'प्रोफ़ाइल', suporte: 'सपोर्ट', secoes: { sobre: 'हमारे-बारे-में', recursos: 'सुविधाएं', equipe: 'टीम', precos: 'कीमतें', faq: 'सामान्य-सवाल' } },
    },
    {
        codigo: 'vi-VN', nome: 'Tiếng Việt (Việt Nam)', curto: 'VI-VN', pais: 'VN', moeda: 'vnd',
        rotas: { ajuda: 'tro-giup', assunto: 'chu-de', termos: 'dieu-khoan', privacidade: 'quyen-rieng-tu', pagamento: 'thanh-toan', compras: { pro: 'pro', acesso: 'truy-cap-khach-hang', downloads: 'tai-xuong', armazenamento: 'dung-luong' }, perfil: 'ho-so', suporte: 'ho-tro', secoes: { sobre: 'gioi-thieu', recursos: 'tinh-nang', equipe: 'doi-ngu', precos: 'bang-gia', faq: 'cau-hoi-thuong-gap' } },
    },
    {
        codigo: 'nl-NL', nome: 'Nederlands (Nederland)', curto: 'NL-NL', pais: 'NL', moeda: 'eur',
        rotas: { ajuda: 'help', assunto: 'onderwerp', termos: 'voorwaarden', privacidade: 'privacy', pagamento: 'betaling', compras: { pro: 'pro', acesso: 'klanttoegang', downloads: 'downloads', armazenamento: 'opslag' }, perfil: 'profiel', suporte: 'ondersteuning', secoes: { sobre: 'over-ons', recursos: 'functies', equipe: 'team', precos: 'prijzen', faq: 'veelgestelde-vragen' } },
    },
    {
        codigo: 'ko-KR', nome: '한국어 (대한민국)', curto: 'KO-KR', pais: 'KR', moeda: 'krw', escrita: 'coreana',
        rotas: { ajuda: '도움말', assunto: '주제', termos: '이용약관', privacidade: '개인정보처리방침', pagamento: '결제', compras: { pro: 'pro', acesso: '건축주-액세스', downloads: '다운로드', armazenamento: '저장공간' }, perfil: '프로필', suporte: '지원', secoes: { sobre: '소개', recursos: '기능', equipe: '팀', precos: '요금', faq: '자주-묻는-질문' } },
    },
    {
        codigo: 'zh-TW', nome: '繁體中文 (台灣)', curto: 'ZH-TW', pais: 'TW', moeda: 'twd', escrita: 'chinesaTradicional',
        rotas: { ajuda: '說明', assunto: '主題', termos: '服務條款', privacidade: '隱私權政策', pagamento: '付款', compras: { pro: 'pro', acesso: '業主存取', downloads: '下載', armazenamento: '儲存空間' }, perfil: '個人檔案', suporte: '支援', secoes: { sobre: '關於我們', recursos: '功能', equipe: '團隊', precos: '方案費用', faq: '常見問題' } },
    },
    {
        codigo: 'ro-RO', nome: 'Română (România)', curto: 'RO-RO', pais: 'RO', moeda: 'ron',
        rotas: { ajuda: 'ajutor', assunto: 'subiect', termos: 'termeni', privacidade: 'confidentialitate', pagamento: 'plata', compras: { pro: 'pro', acesso: 'acces-client', downloads: 'descarcari', armazenamento: 'stocare' }, perfil: 'profil', suporte: 'asistenta', secoes: { sobre: 'despre-noi', recursos: 'functionalitati', equipe: 'echipa', precos: 'preturi', faq: 'intrebari-frecvente' } },
    },
    {
        codigo: 'th-TH', nome: 'ไทย (ประเทศไทย)', curto: 'TH-TH', pais: 'TH', moeda: 'thb', escrita: 'tailandesa',
        rotas: { ajuda: 'ช่วยเหลือ', assunto: 'หัวข้อ', termos: 'ข้อกำหนด', privacidade: 'ความเป็นส่วนตัว', pagamento: 'การชำระเงิน', compras: { pro: 'pro', acesso: 'สิทธิ์ลูกค้า', downloads: 'ดาวน์โหลด', armazenamento: 'พื้นที่จัดเก็บ' }, perfil: 'โปรไฟล์', suporte: 'ฝ่ายสนับสนุน', secoes: { sobre: 'เกี่ยวกับเรา', recursos: 'ฟีเจอร์', equipe: 'ทีมงาน', precos: 'ราคา', faq: 'คำถามที่พบบ่อย' } },
    },
    {
        // A App Store vende na Ucrânia em dólar (sem preço em hryvnia): o site mostra o mesmo preço da loja.
        codigo: 'uk-UA', nome: 'Українська (Україна)', curto: 'UK-UA', pais: 'UA', moeda: 'usd',
        rotas: { ajuda: 'довідка', assunto: 'тема', termos: 'умови', privacidade: 'конфіденційність', pagamento: 'оплата', compras: { pro: 'pro', acesso: 'доступ-клієнта', downloads: 'завантаження', armazenamento: 'сховище' }, perfil: 'профіль', suporte: 'підтримка', secoes: { sobre: 'про-нас', recursos: 'можливості', equipe: 'команда', precos: 'ціни', faq: 'часті-запитання' } },
    },
    {
        codigo: 'ru-KZ', nome: 'Русский (Казахстан)', curto: 'RU-KZ', pais: 'KZ', moeda: 'kzt',
        rotas: { ajuda: 'справка', assunto: 'тема', termos: 'условия', privacidade: 'конфиденциальность', pagamento: 'оплата', compras: { pro: 'pro', acesso: 'доступ-заказчика', downloads: 'скачивания', armazenamento: 'хранилище' }, perfil: 'профиль', suporte: 'поддержка', secoes: { sobre: 'о-нас', recursos: 'возможности', equipe: 'команда', precos: 'цены', faq: 'частые-вопросы' } },
    },
    {
        codigo: 'cs-CZ', nome: 'Čeština (Česko)', curto: 'CS-CZ', pais: 'CZ', moeda: 'czk',
        rotas: { ajuda: 'napoveda', assunto: 'tema', termos: 'podminky', privacidade: 'soukromi', pagamento: 'platba', compras: { pro: 'pro', acesso: 'klientsky-pristup', downloads: 'stahovani', armazenamento: 'uloziste' }, perfil: 'profil', suporte: 'podpora', secoes: { sobre: 'o-nas', recursos: 'funkce', equipe: 'tym', precos: 'ceny', faq: 'caste-dotazy' } },
    },
    {
        codigo: 'el-GR', nome: 'Ελληνικά (Ελλάδα)', curto: 'EL-GR', pais: 'GR', moeda: 'eur',
        rotas: { ajuda: 'βοήθεια', assunto: 'θέμα', termos: 'όροι-χρήσης', privacidade: 'πολιτική-απορρήτου', pagamento: 'επιβεβαίωση-πληρωμής', compras: { pro: 'pro', acesso: 'πρόσβαση-πελάτη', downloads: 'πρόσθετες-λήψεις', armazenamento: 'επιπλέον-20-gb' }, perfil: 'προφίλ', suporte: 'υποστήριξη', secoes: { sobre: 'σχετικά', recursos: 'δυνατότητες', equipe: 'ομάδα', precos: 'τιμές', faq: 'συχνές-ερωτήσεις' } },
    },
    {
        codigo: 'hu-HU', nome: 'Magyar (Magyarország)', curto: 'HU-HU', pais: 'HU', moeda: 'huf',
        rotas: { ajuda: 'sugo', assunto: 'temakor', termos: 'felhasznalasi-feltetelek', privacidade: 'adatvedelmi-tajekoztato', pagamento: 'sikeres-fizetes', compras: { pro: 'pro', acesso: 'ugyfel-hozzaferes', downloads: 'extra-letoltesek', armazenamento: 'plusz-20-gb' }, perfil: 'profil', suporte: 'ugyfelszolgalat', secoes: { sobre: 'rolunk', recursos: 'funkciok', equipe: 'csapat', precos: 'arak', faq: 'gyakori-kerdesek' } },
    },
    {
        codigo: 'he-IL', nome: 'עברית (ישראל)', curto: 'HE-IL', pais: 'IL', moeda: 'ils', direcao: 'rtl', escrita: 'hebraica',
        rotas: { ajuda: 'עזרה', assunto: 'נושא', termos: 'תנאי-שימוש', privacidade: 'מדיניות-פרטיות', pagamento: 'אישור-תשלום', compras: { pro: 'pro', acesso: 'גישת-לקוח', downloads: 'הורדות-נוספות', armazenamento: 'תוספת-20-gb' }, perfil: 'פרופיל', suporte: 'תמיכה', secoes: { sobre: 'אודות', recursos: 'תכונות', equipe: 'צוות', precos: 'מחירים', faq: 'שאלות-נפוצות' } },
    },
];
