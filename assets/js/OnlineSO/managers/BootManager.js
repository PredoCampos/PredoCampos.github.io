/**
 * @file BootManager.js
 * @description Classe especialista em gerenciar os aspectos visuais
 * e a animação em estágios da tela de boot, agora com estágios aleatórios.
 */

import { SistemaOperacional } from '../SistemaOperacional.js';

const FADE_OUT_DURATION_MS = 200;
const ANIMATION_TICK_MS = 50;

export class BootManager {
    constructor() {
        this.bootScreen = document.getElementById('boot-screen');
        this.bootProgressEl = this.bootScreen?.querySelector('.boot-loader-progress');
        this.percentageEl = this.bootScreen?.querySelector('.boot-percentage');
        this.animationInterval = null;
    }

    start(totalDuration) {
        if (!this.bootScreen || !this.bootProgressEl || !this.percentageEl) {
            console.warn('Tela de boot não encontrada. Inicializando sistema diretamente.');
            this._initializeMainApp();
            return;
        }

        this._runStagedAnimation(totalDuration);
        this._initializeMainApp();

        setTimeout(() => {
            this.endSequence();
            if (window.SO && window.SO.gridManager) {
                window.SO.gridManager.startIconAnimation();
            }
        }, totalDuration);
    }

    /**
     * MUDANÇA: Gera uma sequência de estágios aleatórios para a animação.
     * @returns {Array<object>} Uma lista de estágios para a animação.
     */
    _generateRandomStages() {
        const stages = [];
        let lastPercent = 0;

        const numStalls = Math.floor(Math.random() * 3) + 2; // Sorteia entre 2 e 4 travamentos
        const stallPercentages = new Set();

        // Garante uma distância mínima entre os pontos de travamento
        while (stallPercentages.size < numStalls) {
            const randomStall = Math.floor(Math.random() * 80) + 15; // Travamentos entre 15% e 95%
            
            // Verifica se o novo ponto não está muito perto de um já existente
            let tooClose = false;
            for (const existingStall of stallPercentages) {
                if (Math.abs(existingStall - randomStall) < 15) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                stallPercentages.add(randomStall);
            }
        }

        const sortedStalls = Array.from(stallPercentages).sort((a, b) => a - b);
        
        // Constrói os estágios de "carregamento" e "travamento"
        sortedStalls.forEach(stallPoint => {
            // Estágio de carregamento até o ponto de trava
            stages.push({ targetPercent: stallPoint, duration: Math.random() * 1000 + 500 });
            // Estágio de travamento
            stages.push({ targetPercent: stallPoint, duration: Math.random() * 500 + 300 });
            lastPercent = stallPoint;
        });

        // Adiciona o estágio final para chegar a 100%
        stages.push({ targetPercent: 100, duration: Math.random() * 300 + 200 });

        return stages;
    }

    _runStagedAnimation(totalDuration) {
        // MUDANÇA: Chama a função para gerar estágios aleatórios
        const stages = this._generateRandomStages();

        const totalStageDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
        const ratio = totalDuration / totalStageDuration;
        stages.forEach(stage => { stage.duration *= ratio; });

        let currentStageIndex = 0;
        let stageStartTime = Date.now();
        let startPercent = 0;

        this.animationInterval = setInterval(() => {
            const now = Date.now();
            const currentStage = stages[currentStageIndex];
            const elapsedTimeInStage = now - stageStartTime;
            const progressInStage = Math.min(elapsedTimeInStage / currentStage.duration, 1.0);
            const currentPercent = Math.floor(startPercent + (currentStage.targetPercent - startPercent) * progressInStage);

            this.bootProgressEl.style.width = `${currentPercent}%`;
            this.percentageEl.textContent = `${currentPercent}%`;

            if (progressInStage >= 1.0) {
                startPercent = currentStage.targetPercent;
                currentStageIndex++;
                stageStartTime = now;

                if (currentStageIndex >= stages.length) {
                    clearInterval(this.animationInterval);
                    this.bootProgressEl.style.width = '100%';
                    this.percentageEl.textContent = '100%';
                }
            }
        }, ANIMATION_TICK_MS);
    }

    endSequence() {
        if (!this.bootScreen) return;
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        this.bootScreen.classList.add('hidden');
        setTimeout(() => {
            this.bootScreen.remove();
        }, FADE_OUT_DURATION_MS);
    }

    _initializeMainApp() {
        try {
            console.log('🚀 Inicializando Sistema Operacional em segundo plano...');
            window.SO = new SistemaOperacional();
            console.log('🎯 Sistema Operacional pronto!');
        } catch (error) {
            console.error('❌ Erro crítico ao inicializar o Sistema Operacional:', error);
            if (this.bootScreen) {
                this.bootScreen.style.display = 'none';
            }
            document.body.innerHTML = `
                <div style="text-align: center; padding-top: 50px; font-family: sans-serif; color: #333;">
                    <h1>Erro ao Carregar o Sistema</h1>
                    <p>Não foi possível iniciar o sistema. Por favor, verifique o console para mais detalhes.</p>
                </div>
            `;
        }
    }
}