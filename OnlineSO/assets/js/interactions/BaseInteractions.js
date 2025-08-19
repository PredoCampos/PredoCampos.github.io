/**
 * @file BaseInteractions.js
 * @description Classe base abstrata que contém toda a lógica de interação
 * compartilhada entre as plataformas desktop e mobile.
 */

export class BaseInteractions {
    constructor(soInstance) {
        if (this.constructor === BaseInteractions) {
            throw new Error("A classe base 'BaseInteractions' não pode ser instanciada diretamente.");
        }
        this.so = soInstance;
        this.wm = soInstance.windowManager;
        this.gm = soInstance.gridManager;
        this.mm = soInstance.menuManager;
        this.contextMenu = document.getElementById('context-menu');
        this.desktopEl = document.querySelector(this.so.config.selectors.desktop);
    }

    /**
     * Inicializa os listeners de eventos que são comuns a todas as plataformas.
     * As classes filhas devem chamar super.initialize() e adicionar seus próprios listeners.
     */
    initialize() {
        this.desktopEl.addEventListener('click', () => this._clearIconSelection());
        this._observeNewWindows();
        this._setupSharedContextMenuLogic();
    }

    // --- Métodos de Interação de Janela (Comuns) ---

    /**
     * Observa o contêiner de janelas e torna qualquer nova janela interativa.
     * A lógica do MutationObserver é idêntica para ambas as plataformas.
     */
    _observeNewWindows() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('window')) {
                        this._makeWindowInteractive(node);
                    }
                });
            });
        });
        const container = document.querySelector(this.so.config.selectors.windowsContainer);
        observer.observe(container, { childList: true });
    }

    /**
     * Adiciona os listeners de eventos a uma janela (fechar, minimizar, maximizar, etc.).
     * Este método será implementado de forma diferente em cada classe filha para usar
     * 'click' ou 'touchend'.
     * @param {HTMLElement} windowEl - O elemento da janela.
     */
    _makeWindowInteractive(windowEl) {
        throw new Error("O método '_makeWindowInteractive' deve ser implementado pela classe filha.");
    }

    /**
     * MUDANÇA: Novo método compartilhado para garantir que a janela não saia dos limites da área de trabalho.
     * @param {HTMLElement} targetEl - O elemento da janela que está sendo arrastado.
     * @param {number} x - A coordenada X proposta.
     * @param {number} y - A coordenada Y proposta.
     * @returns {{x: number, y: number}} As coordenadas corrigidas.
     */
    _getConstrainedCoordinates(targetEl, x, y) {
        const taskbarHeight = this.so.state.grid.taskbarHeight;
        const maxX = window.innerWidth - targetEl.offsetWidth;
        const maxY = window.innerHeight - taskbarHeight - targetEl.offsetHeight;

        const constrainedX = Math.max(0, Math.min(x, maxX));
        const constrainedY = Math.max(0, Math.min(y, maxY));
        
        return { x: constrainedX, y: constrainedY };
    }

    // --- Métodos de Interação de Ícones (Comuns) ---

    _selectIcon(icon) {
        this._clearIconSelection();
        icon.classList.add('selected');
    }

    _clearIconSelection() {
        document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
    }

    // --- Métodos do Menu de Contexto (Comuns) ---

    /**
     * Configura a lógica de clique/toque DENTRO do menu de contexto, que é idêntica.
     * O evento que ABRE o menu é tratado pelas classes filhas.
     */
    _setupSharedContextMenuLogic() {
        if (!this.contextMenu) return;

        // A ação de clicar em um item do menu é a mesma
        this.contextMenu.addEventListener('click', e => {
            e.stopPropagation();
            const actionItem = e.target.closest('.context-menu-item[data-action]');
            if (!actionItem) return;

            const action = actionItem.dataset.action;
            this.contextMenu.classList.add('hidden'); // Esconde o menu imediatamente

            this._handleContextMenuAction(action);
        });
    }

    /**
     * Centraliza a lógica do switch para as ações do menu de contexto.
     * @param {string} action - A ação a ser executada.
     */
    _handleContextMenuAction(action) {
        switch (action) {
            case 'refresh':
                window.location.reload();
                break;
            case 'reset-layout':
                this.so.persistenceManager.clear();
                window.location.reload();
                break;
            case 'open-cmd':
                this.so.windowManager.open('cmd');
                break;
            case 'inspect':
                console.log('Elemento Inspecionado:', this.contextMenu.targetElement);
                break;
        }
    }
}