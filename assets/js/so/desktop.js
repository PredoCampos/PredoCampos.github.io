// ===== DESKTOP - FUNCIONALIDADES PARA COMPUTADOR =====

// Adiciona métodos desktop à classe SistemaOperacional
Object.assign(SistemaOperacional.prototype, {
    
    // === EVENTOS DESKTOP ===
    configurarEventosDesktop() {
        const icones = document.querySelectorAll('.desktop-icon');
        
        icones.forEach(icone => {
            if (CONFIG.isMobile) {
                // Eventos para mobile (definidos em mobile.js)
                this.configurarEventosMobile(icone);
            } else {
                // Eventos para desktop (mouse)
                this.configurarEventosDesktop_Mouse(icone);
            }
            
            // Sistema de arrastar (funciona para ambos)
            this.configurarArrastarIcone(icone);
        });
        
        // Clique no desktop limpa seleção
        document.querySelector(CONFIG.desktopSelector).addEventListener(
            CONFIG.isMobile ? 'touchstart' : 'click', 
            () => {
                this.limparSelecaoIcones();
            }
        );
    },
    
    configurarEventosDesktop_Mouse(icone) {
        // Duplo clique para desktop
        icone.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.isDraggingIcon) return;
            
            const nomeApp = icone.dataset.app;
            this.interagirComAplicativo(nomeApp);
        });
        
        // Clique simples apenas para seleção
        icone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!this.isDraggingIcon) {
                this.selecionarIcone(icone);
            }
        });
    },
    
    // === ARRASTAR ÍCONES DESKTOP ===
    configurarArrastarIcone(icone) {
        if (CONFIG.isMobile) {
            this.configurarArrastarMobile(icone);
        } else {
            this.configurarArrastarDesktop(icone);
        }
    },
    
    configurarArrastarDesktop(icone) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        
        icone.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            this.isDraggingIcon = true;
            isDragging = true;
            
            const rect = icone.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            icone.classList.add('dragging');
            icone.style.zIndex = 1000;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            const maxX = window.innerWidth - 80;
            const maxY = window.innerHeight - CONFIG.taskbarHeight - 80;
            
            icone.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            icone.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            setTimeout(() => { this.isDraggingIcon = false; }, 100);
            
            icone.classList.remove('dragging');
            icone.style.zIndex = 'auto';
            
            this.encaixarNaGrade(icone);
        });
    },
    
    // === SISTEMA DE ARRASTAR JANELAS DESKTOP ===
    tornarArrastavel(janela, header, nomeApp) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        
        header.addEventListener('mousedown', (e) => {
            // Não arrasta se estiver maximizada
            const app = this.aplicativosAbertos.get(nomeApp);
            if (app && app.maximizada) return;
            
            isDragging = true;
            offsetX = e.clientX - janela.offsetLeft;
            offsetY = e.clientY - janela.offsetTop;
            janela.style.zIndex = ++this.zIndexAtual;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // Limita dentro da área visível
            const maxX = window.innerWidth - janela.offsetWidth;
            const maxY = window.innerHeight - CONFIG.taskbarHeight - janela.offsetHeight;
            
            janela.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            janela.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    },
    
    // === SISTEMA DE APLICATIVOS ===
    abrirAplicativo(nomeApp) {
        // Se já está aberto, apenas foca
        if (this.aplicativosAbertos.has(nomeApp)) {
            this.focarJanela(nomeApp);
            return;
        }
        
        const windowId = `window-${this.proximoWindowId++}`;
        const janela = this.criarJanela(windowId, nomeApp);
        
        // Registra o aplicativo
        this.aplicativosAbertos.set(nomeApp, {
            windowId: windowId,
            elemento: janela,
            minimizada: false,
            maximizada: false,
            posicaoOriginal: null
        });
        
        // Adiciona na barra de tarefas
        this.adicionarNaTaskbar(nomeApp);
        
        // Carrega conteúdo do aplicativo
        this.executarAplicativo(nomeApp, janela.querySelector('.window-content'));
        
        console.log(`Aplicativo '${nomeApp}' aberto`);
    },
    
    criarJanela(windowId, titulo) {
        const container = document.querySelector(CONFIG.windowsContainerSelector);
        
        const janela = document.createElement('div');
        janela.className = 'window';
        janela.id = windowId;
        janela.style.zIndex = ++this.zIndexAtual;
        
        // Ajusta tamanho da janela para mobile
        let larguraJanela = CONFIG.windowDefaultWidth;
        let alturaJanela = CONFIG.windowDefaultHeight;
        
        if (CONFIG.isMobile) {
            // Mobile: janela ocupa quase toda a tela
            larguraJanela = Math.min(CONFIG.windowDefaultWidth, window.innerWidth - 40);
            alturaJanela = Math.min(CONFIG.windowDefaultHeight, window.innerHeight - CONFIG.taskbarHeight - 60);
        }
        
        // Posicionamento inteligente
        let x, y;
        if (this.contadorAppsAbertos === 0) {
            // Centro da tela
            x = (window.innerWidth - larguraJanela) / 2;
            y = (window.innerHeight - CONFIG.taskbarHeight - alturaJanela) / 2;
        } else {
            // Offset proporcional
            const offset = this.contadorAppsAbertos * CONFIG.windowOffsetIncrement;
            x = ((window.innerWidth - larguraJanela) / 2) + offset;
            y = ((window.innerHeight - CONFIG.taskbarHeight - alturaJanela) / 2) + offset;
            
            // Evita sair da tela
            const maxX = window.innerWidth - larguraJanela - 20;
            const maxY = window.innerHeight - CONFIG.taskbarHeight - alturaJanela - 20;
            
            if (x > maxX || y > maxY) {
                x = 20; // Mobile: margem menor
                y = 20;
            }
        }
        
        // Garante que não sai da tela (correção adicional)
        x = Math.max(10, Math.min(x, window.innerWidth - larguraJanela - 10));
        y = Math.max(10, Math.min(y, window.innerHeight - CONFIG.taskbarHeight - alturaJanela - 10));
        
        janela.style.left = `${x}px`;
        janela.style.top = `${y}px`;
        janela.style.width = `${larguraJanela}px`;
        janela.style.height = `${alturaJanela}px`;
        
        this.contadorAppsAbertos++;
        
        janela.innerHTML = `
            <div class="window-header">
                <span class="window-title">${this.capitalizarTexto(titulo)}</span>
                <div class="window-controls">
                    <button class="window-control minimize-btn">_</button>
                    <button class="window-control maximize-btn">□</button>
                    <button class="window-control close-btn">×</button>
                </div>
            </div>
            <div class="window-content">
                <p>Carregando ${titulo}...</p>
            </div>
        `;
        
        container.appendChild(janela);
        this.configurarEventosJanela(janela, titulo);
        
        return janela;
    },
    
    configurarEventosJanela(janela, nomeApp) {
        const header = janela.querySelector('.window-header');
        const minimizeBtn = janela.querySelector('.minimize-btn');
        const maximizeBtn = janela.querySelector('.maximize-btn');
        const closeBtn = janela.querySelector('.close-btn');
        
        // Arrastar janela (desktop e mobile)
        if (CONFIG.isMobile) {
            this.tornarArrastavelMobile(janela, header, nomeApp);
        } else {
            this.tornarArrastavel(janela, header, nomeApp);
        }
        
        // Focar ao clicar
        janela.addEventListener(CONFIG.isMobile ? 'touchstart' : 'mousedown', () => {
            this.focarJanela(nomeApp);
        });
        
        // Botões
        const eventType = CONFIG.isMobile ? 'touchend' : 'click';
        
        minimizeBtn.addEventListener(eventType, (e) => {
            e.stopPropagation();
            this.minimizarJanela(nomeApp);
        });
        
        maximizeBtn.addEventListener(eventType, (e) => {
            e.stopPropagation();
            this.alternarMaximizarJanela(nomeApp);
        });
        
        closeBtn.addEventListener(eventType, (e) => {
            e.stopPropagation();
            this.fecharAplicativo(nomeApp);
        });
        
        // Duplo clique no header para maximizar (apenas desktop)
        if (!CONFIG.isMobile) {
            header.addEventListener('dblclick', () => {
                this.alternarMaximizarJanela(nomeApp);
            });
        }
    },
    
    // === APLICATIVOS ===
    executarAplicativo(nomeApp, containerContent) {
        const aplicativosDisponiveis = {
            'notas': 'Editor de texto simples',
            'calculadora': 'Calculadora básica',
            'internet': 'Navegador web',
            'lixo': 'Lixeira do sistema',
            'arquivos': 'Explorador de arquivos',
            'cobra': 'Jogo da cobrinha'
        };
        
        const descricao = aplicativosDisponiveis[nomeApp] || 'Aplicativo desconhecido';
        
        containerContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3>${this.capitalizarTexto(nomeApp)}</h3>
                <p>${descricao}</p>
                <br>
                <p><em>Aplicativo será implementado em breve...</em></p>
            </div>
        `;
        
        // Evento para aplicativos específicos
        window.dispatchEvent(new CustomEvent('aplicativo-aberto', {
            detail: { nomeApp, containerContent }
        }));
    }
});