// Busca da Central de Ajuda. Roda no navegador, sobre o índice do idioma (sem servidor).
// Sem diferença de acento nem de maiúscula; título pesa mais que tag, tag mais que resumo
// e resumo mais que o texto dos passos. Tolerante: não exige todas as palavras. Os artigos
// que batem com mais palavras do assunto (e com as palavras mais raras do índice, e no título)
// vêm primeiro; volta vazio só quando nenhuma palavra bate. As palavras vazias (artigos,
// preposições, pronomes...) do idioma do índice são ignoradas. Vale para qualquer escrita
// (latina, grega, cirílica, árabe, hebraica, indianas, tailandesa, chinesa, japonesa, coreana).
//
// Pontos de um artigo: para cada termo da consulta, o melhor encaixe em algum campo (peso do
// campo × qualidade: palavra inteira 1, começo de palavra 0,8, dentro da palavra 0,5; o radical
// da palavra, para os idiomas que flexionam, 0,6 inteiro e 0,4 no começo). Cada termo vale mais
// quanto mais raro no índice: a raiz quarta de (artigos ÷ artigos com o termo), suave para que uma
// palavra rara sozinha não passe na frente de quem bate com o assunto todo. A soma é multiplicada pela parte
// dos termos (pesada pela raridade) que o artigo cobre (COBERTURA_INTEIRA). Só soma, multiplicação, divisão e raiz
// quadrada: dá exatamente o mesmo número no navegador, no servidor e no app (Dart).

// Peso de cada campo, na ordem em que prepararBusca guarda: título, tags, resumo e texto dos passos.
const PESOS = [10, 6, 3, 1];

// Um termo conta inteiro na cobertura quando bate pelo menos como palavra inteira no resumo (3 pontos); abaixo
// disso (só no texto dos passos, só o radical), conta em proporção: um encaixe fraco não vale uma palavra.
const COBERTURA_INTEIRA = 3;

// Termos diferentes por consulta (o resto é ignorado): a busca fica leve mesmo com um texto longo.
export const LIMITE_DE_TERMOS = 32;

// Sinais de vogal opcionais do árabe e do hebraico: a mesma palavra com e sem eles é a mesma na busca
// ("صورًا" acha "صورا" e o contrário; "שָׁלוֹם" acha "שלום"). Árabe: tatweel U+0640 (o traço que só alonga a
// letra), harakat e os outros sinais de vogal U+064B–U+065F e o alef sobrescrito U+0670. Hebraico: niqqud,
// cantilação e pontos U+0591–U+05C7 (e o ponto varika U+FB1E), menos a pontuação que fica nessa faixa (maqaf
// U+05BE, paseq U+05C0, sof pasuq U+05C3, nun hafukha U+05C6), que continua separando palavras. Saem depois
// do NFC: as letras com hamza ou madda (أ إ آ ؤ ئ) são letras próprias e ficam. O tatweel (que não é marca)
// fica no fim da lista: dentro dos colchetes, nenhuma marca vem logo depois de uma letra.
const VOGAIS_OPCIONAIS = /[\u064B-\u065F\u0670\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\uFB1E\u0640]/g;

// Palavras vazias por idioma (o código base: "pt" vale para pt-BR e pt-PT, "zh" para zh-TW): artigos,
// preposições, conjunções, pronomes, verbos auxiliares e as palavras de pergunta ("como", "why"). Escritas
// como a pessoa digita; a busca normaliza. Ficam de fora as que, sem acento, viram outra palavra que importa
// no idioma ("pro" é o plano PRO; no vietnamita, onde tirar o acento junta muitas palavras: "ảnh" e "anh", "độ" e
// "đó", "tư" e "từ", "đăng" e "đang", "vẽ" e "về", "thi" e "thì", "thẻ" e "thế", "tải" e "tai", "bản" e "ban",
// "chờ" e "cho", "chi" e "chị", "đề" e "để", "cố" e "có", "hôm nay" e "này", "vôi" e "với").
// Japonês, chinês e tailandês não têm espaço entre as palavras: a lista deles é recortada de dentro do texto
// (ver cortar), e não comparada palavra a palavra.
export const PALAVRAS_VAZIAS_POR_IDIOMA = {
    pt: ['a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
        'num', 'numa', 'ao', 'aos', 'à', 'às', 'para', 'pra', 'por', 'pelo', 'pela', 'pelos', 'pelas', 'com', 'sem', 'como',
        'que', 'qual', 'quais', 'quando', 'onde', 'porque', 'porquê', 'quê', 'ou', 'mas', 'se', 'não', 'sim', 'já', 'eu', 'me',
        'mim', 'meu', 'minha', 'meus', 'minhas', 'tu', 'te', 'teu', 'tua', 'você', 'vc', 'seu', 'sua', 'seus', 'suas', 'ele',
        'ela', 'eles', 'elas', 'lhe', 'nós', 'nosso', 'nossa', 'este', 'esta', 'isto', 'esse', 'essa', 'isso', 'aquele', 'aquela',
        'é', 'são', 'está', 'estão', 'estou', 'ser', 'estar', 'foi', 'tem', 'tenho', 'ter', 'há', 'vai', 'posso', 'pode',
        'consigo', 'consegue', 'quero', 'preciso', 'muito', 'mais', 'também', 'ainda', 'aqui', 'aí'],
    en: ['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'from', 'with', 'without', 'into', 'about', 'and', 'or', 'but',
        'if', 'so', 'as', 'how', 'what', 'why', 'where', 'when', 'which', 'who', 'do', 'does', 'did', 'done', 'is', 'are', 'was',
        'were', 'be', 'been', 'am', 'has', 'have', 'had', 'can', 'cannot', 'cant', 'could', 'will', 'would', 'should', 'may',
        'not', 'no', 'dont', 'doesnt', 'didnt', 'isnt', 'don', 'doesn', 'didn', 'isn', 't', 's', 'i', 'im', 'me', 'my', 'mine',
        'you', 'your', 'we', 'our', 'us', 'he', 'she', 'it', 'its', 'they', 'their', 'them', 'this', 'that', 'these', 'those',
        'there', 'here', 'want', 'need', 'please', 'any', 'some', 'very', 'too', 'also', 'still', 'just'],
    es: ['el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'y', 'e', 'o', 'u', 'con',
        'sin', 'por', 'para', 'que', 'qué', 'como', 'cómo', 'cuál', 'cuáles', 'cuando', 'cuándo', 'donde', 'dónde', 'porque',
        'pero', 'si', 'sí', 'no', 'ya', 'yo', 'me', 'mi', 'mis', 'tú', 'tu', 'tus', 'te', 'usted', 'su', 'sus', 'se', 'le', 'les',
        'nos', 'él', 'ella', 'ellos', 'ellas', 'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'es', 'son', 'está', 'están',
        'estoy', 'ser', 'estar', 'hay', 'tengo', 'tiene', 'puedo', 'puede', 'quiero', 'necesito', 'muy', 'más', 'también',
        'aquí'],
    fr: ['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'au', 'aux', 'à', 'et', 'ou', 'en', 'dans', 'sur', 'sous',
        'pour', 'par', 'avec', 'sans', 'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
        'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'j', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
        'me', 'm', 'te', 'se', 's', 'ne', 'n', 'pas', 'plus', 'que', 'qu', 'qui', 'quoi', 'comment', 'pourquoi', 'où', 'quand',
        'quel', 'quelle', 'quels', 'quelles', 'est', 'sont', 'suis', 'es', 'être', 'ai', 'as', 'a', 'avons', 'avez', 'ont',
        'avoir', 'peux', 'peut', 'pouvez', 'veux', 'voudrais', 'dois', 'faut', 'mais', 'si', 'y', 'c', 'ça', 'cela', 'très',
        'aussi', 'encore'],
    de: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines', 'und', 'oder', 'aber', 'in',
        'im', 'ins', 'an', 'am', 'auf', 'aus', 'bei', 'beim', 'mit', 'nach', 'von', 'vom', 'zu', 'zum', 'zur', 'für', 'über',
        'unter', 'um', 'durch', 'ohne', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'mir', 'dich', 'dir', 'uns', 'sich',
        'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines', 'dein', 'deine', 'sein', 'seine', 'ihre', 'ihren', 'unser',
        'unsere', 'wie', 'was', 'warum', 'wieso', 'weshalb', 'wo', 'wann', 'welche', 'welcher', 'welches', 'wer', 'ist', 'sind',
        'bin', 'bist', 'war', 'waren', 'hat', 'habe', 'haben', 'hast', 'wird', 'werden', 'kann', 'kannst', 'können', 'muss',
        'soll', 'will', 'möchte', 'nicht', 'kein', 'keine', 'keinen', 'auch', 'noch', 'schon', 'nur', 'so', 'da', 'dass', 'ob',
        'man', 'bitte', 'sehr', 'mehr'],
    it: ['il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una', 'di', 'd', 'del', 'dello', 'della', 'dei', 'degli', 'delle',
        'a', 'al', 'allo', 'alla', 'ai', 'agli', 'alle', 'da', 'dal', 'dalla', 'dai', 'in', 'nel', 'nello', 'nella', 'nei',
        'negli', 'nelle', 'su', 'sul', 'sulla', 'sui', 'con', 'per', 'tra', 'fra', 'senza', 'e', 'ed', 'o', 'ma', 'che', 'chi',
        'come', 'perché', 'dove', 'quando', 'quale', 'quali', 'cosa', 'non', 'mi', 'ti', 'si', 'ci', 'vi', 'io', 'tu', 'lui',
        'lei', 'noi', 'voi', 'loro', 'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'suo', 'sua', 'è', 'sono', 'ho', 'hai', 'ha',
        'abbiamo', 'hanno', 'posso', 'può', 'puoi', 'devo', 'voglio', 'questo', 'questa', 'quello', 'quella', 'più', 'anche',
        'già', 'ancora', 'molto'],
    nl: ['de', 'het', 'een', 'en', 'of', 'in', 'op', 'aan', 'van', 'voor', 'met', 'bij', 'naar', 'uit', 'over', 'om', 'tot', 'door',
        'zonder', 'te', 'ik', 'je', 'jij', 'u', 'hij', 'zij', 'ze', 'we', 'wij', 'mij', 'me', 'mijn', 'jouw', 'uw', 'zijn', 'haar',
        'ons', 'onze', 'hoe', 'wat', 'waarom', 'waar', 'wanneer', 'welke', 'wie', 'is', 'ben', 'bent', 'was', 'waren', 'heb',
        'hebt', 'heeft', 'hebben', 'kan', 'kun', 'kunt', 'kunnen', 'moet', 'wil', 'wilt', 'wordt', 'worden', 'niet', 'geen', 'ook',
        'nog', 'al', 'er', 'dat', 'dit', 'die', 'deze', 'als', 'maar', 'dan', 'graag', 'erg', 'meer'],
    ro: ['și', 'sau', 'în', 'la', 'pe', 'de', 'din', 'cu', 'pentru', 'fără', 'prin', 'după', 'despre', 'spre', 'un', 'o', 'unei',
        'unui', 'niște', 'al', 'ale', 'a', 'ai', 'cel', 'cea', 'cei', 'cele', 'eu', 'tu', 'el', 'ea', 'noi', 'voi', 'ei', 'ele',
        'meu', 'mea', 'mei', 'mele', 'tău', 'său', 'lui', 'lor', 'mă', 'îmi', 'mi', 'se', 'își', 'cum', 'ce', 'unde', 'când',
        'care', 'cine', 'de ce', 'nu', 'este', 'e', 'sunt', 'am', 'are', 'au', 'avem', 'pot', 'poate', 'vreau', 'trebuie', 'să',
        'mai', 'ca', 'că', 'dar', 'deci', 'foarte', 'încă', 'deja'],
    pl: ['i', 'a', 'w', 'we', 'z', 'ze', 'na', 'do', 'od', 'o', 'u', 'po', 'za', 'przez', 'dla', 'bez', 'przy', 'pod', 'nad', 'przed',
        'że', 'się', 'nie', 'jak', 'co', 'czy', 'dlaczego', 'czemu', 'gdzie', 'kiedy', 'który', 'która', 'które', 'jest', 'są',
        'był', 'była', 'było', 'mam', 'masz', 'ma', 'mój', 'moja', 'moje', 'mojego', 'mojej', 'mi', 'mnie', 'ja', 'ty', 'on', 'ona',
        'ono', 'my', 'wy', 'oni', 'mogę', 'może', 'można', 'chcę', 'muszę', 'to', 'ten', 'ta', 'tego', 'tej', 'ale', 'lub', 'albo',
        'jeszcze', 'już', 'tak', 'też', 'bardzo', 'proszę'],
    cs: ['a', 'i', 'v', 've', 'z', 'ze', 'na', 'do', 'od', 'o', 'u', 'po', 'za', 'při', 'bez', 's', 'se', 'k', 'ke', 'je',
        'jsou', 'jsem', 'jsi', 'byl', 'byla', 'bylo', 'mám', 'má', 'máme', 'mají', 'můj', 'moje', 'mi', 'mě', 'mně', 'já', 'ty',
        'on', 'ona', 'my', 'vy', 'oni', 'jak', 'co', 'proč', 'kde', 'kdy', 'který', 'která', 'které', 'není', 'ne', 'nejde',
        'mohu', 'můžu', 'může', 'lze', 'chci', 'musím', 'to', 'ten', 'ta', 'tento', 'tato', 'toto', 'ale', 'nebo', 'už', 'také',
        'ještě', 'si', 'by', 'bych', 'že', 'aby', 'velmi', 'prosím'],
    hu: ['a', 'az', 'egy', 'és', 'vagy', 'de', 'hogy', 'nem', 'is', 'meg', 'el', 'ki', 'be', 'fel', 'le', 'mi', 'mit', 'miért',
        'hogyan', 'hol', 'mikor', 'melyik', 'van', 'nincs', 'vannak', 'volt', 'lesz', 'tudok', 'tudom', 'lehet', 'kell',
        'szeretnék', 'szeretném', 'én', 'te', 'ő', 'ti', 'ők', 'ez', 'azt', 'ezt', 'ezek', 'azok', 'ha', 'csak', 'még', 'már',
        'sem', 'mint', 'nekem', 'engem', 'nagyon', 'kérem'],
    tr: ['ve', 'veya', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'ki', 'mi', 'mı', 'mu', 'mü', 'ne', 'neden', 'niye',
        'nasıl', 'nerede', 'nereden', 'hangi', 'kim', 'var', 'yok', 'değil', 'ben', 'sen', 'biz', 'siz', 'onlar', 'benim', 'senin',
        'bana', 'beni', 'çok', 'daha', 'en', 'gibi', 'kadar', 'ama', 'fakat', 'ya', 'olarak', 'oldu', 'olur', 'misin', 'mısın',
        'miyim', 'lütfen'],
    el: ['ο', 'η', 'το', 'οι', 'τα', 'του', 'της', 'των', 'τον', 'την', 'τις', 'τους', 'ένα', 'ένας', 'μια', 'μία', 'και', 'ή',
        'σε', 'στο', 'στη', 'στην', 'στον', 'στα', 'στους', 'στις', 'από', 'για', 'με', 'χωρίς', 'ως', 'πώς', 'πως', 'τι', 'γιατί',
        'πού', 'που', 'πότε', 'ποιο', 'ποια', 'ποιος', 'δεν', 'δε', 'μη', 'μην', 'να', 'θα', 'είναι', 'είμαι', 'έχω', 'έχει',
        'μπορώ', 'μπορεί', 'θέλω', 'μου', 'σου', 'μας', 'σας', 'εγώ', 'εσύ', 'αυτό', 'αυτή', 'αυτά', 'αλλά', 'ότι', 'όταν', 'αν',
        'πολύ', 'ακόμα', 'ήδη'],
    ru: ['и', 'в', 'во', 'на', 'с', 'со', 'к', 'ко', 'по', 'о', 'об', 'от', 'до', 'из', 'у', 'за', 'для', 'без', 'при', 'через',
        'над', 'под', 'про', 'или', 'а', 'но', 'не', 'нет', 'ни', 'как', 'что', 'почему', 'зачем', 'где', 'когда', 'какой', 'какая',
        'какие', 'кто', 'это', 'этот', 'эта', 'эти', 'то', 'тот', 'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они', 'мой', 'моя',
        'моё', 'мои', 'мне', 'меня', 'есть', 'был', 'была', 'было', 'будет', 'можно', 'могу', 'может', 'нужно', 'надо', 'хочу',
        'ли', 'же', 'бы', 'уже', 'ещё', 'только', 'очень', 'так', 'чтобы', 'если', 'пожалуйста'],
    uk: ['і', 'й', 'та', 'в', 'у', 'на', 'з', 'із', 'зі', 'до', 'від', 'по', 'про', 'за', 'для', 'без', 'при', 'через', 'над',
        'під', 'або', 'а', 'але', 'не', 'ні', 'немає', 'як', 'що', 'чому', 'де', 'коли', 'який', 'яка', 'які', 'хто', 'це', 'цей',
        'ця', 'ці', 'то', 'той', 'я', 'ти', 'він', 'вона', 'воно', 'ми', 'ви', 'вони', 'мій', 'моя', 'моє', 'мої', 'мені', 'мене',
        'є', 'був', 'була', 'було', 'буде', 'можна', 'можу', 'може', 'треба', 'потрібно', 'хочу', 'чи', 'же', 'б', 'би', 'вже',
        'ще', 'лише', 'тільки', 'дуже', 'так', 'щоб', 'якщо', 'будь ласка'],
    ar: ['في', 'من', 'إلى', 'الى', 'على', 'عن', 'مع', 'و', 'أو', 'او', 'ثم', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'ما',
        'ماذا', 'لماذا', 'كيف', 'كيفية', 'أين', 'اين', 'متى', 'هل', 'لا', 'لم', 'لن', 'ليس', 'أنا', 'انا', 'أنت', 'انت', 'هو',
        'هي', 'نحن', 'هم', 'كان', 'يكون', 'يمكن', 'يمكنني', 'أستطيع', 'استطيع', 'أريد', 'اريد', 'عند', 'عندي', 'لي', 'قد',
        'لقد', 'جدا', 'أيضا', 'ايضا', 'من فضلك'],
    he: ['של', 'את', 'על', 'עם', 'אל', 'מן', 'או', 'גם', 'אם', 'כי', 'לא', 'אין', 'יש', 'זה', 'זאת', 'זו', 'אלה', 'הוא', 'היא',
        'אני', 'אתה', 'אנחנו', 'הם', 'הן', 'שלי', 'שלך', 'איך', 'למה', 'מדוע', 'מה', 'מתי', 'איפה', 'איזה', 'אפשר', 'יכול',
        'יכולה', 'רוצה', 'צריך', 'צריכה', 'כבר', 'עוד', 'רק', 'מאוד', 'אבל', 'כן', 'בבקשה'],
    hi: ['का', 'की', 'के', 'को', 'में', 'से', 'पर', 'और', 'या', 'है', 'हैं', 'था', 'थी', 'थे', 'हो', 'होता', 'होती', 'कैसे', 'क्या',
        'क्यों', 'कहाँ', 'कहां', 'कब', 'कौन', 'कौनसा', 'मैं', 'मेरा', 'मेरी', 'मेरे', 'मुझे', 'आप', 'आपका', 'आपकी', 'यह', 'वह', 'ये',
        'वो', 'इस', 'उस', 'नहीं', 'ना', 'भी', 'तो', 'ही', 'कर', 'करें', 'करूं', 'करूँ', 'करना', 'करते', 'सकता', 'सकती', 'सकते',
        'चाहिए', 'चाहता', 'चाहती', 'एक', 'लिए', 'ने', 'बहुत', 'कृपया'],
    id: ['dan', 'atau', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'pada', 'dalam', 'oleh', 'tanpa', 'ini', 'itu', 'saya',
        'aku', 'kamu', 'anda', 'kami', 'kita', 'mereka', 'bagaimana', 'gimana', 'cara', 'apa', 'mengapa', 'kenapa', 'dimana',
        'mana', 'kapan', 'siapa', 'adalah', 'ada', 'tidak', 'tak', 'bukan', 'belum', 'sudah', 'bisa', 'dapat', 'mau', 'ingin',
        'harus', 'akan', 'juga', 'saja', 'lagi', 'sih', 'ya', 'tolong', 'sangat'],
    vi: ['của', 'và', 'là', 'không', 'được', 'trong', 'các', 'những', 'một', 'làm', 'nào', 'như', 'gì', 'ở', 'khi', 'bị',
        'hoặc', 'vào', 'đến', 'em', 'ạ', 'vậy'],
    ko: ['어떻게', '왜', '무엇', '뭐', '어디', '어디서', '어디에', '언제', '어느', '그리고', '또는', '및', '이', '그', '저', '제', '내',
        '나', '저는', '제가', '나는', '내가', '우리', '좀', '것', '거', '수', '방법', '방법은', '방법을', '있나요', '있어요', '없어요',
        '없나요', '하나요', '해요', '합니다', '해야', '하는', '하려면', '되나요', '돼요', '안', '못', '안돼요', '주세요'],
    // Recortadas de dentro do texto (sem espaço): só palavras de função que quase nunca fazem parte de outra palavra.
    ja: ['どうやって', 'どうすれば', 'どうしたら', 'できません', 'できない', 'できます', 'ください', 'しません', 'しない', 'します',
        'したい', 'ですか', 'ません', 'でしょう', 'ますか', 'には', 'では', 'とは', 'から', 'まで', 'より', 'ので', 'のに', 'けど',
        'どう', 'なぜ', 'なに', 'どこ', 'いつ', 'どれ', 'する', 'した', 'して', 'です', 'ます', 'ない', '方法', '私', '僕', '何',
        'は', 'が', 'を', 'に', 'の', 'で', 'と', 'も', 'へ', 'や', 'か', 'ね', 'よ'],
    zh: ['為什麼', '为什么', '怎麼樣', '怎么样', '如何', '怎麼', '怎么', '怎樣', '怎样', '什麼', '什么', '為何', '为何', '可以', '沒有',
        '没有', '我的', '你的', '您的', '哪裡', '哪里', '請問', '请问', '一下', '的', '了', '嗎', '吗', '呢', '吧', '我', '你', '您',
        '把', '被', '和', '與', '与', '及', '或', '是', '這', '这', '那', '請', '请', '從', '从', '給', '给', '讓', '让', '對', '对'],
    th: ['อย่างไร', 'ยังไง', 'ทำไม', 'อะไร', 'ที่ไหน', 'เมื่อไหร่', 'เมื่อไร', 'ได้ไหม', 'ไหม', 'หรือ', 'และ', 'ของ', 'ใน', 'ให้',
        'กับ', 'จาก', 'ฉัน', 'ผม', 'ดิฉัน', 'คุณ', 'เรา', 'ครับ', 'ค่ะ', 'คะ', 'นะ', 'จะ', 'ได้', 'ไม่', 'แล้ว', 'การ', 'ความ',
        'เป็น', 'คือ', 'ต้อง', 'วิธี'],
};

// Escritas sem espaço entre as palavras (tailandês, chinês, japonês). Faixas fixas de código, e
// não \p{Script}, para o app (Dart) conferir exatamente igual. O coreano tem espaço: fica de fora.
const SEM_ESPACO = [
    [0x0E00, 0x0E7F], // tailandês
    [0x3005, 0x3007], // 々 〆 〇
    [0x3021, 0x3029], // numerais de Hangzhou
    [0x3038, 0x303B], // 〸 〹 〺 〻
    [0x3040, 0x30FF], // hiragana e katakana (com ー)
    [0x31F0, 0x31FF], // katakana: extensão fonética
    [0x3400, 0x4DBF], // ideogramas: extensão A
    [0x4E00, 0x9FFF], // ideogramas
    [0xF900, 0xFAFF], // ideogramas de compatibilidade
    [0xFF66, 0xFF9F], // katakana de meia largura
    [0x1B000, 0x1B16F], // kana: suplemento e extensões
    [0x20000, 0x3FFFF], // ideogramas: extensões B em diante
];

// Prefixos colados na palavra: artigo e preposições do árabe ("التقرير" também acha "تقرير") e as letras de
// preposição, artigo e conjunção do hebraico ("לדוח" também acha "דוח").
const PREFIXOS_ARABES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال'];
const PREFIXOS_HEBRAICOS = 'הובלמשכ';

// NFD e retirada das marcas U+0300–U+036F: tira o acento do latim, do grego e do cirílico
// ("é" → "e", "ά" → "α", "й" → "и"). As outras marcas (vogais e sinais das escritas indianas e do
// tailandês, por exemplo) fazem parte da palavra e ficam. Volta para NFC para o coreano não ficar
// decomposto e tira os sinais de vogal opcionais do árabe e do hebraico (VOGAIS_OPCIONAIS).
// É o passo que o app (sem NFD/NFC) recebe pronto, caractere a caractere, na tabela gerada.
export function semMarcas(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .normalize('NFC')
        .replace(VOGAIS_OPCIONAIS, '');
}

// Sem marcas (semMarcas) e em minúsculas. O "ς" (sigma do fim da palavra) vira "σ": a mesma palavra em
// maiúsculas e em minúsculas fica igual, aqui e no app. Fica só letra, marca e número, de qualquer escrita.
export function normalizar(texto) {
    return semMarcas(texto)
        .toLowerCase()
        .replace(/ς/g, 'σ')
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
        .trim();
}

// As listas já normalizadas: palavras inteiras (uma por entrada; "de ce" vira "de" e "ce") e, para as
// escritas sem espaço, os recortes, do mais comprido para o mais curto.
function listasDoIdioma(lista) {
    const palavras = new Set();
    const cortes = [];
    for (const item of lista) {
        const n = normalizar(item);
        for (const p of n.split(' ')) if (p) palavras.add(p);
        if (n && !n.includes(' ') && temEscritaSemEspaco(n) && !cortes.includes(n)) cortes.push(n);
    }
    cortes.sort((a, b) => b.length - a.length);
    return { palavras, cortes };
}

const LISTAS = Object.fromEntries(Object.entries(PALAVRAS_VAZIAS_POR_IDIOMA).map(([k, l]) => [k, listasDoIdioma(l)]));
// Sem idioma (quem chama não sabe qual é): as palavras vazias de todos os idiomas juntas.
const TODAS = listasDoIdioma(Object.values(PALAVRAS_VAZIAS_POR_IDIOMA).flat());

// "pt-BR", "pt_PT" ou "pt" → as listas do "pt". Idioma sem lista → nenhuma palavra vazia.
export function listasDaBusca(idioma) {
    if (idioma == null || idioma === '') return TODAS;
    const base = String(idioma).toLowerCase().split(/[-_]/)[0];
    return LISTAS[base] ?? { palavras: new Set(), cortes: [] };
}

// Um campo do artigo já normalizado: o texto (com espaço nas pontas, para achar o começo de palavra) e o
// conjunto das palavras dele (palavra inteira se confere sem varrer o texto).
function campo(texto) {
    const n = normalizar(texto);
    return { texto: ` ${n} `, palavras: new Set(n.split(' ').filter(Boolean)) };
}

// Prepara o índice uma vez por idioma: guarda os campos já normalizados e o idioma (as palavras vazias dele).
export function prepararBusca(artigos, idioma) {
    return {
        idioma: idioma ?? null,
        itens: (artigos ?? []).map((artigo, posicao) => ({
            artigo,
            posicao,
            campos: [
                campo(artigo.titulo),
                campo((artigo.tags ?? []).join(' ')),
                campo(artigo.resumo),
                campo(artigo.busca),
            ],
        })),
    };
}

function semEspaco(codigo) {
    return SEM_ESPACO.some(([de, ate]) => codigo >= de && codigo <= ate);
}

export function temEscritaSemEspaco(texto) {
    for (const letra of texto) if (semEspaco(letra.codePointAt(0))) return true;
    return false;
}

// Tipo de letra dentro da escrita sem espaço: as palavras do japonês mudam de tipo (o kanji da palavra, o
// hiragana da partícula), e o par de letras que atravessa essa troca não é palavra.
function tipoSemEspaco(codigo) {
    if (codigo >= 0x0E00 && codigo <= 0x0E7F) return 'tailandes';
    if (codigo >= 0x3040 && codigo <= 0x309F) return 'hiragana';
    if ((codigo >= 0x30A0 && codigo <= 0x30FF) || (codigo >= 0x31F0 && codigo <= 0x31FF) || (codigo >= 0xFF66 && codigo <= 0xFF9F)) return 'katakana';
    return 'ideograma';
}

const ehHangul = (codigo) => codigo >= 0xAC00 && codigo <= 0xD7A3;

// Recorta as palavras vazias de dentro de um pedaço sem espaço (a mais comprida primeiro, da esquerda para a
// direita). Devolve os pedaços que sobram, como listas de letras.
function cortar(letras, cortes) {
    if (!cortes.length) return [letras];
    const texto = letras.join('');
    const pedacos = [];
    let atual = [];
    let posicao = 0;
    let k = 0;
    while (k < letras.length) {
        const corte = cortes.find((c) => texto.startsWith(c, posicao));
        if (corte) {
            if (atual.length) pedacos.push(atual);
            atual = [];
            const fim = posicao + corte.length;
            while (posicao < fim) {
                posicao += letras[k].length;
                k++;
            }
        } else {
            atual.push(letras[k]);
            posicao += letras[k].length;
            k++;
        }
    }
    if (atual.length) pedacos.push(atual);
    return pedacos;
}

// Na consulta, cada pedaço contínuo de escrita sem espaço vira pares de letras vizinhas
// ("写真を追加" → "写真", "追加"). Antes, as palavras vazias do idioma saem de dentro dele e ele é separado
// onde muda o tipo de letra (kanji, hiragana, katakana); sobra de uma letra só fica se for ideograma ("圖").
// O resto da palavra fica inteiro ("rdoの写真" → "rdo", "写真"), separado onde muda de coreano para outra
// escrita ("pdf를" → "pdf"; a partícula de uma sílaba que sobra sai). Em [cru] (a consulta só tinha palavras
// vazias) nada sai nem é separado no sem espaço, e nenhuma letra solta sai.
function pedacos(palavra, cortes, cru) {
    const termos = [];
    const umaLetra = Array.from(palavra).length === 1;
    let outra = '';
    let outraHangul = false;
    let seguidas = [];
    const fecharOutra = () => {
        if (!outra) return;
        if (cru || umaLetra || !outraHangul || Array.from(outra).length > 1) termos.push(outra);
        outra = '';
    };
    const pares = (letras) => {
        if (letras.length === 1) {
            if (cru || tipoSemEspaco(letras[0].codePointAt(0)) === 'ideograma') termos.push(letras[0]);
            return;
        }
        for (let i = 0; i + 1 < letras.length; i++) termos.push(letras[i] + letras[i + 1]);
    };
    const fecharSeguidas = () => {
        if (!seguidas.length) return;
        if (cru) {
            pares(seguidas);
        } else {
            for (const pedaco of cortar(seguidas, cortes)) {
                let mesmoTipo = [];
                let tipo = null;
                for (const letra of pedaco) {
                    const t = tipoSemEspaco(letra.codePointAt(0));
                    if (tipo !== null && t !== tipo) {
                        pares(mesmoTipo);
                        mesmoTipo = [];
                    }
                    tipo = t;
                    mesmoTipo.push(letra);
                }
                if (mesmoTipo.length) pares(mesmoTipo);
            }
        }
        seguidas = [];
    };
    for (const letra of palavra) {
        const codigo = letra.codePointAt(0);
        if (semEspaco(codigo)) {
            fecharOutra();
            seguidas.push(letra);
        } else {
            fecharSeguidas();
            const hangul = ehHangul(codigo);
            if (outra && hangul !== outraHangul) fecharOutra();
            outraHangul = hangul;
            outra += letra;
        }
    }
    fecharSeguidas();
    fecharOutra();
    return termos;
}

// Termos da consulta, sem repetir, até LIMITE_DE_TERMOS. As palavras vazias do idioma saem; se só houver
// palavras vazias, usa todas, como foram digitadas.
export function termosDaConsulta(consulta, idioma) {
    const { palavras, cortes } = listasDaBusca(idioma);
    const todos = normalizar(consulta).split(' ').filter(Boolean);
    let termos = todos.filter((t) => !palavras.has(t)).flatMap((t) => pedacos(t, cortes, false));
    if (!termos.length) termos = todos.flatMap((t) => pedacos(t, cortes, true));
    return [...new Set(termos)].slice(0, LIMITE_DE_TERMOS);
}

// Um jeito de achar o termo: o texto, o multiplicador, o tamanho (em letras; o coreano conta uma a mais, porque
// duas sílabas já são uma palavra) e se vale em qualquer lugar (escrita sem espaço).
function jeito(texto, multiplicador) {
    const codigo = texto.codePointAt(0);
    const tamanho = Array.from(texto).length + (ehHangul(codigo) ? 1 : 0);
    return { texto, multiplicador, tamanho, livre: semEspaco(codigo) };
}

// Jeitos de achar um termo. "fotos" também acha "foto", "relatorios" acha "relatorio"; no árabe e no hebraico,
// sem o prefixo colado; e os radicais da palavra (o começo dela, até a metade e no mínimo 4 letras; 2 no
// coreano), para os idiomas que flexionam ("fotoğrafları" acha "fotoğraf", "사진을" acha "사진",
// "Bautagesberichts" acha "Bautagesbericht").
function prepararTermo(termo) {
    const letras = Array.from(termo);
    const n = letras.length;
    const jeitos = [jeito(termo, 1)];
    if (n > 4 && termo.endsWith('es')) jeitos.push(jeito(termo.slice(0, -2), 1));
    if (n > 3 && termo.endsWith('s')) jeitos.push(jeito(termo.slice(0, -1), 1));
    const primeira = letras[0].codePointAt(0);
    if (primeira >= 0x0600 && primeira <= 0x06FF) {
        const prefixo = PREFIXOS_ARABES.find((p) => termo.startsWith(p) && n - Array.from(p).length >= 2);
        if (prefixo) jeitos.push(jeito(termo.slice(prefixo.length), 0.8));
    }
    if (primeira >= 0x05D0 && primeira <= 0x05EA) {
        for (let i = 1; i <= 2 && n - i >= 2 && PREFIXOS_HEBRAICOS.includes(letras[i - 1]); i++) {
            jeitos.push(jeito(letras.slice(i).join(''), 0.8));
        }
    }
    const raizes = [];
    if (!semEspaco(primeira)) {
        const minimo = ehHangul(primeira) ? 2 : Math.max(4, Math.ceil(n / 2));
        for (let k = n - 1; k >= minimo; k--) raizes.push(letras.slice(0, k).join(''));
    }
    return { jeitos, raizes };
}

// Qualidade do encaixe de um jeito num campo. Palavra inteira vale mais que começo de palavra, e começo mais
// que pedaço. Termo de uma letra só vale como palavra inteira; o de duas não vale dentro de outra palavra; o
// de escrita sem espaço vale em qualquer lugar.
function pontuarCampo(campo, j) {
    if (campo.palavras.has(j.texto)) return 1;
    if (!j.livre && j.tamanho < 2) return 0;
    if (campo.texto.includes(` ${j.texto}`)) return 0.8;
    if (!j.livre && j.tamanho < 3) return 0;
    if (campo.texto.includes(j.texto)) return 0.5;
    return 0;
}

// O radical só vale como palavra inteira (0,6) ou no começo de uma palavra (0,4). Se algum radical começa uma
// palavra, o mais curto também começa: basta procurar o mais curto.
function pontuarRadical(campo, raizes) {
    if (!raizes.length) return 0;
    for (const r of raizes) if (campo.palavras.has(r)) return 0.6;
    return campo.texto.includes(` ${raizes[raizes.length - 1]}`) ? 0.4 : 0;
}

function melhorEncaixe(campos, termo) {
    let melhor = 0;
    for (let c = 0; c < PESOS.length; c++) {
        const campo = campos[c];
        for (const j of termo.jeitos) {
            const p = pontuarCampo(campo, j) * PESOS[c] * j.multiplicador;
            if (p > melhor) melhor = p;
        }
        const r = pontuarRadical(campo, termo.raizes) * PESOS[c];
        if (r > melhor) melhor = r;
    }
    return melhor;
}

// Devolve os artigos encontrados, do mais para o menos parecido (empate: a ordem do índice).
// opcoes.limite: quantos devolver (padrão 8).
export function buscar(preparado, consulta, opcoes = {}) {
    const limite = opcoes.limite ?? 8;
    const itens = preparado?.itens ?? [];
    const termos = termosDaConsulta(consulta, preparado?.idioma).map(prepararTermo);
    if (!termos.length || !itens.length) return [];

    const encaixes = itens.map((item) => termos.map((t) => melhorEncaixe(item.campos, t)));
    const raridade = termos.map((_, t) => {
        let com = 0;
        for (const e of encaixes) if (e[t] > 0) com++;
        return com > 0 ? Math.sqrt(Math.sqrt(itens.length / com)) : 0;
    });
    let pesoTotal = 0;
    for (const r of raridade) pesoTotal += r;
    if (pesoTotal === 0) return [];

    const achados = [];
    for (let i = 0; i < itens.length; i++) {
        let soma = 0;
        let coberto = 0;
        for (let t = 0; t < termos.length; t++) {
            const e = encaixes[i][t];
            if (e > 0) {
                soma += raridade[t] * e;
                coberto += raridade[t] * (e < COBERTURA_INTEIRA ? e / COBERTURA_INTEIRA : 1);
            }
        }
        if (coberto === 0) continue;
        let pontos = soma * (coberto / pesoTotal);
        if (itens[i].artigo.prioritario) pontos += 0.5;
        achados.push({ artigo: itens[i].artigo, pontos, posicao: itens[i].posicao });
    }
    achados.sort((a, b) => (b.pontos - a.pontos) || (a.posicao - b.posicao));
    return achados.slice(0, limite).map((a) => a.artigo);
}
