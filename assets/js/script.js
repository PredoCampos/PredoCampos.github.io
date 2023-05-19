// Scroll Reveal Section
window.sr = ScrollReveal({reset: true});

sr.reveal('.reveal', {
    duration: 1000,
    interval: 350,
    distance: '50px'
});

sr.reveal('.reveal-menu', {
    duration: 1000,
    interval: 350,
    origin: 'top',
    distance: '50px'
});

// Typed Function
const typed = new Typed('#Typed', {
    strings: ['Developer', 'Pixel Artist', 'Ilustrator', 'GameDev', 'WebDev', 'unemployed'],
    backSpeed: 100,
    backDelay: 1750,
    typeSpeed: 125,
    loop: true,
    cursorChar: '▌',
    autoInsertCss: true,
});