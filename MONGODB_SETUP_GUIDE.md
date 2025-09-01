# 🍽️ MongoDB Setup Guide for Grilli Restaurant Website

## 📋 Prerequisites

Before setting up MongoDB, make sure you have:
- [Node.js](https://nodejs.org/) (v14 or higher) installed
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed locally
- Your project files ready

## 🚀 Quick Setup Steps

### 1. Install MongoDB Community Server

#### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Choose "Complete" installation
4. Install MongoDB Compass (the GUI tool) when prompted
5. MongoDB will be installed as a Windows service

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

#### Linux (Ubuntu):
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Create Environment File

Create a `.env` file in your project root (same level as `server.js`):

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/grilli_restaurant

# Server Configuration
PORT=4000

# JWT Secret for Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Optional: MongoDB Atlas (if you want to use cloud MongoDB later)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/grilli_restaurant
```

### 3. Start MongoDB Service

#### Windows:
- MongoDB should start automatically as a Windows service
- To check: Open Services app → look for "MongoDB" service
- If not running, right-click and select "Start"

#### macOS/Linux:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start if not running
sudo systemctl start mongod
```

### 4. Install Dependencies

```bash
# Navigate to your project directory
cd /path/to/your/project

# Install dependencies (if not already done)
npm install
```

### 5. Start Your Server

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

## 🔍 Verify MongoDB Connection

When you start your server, you should see:

```
🚀 Server is running on http://localhost:4000
📁 Project directory: /path/to/your/project/grilli-master
💾 MongoDB: mongodb://localhost:27017/grilli_restaurant
📊 API endpoints available at http://localhost:4000/api/*
🔍 Health check: http://localhost:4000/api/health
📝 Press Ctrl+C to stop the server
✅ Connected to MongoDB successfully!
📊 Database: mongodb://localhost:4000/grilli_restaurant
```

## 🧪 Test Your Setup

### 1. Health Check
Visit: `http://localhost:4000/api/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "Connected"
}
```

### 2. Initialize Default Menu
Visit: `http://localhost:4000/api/init-menu`

This will populate your database with default menu items.

### 3. View Menu Items
Visit: `http://localhost:4000/api/menu-items`

This should return an array of menu items.

## 🗄️ Database Structure

Your MongoDB database will have the following collections:

### Menu Items Collection
```javascript
{
  _id: ObjectId,
  name: String,           // Product name
  type: String,           // "veg" or "non-veg"
  price: Number,          // Price in rupees
  badge: String,          // Optional badge (e.g., "Popular", "New")
  image: String,          // Base64 encoded image or URL
  description: String,    // Product description
  deliveryTime: String,   // Delivery time estimate
  prepTime: Number,       // Preparation time in minutes
  createdAt: Date         // When item was created
}
```

## 🔧 Troubleshooting

### MongoDB Connection Issues

#### Error: "MongoDB connection error"
**Solution:**
1. Check if MongoDB service is running
2. Verify MongoDB is installed correctly
3. Check if port 27017 is available

#### Error: "ECONNREFUSED"
**Solution:**
1. Start MongoDB service
2. Check firewall settings
3. Verify MongoDB is listening on localhost:27017

### Port Already in Use

#### Error: "EADDRINUSE"
**Solution:**
1. Change PORT in `.env` file
2. Kill process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -i :4000
   kill -9 <PID>
   ```

### Permission Issues

#### Error: "EACCES" or "Permission denied"
**Solution:**
1. Run terminal as Administrator (Windows)
2. Use `sudo` for MongoDB commands (macOS/Linux)
3. Check file permissions

## 🌐 Using MongoDB Atlas (Cloud)

If you prefer cloud MongoDB:

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` file with Atlas connection string

## 📱 API Endpoints

Your server provides these endpoints:

- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Add new menu item
- `PUT /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item
- `POST /api/init-menu` - Initialize default menu
- `GET /api/health` - Server health check

## 🎯 Next Steps

After successful setup:

1. **Test the Add Items page**: Navigate to "Add Items" in your website
2. **Add new menu items**: Use the form to add products
3. **View in main menu**: Check if new items appear on the main page
4. **Test CRUD operations**: Add, edit, and delete menu items

## 🆘 Need Help?

If you encounter issues:

1. Check the console output for error messages
2. Verify MongoDB service is running
3. Check your `.env` file configuration
4. Ensure all dependencies are installed
5. Check if ports are available

## 🔒 Security Notes

- Change the `JWT_SECRET` in production
- Use environment variables for sensitive data
- Consider using MongoDB Atlas for production
- Implement proper authentication and authorization
- Use HTTPS in production

---

**Happy coding! 🚀 Your restaurant website is now powered by MongoDB!**
