/**
 * @file AppRunner.js
 * @description Lida com a execução do conteúdo de um aplicativo dentro de sua janela.
 */
import { capitalize } from '../utils.js';

export class AppRunner {
    constructor(soInstance) {
        this.so = soInstance;
    }

    /**
     * "Executa" um aplicativo, injetando seu conteúdo e disparando um evento.
     * @param {string} appName
     * @param {HTMLElement} contentContainer
     */
    run(appName, contentContainer) {
        const appList = {
            'notas': 'Editor de texto simples',
            'calculadora': 'Calculadora básica',
            'internet': 'Navegador web',
            'lixo': 'Lixeira do sistema',
            'arquivos': 'Explorador de arquivos'
        };

        const description = appList[appName] || 'Aplicativo desconhecido';

        contentContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3>${capitalize(appName)}</h3>
                <p>${description}</p>
                <br>
                <p><em>Funcionalidade a ser implementada...</em></p>
            </div>
        `;

        // Dispara um evento para que módulos externos possam injetar lógica real
        window.dispatchEvent(new CustomEvent('app-opened', {
            detail: { appName, container: contentContainer }
        }));
    }
}