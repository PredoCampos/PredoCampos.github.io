window.addEventListener('load', function() {
    const loader = document.querySelector('.loader');
    document.body.classList.remove('loading');
    loader.style.display = 'none';
});

// Seu código JavaScript existente...

// Após o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", function() {
    // Seleciona o elemento do loader
    const loader = document.querySelector(".loader");

    // Função para remover a classe 'loading'
    function removeLoadingClass() {
        loader.classList.remove("loading");
    }

    // Simula um tempo de carregamento de 3 segundos
    setTimeout(removeLoadingClass, 3000);
});