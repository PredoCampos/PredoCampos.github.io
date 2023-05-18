// Scroll Reveal Section
window.sr = ScrollReveal({reset: true});

sr.reveal('.reveal', {
    duration: 1000,
    interval: 500,
    distance: '50px'
});

// Typed Function
document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed('#element', {
        strings: ['Developer', 'Pixel Artist', 'Ilustrator', 'GameDev', 'WebDev', 'unemployed'],
        backSpeed: 100,
        backDelay: 1750,
        typeSpeed: 125,
        loop: true,
        cursorChar: '▌',
        autoInsertCss: true,
    });
});
