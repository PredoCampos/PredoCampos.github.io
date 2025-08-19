/**
 * @file internet.app.js
 * @description Aplicativo de Navegador de Internet simples.
 */

export default class InternetApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     */
    constructor(container) {
        this.container = container;
        this.addressBar = null;
        this.iframe = null;
        this.defaultUrl = 'https://www.google.com/webhp?igu=1'; // URL que tende a funcionar em iframes
    }

    /**
     * Inicializa o aplicativo, criando a barra de endereço e a área de visualização.
     */
    init() {
        // Estilos para o contêiner principal
        this.container.style.padding = '0';
        this.container.style.overflow = 'hidden';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.backgroundColor = '#fff';

        this._createAddressBar();
        this._createIframe();
        this._attachEventListeners();

        // Carrega a página inicial
        this._navigateTo(this.defaultUrl);
    }

    /**
     * Cria a barra de endereço superior.
     */
    _createAddressBar() {
        const addressBarContainer = document.createElement('div');
        addressBarContainer.style.display = 'flex';
        addressBarContainer.style.padding = '5px';
        addressBarContainer.style.borderBottom = '1px solid #ccc';
        addressBarContainer.style.backgroundColor = '#f0f0f0';

        this.addressBar = document.createElement('input');
        this.addressBar.type = 'text';
        this.addressBar.placeholder = 'Digite uma URL e pressione Enter';
        this.addressBar.style.width = '100%';
        this.addressBar.style.border = '1px solid #999';
        this.addressBar.style.padding = '4px 8px';
        this.addressBar.style.fontSize = '14px';

        addressBarContainer.appendChild(this.addressBar);
        this.container.appendChild(addressBarContainer);
    }

    /**
     * Cria o elemento iframe onde o site será exibido.
     */
    _createIframe() {
        this.iframe = document.createElement('iframe');
        this.iframe.style.flexGrow = '1'; // Ocupa todo o espaço restante
        this.iframe.style.border = 'none';
        this.iframe.setAttribute('sandbox', 'allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts'); // Medida de segurança

        this.container.appendChild(this.iframe);
    }

    /**
     * Adiciona o listener de evento para a barra de endereço.
     */
    _attachEventListeners() {
        this.addressBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._navigateTo(this.addressBar.value);
            }
        });
    }

    /**
     * Navega para a URL especificada.
     * @param {string} url - A URL para carregar no iframe.
     */
    _navigateTo(url) {
        if (!url) return;

        let fullUrl = url.trim();
        // Adiciona http:// ou https:// se não estiver presente, para que o iframe funcione
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            // Tenta usar o texto como uma busca no Google como fallback
            try {
                // Tenta criar uma URL. Se for válido (como "exemplo.com"), funciona.
                // Se não for (como "minha busca"), lança um erro.
                new URL(`https://${fullUrl}`);
                fullUrl = `https://${fullUrl}`;
            } catch (e) {
                // Se não for uma URL válida, trata como uma busca
                fullUrl = `https://www.google.com/search?q=${encodeURIComponent(fullUrl)}`;
            }
        }

        this.addressBar.value = fullUrl;
        this.iframe.src = fullUrl;
    }
}