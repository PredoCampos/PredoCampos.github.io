/**
 * home.js - Versão 3.0 (Final)
 * Animação de Parallax Suavizada baseada na proximidade do final da página.
 *
 * Esta versão implementa um efeito de "smoothing" (lerp) para criar um
 * movimento suave e com um leve atraso, como solicitado. A animação é
 * acionada conforme o usuário se aproxima do rodapé da página.
 */
document.addEventListener("DOMContentLoaded", function() {
    // 1. Seleciona o elemento alvo da animação
    const targetElement = document.querySelector('.absolute-service-list');

    if (!targetElement) {
        console.warn("Elemento para a animação de scroll não encontrado.");
        return;
    }

    // --- CONFIGURAÇÕES DA ANIMAÇÃO ---

    // 2. Define os valores da animação (como antes)
    const START_Y = 15;  // Posição inicial em %
    const END_Y = -45;   // Posição final em %
    const RANGE_Y = END_Y - START_Y;

    // 3. Define a "zona de ativação" em pixels, medindo a distância até o final da página.
    //    A animação começará quando faltarem 1000px para o fim e terminará quando faltarem 200px.
    const ANIMATION_START_DISTANCE_FROM_BOTTOM = 1000;
    const ANIMATION_END_DISTANCE_FROM_BOTTOM = 200;
    const ANIMATION_DISTANCE = ANIMATION_START_DISTANCE_FROM_BOTTOM - ANIMATION_END_DISTANCE_FROM_BOTTOM;

    // 4. Fator de suavização. Um valor menor torna o movimento mais suave e com mais "delay".
    //    Valores ideais geralmente ficam entre 0.05 e 0.1.
    const SMOOTHING_FACTOR = 0.08;

    // --- LÓGICA DA ANIMAÇÃO ---

    let currentY = START_Y; // A posição Y atual e renderizada do elemento
    let targetY = START_Y;  // A posição Y que o elemento deve alcançar com base no scroll
    let isAnimating = false; // Flag para controlar o loop de animação

    // Função que calcula o alvo com base no scroll
    function updateTargetPosition() {
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;

        // Calcula a distância atual até o final da página
        const distanceFromBottom = totalHeight - (scrollTop + viewportHeight);
        
        // Calcula o progresso dentro da nossa "zona de ativação"
        const progressInZone = ANIMATION_START_DISTANCE_FROM_BOTTOM - distanceFromBottom;
        const progress = progressInZone / ANIMATION_DISTANCE;
        
        // Garante que o progresso fique sempre entre 0 e 1
        const clampedProgress = Math.max(0, Math.min(1, progress));

        // Define o novo alvo para a posição Y
        targetY = START_Y + (clampedProgress * RANGE_Y);

        // Se o loop de animação não estiver rodando, inicia ele
        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animate);
        }
    }

    // Função que executa o loop de animação suave
    function animate() {
        // Calcula a diferença entre a posição atual e o alvo
        const delta = targetY - currentY;

        // Se a diferença for muito pequena, podemos parar o loop para economizar recursos
        if (Math.abs(delta) < 0.01) {
            currentY = targetY; // Crava na posição final
            isAnimating = false;
        } else {
            // Move a posição atual uma fração da distância em direção ao alvo (aqui acontece a mágica)
            currentY += delta * SMOOTHING_FACTOR;
            // Continua o loop na próxima frame
            requestAnimationFrame(animate);
        }

        // Aplica a transformação no elemento
        targetElement.style.transform = `translateY(${currentY}%)`;
    }

    // Adiciona o "ouvinte" de evento de scroll
    window.addEventListener('scroll', updateTargetPosition);
    
    // Executa uma vez no início para garantir a posição correta
    updateTargetPosition();
});