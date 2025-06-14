/**
 * @file MenuManager.js
 * @description Gerencia o comportamento do Menu Iniciar, incluindo abrir, fechar
 * e lidar com os cliques nos itens.
 */
export class MenuManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.menuElement = document.getElementById('start-menu');
        this.startButton = document.getElementById('menu-button');
        this.isOpen = false;

        if (!this.menuElement || !this.startButton) {
            console.error("Elementos do Menu Iniciar não foram encontrados no DOM.");
            return;
        }

        this.initialize();
    }

    /**
     * Adiciona todos os listeners de eventos necessários para o menu.
     */
    initialize() {
        // Listener para fechar o menu ao clicar fora
        document.addEventListener('click', (e) => {
            // Se o menu estiver aberto e o clique não for no menu nem no botão start...
            if (this.isOpen && !this.menuElement.contains(e.target) && !this.startButton.contains(e.target)) {
                this.close();
            }
        });

        // Listeners para os itens clicáveis do menu
        const menuItems = this.menuElement.querySelectorAll('.start-menu-item[data-app]');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique feche o menu imediatamente
                
                const appName = item.dataset.app;

                // O item "Programas" não abre um app, apenas mostra o submenu (via CSS)
                if (appName === 'programs') {
                    return; 
                }

                // Para todos os outros itens, abre o aplicativo correspondente
                this.so.windowManager.open(appName);
                this.close(); // Fecha o menu após abrir um app
            });
        });
    }

    /**
     * Alterna a visibilidade do menu.
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Abre o Menu Iniciar.
     */
    open() {
        this.menuElement.classList.remove('hidden');
        this.isOpen = true;
    }

    /**
     * Fecha o Menu Iniciar.
     */
    close() {
        this.menuElement.classList.add('hidden');
        this.isOpen = false;
    }
}