/**
 * @file menu.js
 * @description Controla a lógica de seleção e o layout aleatório para o menu.
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.main-nav li');

    /**
     * Aplica uma rotação e um desvio horizontal aleatórios a cada item do menu.
     * Esta função é executada apenas uma vez, ao carregar a página.
     */
    function randomizeMenuLayout() {
        menuItems.forEach(item => {
            const link = item.querySelector('a');

            // Gera valores aleatórios
            // Rotação entre -10 e +10 graus
            const randomRotation = Math.random() * 20 - 10; 
            // Desvio horizontal entre 0 e 100 pixels
            const randomIndent = Math.random() * 100;

            // Aplica os estilos diretamente ao elemento <a>
            link.style.transform = `translateX(${randomIndent}px) rotate(${randomRotation}deg)`;
        });
    }

    /**
     * Controla qual item está com a classe 'selected'.
     */
    function handleMenuClick(clickedItem) {
        menuItems.forEach(item => {
            item.classList.remove('selected');
        });
        clickedItem.classList.add('selected');
    }

    // Adiciona o "ouvinte" de clique a cada item
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); 
            handleMenuClick(item);
        });
    });

    // --- EXECUÇÃO ---

    // 1. Gera o layout aleatório assim que a página carrega
    randomizeMenuLayout();

    // 2. Deixa o primeiro item selecionado por padrão
    if (menuItems.length > 0) {
        menuItems[0].classList.add('selected');
    }
});