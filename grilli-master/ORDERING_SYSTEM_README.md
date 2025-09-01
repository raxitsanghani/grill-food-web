# Grilli Restaurant - Complete Ordering System

## Overview
This is a fully functional restaurant ordering system similar to Zomato, built for the Grilli restaurant website. The system includes individual menu item pages, complete ordering functionality, Indian payment methods, and order tracking.

## Features Implemented

### 🍽️ Menu System
- **Clickable Menu Items**: Each menu item is now clickable and opens a detailed page
- **Individual Item Pages**: Full details, images, descriptions, and pricing
- **Quantity Selection**: Choose quantity from 1-10 items
- **Real-time Price Calculation**: Automatic total calculation including delivery fee

### 🚚 Delivery & Timing
- **Smart Delivery Time**: Calculates delivery time based on item preparation time
- **Peak Hour Adjustments**: Automatically adds extra time during busy hours (12-2 PM, 7-9 PM)
- **Delivery Fee**: Standard ₹40 delivery fee for all orders
- **Real-time Updates**: Dynamic delivery time based on current restaurant status

### 💳 Payment Methods (Indian Focus)
- **Cash on Delivery (COD)**: Pay when you receive your order
- **UPI Payment**: Google Pay, PhonePe, Paytm integration ready
- **Credit/Debit Cards**: Visa, MasterCard, RuPay support
- **Net Banking**: All major Indian banks supported

### 📋 Ordering Process
1. **Customer Details**: Name, phone, address, city, pincode
2. **Payment Selection**: Choose from available payment methods
3. **Order Summary**: Review item, quantity, and total amount
4. **Order Confirmation**: Get order ID and estimated delivery time

### 📱 Order Management
- **Order History**: View all previous orders
- **Order Tracking**: Real-time status updates
- **Reorder Function**: Easy reordering of previous items
- **Order Status**: Confirmed → Preparing → Out for Delivery → Delivered

### 🔄 User Experience
- **Auto-fill Forms**: Remembers customer details for future orders
- **Responsive Design**: Works perfectly on all devices
- **Smooth Navigation**: Seamless flow between pages
- **Professional UI**: Modern, restaurant-grade interface

## How to Use

### 1. Browse Menu
- Visit the main page and scroll to the menu section
- Click on any menu item (image or title) to view details

### 2. Order Food
- On the item page, select quantity
- Click "Order Now" button
- Fill in delivery details
- Choose payment method
- Review and confirm order

### 3. Track Orders
- Navigate to "My Orders" page
- View order history and current status
- Track delivery progress
- Reorder favorite items

## Technical Implementation

### Files Created/Modified
- `menu-item.html` - Individual menu item pages
- `menu-item.css` - Styling for item pages
- `menu-item.js` - Item page functionality
- `orders.html` - Order tracking page
- `orders.css` - Order page styling
- `orders.js` - Order management logic
- `index.html` - Updated with clickable menu items
- `style.css` - Enhanced menu card interactions

### Data Storage
- **LocalStorage**: Orders and customer details stored locally
- **Order Structure**: Complete order information with timestamps
- **Customer Profiles**: Saved delivery information for convenience

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Responsive grid layouts
- **Desktop Experience**: Full-featured desktop interface

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Local Development

### Setup
1. Clone the repository
2. Open `index.html` in a web browser
3. No build process required - pure HTML/CSS/JavaScript

### Testing
1. Click on menu items to test navigation
2. Place test orders to verify functionality
3. Check order tracking and history
4. Test responsive design on different screen sizes

## Future Enhancements

### Planned Features
- **Real Payment Gateway**: Integration with Razorpay/PayU
- **SMS Notifications**: Order status updates via SMS
- **Push Notifications**: Browser push notifications
- **Admin Panel**: Restaurant order management
- **Analytics**: Order analytics and reporting

### API Integration Ready
- **Backend Ready**: Structure supports API integration
- **Database Schema**: Designed for scalable data storage
- **Authentication**: User login system in place

## Support & Contact

### Customer Care
- **Phone**: +91 9510261149
- **Email**: raxitsanghani@gmail.com
- **Hours**: 24/7 Support Available

### Technical Support
- **Documentation**: This README file
- **Code Comments**: Well-documented JavaScript
- **Responsive Design**: Mobile-first approach

## License
This project is part of the Grilli restaurant website. All rights reserved.

---

**Note**: This is a fully functional demo system. For production use, integrate with real payment gateways and backend services.
