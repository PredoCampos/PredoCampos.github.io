// assets/js/modules/utils.js
// Contém funções utilitárias genéricas que podem ser usadas em todo o sistema.

/**
 * Capitaliza a primeira letra de uma string.
 * @param {string} text - A string a ser capitalizada.
 * @returns {string} A string com a primeira letra em maiúscula.
 */
export function capitalizeText(text) {
    if (typeof text !== 'string' || text.length === 0) {
        return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Retorna uma nova função que atrasa sua execução até que um certo tempo
 * tenha passado sem que ela seja chamada novamente. Útil para eventos de redimensionamento,
 * digitação, etc.
 * @param {Function} func - A função a ser "debouced".
 * @param {number} wait - O tempo de espera em milissegundos.
 * @returns {Function} A função "debouced".
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        const later = function() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}