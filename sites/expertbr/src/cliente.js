// O pouco que o site da ExpertBR faz no navegador (a página já chega pronta do build e funciona sem isto):
//   - botão do tema claro/escuro (a escolha fica no navegador, "expertbr:tema");
//   - menu de idiomas fecha com Esc e ao tocar fora;
//   - raiz "/" sem o servidor (prévia): vai para o idioma do navegador. No ar, o .htaccess faz isso antes (302).

const raiz = document.documentElement;

const botaoTema = document.querySelector('[data-tema]');
if (botaoTema) {
    botaoTema.hidden = false;
    botaoTema.addEventListener('click', () => {
        const escuro = raiz.getAttribute('data-theme') !== 'dark';
        raiz.setAttribute('data-theme', escuro ? 'dark' : 'light');
        try {
            window.localStorage.setItem('expertbr:tema', escuro ? 'escuro' : 'claro');
        } catch {
            // sem permissão para guardar: vale só nesta visita
        }
    });
}

const menu = document.querySelector('[data-idiomas]');
if (menu) {
    document.addEventListener('click', (e) => {
        if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.open) {
            menu.open = false;
            menu.querySelector('summary')?.focus();
        }
    });
    // Ao abrir, o idioma atual aparece à vista no meio da lista (só a lista rola).
    menu.addEventListener('toggle', () => {
        if (!menu.open) return;
        const lista = menu.querySelector('ul');
        const atual = lista?.querySelector('[aria-current="true"]');
        if (lista && atual) lista.scrollTop = atual.offsetTop - lista.clientHeight / 2 + atual.clientHeight / 2;
    });
}

const raizDosIdiomas = document.querySelector('[data-raiz]');
if (raizDosIdiomas) {
    // Só a raiz baixa a regra de escolha (o cadastro dos idiomas): as páginas dos idiomas não precisam dela.
    import('../../../src/i18n/idiomas.js').then(({ escolherIdioma }) => {
        const codigo = escolherIdioma([...(navigator.languages ?? []), navigator.language].filter(Boolean));
        const destino = raizDosIdiomas.querySelector(`[data-codigo="${codigo}"]`);
        if (destino) window.location.replace(destino.getAttribute('href'));
    });
}
