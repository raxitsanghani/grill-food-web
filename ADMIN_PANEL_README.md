# Grilli Restaurant Admin Panel

A secure, feature-rich admin panel for managing restaurant operations including menu items, orders, and customer management.

## Features

### 🔐 Secure Authentication
- **First-time Setup**: Account creation with admin credentials
- **Secure Login**: Email, password, and 6-digit security key required
- **JWT Token Authentication**: Secure session management
- **Password Protection**: Eye button to show/hide passwords

### 📊 Dashboard
- **Real-time Statistics**: Total orders, pending orders, menu items, daily revenue
- **Quick Actions**: Easy access to menu management and order management
- **Visual Cards**: Beautiful, interactive interface elements

### 🍽️ Menu Management
- **Add Items**: Create new menu items with photos, names, prices, delivery times
- **Edit Items**: Modify existing menu items
- **Delete Items**: Remove items from the menu
- **Image Support**: Automatic image resizing and optimization
- **Categorization**: Vegetarian/Non-vegetarian classification
- **Badge System**: Special labels (Popular, Chef Special, etc.)

### 📋 Order Management
- **Real-time Updates**: Live order status tracking
- **Status Management**: 
  - Pending → Payment Done → Preparing → Out for Delivery → Delivered
  - Reject orders if needed
- **Customer Details**: View customer information and special instructions
- **Admin Notes**: Add internal notes about orders
- **Filtering**: Filter orders by status

### 🎨 Theme & Design
- **Consistent Branding**: Matches main website theme exactly
- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean, professional interface
- **Color Scheme**: Dark theme with gold accents (Grilli brand colors)

## Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd grilli-master

# Install dependencies
npm install

# Copy environment template
cp env-template.txt .env

# Edit .env file with your values
nano .env
```

### 3. Environment Configuration

Edit the `.env` file with your configuration:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/grilli-restaurant

# JWT Secret Key (Change this to a secure random string!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Server Port
ADMIN_PORT=4001

# Main Server Port
PORT=4000
```

### 4. Database Setup

```bash
# Start MongoDB (if using local installation)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env file
```

### 5. Running the Application

```bash
# Start both servers (main + admin)
npm run start:all

# Or start them separately:
# Main server (user side)
npm run start

# Admin server
npm run admin

# Development mode with auto-reload
npm run dev:all
```

## User Experience Flow

### 1. Loading Screen
- **Duration**: 2 seconds
- **Content**: Grilli logo, animated text, and loading spinner
- **Purpose**: Brand introduction and smooth transition

### 2. Authentication
- **Default View**: Login form appears first
- **Signup Option**: "Don't have an admin account? Create one" link
- **Required Fields**: Email, Password, 6-digit Security Key

### 3. Admin Dashboard
After successful authentication, admin is redirected to dashboard with two main options:
- **Update Orders**: Manage customer orders and update status
- **Add Items**: Add, edit, and remove menu items

## First-Time Setup

### 1. Access Admin Panel
Navigate to `http://localhost:4001` in your browser.

### 2. Loading Screen
Wait for the 2-second loading screen to complete.

### 3. Create Admin Account
- Click "Don't have an admin account? Create one" on the login page
- Fill in the account creation form:
  - **Full Name**: Your complete name
  - **Mobile Number**: Contact number
  - **Email**: Your email address
  - **Password**: Strong password (minimum 6 characters)
  - **Confirm Password**: Re-enter your password
  - **Security Key**: 6-digit number (remember this!)
- Click "Create Admin Account"

### 4. Login
- Use your email, password, and security key
- You'll be redirected to the dashboard

## Usage Guide

### Dashboard
- View restaurant statistics at a glance
- Two main action buttons:
  - **Update Orders**: Manage customer orders and update status
  - **Add Items**: Manage menu items (add, edit, remove)

### Adding Menu Items
1. Click "Add Items" from dashboard
2. Click "+ Add New Item" button
3. Fill in the form:
   - **Item Name**: Food item name
   - **Type**: Vegetarian or Non-vegetarian
   - **Price**: Cost in rupees
   - **Badge**: Optional special label
   - **Delivery Time**: Estimated delivery time
   - **Preparation Time**: Cooking time in minutes
   - **Description**: Item description
   - **Image URL**: Link to food image
4. Click "Save Item"

### Managing Orders
1. Click "Update Orders" from dashboard
2. View all orders with current status
3. Filter by status using the dropdown
4. Click "View Details" on any order
5. Update status and add admin notes
6. Click "Update Status" to save changes

### Navigation
- **Back Button**: Always available to return to dashboard
- **Logout**: Available in top-right header
- **Responsive Design**: Works on mobile and desktop

## Security Features

- **JWT Authentication**: Secure token-based sessions
- **Password Hashing**: Bcrypt encryption for passwords
- **Security Key**: Additional 6-digit verification
- **Session Management**: Automatic token expiration
- **Input Validation**: Server-side validation for all inputs
- **Unique Email Policy**: One email can only have one admin account
- **Password Confirmation**: Must confirm password during signup
- **Password Strength**: Minimum 6 characters required

## API Endpoints

### Authentication
- `POST /api/admin/setup` - Create admin account
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile

### Menu Management
- `GET /api/admin/menu-items` - Get all menu items
- `POST /api/admin/menu-items` - Add new menu item
- `PUT /api/admin/menu-items/:id` - Update menu item
- `DELETE /api/admin/menu-items/:id` - Delete menu item

### Order Management
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status

### Dashboard
- `GET /api/admin/dashboard-stats` - Get dashboard statistics

## Real-time Updates

The admin panel uses Socket.IO for real-time updates:
- Menu changes are instantly reflected on the user side
- Order status updates are synchronized in real-time
- No page refresh needed for updates

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Ensure database name is correct

2. **Port Already in Use**
   - Change port numbers in `.env`
   - Kill processes using the ports
   - Restart the application

3. **Admin Account Creation Fails**
   - Check all required fields are filled
   - Ensure security key is exactly 6 digits
   - Verify email format is correct

4. **Images Not Loading**
   - Check image URLs are accessible
   - Ensure proper image format (JPG, PNG, etc.)
   - Verify internet connection for external images

### Error Messages

- **"All fields are required"**: Fill in all form fields
- **"Security key must be exactly 6 digits"**: Use 6-digit number
- **"Email already registered"**: Use different email address
- **"Invalid credentials"**: Check email, password, and security key

## Production Deployment

### Security Checklist
- [ ] Change JWT_SECRET to secure random string
- [ ] Use HTTPS in production
- [ ] Set up proper MongoDB authentication
- [ ] Configure firewall rules
- [ ] Use environment-specific configurations

### Performance Optimization
- [ ] Enable MongoDB indexing
- [ ] Use CDN for images
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging

## Support

For technical support or questions:
1. Check this README first
2. Review error logs in the console
3. Verify all setup steps are completed
4. Check MongoDB connection and data

## License

This project is licensed under the MIT License.

---

**Note**: This admin panel is designed specifically for the Grilli restaurant website. Ensure all branding, colors, and functionality align with your restaurant's requirements.
