/**
 * @file AppRunner.js
 * @description Lida com o carregamento dinâmico e a execução de aplicativos
 * modulares sob demanda, agora com carga e execução separadas.
 */
import { capitalize } from '../utils.js';

export class AppRunner {
    constructor(soInstance) {
        this.so = soInstance;
    }

    /**
     * MUDANÇA: Novo método que apenas carrega o módulo do aplicativo dinamicamente.
     * Isso permite que o carregamento aconteça em paralelo com outras operações.
     * @param {string} appName - O nome do aplicativo a ser carregado.
     * @returns {Promise<object>} Uma promessa que resolve com o módulo do aplicativo.
     */
    async load(appName) {
        try {
            const appPath = `../apps/${appName}.app.js`;
            console.log(`Carregando módulo do aplicativo: ${appPath}`);
            const module = await import(appPath);
            return module;
        } catch (error) {
            console.error(`Falha ao carregar o módulo do aplicativo '${appName}':`, error);
            // Re-lança o erro para que a promessa seja rejeitada e possa ser tratada pelo chamador.
            throw error;
        }
    }

    /**
     * MUDANÇA: O método agora recebe um módulo já carregado e o executa.
     * @param {object} appModule - O módulo do aplicativo já carregado.
     * @param {HTMLElement} contentContainer - O elemento onde o app será renderizado.
     */
    run(appModule, contentContainer) {
        const appName = contentContainer.closest('.window')?.dataset.app || 'desconhecido';
        
        // Limpa o conteúdo anterior e reseta estilos básicos
        contentContainer.innerHTML = '';
        contentContainer.style.backgroundColor = 'var(--color-win98-grey)';
        contentContainer.style.fontFamily = 'var(--font-primary)';
        contentContainer.style.color = 'var(--color-win98-text)';
        contentContainer.style.padding = '10px';

        try {
            const AppClass = appModule.default;
            if (!AppClass) {
                throw new Error(`O arquivo do aplicativo '${appName}' não tem uma exportação padrão (default export).`);
            }

            // Passa a instância do SO para o construtor do app, se necessário
            const appInstance = new AppClass(contentContainer, this.so); 

            if (typeof appInstance.init === 'function') {
                appInstance.init();
            } else {
                throw new Error(`A classe do aplicativo '${appName}' não tem um método init().`);
            }

        } catch (error) {
            console.error(`Falha ao instanciar ou executar o aplicativo '${appName}':`, error);
            contentContainer.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3>Erro ao abrir ${capitalize(appName)}</h3>
                    <p>Não foi possível iniciar o aplicativo.</p>
                    <p style="font-size: 11px; color: #555; margin-top: 15px;">Verifique o console para detalhes técnicos.</p>
                </div>
            `;
        }
    }
}