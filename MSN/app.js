document.addEventListener('DOMContentLoaded', () => {
    const contactList = document.getElementById('contact-list');
    const messageList = document.getElementById('message-list');
    
    const MEU_EMAIL = "gui.slz@hotmail.com"; // <-- IMPORTANTE: Verifique se este é o seu e-mail

    let allConversations = {};
    let activeContactId = null;

    async function loadConversations() {
        try {
            const response = await fetch('conversas.json');
            if (!response.ok) throw new Error('Erro ao carregar o arquivo conversas.json.');
            allConversations = await response.json();
            populateContactList();
        } catch (error) {
            messageList.innerHTML = `<div class="system-event">${error.message}</div>`;
        }
    }

    function populateContactList() {
        contactList.innerHTML = '';
        
        // NOVO: Pega as chaves (e-mails) e as ordena em ordem alfabética
        const sortedContactIds = Object.keys(allConversations).sort();

        sortedContactIds.forEach(contactId => {
            const li = document.createElement('li');
            li.textContent = contactId;
            li.dataset.contactId = contactId;
            li.addEventListener('click', () => showConversation(contactId));
            contactList.appendChild(li);
        });
    }

    function showConversation(contactId) {
        messageList.innerHTML = '';

        if (activeContactId) {
            contactList.querySelector(`[data-contact-id="${activeContactId}"]`).classList.remove('active');
        }
        contactList.querySelector(`[data-contact-id="${contactId}"]`).classList.add('active');
        activeContactId = contactId;

        const conversation = allConversations[contactId];
        let lastSessionId = null;

        if (conversation && conversation.messages) {
            conversation.messages.forEach(msg => {
                // NOVO: Adiciona o cabeçalho da sessão sempre que o ID da sessão mudar
                if (msg.session_id && msg.session_id !== lastSessionId) {
                    const sessionHeader = createSessionHeaderElement(msg);
                    messageList.appendChild(sessionHeader);
                    lastSessionId = msg.session_id;
                }

                const messageElement = createMessageElement(msg);
                messageList.appendChild(messageElement);
            });
        }
        messageList.scrollTop = 0; // Rola para o topo ao carregar a conversa
    }

    // NOVO: Função para criar o cabeçalho da sessão (H2 com a data)
    function createSessionHeaderElement(msg) {
        const h2 = document.createElement('h2');
        h2.className = 'session-header';
        
        const date = new Date(msg.timestamp_iso);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // Formata a data para "sexta-feira, 13 de junho de 2008"
        const formattedDate = date.toLocaleDateString('pt-BR', options);

        h2.textContent = `Início da Sessão: ${formattedDate}`;
        return h2;
    }

    function createMessageElement(msg) {
        const div = document.createElement('div');
        
        // Corrige o caminho de todas as imagens para apontar para a pasta 'imagens'
        const fixImgPaths = (htmlStr) => {
            if (!htmlStr) return '';
            // Usa uma expressão regular para substituir src=" com src="imagens/
            return htmlStr.replace(/src="/g, 'src="imagens/');
        };

        if (msg.message_type === 'user_message' && msg.timestamp_iso) {
            div.className = 'message-entry';
            
            // NOVO: Extrai e formata a hora
            const time = new Date(msg.timestamp_iso);
            const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const senderNickname = fixImgPaths(msg.sender_nickname) || msg.sender_email;
            const contentHtml = fixImgPaths(msg.content_html);

            div.innerHTML = `
                <div class="sender-info">
                    <span class="time">(${timeStr})</span>
                    ${senderNickname}:
                </div>
                <div class="message-content">${contentHtml}</div>
            `;
        } else {
            div.className = 'system-event';
            div.innerHTML = fixImgPaths(msg.content_html);
        }

        return div;
    }

    loadConversations();
});