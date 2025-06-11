// assets/js/managers/taskbarManager.js
// Gerencia a barra de tarefas, incluindo relógio, data e botões de aplicativos.

import { CONFIG } from '../modules/config.js';
import { capitalizeText } from '../modules/utils.js';

export class TaskbarManager {
    /**
     * @param {object} config - O objeto de configurações globais.
     * @param {Function} capitalizeTextFn - Função utilitária para capitalizar texto.
     * @param {object} windowManager - Instância do WindowManager para interagir com janelas.
     */
    constructor(config, capitalizeTextFn, windowManager) {
        this.config = config;
        this.capitalizeText = capitalizeTextFn;
        this.windowManager = windowManager; // Para interagir com as janelas abertas

        this.taskbarAppsContainer = document.querySelector(this.config.taskbarAppsSelector);
        this.taskbarClockElement = document.querySelector(this.config.taskbarClockSelector);
        this.taskbarDateElement = document.querySelector(this.config.taskbarDataSelector);
        this.menuButton = document.querySelector(this.config.menuButtonSelector);

        if (!this.taskbarAppsContainer || !this.taskbarClockElement || !this.menuButton) {
            console.error('TaskbarManager: Um ou mais elementos da barra de tarefas não encontrados!');
        }

        this.setupTaskbarEvents();
        this.startClock(); // Inicia o relógio assim que o manager é instanciado
        
        // Adiciona ouvintes para eventos de janela para atualizar a taskbar
        window.addEventListener('window-opened', this.onWindowOpened.bind(this));
        window.addEventListener('window-closed', this.onWindowClosed.bind(this));
        window.addEventListener('window-state-changed', this.updateTaskbarState.bind(this));
    }

    /**
     * Configura os ouvintes de eventos para os elementos da barra de tarefas.
     */
    setupTaskbarEvents() {
        this.menuButton.addEventListener('click', () => {
            console.log('TaskbarManager: Menu clicado - funcionalidade futura.');
            // Implementação futura: abrir menu iniciar
        });
    }

    /**
     * Inicia o relógio e a data na barra de tarefas.
     */
    startClock() {
        const updateClockAndDate = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            
            this.taskbarClockElement.textContent = `${hours}:${minutes}`;

            // Exibir data (formato dd/mm/aaaa ou dd/mm/aa)
            const day = now.getDate().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Mês é 0-indexed
            const year = now.getFullYear().toString().slice(-2); // Últimos 2 dígitos do ano
            
            // Verifica se o elemento da data existe antes de tentar atualizá-lo
            if (this.taskbarDateElement) {
                this.taskbarDateElement.textContent = `${day}/${month}/${year}`;
            }
        };
        
        updateClockAndDate(); // Atualiza imediatamente ao iniciar
        setInterval(updateClockAndDate, 1000); // Atualiza a cada segundo
    }

    /**
     * Adiciona um botão de aplicativo à barra de tarefas quando uma janela é aberta.
     * @param {CustomEvent} event - O evento 'window-opened'.
     */
    onWindowOpened(event) {
        const appName = event.detail.appName;
        this.addAppButtonToTaskbar(appName);
    }

    /**
     * Remove um botão de aplicativo da barra de tarefas quando uma janela é fechada.
     * @param {CustomEvent} event - O evento 'window-closed'.
     */
    onWindowClosed(event) {
        const appName = event.detail.appName;
        this.removeAppButtonFromTaskbar(appName);
    }

    /**
     * Adiciona um botão para o aplicativo na barra de tarefas.
     * @param {string} appName - O nome do aplicativo.
     */
    addAppButtonToTaskbar(appName) {
        if (!this.taskbarAppsContainer) return;

        const existingButton = this.taskbarAppsContainer.querySelector(`[data-app="${appName}"]`);
        if (existingButton) return; // Evita duplicatas

        const button = document.createElement('button');
        button.className = 'taskbar-app';
        button.dataset.app = appName;
        button.textContent = this.capitalizeText(appName);
        
        // Ao clicar no botão da taskbar, interage com o aplicativo
        button.addEventListener('click', () => {
            this.windowManager.interactWithApplication(appName);
        });
        
        this.taskbarAppsContainer.appendChild(button);
        this.updateTaskbarState(); // Atualiza o estado visual
    }

    /**
     * Remove um botão de aplicativo da barra de tarefas.
     * @param {string} appName - O nome do aplicativo.
     */
    removeAppButtonFromTaskbar(appName) {
        const button = this.taskbarAppsContainer.querySelector(`[data-app="${appName}"]`);
        if (button) {
            button.remove();
            this.updateTaskbarState(); // Atualiza o estado visual
        }
    }

    /**
     * Atualiza o estado visual dos botões da barra de tarefas
     * (e.g., adiciona classe 'active' para janelas focadas/não minimizadas).
     */
    updateTaskbarState() {
        if (!this.taskbarAppsContainer) return;

        const appButtons = this.taskbarAppsContainer.querySelectorAll('.taskbar-app');
        appButtons.forEach(button => {
            const appName = button.dataset.app;
            const appState = this.windowManager.getAppState(appName); // Pega o estado do app do WindowManager

            if (appState && !appState.minimized && !appState.maximized) { // Supondo que focado ou não minimizado é 'active'
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
}