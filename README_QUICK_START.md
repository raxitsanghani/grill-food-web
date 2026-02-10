# 🚀 Grilli Restaurant Management System - Quick Start Guide

## ✅ System Status: WORKING ✅

Your Grilli Restaurant Management System is now fully functional and ready to use!

## 🎯 How to Start the System

### Option 1: Start the Unified Server (Recommended)
```bash
node unified-server.js
```

### Option 2: Use NPM Script
```bash
npm start
```

### Option 3: Use the Custom Start Script
```bash
node start-server.js
```

## 🌐 Access Points

Once the server is running, you can access:

- **📱 Main Selection Page**: http://localhost:5000/
- **🍽️ User Web Panel**: http://localhost:5000/user
- **⚙️ Admin Panel**: http://localhost:5000/admin
- **📊 Health Check**: http://localhost:5000/api/health

## 🔧 System Features

### User Panel Features ✅
- Browse restaurant menu
- Place food orders
- View order history ("My Orders")
- User authentication (login/signup)
- Real-time order tracking
- Multiple payment options

### Admin Panel Features ✅
- Manage menu items (add/edit/delete)
- View and process orders
- Manage riders
- Manage chefs
- Real-time order monitoring
- Admin authentication
- Dashboard with statistics

## 💾 Database Options

### Option 1: Local JSON Database (Default)
- No setup required
- Data stored in local JSON files
- Perfect for development and testing

### Option 2: MongoDB Database
Set your MongoDB connection string:
```bash
set MONGODB_URI=your-mongodb-connection-string
node unified-server.js
```

## 🎨 Recent Improvements

### ✨ Modern Selection Page
- Professional UI with gold and navy color scheme
- Smooth animations and hover effects
- Side-by-side layout for User/Admin cards
- Responsive design for all devices

### 🔄 Real-Time Features
- Socket.IO integration for live updates
- Order status changes sync between admin and user
- Real-time notifications

### 🛡️ Enhanced Security
- JWT authentication for admin panel
- Secure API endpoints
- Input validation and sanitization

## 📁 Project Structure

```
grilli-master/
├── unified-server.js          # Main server (recommended)
├── server.js                  # Alternative user server
├── admin-server.js            # Alternative admin server
├── selection.html             # Landing page
├── grilli-master/            # User panel files
│   ├── index.html            # Main user interface
│   ├── assets/               # CSS, JS, images
│   └── ...
├── admin-panel/              # Admin panel files
│   ├── dashboard.html        # Admin dashboard
│   ├── index.html           # Admin login
│   └── ...
└── data/                     # Local database files
```

## 🚨 Troubleshooting

### Server Not Starting?
1. Make sure dependencies are installed: `npm install`
2. Check if port 5000 is available
3. Look for error messages in the console

### Can't Access Pages?
1. Verify server is running: http://localhost:5000/api/health
2. Check browser console for errors
3. Ensure you're using the correct URLs

### Database Issues?
1. Local JSON: Files in `data/` folder are readable/writable
2. MongoDB: Check connection string and database accessibility

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the server console for error messages
3. Ensure all dependencies are installed
4. Verify the correct server is running

---

**🎉 Your system is ready to use! Visit http://localhost:5000/ to get started.**
