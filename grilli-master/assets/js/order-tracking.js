/**
 * Order Tracking Visual Timeline
 * Provides visual timeline for order status tracking
 */

class OrderTrackingTimeline {
    constructor() {
        this.statuses = [
            { id: 'pending', label: 'Order Placed', icon: '📝', color: '#ff9800' },
            { id: 'confirmed', label: 'Confirmed', icon: '✅', color: '#4caf50' },
            { id: 'preparing', label: 'Preparing', icon: '👨‍🍳', color: '#2196f3' },
            { id: 'out-for-delivery', label: 'Out for Delivery', icon: '🚚', color: '#9c27b0' },
            { id: 'delivered', label: 'Delivered', icon: '🎉', color: '#4caf50' }
        ];
    }

    /**
     * Create timeline HTML
     * @param {Object} order - Order object with status
     * @returns {string} Timeline HTML
     */
    createTimeline(order) {
        const currentStatusIndex = this.getStatusIndex(order.status || 'pending');
        
        return `
            <div class="order-timeline" role="status" aria-label="Order tracking timeline">
                ${this.statuses.map((status, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isPending = index > currentStatusIndex;
                    
                    return `
                        <div class="timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}"
                             data-status="${status.id}">
                            <div class="timeline-marker">
                                <div class="timeline-icon">${status.icon}</div>
                                ${isCompleted && !isCurrent ? '<div class="timeline-check">✓</div>' : ''}
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-label">${status.label}</div>
                                ${isCurrent ? `<div class="timeline-time">${this.getStatusTime(order, status.id)}</div>` : ''}
                            </div>
                            ${index < this.statuses.length - 1 ? '<div class="timeline-line"></div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Get status index
     */
    getStatusIndex(status) {
        return this.statuses.findIndex(s => s.id === status);
    }

    /**
     * Get status time
     */
    getStatusTime(order, statusId) {
        const statusMap = {
            'pending': order.orderTime,
            'confirmed': order.confirmedTime,
            'preparing': order.preparingTime,
            'out-for-delivery': order.outForDeliveryTime,
            'delivered': order.deliveredTime
        };

        const time = statusMap[statusId];
        if (!time) return '';

        const date = new Date(time);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Render timeline in container
     */
    render(containerId, order) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container with ID "${containerId}" not found`);
            return;
        }

        container.innerHTML = this.createTimeline(order);
    }
}

// CSS for order timeline
const orderTimelineStyles = `
.order-timeline {
    position: relative;
    padding: 20px 0;
}

.timeline-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 30px;
}

.timeline-item:last-child {
    margin-bottom: 0;
}

.timeline-marker {
    position: relative;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--eerie-black-2, #1d1d1d);
    border: 3px solid var(--eerie-black-3, #141414);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s ease;
    z-index: 2;
}

.timeline-item.completed .timeline-marker {
    background: #4caf50;
    border-color: #4caf50;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
}

.timeline-item.current .timeline-marker {
    background: var(--gold-crayola, #ffd700);
    border-color: var(--gold-crayola, #ffd700);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
    animation: pulse-timeline 2s infinite;
}

.timeline-item.pending .timeline-marker {
    background: var(--eerie-black-2, #1d1d1d);
    border-color: var(--eerie-black-3, #141414);
    opacity: 0.5;
}

.timeline-icon {
    font-size: 2rem;
    line-height: 1;
}

.timeline-check {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 2rem;
    font-weight: bold;
}

.timeline-content {
    flex: 1;
    padding-top: 8px;
}

.timeline-label {
    font-size: 1.6rem;
    font-weight: var(--weight-bold, 700);
    color: var(--white, #fff);
    margin-bottom: 4px;
}

.timeline-item.completed .timeline-label {
    color: #4caf50;
}

.timeline-item.current .timeline-label {
    color: var(--gold-crayola, #ffd700);
}

.timeline-item.pending .timeline-label {
    color: var(--quick-silver, #a6a6a6);
}

.timeline-time {
    font-size: 1.2rem;
    color: var(--quick-silver, #a6a6a6);
    margin-top: 4px;
}

.timeline-line {
    position: absolute;
    left: 25px;
    top: 50px;
    width: 3px;
    height: calc(100% + 30px);
    background: var(--eerie-black-3, #141414);
    z-index: 1;
}

.timeline-item.completed .timeline-line {
    background: #4caf50;
}

.timeline-item:last-child .timeline-line {
    display: none;
}

@keyframes pulse-timeline {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .timeline-marker {
        width: 40px;
        height: 40px;
    }
    
    .timeline-icon {
        font-size: 1.6rem;
    }
    
    .timeline-label {
        font-size: 1.4rem;
    }
    
    .timeline-item {
        gap: 15px;
        margin-bottom: 25px;
    }
    
    .timeline-line {
        left: 20px;
        top: 40px;
    }
}
`;

// Inject styles
if (!document.getElementById('order-timeline-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'order-timeline-styles';
    styleSheet.textContent = orderTimelineStyles;
    document.head.appendChild(styleSheet);
}

// Export
window.OrderTrackingTimeline = OrderTrackingTimeline;

