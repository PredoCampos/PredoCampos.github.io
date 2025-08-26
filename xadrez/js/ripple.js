/**
 * @file ripple.js
 * @description Controla a criação de um efeito de ondulação visual em cliques e toques.
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {

    function createRipple(event) {
        const ripple = document.createElement('div');
        
        ripple.classList.add('ripple');
        
        document.body.appendChild(ripple);

        const x = event.clientX;
        const y = event.clientY;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        setTimeout(() => {
            ripple.remove();
        }, 700); 
    }

    document.addEventListener('pointerdown', createRipple);
});