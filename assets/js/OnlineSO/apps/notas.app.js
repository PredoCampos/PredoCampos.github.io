/**
 * @file notas.app.js
 * @description Aplicativo Bloco de Notas com funcionalidades avançadas,
 * incluindo salvar como .txt e estilo de caderno.
 */

export default class NotesApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     */
    constructor(container) {
        this.container = container;
        this.titleInput = null;
        this.textarea = null;
        this.newFileButton = null;
        this.downloadButton = null;
    }

    /**
     * Inicializa o aplicativo, criando a barra de menu e a área de texto estilizada.
     */
    init() {
        // Zera o padding do contêiner da janela para controle total do layout.
        this.container.style.padding = '0';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.backgroundColor = '#FDFD96'; // Fundo geral amarelo claro

        this._createMenu();
        this._createTextarea();
        this._attachEventListeners();

        this._resetNote(); // Define o estado inicial
    }

    /**
     * Cria a barra de menu superior.
     */
    _createMenu() {
        const menuBar = document.createElement('div');
        menuBar.style.display = 'flex';
        menuBar.style.alignItems = 'center';
        menuBar.style.padding = '5px 10px';
        menuBar.style.backgroundColor = '#f0e68c'; // Um amarelo um pouco mais escuro para o menu
        menuBar.style.borderBottom = '1px solid #ddd';
        menuBar.style.gap = '10px';

        // Campo para o título da nota
        const titleLabel = document.createElement('span');
        titleLabel.textContent = 'Título:';
        titleLabel.style.fontWeight = 'bold';
        this.titleInput = document.createElement('input');
        this.titleInput.type = 'text';
        this.titleInput.style.flexGrow = '1';
        this.titleInput.style.border = '1px solid #ccc';
        this.titleInput.style.padding = '4px';

        // Botão de Novo Arquivo
        this.newFileButton = document.createElement('button');
        this.newFileButton.textContent = 'Novo';
        
        // Botão de Baixar
        this.downloadButton = document.createElement('button');
        this.downloadButton.textContent = 'Baixar';

        // Aplica um estilo comum aos botões
        [this.newFileButton, this.downloadButton].forEach(btn => {
            btn.style.padding = '4px 8px';
            btn.style.border = '1px solid #ccc';
            btn.style.backgroundColor = '#fff';
            btn.style.cursor = 'pointer';
        });

        menuBar.appendChild(titleLabel);
        menuBar.appendChild(this.titleInput);
        menuBar.appendChild(this.newFileButton);
        menuBar.appendChild(this.downloadButton);
        
        this.container.appendChild(menuBar);
    }

    /**
     * Cria a área de texto com o estilo de papel pautado.
     */
    _createTextarea() {
        this.textarea = document.createElement('textarea');
        
        // Estilos para o efeito de caderno amarelo pautado
        this.textarea.style.flexGrow = '1'; // Faz o textarea preencher o resto do espaço
        this.textarea.style.border = 'none';
        this.textarea.style.outline = 'none';
        this.textarea.style.padding = '10px';
        this.textarea.style.paddingLeft = '30px'; // Espaço para a "margem vermelha"
        this.textarea.style.boxSizing = 'border-box';
        this.textarea.style.fontFamily = "'Caveat', cursive, sans-serif"; // Uma fonte que parece escrita à mão
        this.textarea.style.fontSize = '18px';
        this.textarea.style.color = '#333';
        this.textarea.style.backgroundColor = '#FFFACD'; // Amarelo "papel"
        this.textarea.style.lineHeight = '24px'; // IMPORTANTE: Deve corresponder à altura da linha no gradiente
        this.textarea.style.backgroundImage = `
            linear-gradient(to right, rgba(255,0,0,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, #FFFACD 23px, #EADCA6 24px)
        `; // Cria a margem vermelha e as linhas horizontais
        this.textarea.style.backgroundSize = 'auto 24px'; // A altura deve corresponder ao lineHeight
        this.textarea.setAttribute('spellcheck', 'false');

        // Adiciona um link para a fonte no cabeçalho do documento principal
        this._loadGoogleFont('Caveat');

        this.container.appendChild(this.textarea);
    }

    /**
     * Adiciona os listeners de eventos aos botões.
     */
    _attachEventListeners() {
        this.newFileButton.addEventListener('click', () => this._resetNote());
        this.downloadButton.addEventListener('click', () => this._downloadNote());
    }

    /**
     * Limpa o conteúdo e reseta o título para o padrão.
     */
    _resetNote() {
        this.titleInput.value = 'Nota';
        this.textarea.value = '';
        this.textarea.focus();
    }

    /**
     * Gera e baixa um arquivo .txt com o conteúdo da nota.
     */
    _downloadNote() {
        const title = this.titleInput.value || 'Nota sem título';
        const content = this.textarea.value;
        
        // Limpa o nome do arquivo para evitar caracteres inválidos
        const filename = title.replace(/[^a-z0-9_-\s]/gi, '').trim() + '.txt';

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        
        // Cria um link temporário para acionar o download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        
        // Adiciona, clica e remove o link do DOM
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpa a URL do objeto
        URL.revokeObjectURL(link.href);
    }

    /**
     * Adiciona a fonte do Google Fonts ao <head> do documento, se ainda não existir.
     * @param {string} fontName - O nome da fonte a ser carregada.
     */
    _loadGoogleFont(fontName) {
        const fontId = `google-font-${fontName.toLowerCase()}`;
        if (document.getElementById(fontId)) {
            return; // Fonte já foi adicionada
        }

        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;700&display=swap`;
        
        document.head.appendChild(link);
    }
}