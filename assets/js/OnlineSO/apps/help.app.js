/**
 * @file help.app.js
 * @description Aplicativo de Ajuda / Sobre. Exibe informações estáticas sobre o projeto.
 */

import { capitalize } from '../utils.js';

export default class HelpApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     */
    constructor(container) {
        this.container = container;
        this.appName = 'Ajuda'; // Nome padrão
        // Tenta obter o nome dinamicamente para consistência
        const appNameFromDOM = this.container.closest('.window')?.dataset.app;
        if (appNameFromDOM) {
            this.appName = capitalize(appNameFromDOM);
        }
    }

    /**
     * Inicializa o aplicativo, renderizando o conteúdo HTML.
     */
    init() {
        // Estilo para parecer mais com uma caixa de diálogo "Sobre".
        this.container.style.backgroundColor = '#F0F0F0';
        this.container.style.padding = '20px';
        this.container.style.fontSize = '14px';
        this.container.style.lineHeight = '1.6';

        this.container.innerHTML = `
            <div style="text-align: center;">
                <img src="assets/images/so/windows-icon.png" alt="Logo" style="width: 48px; height: 48px;">
                <h1 style="font-size: 24px; margin: 10px 0; color: #333;">Online SO</h1>
            </div>

            <hr style="margin: 20px 0;">

            <p>
                Este projeto é uma homenagem criativa aos sistemas operacionais clássicos, misturando a estética nostálgica do <strong>Windows 98</strong> e a funcionalidade aprimorada do <strong>Windows XP</strong>.
            </p>
            <p>
                O objetivo é criar uma experiência de desktop simulada diretamente no seu navegador, construída sobre uma arquitetura de software modular e limpa.
            </p>
            
            <br>
            
            <p>
                <strong>Criado por:</strong> Predo Campos
            </p>
        `;
    }
}