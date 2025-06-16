/**
 * @file AppRunner.js
 * @description Lida com o carregamento dinâmico e a execução de aplicativos
 * modulares sob demanda.
 */
import { capitalize } from '../utils.js';

export class AppRunner {
    constructor(soInstance) {
        this.so = soInstance;
    }

    /**
     * Carrega e executa um aplicativo dinamicamente a partir de seu arquivo de módulo.
     * @param {string} appName - O nome do aplicativo a ser executado.
     * @param {HTMLElement} contentContainer - O elemento onde o app será renderizado.
     */
    async run(appName, contentContainer) {
        // Limpa o conteúdo anterior e reseta estilos básicos
        contentContainer.innerHTML = '';
        contentContainer.style.backgroundColor = 'var(--color-win98-grey)';
        contentContainer.style.fontFamily = 'var(--font-primary)';
        contentContainer.style.color = 'var(--color-win98-text)';
        contentContainer.style.padding = '10px';

        try {
            // MUDANÇA: O caminho agora sobe um diretório ('../') para encontrar a pasta 'apps'.
            const appPath = `../apps/${appName}.app.js`;
            console.log(`Carregando módulo do aplicativo: ${appPath}`);

            const module = await import(appPath);

            const AppClass = module.default;
            if (!AppClass) {
                throw new Error(`O arquivo do aplicativo '${appName}' não tem uma exportação padrão (default export).`);
            }

            const appInstance = new AppClass(contentContainer, this.so);

            if (typeof appInstance.init === 'function') {
                appInstance.init();
            } else {
                throw new Error(`A classe do aplicativo '${appName}' não tem um método init().`);
            }

        } catch (error) {
            console.error(`Falha ao carregar ou executar o aplicativo '${appName}':`, error);
            contentContainer.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3>Erro ao abrir ${capitalize(appName)}</h3>
                    <p>Não foi possível carregar o aplicativo.</p>
                    <p style="font-size: 11px; color: #555; margin-top: 15px;">Verifique o console para detalhes técnicos.</p>
                </div>
            `;
        }
    }
}