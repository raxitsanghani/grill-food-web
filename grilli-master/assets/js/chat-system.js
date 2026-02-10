// Customer Chat System for Grilli Restaurant
class ChatSystem {
    constructor() {
        this.socket = null;
        this.messages = [];
        this.currentOrderId = null;
        this.customerId = this.getOrCreateCustomerId();
        this.isTyping = false;
        this.typingTimeout = null;
        this.apiBaseUrl = '/api';
        this.isConnected = false;
        this.unreadCount = 0;
        this.init();
    }

    init() {
        this.createChatWidget();
        this.setupEventListeners();
        this.initializeSocket();
        this.loadMessageHistory();
        
        // Listen for order placement to auto-open chat
        window.addEventListener('orderPlaced', (e) => {
            this.currentOrderId = e.detail.orderId;
            this.openChat();
            this.sendMessage(`Hello! I just placed order #${e.detail.orderId}. Can you help me?`);
        });
    }

    getOrCreateCustomerId() {
        let customerId = localStorage.getItem('grilli_customer_id');
        if (!customerId) {
            customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('grilli_customer_id', customerId);
        }
        return customerId;
    }

    createChatWidget() {
        // Create chat button
        const chatButton = document.createElement('button');
        chatButton.className = 'chat-widget-button';
        chatButton.innerHTML = '💬';
        chatButton.setAttribute('aria-label', 'Open chat');
        chatButton.id = 'chatWidgetButton';
        document.body.appendChild(chatButton);

        // Create chat widget
        const chatWidget = document.createElement('div');
        chatWidget.className = 'chat-widget';
        chatWidget.id = 'chatWidget';
        chatWidget.innerHTML = `
            <div class="chat-header">
                <span>💬 Chat with Grilli</span>
                <button class="chat-toggle" aria-label="Minimize chat">×</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="chat-empty">
                    <div class="chat-empty-icon">💬</div>
                    <p>Start a conversation with us!</p>
                    <p style="font-size: 12px; margin-top: 8px; opacity: 0.7;">We're here to help with your order.</p>
                </div>
            </div>
            <div class="chat-input-container">
                <input 
                    type="text" 
                    id="chatInput" 
                    placeholder="Type your message..." 
                    aria-label="Message input"
                >
                <button id="sendMessageBtn" aria-label="Send message">Send</button>
            </div>
        `;
        document.body.appendChild(chatWidget);
    }

    setupEventListeners() {
        const chatButton = document.getElementById('chatWidgetButton');
        const chatWidget = document.getElementById('chatWidget');
        const chatToggle = chatWidget?.querySelector('.chat-toggle');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendMessageBtn');

        // Toggle chat widget
        chatButton?.addEventListener('click', () => this.openChat());
        chatToggle?.addEventListener('click', () => this.closeChat());

        // Send message
        sendBtn?.addEventListener('click', () => this.handleSendMessage());
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Typing indicator
        chatInput?.addEventListener('input', () => {
            this.handleTyping();
        });

        // Close on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (chatWidget && !chatWidget.contains(e.target) && 
                chatButton && !chatButton.contains(e.target) &&
                chatWidget.classList.contains('active')) {
                // Only close on mobile, keep open on desktop
                if (window.innerWidth <= 768) {
                    this.closeChat();
                }
            }
        });
    }

    initializeSocket() {
        // Check if Socket.IO is available
        if (typeof io === 'undefined') {
            console.warn('Socket.IO not loaded, chat will use REST API only');
            return;
        }

        try {
            // Use existing socket manager if available
            if (window.socketManager && window.socketManager.socket) {
                this.socket = window.socketManager.socket;
            } else {
                // Create new socket connection
                this.socket = io('http://localhost:4000', {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5
                });
            }

            this.socket.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Chat connected to server');
                this.joinChatRoom();
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                console.log('⚠️ Chat disconnected');
            });

            this.socket.on('message', (data) => {
                this.receiveMessage(data);
            });

            this.socket.on('typing', (data) => {
                if (data.customerId === this.customerId) {
                    this.showTypingIndicator();
                }
            });

            this.socket.on('typingStop', (data) => {
                if (data.customerId === this.customerId) {
                    this.hideTypingIndicator();
                }
            });

            this.socket.on('messageRead', (data) => {
                this.updateMessageStatus(data.messageId, 'read');
            });

        } catch (error) {
            console.error('Error initializing socket:', error);
        }
    }

    joinChatRoom() {
        if (this.socket && this.isConnected) {
            this.socket.emit('joinChat', {
                customerId: this.customerId,
                orderId: this.currentOrderId
            });
        }
    }

    openChat() {
        const chatWidget = document.getElementById('chatWidget');
        const chatButton = document.getElementById('chatWidgetButton');
        
        if (chatWidget) {
            chatWidget.classList.add('active');
            chatWidget.classList.remove('minimized');
            if (chatButton) chatButton.classList.add('hidden');
            
            // Focus input
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) chatInput.focus();
            }, 300);

            // Scroll to bottom
            this.scrollToBottom();
        }
    }

    closeChat() {
        const chatWidget = document.getElementById('chatWidget');
        const chatButton = document.getElementById('chatWidgetButton');
        
        if (chatWidget) {
            chatWidget.classList.remove('active');
            if (chatButton) chatButton.classList.remove('hidden');
        }
    }

    handleSendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value.trim();
        
        if (!message) return;

        this.sendMessage(message);
        if (chatInput) chatInput.value = '';
        this.stopTyping();
    }

    async sendMessage(content, type = 'text') {
        const message = {
            customerId: this.customerId,
            orderId: this.currentOrderId,
            content: content,
            type: type,
            timestamp: new Date().toISOString()
        };

        // Add to local messages immediately (optimistic update)
        message._id = `temp_${Date.now()}`;
        message.status = 'sending';
        this.addMessageToUI(message);

        try {
            // Send via Socket.IO if available
            if (this.socket && this.isConnected) {
                this.socket.emit('sendMessage', message);
                message.status = 'sent';
            } else {
                // Fallback to REST API
                const response = await fetch(`${this.apiBaseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                });

                if (response.ok) {
                    const savedMessage = await response.json();
                    message._id = savedMessage._id;
                    message.status = 'sent';
                    this.updateMessageInUI(message);
                } else {
                    throw new Error('Failed to send message');
                }
            }

            // Update message status
            this.updateMessageStatus(message._id, 'sent');
        } catch (error) {
            console.error('Error sending message:', error);
            message.status = 'error';
            this.updateMessageStatus(message._id, 'error');
            
            if (window.showNotification) {
                window.showNotification('Failed to send message. Please try again.', 'error');
            }
        }
    }

    receiveMessage(data) {
        if (data.customerId === this.customerId) {
            this.addMessageToUI(data);
            this.updateUnreadCount();
            
            // Show notification if chat is closed
            const chatWidget = document.getElementById('chatWidget');
            if (!chatWidget?.classList.contains('active')) {
                if (window.showNotification) {
                    window.showNotification('New message from Grilli!', 'info');
                }
            }
        }
    }

    addMessageToUI(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Remove empty state
        const emptyState = messagesContainer.querySelector('.chat-empty');
        if (emptyState) emptyState.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${message.sender === 'admin' ? 'admin' : 'customer'}`;
        messageDiv.id = `message_${message._id}`;
        
        let contentHTML = this.escapeHtml(message.content);
        
        // Handle images
        if (message.type === 'image' && message.imageUrl) {
            contentHTML += `<img src="${message.imageUrl}" alt="Image" class="message-image" onclick="window.open('${message.imageUrl}', '_blank')">`;
        }

        const time = this.formatTime(message.timestamp);
        const statusIcon = this.getStatusIcon(message.status);

        messageDiv.innerHTML = `
            <div>${contentHTML}</div>
            <span class="message-time">${time}</span>
            ${message.sender !== 'admin' ? `<span class="message-status">${statusIcon}</span>` : ''}
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        this.messages.push(message);
    }

    updateMessageInUI(message) {
        const messageDiv = document.getElementById(`message_${message._id}`);
        if (messageDiv) {
            const statusIcon = this.getStatusIcon(message.status);
            const statusEl = messageDiv.querySelector('.message-status');
            if (statusEl) {
                statusEl.innerHTML = statusIcon;
            }
        }
    }

    updateMessageStatus(messageId, status) {
        const message = this.messages.find(m => m._id === messageId);
        if (message) {
            message.status = status;
            this.updateMessageInUI(message);
        }
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Remove existing typing indicator
        const existing = messagesContainer.querySelector('.typing-indicator');
        if (existing) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingIndicator = messagesContainer?.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            if (this.socket && this.isConnected) {
                this.socket.emit('typing', {
                    customerId: this.customerId,
                    orderId: this.currentOrderId
                });
            }
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    stopTyping() {
        this.isTyping = false;
        if (this.socket && this.isConnected) {
            this.socket.emit('typingStop', {
                customerId: this.customerId,
                orderId: this.currentOrderId
            });
        }
        this.hideTypingIndicator();
    }

    async loadMessageHistory() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/messages?customerId=${this.customerId}`);
            if (response.ok) {
                const messages = await response.json();
                this.messages = messages;
                
                const messagesContainer = document.getElementById('chatMessages');
                if (messagesContainer && messages.length > 0) {
                    messagesContainer.innerHTML = '';
                    messages.forEach(message => {
                        this.addMessageToUI(message);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading message history:', error);
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    updateUnreadCount() {
        const chatWidget = document.getElementById('chatWidget');
        const chatButton = document.getElementById('chatWidgetButton');
        
        if (!chatWidget?.classList.contains('active')) {
            this.unreadCount++;
            
            let badge = chatButton?.querySelector('.badge');
            if (!badge && chatButton) {
                badge = document.createElement('span');
                badge.className = 'badge';
                chatButton.appendChild(badge);
            }
            
            if (badge) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            }
        } else {
            this.unreadCount = 0;
            const badge = chatButton?.querySelector('.badge');
            if (badge) badge.remove();
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

    getStatusIcon(status) {
        switch (status) {
            case 'sending':
                return '⏳';
            case 'sent':
                return '✓';
            case 'delivered':
                return '✓✓';
            case 'read':
                return '✓✓';
            case 'error':
                return '✕';
            default:
                return '✓';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachToOrder(orderId) {
        this.currentOrderId = orderId;
        this.joinChatRoom();
        
        // Add order context to chat
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            const existingContext = messagesContainer.querySelector('.chat-order-context');
            if (!existingContext) {
                const contextDiv = document.createElement('div');
                contextDiv.className = 'chat-order-context';
                contextDiv.innerHTML = `
                    <strong>Order #${orderId}</strong>
                    <p>Chatting about this order</p>
                    <a href="/orders.html?orderId=${orderId}" class="order-link">View Order Details →</a>
                `;
                messagesContainer.insertBefore(contextDiv, messagesContainer.firstChild);
            }
        }
    }
}

// Initialize chat system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatSystem = new ChatSystem();
    });
} else {
    window.chatSystem = new ChatSystem();
}




