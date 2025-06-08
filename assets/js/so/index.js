// ===== SISTEMA OPERACIONAL - JAVASCRIPT PRINCIPAL =====
// Carrega e inicializa todos os módulos do SO

// Função para carregar scripts dinamicamente
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Carregando Sistema Operacional...');
        
        // Carrega módulos em sequência
        await loadScript('assets/js/so/core.js');
        await loadScript('assets/js/so/desktop.js');
        await loadScript('assets/js/so/mobile.js');
        
        console.log('✅ Módulos carregados com sucesso');
        
        // Inicializa o sistema operacional
        window.SO = new SistemaOperacional();
        
        console.log('Sistema Operacional inicializado!');
        
    } catch (error) {
        console.error('Erro ao carregar o Sistema Operacional:', error);
    }
});