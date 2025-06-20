/**
 * @file lixo.app.js
 * @description Aplicativo Lixeira. Versão inicial apenas visual.
 */

export default class LixoApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Inicializa o aplicativo, criando a interface visual da Lixeira.
     */
    init() {
        // Estilos do contêiner principal da janela
        this.container.style.padding = '0';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.backgroundColor = '#FFFFFF';
        this.container.style.fontFamily = "'Tahoma', sans-serif";

        this._createToolbar();
        this._createContentView();
        this._createStatusBar();
    }

    /**
     * Cria a barra de ferramentas superior com botões desabilitados.
     */
    _createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.alignItems = 'center';
        toolbar.style.padding = '4px';
        toolbar.style.borderBottom = '1px solid #ddd';
        toolbar.style.backgroundColor = '#f0f0f0';
        toolbar.style.gap = '15px';

        // Botão para "Esvaziar Lixeira"
        const emptyButton = this._createToolbarButton('Esvaziar Lixeira', 'assets/images/so/lixo.png');
        
        // Botão para "Restaurar todos os itens"
        const restoreAllButton = this._createToolbarButton('Restaurar tudo', 'assets/images/so/programs-icon.png');
        
        toolbar.appendChild(emptyButton);
        toolbar.appendChild(restoreAllButton);

        this.container.appendChild(toolbar);
    }

    /**
     * Cria um botão para a barra de ferramentas.
     * @param {string} text - O texto do botão.
     * @param {string} iconSrc - O caminho para o ícone do botão.
     * @returns {HTMLButtonElement} O elemento do botão criado.
     */
    _createToolbarButton(text, iconSrc) {
        const button = document.createElement('button');
        button.disabled = true; // Botões desabilitados nesta versão
        
        button.style.background = 'none';
        button.style.border = 'none';
        button.style.display = 'flex';
        button.style.flexDirection = 'column';
        button.style.alignItems = 'center';
        button.style.cursor = 'default';
        button.style.opacity = '0.5';
        button.style.fontFamily = 'inherit';
        
        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.style.width = '24px';
        icon.style.height = '24px';
        
        const label = document.createElement('span');
        label.textContent = text;
        label.style.marginTop = '4px';
        label.style.fontSize = '12px';

        button.appendChild(icon);
        button.appendChild(label);
        
        return button;
    }

    /**
     * Cria a área de conteúdo principal.
     */
    _createContentView() {
        const contentView = document.createElement('div');
        contentView.style.flexGrow = '1';
        contentView.style.padding = '20px';
        contentView.style.display = 'flex';
        contentView.style.alignItems = 'center';
        contentView.style.justifyContent = 'center';
        contentView.style.color = '#555';

        const message = document.createElement('p');
        message.textContent = 'A Lixeira está vazia.';
        
        contentView.appendChild(message);
        this.container.appendChild(contentView);
    }

    /**
     * Cria a barra de status inferior.
     */
    _createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.style.padding = '4px 10px';
        statusBar.style.borderTop = '1px solid #ddd';
        statusBar.style.fontSize = '12px';
        statusBar.style.color = '#333';
        
        statusBar.textContent = '0 objeto(s)';
        
        this.container.appendChild(statusBar);
    }
}