/**
 * @file MenuManager.js
 * @description Gerencia o estado do Menu Iniciar (aberto/fechado) e o comportamento
 * dos itens internos, seguindo uma arquitetura limpa.
 */
export class MenuManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.menuElement = document.getElementById('start-menu');
        this.startButton = document.getElementById('menu-button'); // Mantemos a referência
        this.isOpen = false;

        if (!this.menuElement || !this.startButton) {
            console.error("Elementos do Menu Iniciar não foram encontrados no DOM.");
            return;
        }

        this.initialize();
    }

    /**
     * Adiciona listeners para os itens DENTRO do menu e para fechar ao clicar fora.
     * A responsabilidade de ABRIR o menu (clique no botão) foi movida para as
     * classes de Interação para corrigir bugs.
     */
    initialize() {
        // Lógica para fechar o menu ao clicar fora (desktop)
        document.addEventListener('click', (e) => {
            if (!this.so.state.device.isMobile && this.isOpen && !this.menuElement.contains(e.target) && e.target !== this.startButton) {
                this.close();
            }
        });
        
        // Lógica para fechar o menu ao tocar fora (mobile)
         document.addEventListener('touchend', (e) => {
            if (this.so.state.device.isMobile && this.isOpen && !this.menuElement.contains(e.target) && e.target !== this.startButton) {
                this.close();
            }
        });


        // Listeners para os itens do menu
        const menuItems = this.menuElement.querySelectorAll('.start-menu-item[data-app]');
        const clickEvent = this.so.state.device.isMobile ? 'touchend' : 'click';

        menuItems.forEach(item => {
            item.addEventListener(clickEvent, (e) => {
                e.stopPropagation();
                if (this.so.state.device.isMobile) e.preventDefault();

                const hasSubmenu = item.querySelector('.start-menu-submenu');

                if (hasSubmenu) {
                    if (this.so.state.device.isMobile) {
                        item.classList.toggle('active');
                    }
                    return;
                }
                
                const appName = item.dataset.app;
                this.so.windowManager.open(appName);
                this.close();
            });
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.menuElement.classList.remove('hidden');
        this.isOpen = true;
    }

    close() {
        this.menuElement.classList.add('hidden');
        this.isOpen = false;

        const activeItem = this.menuElement.querySelector('.start-menu-item.active');
        if (activeItem) {
            activeItem.classList.remove('active');
        }
    }
}