/**
 * @file arquivos.app.js
 * @description Aplicativo Explorador de Arquivos, recriado com uma interface
 * clássica de dois painéis e um sistema de arquivos simulado e divertido.
 */

export default class ArquivosApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     */
    constructor(container) {
        this.container = container;

        // MUDANÇA: Sistema de arquivos falso, agora mais elaborado e divertido.
        this.fileSystem = {
            'Meu Computador': {
                type: 'computer',
                children: {
                    'Disco Local (C:)': {
                        type: 'drive',
                        children: {
                            'Documentos': {
                                type: 'folder',
                                children: {
                                    'lista_de_tarefas.txt': { type: 'file', icon: 'notes' },
                                    'poemas_incompreendidos.docx': { type: 'file', icon: 'notes' }
                                }
                            },
                            'Downloads': {
                                type: 'folder',
                                children: {
                                    'nao_clique_aqui.exe': { type: 'file', icon: 'cmd' }
                                }
                            },
                            'Planos de Dominação Mundial': {
                                type: 'folder',
                                children: {
                                    'passo_1_comprar_pao.txt': { type: 'file', icon: 'notes' },
                                    'passo_2_conquistar_o_mundo.txt': { type: 'file', icon: 'notes' }
                                }
                            },
                            'FOTOS_PROIBIDAS': {
                                type: 'folder',
                                children: {
                                    'gato_de_chapeu.jpg': { type: 'file', icon: 'internet' },
                                    'selfie_ruim_2007.png': { type: 'file', icon: 'internet' }
                                }
                            },
                        }
                    },
                    'Meus Documentos': { // Atalho para C:/Documentos
                        type: 'folder',
                        children: null, // Será populado dinamicamente
                        shortcutTo: ['Meu Computador', 'Disco Local (C:)', 'Documentos']
                    }
                }
            }
        };
        // Popula o atalho
        this.fileSystem['Meu Computador'].children['Meus Documentos'].children = this.fileSystem['Meu Computador'].children['Disco Local (C:)'].children['Documentos'].children;


        // Estado da navegação
        this.currentPath = ['Meu Computador', 'Disco Local (C:)'];
        this.treePane = null; // Painel da esquerda
        this.contentPane = null; // Painel da direita
    }

    /**
     * Inicializa o aplicativo, criando a interface de dois painéis.
     */
    init() {
        this.container.style.padding = '0';
        this.container.style.display = 'flex';
        this.container.style.backgroundColor = '#FFFFFF';
        this.container.style.fontFamily = "'Tahoma', sans-serif";
        this.container.style.fontSize = '13px';

        this._createPanes();
        this._renderTree();
        this._renderContent();
    }

    /**
     * Cria os painéis da esquerda (árvore de pastas) e da direita (conteúdo).
     */
    _createPanes() {
        // Painel da Esquerda (Árvore de Pastas)
        this.treePane = document.createElement('div');
        this.treePane.style.width = '180px';
        this.treePane.style.height = '100%';
        this.treePane.style.borderRight = '2px solid #f0f0f0';
        this.treePane.style.backgroundColor = '#f7f7f7';
        this.treePane.style.padding = '10px';
        this.treePane.style.boxSizing = 'border-box';
        this.treePane.style.overflowY = 'auto';

        // Painel da Direita (Conteúdo da Pasta)
        this.contentPane = document.createElement('div');
        this.contentPane.style.flexGrow = '1';
        this.contentPane.style.height = '100%';
        this.contentPane.style.padding = '10px';
        this.contentPane.style.boxSizing = 'border-box';
        this.contentPane.style.display = 'flex';
        this.contentPane.style.flexWrap = 'wrap';
        this.contentPane.style.alignContent = 'flex-start';
        this.contentPane.style.gap = '15px';
        this.contentPane.style.overflowY = 'auto';

        this.container.appendChild(this.treePane);
        this.container.appendChild(this.contentPane);
    }

    /**
     * Renderiza a árvore de diretórios no painel esquerdo.
     */
    _renderTree(parentElement = this.treePane, fileNode = this.fileSystem, path = []) {
        if (parentElement === this.treePane) {
            this.treePane.innerHTML = ''; // Limpa antes de renderizar
        }

        Object.keys(fileNode).forEach(key => {
            const currentNode = fileNode[key];
            const currentItemPath = [...path, key];
            
            if (currentNode.type !== 'file') {
                const entry = document.createElement('div');
                entry.style.paddingLeft = `${path.length * 15}px`;
                entry.style.cursor = 'pointer';
                entry.style.marginBottom = '5px';
                entry.textContent = `📁 ${key}`;

                entry.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.currentPath = currentItemPath;
                    this._renderContent();
                    this._highlightTreeSelection();
                });

                parentElement.appendChild(entry);

                // Renderiza subpastas recursivamente
                if (currentNode.children) {
                    this._renderTree(entry, currentNode.children, currentItemPath);
                }
            }
        });
    }

    /**
     * Renderiza o conteúdo do diretório atual no painel direito.
     */
    _renderContent() {
        this.contentPane.innerHTML = ''; // Limpa o painel

        let currentDir = this.fileSystem;
        for (const part of this.currentPath) {
            currentDir = currentDir[part]?.children || currentDir[part];
        }

        if (currentDir && currentDir.children) {
            Object.entries(currentDir.children).forEach(([name, item]) => {
                this.contentPane.appendChild(this._createContentItem(name, item.type, item.icon));
            });
        }
        
        this._highlightTreeSelection();
    }

    /**
     * Cria um ícone individual para o painel de conteúdo.
     */
    _createContentItem(name, type, iconName = 'notes') {
        const item = document.createElement('div');
        item.style.width = '80px';
        item.style.textAlign = 'center';
        item.style.cursor = 'pointer';
        item.dataset.name = name;
        item.dataset.type = type;

        const icon = document.createElement('img');
        icon.style.width = '32px';
        icon.style.height = '32px';

        if (type === 'folder') {
            icon.src = 'assets/images/so/explorer.png';
        } else {
            // Usa ícones de outros apps para os arquivos
            icon.src = `assets/images/so/${iconName}.png`;
        }

        const label = document.createElement('span');
        label.textContent = name;
        label.style.display = 'block';
        label.style.marginTop = '5px';
        label.style.wordWrap = 'break-word';

        item.appendChild(icon);
        item.appendChild(label);
        
        item.addEventListener('dblclick', () => {
            if (type === 'folder') {
                this.currentPath.push(name);
                this._renderContent();
            } else {
                alert(`Arquivo "${name}"\n\nEste é um sistema de arquivos simulado. A edição de arquivos será implementada no futuro!`);
            }
        });

        return item;
    }

    /**
     * Destaca a pasta selecionada na árvore da esquerda.
     */
    _highlightTreeSelection() {
        const pathString = this.currentPath.join('/');
        this.treePane.querySelectorAll('div').forEach(div => {
            // Uma forma simples de encontrar o div certo pelo seu conteúdo de texto
            const divPath = div.textContent.trim().replace(/📁 /g, '');
            // Isso é uma simplificação e pode não funcionar para nomes de pasta complexos, mas é ok para este app.
            if(pathString.endsWith(divPath)) {
                 div.style.backgroundColor = '#cce5ff';
                 div.style.fontWeight = 'bold';
            } else {
                 div.style.backgroundColor = 'transparent';
                 div.style.fontWeight = 'normal';
            }
        });
    }
}