// ===== CORE - SISTEMA PRINCIPAL DO SO =====

    // === CONFIGURAÇÃO GLOBAL ===
    const CONFIG = {
        // Configurações de janela
        windowDefaultWidth: 400,
        windowDefaultHeight: 300,
        windowOffsetIncrement: 30,
        maxZIndex: 1000,
        
        // Configurações do grid responsivo
        taskbarPercentage: 0.10, // 10% do menor lado da tela
        gridMarginPercentage: 0.05, // 5% de margem em cada direção
        iconSize: 80, // Tamanho base do ícone
        
        // Detecção de dispositivo
        isMobile: false,
        isTouch: false,
        
        // Configurações calculadas dinamicamente
        taskbarHeight: 0,
        gridMargin: 0,
        gridSize: 0,
        gridStartX: 0,
        gridStartY: 0,
        maxColunas: 0,
        maxLinhas: 0,
        gridWidth: 0,
        gridHeight: 0,
        
        // Seletores
        desktopSelector: '#desktop',
        windowsContainerSelector: '#windows-container',
        taskbarAppsSelector: '#taskbar-apps',
        taskbarClockSelector: '#taskbar-clock',
        taskbarDataSelector: '#taskbar-data',
        menuButtonSelector: '#menu-button'
    };
    
    // === SISTEMA OPERACIONAL PRINCIPAL ===
    class SistemaOperacional {
        constructor() {
            this.aplicativosAbertos = new Map();
            this.proximoWindowId = 1;
            this.zIndexAtual = CONFIG.maxZIndex;
            this.contadorAppsAbertos = 0;
            this.isDraggingIcon = false;
            this.gridOcupado = new Map();
            this.gridVisualizacao = null;
            
            // Detecta dispositivo antes de inicializar
            this.detectarDispositivo();
            this.inicializar();
        }
        
        // === DETECÇÃO DE DISPOSITIVO ===
        detectarDispositivo() {
            // Detecta se tem suporte a touch
            CONFIG.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Detecta se é mobile baseado em tamanho de tela e user agent
            const isMobileSize = window.innerWidth <= 768 || window.innerHeight <= 768;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            CONFIG.isMobile = CONFIG.isTouch && (isMobileSize || isMobileUA);
            
            console.log('Dispositivo detectado:', {
                isMobile: CONFIG.isMobile,
                isTouch: CONFIG.isTouch,
                largura: window.innerWidth,
                altura: window.innerHeight
            });
            
            // Aplica configurações específicas para mobile
            if (CONFIG.isMobile) {
                this.configurarMobile();
            }
        }
        
        configurarMobile() {
            // Previne zoom no duplo toque
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
            
            // Remove scroll da página
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            
            // Ajusta configurações do grid para mobile
            CONFIG.gridMarginPercentage = 0.02; // Margem menor no mobile
            CONFIG.iconSize = 60; // Ícones menores
            
            console.log('Configurações mobile aplicadas');
        }
        
        inicializar() {
            this.calcularDimensoesGrid();
            this.configurarEventosDesktop();
            this.configurarEventosTaskbar();
            this.criarVisualizacaoGrid();
            this.inicializarPosicaoIcones();
            this.configurarRedimensionamento();
            
            // Aguarda um pouco para garantir que o DOM está completamente carregado
            setTimeout(() => {
                this.iniciarRelogio();
            }, 500);
            
            console.log('Sistema Operacional inicializado');
            console.log('Grid:', {
                colunas: CONFIG.maxColunas,
                linhas: CONFIG.maxLinhas,
                tamanhoGrid: CONFIG.gridSize,
                margemGrid: CONFIG.gridMargin
            });
        }
        
        // === CÁLCULO RESPONSIVO DO GRID ===
        calcularDimensoesGrid() {
            const larguraTela = window.innerWidth;
            const alturaTela = window.innerHeight;
            const menorLado = Math.min(larguraTela, alturaTela);
            
            // Calcula altura da barra de tarefas (10% do menor lado)
            CONFIG.taskbarHeight = Math.floor(menorLado * CONFIG.taskbarPercentage);
            
            // Calcula margem do grid (5% do menor lado)
            CONFIG.gridMargin = Math.floor(menorLado * CONFIG.gridMarginPercentage);
            
            // Área disponível para o grid
            const larguraDisponivel = larguraTela - (CONFIG.gridMargin * 2);
            const alturaDisponivel = alturaTela - CONFIG.taskbarHeight - (CONFIG.gridMargin * 2);
            
            // Calcula tamanho ideal da célula baseado no ícone
            const tamanhoIdealCelula = CONFIG.iconSize + 20; // ícone + padding
            
            // Calcula quantas colunas e linhas cabem
            CONFIG.maxColunas = Math.floor(larguraDisponivel / tamanhoIdealCelula);
            CONFIG.maxLinhas = Math.floor(alturaDisponivel / tamanhoIdealCelula);
            
            // Garante pelo menos 2 colunas (requisito mínimo)
            CONFIG.maxColunas = Math.max(2, CONFIG.maxColunas);
            CONFIG.maxLinhas = Math.max(2, CONFIG.maxLinhas);
            
            // Calcula tamanho real da célula para usar todo o espaço disponível
            CONFIG.gridSize = Math.min(
                Math.floor(larguraDisponivel / CONFIG.maxColunas),
                Math.floor(alturaDisponivel / CONFIG.maxLinhas)
            );
            
            // Calcula área real do grid
            CONFIG.gridWidth = CONFIG.maxColunas * CONFIG.gridSize;
            CONFIG.gridHeight = CONFIG.maxLinhas * CONFIG.gridSize;
            
            // Centraliza o grid na área disponível
            CONFIG.gridStartX = CONFIG.gridMargin + Math.floor((larguraDisponivel - CONFIG.gridWidth) / 2);
            CONFIG.gridStartY = CONFIG.gridMargin + Math.floor((alturaDisponivel - CONFIG.gridHeight) / 2);
            
            // Ajuste específico para mobile - garantir centralização
            if (CONFIG.isMobile) {
                // Recalcula para melhor centralização no mobile
                const espacoSobrandoX = larguraTela - CONFIG.gridWidth;
                const espacoSobrandoY = (alturaTela - CONFIG.taskbarHeight) - CONFIG.gridHeight;
                
                CONFIG.gridStartX = Math.floor(espacoSobrandoX / 2);
                CONFIG.gridStartY = Math.floor(espacoSobrandoY / 2);
            } else {
                // Desktop: ajuste fino para reduzir margem esquerda
                const espacoSobrandoX = larguraTela - CONFIG.gridWidth;
                CONFIG.gridStartX = Math.floor(espacoSobrandoX / 2) - 10; // Reduz 10px da margem esquerda
                CONFIG.gridStartX = Math.max(10, CONFIG.gridStartX); // Garante margem mínima
            }
            
            // Atualiza CSS da barra de tarefas
            this.atualizarBarraDeTaskas();
        }
        
        atualizarBarraDeTaskas() {
            const taskbar = document.querySelector('.taskbar');
            if (taskbar) {
                taskbar.style.height = `${CONFIG.taskbarHeight}px`;
            }
            
            // Atualiza altura do desktop
            const desktop = document.querySelector('.desktop');
            if (desktop) {
                desktop.style.height = `calc(100vh - ${CONFIG.taskbarHeight}px)`;
            }
            
            // Atualiza container de janelas
            const windowsContainer = document.querySelector('.windows-container');
            if (windowsContainer) {
                windowsContainer.style.height = `calc(100vh - ${CONFIG.taskbarHeight}px)`;
            }
        }
        
        // === REDIMENSIONAMENTO RESPONSIVO ===
        configurarRedimensionamento() {
            window.addEventListener('resize', () => {
                this.debounce(() => {
                    console.log('Redimensionando grid...');
                    this.recalcularGrid();
                }, 250);
            });
        }
        
        debounce(func, wait) {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(func, wait);
        }
        
        recalcularGrid() {
            // Salva posições atuais dos ícones
            const posicoesIcones = this.salvarPosicoesIcones();
            
            // Recalcula dimensões
            this.calcularDimensoesGrid();
            
            // Remove visualização antiga
            if (this.gridVisualizacao) {
                this.gridVisualizacao.remove();
            }
            
            // Recria visualização
            this.criarVisualizacaoGrid();
            
            // Reposiciona ícones
            this.reposicionarIcones(posicoesIcones);
            
            console.log('Grid redimensionado:', {
                colunas: CONFIG.maxColunas,
                linhas: CONFIG.maxLinhas,
                tamanhoGrid: CONFIG.gridSize
            });
        }
        
        salvarPosicoesIcones() {
            const posicoes = new Map();
            for (const [chave, nomeApp] of this.gridOcupado.entries()) {
                const [coluna, linha] = chave.split(',').map(Number);
                posicoes.set(nomeApp, { coluna, linha });
            }
            return posicoes;
        }
        
        reposicionarIcones(posicoesAnteriores) {
            // Limpa grid e reinicializa com posições padrão
            this.inicializarPosicaoIcones();
        }
        
        // === VISUALIZAÇÃO DO GRID ===
        criarVisualizacaoGrid() {
            const desktop = document.querySelector(CONFIG.desktopSelector);
            this.gridVisualizacao = document.createElement('div');
            this.gridVisualizacao.id = 'grid-visualization';
            this.gridVisualizacao.style.position = 'absolute';
            this.gridVisualizacao.style.top = '0';
            this.gridVisualizacao.style.left = '0';
            this.gridVisualizacao.style.width = '100%';
            this.gridVisualizacao.style.height = '100%';
            this.gridVisualizacao.style.pointerEvents = 'none';
            this.gridVisualizacao.style.zIndex = '1';
            
            // Cria células do grid para visualização
            for (let coluna = 0; coluna < CONFIG.maxColunas; coluna++) {
                for (let linha = 0; linha < CONFIG.maxLinhas; linha++) {
                    const celula = document.createElement('div');
                    celula.className = 'grid-cell';
                    celula.style.left = `${CONFIG.gridStartX + (coluna * CONFIG.gridSize)}px`;
                    celula.style.top = `${CONFIG.gridStartY + (linha * CONFIG.gridSize)}px`;
                    celula.style.width = `${CONFIG.gridSize}px`;
                    celula.style.height = `${CONFIG.gridSize}px`;
                    celula.dataset.posicao = `${coluna},${linha}`;
                    
                    this.gridVisualizacao.appendChild(celula);
                }
            }
            
            desktop.appendChild(this.gridVisualizacao);
            console.log(`Grid de visualização criado: ${CONFIG.maxColunas}x${CONFIG.maxLinhas}`);
        }
        
        // === RELÓGIO ===
        iniciarRelogio() {
            const atualizarRelogio = () => {
                const agora = new Date();
                const horas = agora.getHours().toString().padStart(2, '0');
                const minutos = agora.getMinutes().toString().padStart(2, '0');
                
                const elementoRelogio = document.querySelector(CONFIG.taskbarClockSelector);
                if (elementoRelogio) {
                    elementoRelogio.textContent = `${horas}:${minutos}`;
                }
            };
            
            atualizarRelogio();
            setInterval(atualizarRelogio, 1000);
        }
        
        // === BARRA DE TAREFAS ===
        configurarEventosTaskbar() {
            document.querySelector(CONFIG.menuButtonSelector).addEventListener('click', () => {
                console.log('Menu clicado - funcionalidade futura');
            });
        }
        
        // === UTILITÁRIOS ===
        capitalizarTexto(texto) {
            return texto.charAt(0).toUpperCase() + texto.slice(1);
        }
    }