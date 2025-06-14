/**
 * @file TaskManager.js
 * @description Gerencia a barra de tarefas, agora usando os ícones pequenos
 * dos aplicativos.
 */
import { capitalize } from '../utils.js';
import { APP_ICONS } from '../config.js';

export class TaskManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.container = document.querySelector(this.config.selectors.taskbarApps);
    }

    /**
     * Adiciona o botão de um aplicativo (com ícone) à barra de tarefas.
     * @param {string} appName
     */
    add(appName) {
        const button = document.createElement('button');
        button.className = 'taskbar-app';
        button.dataset.app = appName;
        button.title = capitalize(appName);

        // Pega o caminho do ícone PEQUENO e o insere no botão como uma imagem
        const iconPath = (APP_ICONS[appName] || APP_ICONS.default).small;
        button.innerHTML = `<img src="${iconPath}" alt="${capitalize(appName)}" class="taskbar-app-icon">`;
        
        button.addEventListener('click', () => {
            this.so.windowManager.interact(appName);
        });

        this.container.appendChild(button);
        this.updateState();
    }

    /**
     * Remove o botão de um aplicativo da barra de tarefas.
     * @param {string} appName
     */
    remove(appName) {
        const button = this.container.querySelector(`[data-app="${appName}"]`);
        if (button) {
            button.remove();
        }
    }

    /**
     * Atualiza o estado visual (ativo/inativo) de todos os botões na barra de tarefas.
     */
    updateState() {
        const buttons = this.container.querySelectorAll('.taskbar-app');
        buttons.forEach(button => {
            const appName = button.dataset.app;
            const app = this.so.state.windows.abertas.get(appName);

            if (app && !app.minimized && app.element.classList.contains('focused')) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
}