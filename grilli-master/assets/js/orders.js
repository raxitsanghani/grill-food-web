// Orders Page JavaScript

class OrdersPage {
  constructor() {
    this.orders = [];
    this.socket = null;
    this.init();
  }

  init() {
    this.checkLoginStatus();
    this.loadOrders();
    this.syncOrdersWithServer(); // Sync with server first
    this.displayOrders();
    this.setupLogoutButton();
    this.initializeSocket();
  }

  setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (isLoggedIn && currentUser) {
      this.updateUserInfo(currentUser);
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
      }
    } else {
      // Don't redirect - let users browse freely
      // Just hide the logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    }
  }

  updateUserInfo(user) {
    // Update any user-specific elements on the page
  }

  loadOrders() {
    this.orders = JSON.parse(localStorage.getItem('grilliOrders') || '[]');
    
    // Sort orders by order time (newest first)
    this.orders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
  }

  displayOrders() {
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');

    if (this.orders.length === 0) {
      ordersList.style.display = 'none';
      noOrders.style.display = 'block';
      return;
    }

    ordersList.style.display = 'block';
    noOrders.style.display = 'none';

    ordersList.innerHTML = this.orders.map(order => this.createOrderCard(order)).join('');
  }

  createOrderCard(order) {
    const orderDate = new Date(order.orderTime);
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const status = this.getOrderStatus(order);
    const statusClass = this.getStatusClass(status);
    
    return `
      <div class="order-card food-order">
        <div class="order-header">
          <div class="order-info">
            <h3>${order.item.name}</h3>
            <div class="order-id">Order ID: ${order.id}</div>
            <div class="order-type">Food Order</div>
          </div>
          <div class="order-status ${statusClass}">${status}</div>
        </div>

        <div class="order-details">
          ${this.createFoodOrderDetails(order)}
        </div>

        <div class="order-meta">
          <div class="meta-item">
            <h5>Order Date</h5>
            <p>${formattedDate}</p>
          </div>
          ${this.createFoodOrderMeta(order)}
        </div>

        <div class="order-actions">
          <button class="btn btn-secondary" onclick="ordersPage.trackOrder('${order.id}')">
            Track Order
          </button>
          <button class="btn btn-primary" onclick="ordersPage.reorder('${order.id}')">Reorder</button>
        </div>
      </div>
    `;
  }



  createFoodOrderDetails(order) {
    return `
      <div class="order-item">
        ${order.item.image.startsWith('🪑') ? 
          `<div class="table-icon-large">${order.item.image}</div>` : 
          `<img src="${order.item.image}" alt="${order.item.name}">`
        }
        <div class="item-info">
          <h4>${order.item.name}</h4>
          <div class="quantity">Quantity: ${order.quantity}</div>
        </div>
      </div>

      <div class="order-summary">
        <h4>Order Summary</h4>
        <div class="summary-row">
          <span>Item Price:</span>
          <span>₹${(order.item.price * order.quantity).toLocaleString('en-IN')}</span>
        </div>
        <div class="summary-row">
          <span>Delivery Fee:</span>
          <span>₹40</span>
        </div>
        <div class="summary-row total">
          <span>Total Amount:</span>
          <span class="amount">₹${order.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    `;
  }



  createFoodOrderMeta(order) {
    return `
      <div class="meta-item">
        <h5>Delivery Address</h5>
        <p>${order.customerAddress}<br>${order.customerCity} - ${order.customerPincode}</p>
      </div>
      <div class="meta-item">
        <h5>Payment Method</h5>
        <p>${this.formatPaymentMethod(order.paymentMethod)}</p>
      </div>
      <div class="meta-item">
        <h5>Estimated Delivery</h5>
        <p>${order.estimatedDelivery}</p>
      </div>
    `;
  }

  getOrderStatus(order) {
    // Use the status from the order if it exists, otherwise calculate based on time
    if (order.status && order.status !== 'pending') {
      return order.status;
    }
    
    const orderTime = new Date(order.orderTime);
    const now = new Date();
    const timeDiff = now - orderTime;
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < 10) {
      return 'pending';
    } else if (minutesDiff < 25) {
      return 'preparing';
    } else if (minutesDiff < 35) {
      return 'out-for-delivery';
    } else {
      return 'delivered';
    }
  }

  getStatusClass(status) {
    const statusMap = {
      'pending': 'pending',
      'payment-done': 'payment-done',
      'preparing': 'preparing',
      'out-for-delivery': 'out-for-delivery',
      'delivered': 'delivered',
      'rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  formatPaymentMethod(method) {
    const methodMap = {
      'cod': 'Cash on Delivery',
      'upi': 'UPI Payment',
      'card': 'Credit/Debit Card',
      'netbanking': 'Net Banking'
    };
    return methodMap[method] || method;
  }

  trackOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const status = this.getOrderStatus(order);
    const statusText = this.getStatusText(status);
    
    alert(`Order Tracking: ${order.id}\n\nStatus: ${statusText}\n\nEstimated Delivery: ${order.estimatedDelivery}\n\nFor real-time updates, call our customer care at +91 9510261149`);
  }

  getStatusText(status) {
    const statusTextMap = {
      'pending': 'Order confirmed and received',
      'payment-done': 'Payment Successfully Completed!',
      'preparing': 'Your order is being prepared in the kitchen',
      'out-for-delivery': 'Your order is out for delivery',
      'delivered': 'Order delivered successfully',
      'rejected': 'Order has been rejected'
    };
    return statusTextMap[status] || 'Order confirmed';
  }

  reorder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    if (confirm(`Would you like to reorder ${order.item.name}?`)) {
      window.location.href = `./menu-item.html?id=${this.getItemId(order.item.name)}`;
    }
  }

  getItemId(itemName) {
    const itemMap = {
      'Greek Salad': 'greek-salad',
      'Lasagne': 'lasagne',
      'Butternut Pumpkin': 'butternut-pumpkin',
      'Tokusen Wagyu': 'tokusen-wagyu',
      'Olivas Rellenas': 'olivas-rellenas',
      'Opu Fish': 'opu-fish'
    };
    return itemMap[itemName] || 'greek-salad';
  }

  logout() {
    // Clear login status
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    // Redirect to main page
    window.location.href = './index.html';
  }

  initializeSocket() {
    // Connect to the user server for real-time updates
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('Connected to user server for real-time updates');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from user server');
    });

    // Listen for order status updates from admin
    this.socket.on('order-status-updated', (data) => {
      this.handleOrderStatusUpdate(data);
    });

    // Listen for new orders (if user is admin)
    this.socket.on('new-order', (order) => {
      console.log('New order received:', order);
    });
  }

  handleOrderStatusUpdate(data) {
    const { orderId, status, adminNotes, order } = data;
    
    console.log('🔄 Order status update received:', { orderId, status, adminNotes });
    
    // Find and update the order in local storage
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      // Update the order with new status and admin notes
      this.orders[orderIndex].status = status;
      this.orders[orderIndex].adminNotes = adminNotes || '';
      
      // If we have the full order object from server, update other fields too
      if (order) {
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          ...order,
          id: orderId // Ensure ID is preserved
        };
      }
      
      // Update localStorage
      localStorage.setItem('grilliOrders', JSON.stringify(this.orders));
      
      // Refresh the display
      this.displayOrders();
      
      // Show notification for status changes
      this.showStatusNotification(status, this.orders[orderIndex].item.name);
      
      console.log('✅ Order status updated successfully:', orderId, '->', status);
    } else {
      console.log('⚠️ Order not found in local storage:', orderId);
      // If order not found locally, try to sync with server
      this.syncOrdersWithServer();
    }
  }

  showStatusNotification(status, itemName) {
    let message = '';
    let type = 'info';
    
    switch (status) {
      case 'pending':
        message = `Your order for ${itemName} has been confirmed and is pending!`;
        type = 'info';
        break;
      case 'payment-done':
        message = `Payment completed! Your order for ${itemName} is being processed!`;
        type = 'success';
        break;
      case 'preparing':
        message = `Your order for ${itemName} is being prepared in the kitchen!`;
        type = 'info';
        break;
      case 'out-for-delivery':
        message = `Your order for ${itemName} is out for delivery!`;
        type = 'warning';
        break;
      case 'delivered':
        message = `Your order for ${itemName} has been delivered successfully!`;
        type = 'success';
        break;
      case 'rejected':
        message = `Your order for ${itemName} has been rejected. Please contact customer support.`;
        type = 'error';
        break;
      default:
        message = `Status updated for your order: ${itemName}`;
        type = 'info';
    }
    
    this.showToast(message, type);
  }

  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-width: 300px;
      font-size: 14px;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  }

  // Add method to sync orders with server
  async syncOrdersWithServer() {
    try {
      console.log('🔄 Syncing orders with server...');
      const response = await fetch('http://localhost:4000/api/orders');
      if (response.ok) {
        const serverOrders = await response.json();
        console.log(`📦 Received ${serverOrders.length} orders from server`);
        
        // Get local orders
        const localOrders = JSON.parse(localStorage.getItem('grilliOrders') || '[]');
        console.log(`📱 Found ${localOrders.length} orders in local storage`);
        
        // Merge server orders with local orders, avoiding duplicates
        const mergedOrders = [...localOrders];
        
        serverOrders.forEach(serverOrder => {
          const existingIndex = mergedOrders.findIndex(localOrder => localOrder.id === serverOrder._id);
          
          if (existingIndex === -1) {
            // This is a new order from server, add it
            const userOrder = {
              id: serverOrder._id,
              item: {
                name: serverOrder.itemName,
                price: serverOrder.unitPrice || serverOrder.subtotal,
                image: serverOrder.itemImage || './assets/images/menu-1.png'
              },
              quantity: serverOrder.quantity,
              totalAmount: serverOrder.totalPrice,
              customerName: serverOrder.customerName,
              customerPhone: serverOrder.customerPhone,
              customerEmail: serverOrder.customerEmail || '',
              customerAddress: serverOrder.customerAddress || 'Not specified',
              customerCity: serverOrder.customerCity || 'Not specified',
              customerPincode: serverOrder.customerPincode || 'Not specified',
              deliveryDate: serverOrder.deliveryDate,
              deliveryTime: serverOrder.deliveryTime,
              paymentMethod: serverOrder.paymentMethod,
              specialInstructions: serverOrder.specialInstructions || '',
              orderTime: serverOrder.orderDate || new Date().toISOString(),
              status: serverOrder.status || 'pending',
              estimatedDelivery: (serverOrder.deliveryDate || 'Not specified') + ' at ' + (serverOrder.deliveryTime || 'Not specified')
            };
            
            mergedOrders.unshift(userOrder);
            console.log(`➕ Added new order from server: ${serverOrder.itemName}`);
          } else {
            // Update existing order with server data
            const oldStatus = mergedOrders[existingIndex].status;
            mergedOrders[existingIndex].status = serverOrder.status || mergedOrders[existingIndex].status;
            mergedOrders[existingIndex].adminNotes = serverOrder.adminNotes || mergedOrders[existingIndex].adminNotes;
            
            if (oldStatus !== mergedOrders[existingIndex].status) {
              console.log(`🔄 Updated order status: ${serverOrder.itemName} - ${oldStatus} -> ${mergedOrders[existingIndex].status}`);
            }
          }
        });
        
        // Sort by order time (newest first)
        mergedOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
        
        // Update local storage and display
        this.orders = mergedOrders;
        localStorage.setItem('grilliOrders', JSON.stringify(mergedOrders));
        this.displayOrders();
        
        console.log(`✅ Orders synced successfully. Total: ${mergedOrders.length}`);
      } else {
        console.error('❌ Failed to sync orders with server:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error syncing orders with server:', error);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ordersPage = new OrdersPage();
});
// Handle preloader
window.addEventListener('load', function () {
  const preloader = document.querySelector("[data-preaload]");
  if (preloader) {
    preloader.classList.add("loaded");
    document.body.classList.add("loaded");
  }
});

