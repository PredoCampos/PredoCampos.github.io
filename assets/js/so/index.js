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
        console.log('🚀 Carregando Sistema Operacional...');
        
        // Carrega módulos em sequência
        await loadScript('assets/js/so/core.js');
        await loadScript('assets/js/so/desktop.js');
        await loadScript('assets/js/so/mobile.js');
        
        console.log('✅ Módulos carregados com sucesso');
        
        // Aguarda um pouco mais para garantir que tudo está pronto
        setTimeout(() => {
            // Inicializa o sistema operacional
            window.SO = new SistemaOperacional();
            
            console.log('🎯 Sistema Operacional inicializado!');
            
            // Debug adicional - verificar se elementos existem
            setTimeout(() => {
                const relogio = document.getElementById('taskbar-clock');
                const data = document.getElementById('taskbar-data');
                console.log('Elementos encontrados:', {
                    relogio: !!relogio,
                    data: !!data,
                    relogioTexto: relogio?.textContent,
                    dataTexto: data?.textContent
                });
            }, 1000);
            
        }, 200);
        
    } catch (error) {
        console.error('❌ Erro ao carregar o Sistema Operacional:', error);
    }
});