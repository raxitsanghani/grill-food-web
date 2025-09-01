# Grilli Admin Panel

## Overview
The admin panel is now split into two separate pages:
1. **Login Page** (`index.html`) - For admin authentication
2. **Dashboard Page** (`dashboard.html`) - The main admin interface

## How It Works

### 1. Login Flow
- Admin visits `/admin` (serves `index.html`)
- Enters credentials (email, password, security key)
- Upon successful login, automatically redirects to `/admin/dashboard` (serves `dashboard.html`)

### 2. Dashboard Features
- **Dashboard Overview**: Shows statistics (total orders, pending orders, menu items, today's revenue)
- **Menu Management**: Add, edit, delete menu items
- **Order Management**: View and update order statuses
- **Real-time Updates**: Socket.IO integration for live updates

### 3. Authentication
- JWT tokens stored in localStorage
- Automatic token validation on dashboard load
- Redirects to login if token is invalid or expired

## File Structure
```
admin-panel/
├── index.html          # Login page
├── dashboard.html      # Main dashboard
├── script.js           # Login page logic
├── dashboard.js        # Dashboard functionality
├── styles.css          # Login page styles
└── README.md           # This file
```

## API Endpoints

### Authentication
- `POST /api/admin/setup` - Create admin account
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `GET /api/admin/check-auth` - Check authentication status

### Menu Items
- `GET /api/admin/menu-items` - Get all menu items
- `POST /api/admin/menu-items` - Create new menu item
- `PUT /api/admin/menu-items/:id` - Update menu item
- `DELETE /api/admin/menu-items/:id` - Delete menu item

### Orders
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status

### Dashboard
- `GET /api/admin/dashboard-stats` - Get dashboard statistics

## Usage

### Starting the Admin Server
```bash
npm run admin
# or
node admin-server.js
```

### Accessing the Admin Panel
1. Open `http://localhost:4001/admin` in your browser
2. Login with admin credentials
3. You'll be automatically redirected to the dashboard
4. Use the dashboard to manage menu items and orders

### Features
- ✅ **Separate Dashboard Page**: Completely independent from the main website
- ✅ **Real-time Updates**: Live order notifications and menu updates
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Secure Authentication**: JWT-based security
- ✅ **Menu Management**: Full CRUD operations for menu items
- ✅ **Order Management**: Update order statuses with admin notes

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- Security key requirement (6-digit code)
- Automatic token validation
- Secure logout with token removal

## Real-time Features
- New order notifications
- Live menu updates
- Order status changes
- Socket.IO integration

## Troubleshooting

### Dashboard Not Loading
- Check if admin server is running on port 4001
- Verify JWT token in localStorage
- Check browser console for errors

### Login Issues
- Ensure admin account exists
- Verify email, password, and security key
- Check server logs for authentication errors

### Real-time Updates Not Working
- Verify Socket.IO connection
- Check if admin server is accessible
- Ensure proper CORS configuration
