// assets/js/managers/windowManager.js
// Gerencia a criação, estado (aberta, minimizada, maximizada) e interações das janelas de aplicativo.

import { CONFIG } from '../modules/config.js';
import { capitalizeText } from '../modules/utils.js';
import { Draggable } from '../modules/draggable.js';

export class WindowManager {
    /**
     * @param {object} config - O objeto de configurações globais.
     * @param {Function} capitalizeTextFn - Função utilitária para capitalizar texto.
     */
    constructor(config, capitalizeTextFn) {
        this.config = config;
        this.capitalizeText = capitalizeTextFn; // Mantém a função utilitária
        this.aplicativosAbertos = new Map(); // Mapa para rastrear janelas abertas
        this.nextWindowId = 1; // Contador para IDs únicos de janelas
        this.currentZIndex = config.maxZIndex; // Z-index inicial para janelas
        this.openAppsCount = 0; // Contador de aplicativos abertos

        this.windowsContainer = document.querySelector(this.config.windowsContainerSelector);
        if (!this.windowsContainer) {
            console.error('WindowManager: Container de janelas não encontrado!');
        }
    }

    /**
     * Interage com um aplicativo: abre se não estiver aberto, foca se estiver minimizado,
     * ou minimiza se já estiver focado.
     * @param {string} appName - O nome do aplicativo.
     */
    interactWithApplication(appName) {
        if (this.aplicativosAbertos.has(appName)) {
            const app = this.aplicativosAbertos.get(appName);
            if (app.minimized) {
                console.log(`WindowManager: Desminimizando ${appName}`);
                this.restoreWindow(appName);
            } else {
                console.log(`WindowManager: Minimizando ${appName}`);
                this.minimizeWindow(appName);
            }
            this.focusWindow(appName); // Sempre foca na interação
        } else {
            console.log(`WindowManager: Abrindo ${appName}`);
            this.openApplication(appName);
        }
        // Dispara um evento customizado que a TaskbarManager poderá ouvir
        window.dispatchEvent(new CustomEvent('window-state-changed'));
    }

    /**
     * Abre um novo aplicativo criando uma janela.
     * @param {string} appName - O nome do aplicativo a ser aberto.
     */
    openApplication(appName) {
        if (this.aplicativosAbertos.has(appName)) {
            this.focusWindow(appName); // Já está aberto, apenas foca
            return;
        }

        const windowId = `window-${this.nextWindowId++}`;
        const windowElement = this.createWindowElement(windowId, appName);

        // Registra o aplicativo
        this.aplicativosAbertos.set(appName, {
            windowId: windowId,
            element: windowElement,
            minimized: false,
            maximized: false,
            originalPosition: null // Para restaurar após maximizar
        });

        this.openAppsCount++;

        // Carrega conteúdo do aplicativo (placeholder por enquanto)
        this.loadApplicationContent(appName, windowElement.querySelector('.window-content'));
        
        // Dispara evento para a TaskbarManager
        window.dispatchEvent(new CustomEvent('window-opened', { detail: { appName } }));

        console.log(`WindowManager: Aplicativo '${appName}' aberto.`);
    }

    /**
     * Cria e retorna o elemento DOM da janela.
     * @param {string} id - ID único da janela.
     * @param {string} title - Título da janela (nome do aplicativo).
     * @returns {HTMLElement} O elemento DOM da janela criada.
     */
    createWindowElement(id, title) {
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = id;
        windowElement.style.zIndex = ++this.currentZIndex;

        // Calcula tamanho e posição inicial
        let windowWidth = this.config.windowDefaultWidth;
        let windowHeight = this.config.windowDefaultHeight;

        if (this.config.isMobile) {
            windowWidth = Math.min(this.config.windowDefaultWidth, window.innerWidth - 40);
            windowHeight = Math.min(this.config.windowDefaultHeight, window.innerHeight - this.config.taskbarHeight - 60);
        }

        // Posicionamento inteligente (cascata para novas janelas)
        let x, y;
        const offset = this.openAppsCount * this.config.windowOffsetIncrement;
        x = ((window.innerWidth - windowWidth) / 2) + offset;
        y = ((window.innerHeight - this.config.taskbarHeight - windowHeight) / 2) + offset;
        
        // Garante que a janela não saia da tela
        const maxX = window.innerWidth - windowWidth - 10; // Margem de 10px
        const maxY = window.innerHeight - this.config.taskbarHeight - windowHeight - 10;
        x = Math.max(10, Math.min(x, maxX));
        y = Math.max(10, Math.min(y, maxY));
        
        windowElement.style.left = `${x}px`;
        windowElement.style.top = `${y}px`;
        windowElement.style.width = `${windowWidth}px`;
        windowElement.style.height = `${windowHeight}px`;

        windowElement.innerHTML = `
            <div class="window-header">
                <span class="window-title">${this.capitalizeText(title)}</span>
                <div class="window-controls">
                    <button class="window-control minimize-btn">_</button>
                    <button class="window-control maximize-btn">□</button>
                    <button class="window-control close-btn">×</button>
                </div>
            </div>
            <div class="window-content">
                <p>Carregando ${title}...</p>
            </div>
        `;

        this.windowsContainer.appendChild(windowElement);
        this.setupWindowEvents(windowElement, title);

        return windowElement;
    }

    /**
     * Configura os ouvintes de eventos para uma janela recém-criada.
     * @param {HTMLElement} windowElement - O elemento DOM da janela.
     * @param {string} appName - O nome do aplicativo associado.
     */
    setupWindowEvents(windowElement, appName) {
        const header = windowElement.querySelector('.window-header');
        const minimizeBtn = windowElement.querySelector('.minimize-btn');
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        const closeBtn = windowElement.querySelector('.close-btn');

        // Torna a janela arrastável pelo header
        Draggable.makeDraggable(windowElement, header, null, true); // isWindow = true

        // Focar janela ao clicar em qualquer parte dela
        windowElement.addEventListener(this.config.isMobile ? 'touchstart' : 'mousedown', (e) => {
            // Garante que não é um arraste sendo finalizado
            if (!e.target.closest('.window-control')) { // Não foca se clicar nos botões de controle
                this.focusWindow(appName);
            }
        });

        // Eventos dos botões de controle (usando `click` para ambos, pois `touchend` para botões é complexo)
        // O Draggable já está lidando com o preventDefault para arrastar.
        // Para os botões, um 'click' simples é geralmente suficiente e mais robusto.
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague para o header/janela e a foque novamente
            this.minimizeWindow(appName);
            this.focusWindow(appName); // Mantém o foco no botão da taskbar
        });
        
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximizeWindow(appName);
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeApplication(appName);
        });
        
        // Duplo clique no header para maximizar/restaurar (apenas desktop)
        if (!this.config.isMobile) {
            header.addEventListener('dblclick', () => {
                this.toggleMaximizeWindow(appName);
            });
        }
    }

    /**
     * Traz uma janela para o foco (topo da pilha de z-index) e a ativa na taskbar.
     * @param {string} appName - O nome do aplicativo.
     */
    focusWindow(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        app.element.style.zIndex = ++this.currentZIndex;
        // Se estiver minimizada, restaura
        if (app.minimized) {
            this.restoreWindow(appName);
        }
        window.dispatchEvent(new CustomEvent('window-state-changed'));
    }

    /**
     * Minimiza uma janela (esconde e marca como minimizada).
     * @param {string} appName - O nome do aplicativo.
     */
    minimizeWindow(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        app.element.classList.add('minimized');
        app.minimized = true;
        window.dispatchEvent(new CustomEvent('window-state-changed'));
        console.log(`WindowManager: Janela '${appName}' minimizada.`);
    }

    /**
     * Restaura uma janela minimizada (torna visível).
     * @param {string} appName - O nome do aplicativo.
     */
    restoreWindow(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        app.element.classList.remove('minimized');
        app.minimized = false;
        app.element.style.zIndex = ++this.currentZIndex; // Traz para o topo ao restaurar
        window.dispatchEvent(new CustomEvent('window-state-changed'));
        console.log(`WindowManager: Janela '${appName}' restaurada.`);
    }

    /**
     * Alterna o estado de maximização de uma janela.
     * @param {string} appName - O nome do aplicativo.
     */
    toggleMaximizeWindow(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        if (app.maximized) {
            this.restoreWindowSize(appName);
        } else {
            this.maximizeWindow(appName);
        }
        window.dispatchEvent(new CustomEvent('window-state-changed'));
    }

    /**
     * Maximiza uma janela, salvando sua posição e tamanho originais.
     * @param {string} appName - O nome do aplicativo.
     */
    maximizeWindow(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        const windowElement = app.element;
        
        // Salva posição e tamanho originais antes de maximizar
        app.originalPosition = {
            left: windowElement.style.left,
            top: windowElement.style.top,
            width: windowElement.style.width,
            height: windowElement.style.height
        };
        
        windowElement.classList.add('maximized');
        app.maximized = true;
        
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.textContent = '❐'; // Altera o ícone do botão
        }
        console.log(`WindowManager: Janela '${appName}' maximizada.`);
    }

    /**
     * Restaura uma janela para seu tamanho e posição originais após maximização.
     * @param {string} appName - O nome do aplicativo.
     */
    restoreWindowSize(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        const windowElement = app.element;
        windowElement.classList.remove('maximized');
        
        if (app.originalPosition) {
            windowElement.style.left = app.originalPosition.left;
            windowElement.style.top = app.originalPosition.top;
            windowElement.style.width = app.originalPosition.width;
            windowElement.style.height = app.originalPosition.height;
        }
        
        app.maximized = false;
        
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.textContent = '□'; // Restaura o ícone do botão
        }
        console.log(`WindowManager: Janela '${appName}' restaurada ao tamanho original.`);
    }

    /**
     * Fecha um aplicativo, removendo sua janela e atualizando o estado.
     * @param {string} appName - O nome do aplicativo a ser fechado.
     */
    closeApplication(appName) {
        const app = this.aplicativosAbertos.get(appName);
        if (!app) return;
        
        app.element.remove(); // Remove o elemento DOM
        this.aplicativosAbertos.delete(appName); // Remove do mapa
        this.openAppsCount = Math.max(0, this.openAppsCount - 1); // Decrementa contador
        
        // Dispara evento para a TaskbarManager
        window.dispatchEvent(new CustomEvent('window-closed', { detail: { appName } }));

        console.log(`WindowManager: Aplicativo '${appName}' fechado.`);
    }

    /**
     * Carrega o conteúdo real do aplicativo dentro da janela.
     * Por enquanto, usa um placeholder. Pode ser expandido para carregar IFrames, componentes, etc.
     * @param {string} appName - O nome do aplicativo.
     * @param {HTMLElement} contentContainer - O elemento DOM onde o conteúdo será carregado.
     */
    loadApplicationContent(appName, contentContainer) {
        const availableApps = {
            'notas': 'Editor de texto simples',
            'calculadora': 'Calculadora básica',
            'internet': 'Navegador web',
            'lixo': 'Lixeira do sistema',
            'arquivos': 'Explorador de arquivos',
            'cobra': 'Jogo da cobrinha'
        };
        
        const description = availableApps[appName] || 'Aplicativo desconhecido';
        
        contentContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3>${this.capitalizeText(appName)}</h3>
                <p>${description}</p>
                <br>
                <p><em>Aplicativo será implementado em breve...</em></p>
            </div>
        `;
        
        // Pode disparar um evento específico para cada aplicativo se for necessário,
        // mas a lógica de abertura já é genérica.
        // window.dispatchEvent(new CustomEvent('aplicativo-aberto', { detail: { appName, containerContent } }));
    }

    /**
     * Retorna o estado atual de um aplicativo.
     * Útil para a TaskbarManager, por exemplo, para saber se um app está minimizado.
     * @param {string} appName - O nome do aplicativo.
     * @returns {object | undefined} O objeto de estado do aplicativo ou undefined.
     */
    getAppState(appName) {
        return this.aplicativosAbertos.get(appName);
    }

    /**
     * Retorna um iterador para todos os aplicativos abertos.
     * @returns {IterableIterator<[string, object]>} Um iterador de [nomeApp, estadoApp].
     */
    getOpenApplications() {
        return this.aplicativosAbertos.entries();
    }
}