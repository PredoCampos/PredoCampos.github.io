/**
 * @file index.js
 * @description Ponto de entrada principal do Sistema Operacional.
 * Carrega e inicializa a aplicação usando módulos ES.
 */
import { SistemaOperacional } from './SistemaOperacional.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Inicializando Sistema Operacional...');
        window.SO = new SistemaOperacional();
        console.log('🎯 Sistema Operacional pronto!');
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar o Sistema Operacional:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding-top: 50px; font-family: sans-serif;">
                <h1>Erro ao Carregar o Sistema</h1>
                <p>Não foi possível iniciar o sistema. Verifique o console para mais detalhes.</p>
            </div>
        `;
    }
});