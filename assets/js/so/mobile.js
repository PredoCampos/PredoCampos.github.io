// ===== MOBILE - FUNCIONALIDADES PARA DISPOSITIVOS MÓVEIS =====

// Adiciona métodos mobile à classe SistemaOperacional
Object.assign(SistemaOperacional.prototype, {
    
    // === EVENTOS MOBILE ===
    configurarEventosMobile(icone) {
        let longPressTimer = null;
        let longPressActivated = false;
        
        // Touch start
        icone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (this.isDraggingIcon) return;
            
            longPressActivated = false;
            
            // Timer para long press (arraste)
            longPressTimer = setTimeout(() => {
                longPressActivated = true;
                console.log(`Mobile: Long press detectado em ${icone.dataset.app}`);
                
                // Feedback tátil se disponível
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 500);
            
        }, { passive: false });
        
        // Touch end
        icone.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Cancela timer se ainda estiver rodando
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // Se não foi long press e não está arrastando, é toque simples
            if (!longPressActivated && !this.isDraggingIcon) {
                const nomeApp = icone.dataset.app;
                this.interagirComAplicativo(nomeApp);
                console.log(`Mobile: Toque simples em ${nomeApp}`);
            }
            
        }, { passive: false });
        
        // Touch move - cancela long press se mover muito
        icone.addEventListener('touchmove', (e) => {
            if (!this.isDraggingIcon && longPressTimer) {
                // Se mover antes do long press, cancela
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: false });
    },
    
    // === ARRASTAR ÍCONES MOBILE ===
    configurarArrastarMobile(icone) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let longPressTimer = null;
        let startTouch = null;
        
        icone.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            startTouch = { x: touch.clientX, y: touch.clientY };
            
            const rect = icone.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            
            // Timer para long press (500ms para iniciar arraste)
            longPressTimer = setTimeout(() => {
                this.isDraggingIcon = true;
                isDragging = true;
                
                icone.classList.add('dragging');
                icone.style.zIndex = 1000;
                
                // Feedback tátil se disponível
                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }
                
                console.log(`Mobile: Iniciando arraste de ${icone.dataset.app}`);
            }, 500);
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) {
                // Se mover muito antes do long press, cancela
                if (longPressTimer && startTouch) {
                    const touch = e.touches[0];
                    const deltaX = Math.abs(touch.clientX - startTouch.x);
                    const deltaY = Math.abs(touch.clientY - startTouch.y);
                    
                    if (deltaX > 10 || deltaY > 10) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                }
                return;
            }
            
            e.preventDefault();
            
            const touch = e.touches[0];
            const x = touch.clientX - offsetX;
            const y = touch.clientY - offsetY;
            
            const maxX = window.innerWidth - 80;
            const maxY = window.innerHeight - CONFIG.taskbarHeight - 80;
            
            icone.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            icone.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (!isDragging) return;
            
            isDragging = false;
            setTimeout(() => { this.isDraggingIcon = false; }, 200);
            
            icone.classList.remove('dragging');
            icone.style.zIndex = 'auto';
            
            this.encaixarNaGrade(icone);
            console.log(`Mobile: Finalizando arraste de ${icone.dataset.app}`);
        }, { passive: false });
    },
    
    // === SISTEMA DE ARRASTAR JANELAS MOBILE ===
    tornarArrastavelMobile(janela, header, nomeApp) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let longPressTimer = null;
        let startTouch = null;
        
        header.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            // Não arrasta se estiver maximizada
            const app = this.aplicativosAbertos.get(nomeApp);
            if (app && app.maximizada) return;
            
            const touch = e.touches[0];
            startTouch = { x: touch.clientX, y: touch.clientY };
            
            offsetX = touch.clientX - janela.offsetLeft;
            offsetY = touch.clientY - janela.offsetTop;
            
            // Timer para long press (300ms para janelas)
            longPressTimer = setTimeout(() => {
                isDragging = true;
                janela.style.zIndex = ++this.zIndexAtual;
                
                // Feedback tátil
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                console.log(`Mobile: Iniciando arraste da janela ${nomeApp}`);
            }, 300);
            
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) {
                // Se mover muito antes do long press, cancela
                if (longPressTimer && startTouch) {
                    const touch = e.touches[0];
                    const deltaX = Math.abs(touch.clientX - startTouch.x);
                    const deltaY = Math.abs(touch.clientY - startTouch.y);
                    
                    if (deltaX > 10 || deltaY > 10) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                }
                return;
            }
            
            e.preventDefault();
            
            const touch = e.touches[0];
            const x = touch.clientX - offsetX;
            const y = touch.clientY - offsetY;
            
            // Limita dentro da área visível
            const maxX = window.innerWidth - janela.offsetWidth;
            const maxY = window.innerHeight - CONFIG.taskbarHeight - janela.offsetHeight;
            
            janela.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            janela.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (isDragging) {
                isDragging = false;
                console.log(`Mobile: Finalizando arraste da janela ${nomeApp}`);
            }
        }, { passive: false });
    }
});

// === FUNCIONALIDADES COMPARTILHADAS (GRID E JANELAS) ===
Object.assign(SistemaOperacional.prototype, {
    
    // === GERENCIAMENTO DE ÍCONES ===
    inicializarPosicaoIcones() {
        const icones = document.querySelectorAll('.desktop-icon');
        this.gridOcupado.clear();
        
        // Define ordem específica e posições
        const ordemIcones = {
            'internet': { coluna: 0, linha: 0 },
            'arquivos': { coluna: 0, linha: 1 },
            'notas': { coluna: 0, linha: 2 },
            'calculadora': { coluna: 0, linha: 3 },
            'cobra': { coluna: 0, linha: 4 },
            'lixo': { coluna: CONFIG.maxColunas - 1, linha: CONFIG.maxLinhas - 1 } // Última posição
        };
        
        icones.forEach(icone => {
            const nomeApp = icone.dataset.app;
            const posicao = ordemIcones[nomeApp];
            
            if (posicao) {
                // Verifica se a posição está dentro dos limites do grid
                if (posicao.coluna < CONFIG.maxColunas && posicao.linha < CONFIG.maxLinhas) {
                    const coordenadas = this.obterCoordenadaGrid(`${posicao.coluna},${posicao.linha}`);
                    icone.style.left = `${coordenadas.x}px`;
                    icone.style.top = `${coordenadas.y}px`;
                    
                    // Marca posição como ocupada
                    this.gridOcupado.set(`${posicao.coluna},${posicao.linha}`, nomeApp);
                } else {
                    // Se não cabe na posição padrão, encontra uma posição livre
                    const posicaoLivre = this.encontrarPosicaoLivrePara(0, 0, nomeApp);
                    const coordenadas = this.obterCoordenadaGrid(`${posicaoLivre.coluna},${posicaoLivre.linha}`);
                    icone.style.left = `${coordenadas.x}px`;
                    icone.style.top = `${coordenadas.y}px`;
                    this.gridOcupado.set(`${posicaoLivre.coluna},${posicaoLivre.linha}`, nomeApp);
                }
            }
        });
        
        console.log('Posições padrão dos ícones definidas');
    },
    
    // === SISTEMA DE GRID ===
    obterChaveGrid(x, y) {
        const coluna = Math.round((x - CONFIG.gridStartX) / CONFIG.gridSize);
        const linha = Math.round((y - CONFIG.gridStartY) / CONFIG.gridSize);
        return `${coluna},${linha}`;
    },
    
    obterCoordenadaGrid(chaveGrid) {
        const [coluna, linha] = chaveGrid.split(',').map(Number);
        return {
            x: CONFIG.gridStartX + (coluna * CONFIG.gridSize),
            y: CONFIG.gridStartY + (linha * CONFIG.gridSize)
        };
    },
    
    encaixarNaGrade(icone) {
        const x = parseInt(icone.style.left);
        const y = parseInt(icone.style.top);
        
        // Remove o ícone da posição atual no grid
        const chaveAtual = this.encontrarChaveIcone(icone.dataset.app);
        if (chaveAtual) {
            this.gridOcupado.delete(chaveAtual);
        }
        
        // Calcula a posição da grade mais próxima
        let gridX = Math.round((x - CONFIG.gridStartX) / CONFIG.gridSize) * CONFIG.gridSize + CONFIG.gridStartX;
        let gridY = Math.round((y - CONFIG.gridStartY) / CONFIG.gridSize) * CONFIG.gridSize + CONFIG.gridStartY;
        
        // CORREÇÃO: Garante que não sai dos limites do grid (não apenas da tela)
        const maxGridX = CONFIG.gridStartX + ((CONFIG.maxColunas - 1) * CONFIG.gridSize);
        const maxGridY = CONFIG.gridStartY + ((CONFIG.maxLinhas - 1) * CONFIG.gridSize);
        
        const finalX = Math.max(CONFIG.gridStartX, Math.min(gridX, maxGridX));
        const finalY = Math.max(CONFIG.gridStartY, Math.min(gridY, maxGridY));
        
        // Converte para coluna/linha
        const coluna = Math.round((finalX - CONFIG.gridStartX) / CONFIG.gridSize);
        const linha = Math.round((finalY - CONFIG.gridStartY) / CONFIG.gridSize);
        
        // Verifica se há colisão e move ícones em cascata vertical
        const chaveDestino = `${coluna},${linha}`;
        if (this.gridOcupado.has(chaveDestino) && this.gridOcupado.get(chaveDestino) !== icone.dataset.app) {
            console.log(`Colisão detectada na posição ${coluna},${linha}`);
            this.moverIconesCascataVerticalNova(coluna, linha, icone);
        }
        
        // Move o ícone para a posição desejada
        icone.style.left = `${finalX}px`;
        icone.style.top = `${finalY}px`;
        
        // Atualiza o grid com a nova posição do ícone movido
        this.gridOcupado.set(chaveDestino, icone.dataset.app);
        
        console.log(`${icone.dataset.app} colocado na posição ${coluna},${linha}`);
    },
    
    encontrarChaveIcone(nomeApp) {
        for (const [chave, app] of this.gridOcupado.entries()) {
            if (app === nomeApp) {
                return chave;
            }
        }
        return null;
    },
    
    encontrarIconePorApp(nomeApp) {
        return document.querySelector(`.desktop-icon[data-app="${nomeApp}"]`);
    },
    
    encontrarPosicaoLivrePara(coluna, linha, nomeApp) {
        // Procura posição livre a partir da posição desejada
        for (let l = 0; l < CONFIG.maxLinhas; l++) {
            for (let c = 0; c < CONFIG.maxColunas; c++) {
                const chave = `${c},${l}`;
                if (!this.gridOcupado.has(chave)) {
                    return { coluna: c, linha: l };
                }
            }
        }
        // Se não encontrou, sobrescreve a primeira posição
        return { coluna: 0, linha: 0 };
    },
    
    // === SISTEMA DE CASCATA ===
    moverIconesCascataVerticalNova(coluna, linha, iconeMovido) {
        // Coleta todos os ícones da coluna a partir da posição de inserção
        const iconesParaMover = [];
        
        for (let l = linha; l < CONFIG.maxLinhas; l++) {
            const chave = `${coluna},${l}`;
            if (this.gridOcupado.has(chave)) {
                const nomeApp = this.gridOcupado.get(chave);
                const icone = this.encontrarIconePorApp(nomeApp);
                if (icone && icone !== iconeMovido) {
                    iconesParaMover.push({
                        icone: icone,
                        nomeApp: nomeApp,
                        linhaOriginal: l
                    });
                }
            }
        }
        
        console.log(`Movendo ${iconesParaMover.length} ícones da coluna ${coluna}`);
        
        // Remove todos os ícones da coluna que serão movidos
        iconesParaMover.forEach(item => {
            const chave = `${coluna},${item.linhaOriginal}`;
            this.gridOcupado.delete(chave);
        });
        
        // Reposiciona os ícones uma linha abaixo
        iconesParaMover.forEach((item, index) => {
            let novaLinha = linha + 1 + index;
            let novaColuna = coluna;
            
            // Se ultrapassou o limite da coluna atual, vai para próxima coluna
            if (novaLinha >= CONFIG.maxLinhas) {
                // NOVA REGRA: Se não há próxima coluna, empurra para cima
                if (coluna >= CONFIG.maxColunas - 1) {
                    // Encontra posição livre empurrando para cima
                    const posicaoLivre = this.encontrarPosicaoEmpurrandoParaCima(coluna, linha);
                    novaColuna = posicaoLivre.coluna;
                    novaLinha = posicaoLivre.linha;
                } else {
                    // Vai para próxima coluna
                    novaColuna = coluna + 1;
                    novaLinha = 0;
                    
                    // Se a próxima coluna tem ícones, continua a cascata
                    const novaChave = `${novaColuna},${novaLinha}`;
                    if (this.gridOcupado.has(novaChave)) {
                        this.moverIconesCascataVerticalNova(novaColuna, novaLinha, item.icone);
                    }
                }
            }
            
            // Move o ícone para a nova posição
            const coordenadas = this.obterCoordenadaGrid(`${novaColuna},${novaLinha}`);
            item.icone.style.left = `${coordenadas.x}px`;
            item.icone.style.top = `${coordenadas.y}px`;
            
            // Atualiza o grid
            this.gridOcupado.set(`${novaColuna},${novaLinha}`, item.nomeApp);
            
            console.log(`${item.nomeApp} movido para ${novaColuna},${novaLinha}`);
        });
    },
    
    // Encontra posição livre empurrando ícones para cima
    encontrarPosicaoEmpurrandoParaCima(colunaOriginal, linhaOriginal) {
        // Procura primeiro espaço livre acima da posição atual na mesma coluna
        for (let l = linhaOriginal - 1; l >= 0; l--) {
            const chave = `${colunaOriginal},${l}`;
            if (!this.gridOcupado.has(chave)) {
                return { coluna: colunaOriginal, linha: l };
            }
        }
        
        // Se não encontrou espaço acima, empurra todos os ícones para cima
        const iconesParaEmpurrar = [];
        for (let l = 0; l < linhaOriginal; l++) {
            const chave = `${colunaOriginal},${l}`;
            if (this.gridOcupado.has(chave)) {
                const nomeApp = this.gridOcupado.get(chave);
                const icone = this.encontrarIconePorApp(nomeApp);
                iconesParaEmpurrar.push({
                    icone: icone,
                    nomeApp: nomeApp,
                    linha: l
                });
            }
        }
        
        // Remove todos da posição atual
        iconesParaEmpurrar.forEach(item => {
            this.gridOcupado.delete(`${colunaOriginal},${item.linha}`);
        });
        
        // Reposiciona empurrando para cima (linha 0 fica vazia)
        iconesParaEmpurrar.forEach((item, index) => {
            const novaLinha = index + 1;
            const coordenadas = this.obterCoordenadaGrid(`${colunaOriginal},${novaLinha}`);
            item.icone.style.left = `${coordenadas.x}px`;
            item.icone.style.top = `${coordenadas.y}px`;
            this.gridOcupado.set(`${colunaOriginal},${novaLinha}`, item.nomeApp);
        });
        
        // Retorna a linha 0 como disponível
        return { coluna: colunaOriginal, linha: 0 };
    },
    
    // === CONTROLE DE JANELAS ===
    interagirComAplicativo(nomeApp) {
        // Verifica se o aplicativo está aberto
        if (this.aplicativosAbertos.has(nomeApp)) {
            const app = this.aplicativosAbertos.get(nomeApp);
            
            // Se está minimizado, desminimiza
            if (app.minimizada) {
                console.log(`Desminimizando ${nomeApp}`);
                this.restaurarJanela(nomeApp);
            } else {
                // Se está visível, minimiza
                console.log(`Minimizando ${nomeApp}`);
                this.minimizarJanela(nomeApp);
            }
        } else {
            // Se não está aberto, abre o aplicativo
            console.log(`Abrindo ${nomeApp}`);
            this.abrirAplicativo(nomeApp);
        }
    },
    
    focarJanela(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        if (app.minimizada) {
            this.restaurarJanela(nomeApp);
        }
        
        app.elemento.style.zIndex = ++this.zIndexAtual;
        this.atualizarEstadoTaskbar();
    },
    
    minimizarJanela(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        app.elemento.classList.add('minimized');
        app.minimizada = true;
        this.atualizarEstadoTaskbar();
    },
    
    restaurarJanela(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        app.elemento.classList.remove('minimized');
        app.minimizada = false;
        app.elemento.style.zIndex = ++this.zIndexAtual;
        this.atualizarEstadoTaskbar();
    },
    
    alternarMaximizarJanela(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        if (app.maximizada) {
            this.restaurarTamanhoJanela(nomeApp);
        } else {
            this.maximizarJanela(nomeApp);
        }
    },
    
    maximizarJanela(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        const janela = app.elemento;
        
        // Salva posição original
        app.posicaoOriginal = {
            left: janela.style.left,
            top: janela.style.top,
            width: janela.style.width,
            height: janela.style.height
        };
        
        janela.classList.add('maximized');
        app.maximizada = true;
        
        const maximizeBtn = janela.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.textContent = '❐';
        }
        
        this.atualizarEstadoTaskbar();
    },
    
    restaurarTamanhoJanela(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        const janela = app.elemento;
        janela.classList.remove('maximized');
        
        if (app.posicaoOriginal) {
            janela.style.left = app.posicaoOriginal.left;
            janela.style.top = app.posicaoOriginal.top;
            janela.style.width = app.posicaoOriginal.width;
            janela.style.height = app.posicaoOriginal.height;
        }
        
        app.maximizada = false;
        
        const maximizeBtn = janela.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.textContent = '□';
        }
        
        this.atualizarEstadoTaskbar();
    },
    
    fecharAplicativo(nomeApp) {
        const app = this.aplicativosAbertos.get(nomeApp);
        if (!app) return;
        
        app.elemento.remove();
        this.aplicativosAbertos.delete(nomeApp);
        this.contadorAppsAbertos = Math.max(0, this.contadorAppsAbertos - 1);
        this.removerDaTaskbar(nomeApp);
        
        console.log(`Aplicativo '${nomeApp}' fechado`);
    },
    
    // === BARRA DE TAREFAS ===
    adicionarNaTaskbar(nomeApp) {
        const container = document.querySelector(CONFIG.taskbarAppsSelector);
        
        const botao = document.createElement('button');
        botao.className = 'taskbar-app';
        botao.dataset.app = nomeApp;
        botao.textContent = this.capitalizarTexto(nomeApp);
        
        botao.addEventListener('click', () => {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (app && app.minimizada) {
                this.restaurarJanela(nomeApp);
            } else if (app && !app.minimizada) {
                this.minimizarJanela(nomeApp);
            }
        });
        
        container.appendChild(botao);
        this.atualizarEstadoTaskbar();
    },
    
    removerDaTaskbar(nomeApp) {
        const botao = document.querySelector(`${CONFIG.taskbarAppsSelector} [data-app="${nomeApp}"]`);
        if (botao) {
            botao.remove();
        }
    },
    
    atualizarEstadoTaskbar() {
        const botoes = document.querySelectorAll('.taskbar-app');
        
        botoes.forEach(botao => {
            const nomeApp = botao.dataset.app;
            const app = this.aplicativosAbertos.get(nomeApp);
            
            if (app && !app.minimizada) {
                botao.classList.add('active');
            } else {
                botao.classList.remove('active');
            }
        });
    },
    
    selecionarIcone(icone) {
        this.limparSelecaoIcones();
        icone.classList.add('selected');
    },
    
    limparSelecaoIcones() {
        const icones = document.querySelectorAll('.desktop-icon');
        icones.forEach(icone => {
            icone.classList.remove('selected');
        });
    }
});