/**
 * @file index.js
 * @description Ponto de entrada principal do Sistema Operacional.
 * Controla a exibição da tela de boot e sincroniza a animação dos ícones.
 */

import { SistemaOperacional } from './SistemaOperacional.js';

document.addEventListener('DOMContentLoaded', () => {
    const bootScreen = document.getElementById('boot-screen');

    if (!bootScreen) {
        try {
            console.log('🚀 Inicializando Sistema Operacional...');
            window.SO = new SistemaOperacional();
            console.log('🎯 Sistema Operacional pronto!');
        } catch (error) {
            console.error('❌ Erro crítico ao inicializar o Sistema Operacional:', error);
        }
        return;
    }

    // --- LÓGICA DA TELA DE BOOT COM TEMPO ALEATÓRIO ---

    const minDuration = 3000;
    const maxDuration = 5000;
    const randomBootDuration = Math.random() * (maxDuration - minDuration) + minDuration;

    console.log(`Tempo de boot definido para: ${Math.round(randomBootDuration / 1000)} segundos.`);

    setTimeout(() => {
        // Inicia o desaparecimento da tela de boot
        bootScreen.classList.add('hidden');
        
        // MUDANÇA: Inicia a animação dos ícones no momento em que a tela de boot some
        if (window.SO && window.SO.gridManager) {
            window.SO.gridManager.startIconAnimation();
        }

        // Após a animação de fade-out (0.2s), remove a tela do DOM
        setTimeout(() => {
            bootScreen.style.display = 'none';
        }, 200);

    }, randomBootDuration);

    try {
        console.log('🚀 Inicializando Sistema Operacional em segundo plano...');
        window.SO = new SistemaOperacional();
        console.log('🎯 Sistema Operacional pronto!');
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar o Sistema Operacional:', error);
        bootScreen.style.display = 'none';
        document.body.innerHTML = `
            <div style="text-align: center; padding-top: 50px; font-family: sans-serif;">
                <h1>Erro ao Carregar o Sistema</h1>
                <p>Não foi possível iniciar o sistema. Por favor, verifique o console para mais detalhes.</p>
            </div>
        `;
    }
});