// Admin Chat System for Grilli Restaurant
class AdminChatSystem {
    constructor() {
        this.socket = null;
        this.conversations = [];
        this.activeConversation = null;
        this.messages = {};
        this.isConnected = false;
        this.apiBaseUrl = '/api';
        this.quickReplies = [
            'Hello! How can I help you?',
            'Your order is being prepared.',
            'Your order is out for delivery.',
            'Thank you for your order!',
            'Is there anything else I can help with?'
        ];
        this.init();
    }

    init() {
        this.createChatPanel();
        this.setupEventListeners();
        this.initializeSocket();
        this.loadConversations();
        
        // Auto-refresh conversations every 30 seconds
        setInterval(() => {
            this.loadConversations();
        }, 30000);
    }

    createChatPanel() {
        const adminPanel = document.querySelector('.admin-panel-container') || document.body;
        
        const chatPanel = document.createElement('div');
        chatPanel.className = 'admin-chat-panel';
        chatPanel.id = 'adminChatPanel';
        chatPanel.innerHTML = `
            <div class="conversations-list">
                <div class="conversations-header">
                    <span>💬 Customer Chats</span>
                    <button id="refreshConversations" aria-label="Refresh conversations">🔄</button>
                </div>
                <div class="conversations-search">
                    <input 
                        type="text" 
                        id="conversationsSearch" 
                        placeholder="Search conversations..."
                        aria-label="Search conversations"
                    >
                </div>
                <div class="conversations-list-items" id="conversationsList">
                    <div class="chat-loading">Loading conversations...</div>
                </div>
            </div>
            <div class="admin-chat-window">
                <div class="admin-chat-header" id="adminChatHeader">
                    <div class="admin-chat-header-info">
                        <h3>Select a conversation</h3>
                        <p>Choose a customer to start chatting</p>
                    </div>
                </div>
                <div class="admin-chat-messages" id="adminChatMessages">
                    <div class="chat-empty">
                        <div class="chat-empty-icon">💬</div>
                        <p>Select a conversation to view messages</p>
                    </div>
                </div>
                <div class="admin-chat-quick-replies" id="adminChatQuickReplies">
                    ${this.quickReplies.map(reply => 
                        `<button class="quick-reply-btn" data-reply="${this.escapeHtml(reply)}">${this.escapeHtml(reply)}</button>`
                    ).join('')}
                </div>
                <div class="admin-chat-input-container">
                    <input 
                        type="text" 
                        id="adminChatInput" 
                        placeholder="Type your message..."
                        aria-label="Message input"
                    >
                    <button id="adminSendBtn" aria-label="Send message">Send</button>
                </div>
            </div>
        `;
        
        adminPanel.appendChild(chatPanel);
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshConversations');
        const searchInput = document.getElementById('conversationsSearch');
        const adminChatInput = document.getElementById('adminChatInput');
        const adminSendBtn = document.getElementById('adminSendBtn');
        const quickReplyBtns = document.querySelectorAll('.quick-reply-btn');

        refreshBtn?.addEventListener('click', () => this.loadConversations());
        
        searchInput?.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });

        adminSendBtn?.addEventListener('click', () => this.handleSendMessage());
        
        adminChatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        quickReplyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const reply = btn.dataset.reply;
                if (adminChatInput) {
                    adminChatInput.value = reply;
                    adminChatInput.focus();
                }
            });
        });
    }

    initializeSocket() {
        if (typeof io === 'undefined') {
            console.warn('Socket.IO not loaded, admin chat will use REST API only');
            return;
        }

        try {
            if (window.socketManager && window.socketManager.socket) {
                this.socket = window.socketManager.socket;
            } else {
                this.socket = io('http://localhost:4000', {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5
                });
            }

            this.socket.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Admin chat connected to server');
                this.joinAdminRoom();
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                console.log('⚠️ Admin chat disconnected');
            });

            this.socket.on('newMessage', (data) => {
                this.handleNewMessage(data);
            });

            this.socket.on('typing', (data) => {
                if (this.activeConversation && 
                    this.activeConversation.customerId === data.customerId) {
                    this.showTypingIndicator(data.customerId);
                }
            });

            this.socket.on('typingStop', (data) => {
                if (this.activeConversation && 
                    this.activeConversation.customerId === data.customerId) {
                    this.hideTypingIndicator(data.customerId);
                }
            });

        } catch (error) {
            console.error('Error initializing admin socket:', error);
        }
    }

    joinAdminRoom() {
        if (this.socket && this.isConnected) {
            this.socket.emit('joinAdminRoom');
        }
    }

    async loadConversations() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/messages/conversations`);
            if (response.ok) {
                this.conversations = await response.json();
                this.renderConversations();
            } else {
                throw new Error('Failed to load conversations');
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            const list = document.getElementById('conversationsList');
            if (list) {
                list.innerHTML = '<div class="chat-empty"><p>Error loading conversations</p></div>';
            }
        }
    }

    renderConversations() {
        const list = document.getElementById('conversationsList');
        if (!list) return;

        if (this.conversations.length === 0) {
            list.innerHTML = '<div class="chat-empty"><p>No conversations yet</p></div>';
            return;
        }

        list.innerHTML = this.conversations.map(conv => {
            const lastMessage = conv.lastMessage || { content: 'No messages yet', timestamp: conv.updatedAt };
            const time = this.formatTime(lastMessage.timestamp || conv.updatedAt);
            const unreadCount = conv.unreadCount || 0;
            
            return `
                <div class="conversation-item ${this.activeConversation?.customerId === conv.customerId ? 'active' : ''}" 
                     data-customer-id="${conv.customerId}">
                    <div class="conversation-item-info">
                        <div class="conversation-item-name">${this.escapeHtml(conv.customerName || `Customer ${conv.customerId.slice(-6)}`)}</div>
                        <div class="conversation-item-preview">${this.escapeHtml(lastMessage.content)}</div>
                    </div>
                    <div class="conversation-item-meta">
                        <div class="conversation-item-time">${time}</div>
                        ${unreadCount > 0 ? `<div class="conversation-item-badge">${unreadCount}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        list.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const customerId = item.dataset.customerId;
                this.selectConversation(customerId);
            });
        });
    }

    filterConversations(searchTerm) {
        const items = document.querySelectorAll('.conversation-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.conversation-item-name')?.textContent.toLowerCase() || '';
            const preview = item.querySelector('.conversation-item-preview')?.textContent.toLowerCase() || '';
            
            if (name.includes(term) || preview.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async selectConversation(customerId) {
        this.activeConversation = this.conversations.find(c => c.customerId === customerId);
        if (!this.activeConversation) return;

        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.customerId === customerId) {
                item.classList.add('active');
            }
        });

        // Update header
        this.updateChatHeader();

        // Load messages
        await this.loadMessages(customerId);

        // Mark as read
        this.markAsRead(customerId);
    }

    updateChatHeader() {
        const header = document.getElementById('adminChatHeader');
        if (!header || !this.activeConversation) return;

        const conv = this.activeConversation;
        header.innerHTML = `
            <div class="admin-chat-header-info">
                <h3>${this.escapeHtml(conv.customerName || `Customer ${conv.customerId.slice(-6)}`)}</h3>
                <p>Customer ID: ${conv.customerId.slice(-8)}</p>
                ${conv.orderId ? `<p>Order: #${conv.orderId}</p>` : ''}
            </div>
            <div class="admin-chat-actions">
                <button onclick="window.adminChatSystem.markAsRead('${conv.customerId}')">Mark as Read</button>
                ${conv.orderId ? `<a href="/orders.html?orderId=${conv.orderId}" target="_blank" style="color: #ffd700; text-decoration: none;">View Order</a>` : ''}
            </div>
        `;

        // Show customer info if available
        if (conv.orderId) {
            this.showCustomerInfo(conv);
        }
    }

    showCustomerInfo(conv) {
        const messagesContainer = document.getElementById('adminChatMessages');
        if (!messagesContainer) return;

        // Check if info already shown
        if (messagesContainer.querySelector('.admin-chat-customer-info')) return;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'admin-chat-customer-info';
        infoDiv.innerHTML = `
            <h4>Order Information</h4>
            <p><strong>Order ID:</strong> #${conv.orderId}</p>
            <p><strong>Customer:</strong> ${this.escapeHtml(conv.customerName || 'N/A')}</p>
            <a href="/orders.html?orderId=${conv.orderId}" target="_blank" style="color: #ffd700;">View Full Order Details →</a>
        `;
        messagesContainer.insertBefore(infoDiv, messagesContainer.firstChild);
    }

    async loadMessages(customerId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/messages?customerId=${customerId}`);
            if (response.ok) {
                const messages = await response.json();
                this.messages[customerId] = messages;
                this.renderMessages(customerId);
            } else {
                throw new Error('Failed to load messages');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages(customerId) {
        const messagesContainer = document.getElementById('adminChatMessages');
        if (!messagesContainer) return;

        const messages = this.messages[customerId] || [];
        
        // Remove customer info if exists (we'll re-add it)
        const existingInfo = messagesContainer.querySelector('.admin-chat-customer-info');
        if (existingInfo) existingInfo.remove();

        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="chat-empty"><p>No messages yet</p></div>';
            return;
        }

        messagesContainer.innerHTML = messages.map(message => {
            const isAdmin = message.sender === 'admin';
            const time = this.formatTime(message.timestamp);
            
            let contentHTML = this.escapeHtml(message.content);
            if (message.type === 'image' && message.imageUrl) {
                contentHTML += `<img src="${message.imageUrl}" alt="Image" class="message-image" onclick="window.open('${message.imageUrl}', '_blank')">`;
            }

            return `
                <div class="message-bubble ${isAdmin ? 'admin' : 'customer'}">
                    <div>${contentHTML}</div>
                    <span class="message-time">${time}</span>
                </div>
            `;
        }).join('');

        this.scrollToBottom();
    }

    async handleSendMessage() {
        const input = document.getElementById('adminChatInput');
        const message = input?.value.trim();
        
        if (!message || !this.activeConversation) return;

        const messageData = {
            customerId: this.activeConversation.customerId,
            orderId: this.activeConversation.orderId,
            content: message,
            sender: 'admin',
            type: 'text',
            timestamp: new Date().toISOString()
        };

        try {
            if (this.socket && this.isConnected) {
                this.socket.emit('sendAdminMessage', messageData);
            } else {
                const response = await fetch(`${this.apiBaseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(messageData)
                });

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
            }

            // Add to UI immediately
            if (!this.messages[this.activeConversation.customerId]) {
                this.messages[this.activeConversation.customerId] = [];
            }
            this.messages[this.activeConversation.customerId].push(messageData);
            this.renderMessages(this.activeConversation.customerId);

            if (input) input.value = '';

            // Refresh conversations to update last message
            this.loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            if (window.showNotification) {
                window.showNotification('Failed to send message', 'error');
            }
        }
    }

    handleNewMessage(data) {
        // Update conversations list
        this.loadConversations();

        // If this is the active conversation, add message to UI
        if (this.activeConversation && 
            this.activeConversation.customerId === data.customerId) {
            if (!this.messages[data.customerId]) {
                this.messages[data.customerId] = [];
            }
            this.messages[data.customerId].push(data);
            this.renderMessages(data.customerId);
        }
    }

    showTypingIndicator(customerId) {
        const messagesContainer = document.getElementById('adminChatMessages');
        if (!messagesContainer) return;

        const existing = messagesContainer.querySelector('.typing-indicator');
        if (existing) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator(customerId) {
        const messagesContainer = document.getElementById('adminChatMessages');
        const typingIndicator = messagesContainer?.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async markAsRead(customerId) {
        try {
            await fetch(`${this.apiBaseUrl}/messages/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customerId })
            });

            // Update UI
            this.loadConversations();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('adminChatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize admin chat when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminChatSystem = new AdminChatSystem();
    });
} else {
    window.adminChatSystem = new AdminChatSystem();
}




