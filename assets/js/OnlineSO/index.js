/**
 * @file index.js
 * @description Ponto de entrada e orquestrador principal do Sistema Operacional.
 */

import { SistemaOperacional } from './SistemaOperacional.js';
import { BootManager } from './managers/BootManager.js';

// --- Constantes de Configuração ---
const MIN_BOOT_TIME_MS = 3000;
const MAX_BOOT_TIME_MS = 5000;

/**
 * Tenta inicializar a classe principal do SO e trata erros críticos.
 */
function initializeMainApp() {
    try {
        console.log('🚀 Inicializando Sistema Operacional...');
        window.SO = new SistemaOperacional();
        console.log('🎯 Sistema Operacional pronto!');
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar o Sistema Operacional:', error);
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) bootScreen.style.display = 'none';

        document.body.innerHTML = `
            <div style="text-align: center; padding-top: 50px; font-family: sans-serif; color: #333;">
                <h1>Erro ao Carregar o Sistema</h1>
                <p>Não foi possível iniciar o sistema. Por favor, verifique o console para mais detalhes.</p>
            </div>
        `;
    }
}

// --- Ponto de Entrada Principal ---
document.addEventListener('DOMContentLoaded', () => {
    const bootManager = new BootManager();

    if (!bootManager.bootScreen) {
        console.warn('Tela de boot não encontrada. Inicializando sistema diretamente.');
        initializeMainApp();
        return;
    }

    const randomBootDuration = Math.random() * (MAX_BOOT_TIME_MS - MIN_BOOT_TIME_MS) + MIN_BOOT_TIME_MS;

    // MUDANÇA: Corrigido o nome do método para bootManager.start()
    bootManager.start(randomBootDuration);
});