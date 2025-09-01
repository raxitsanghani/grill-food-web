# Render Deployment Guide for Grilli Restaurant App

## Overview
This guide explains how to deploy your Grilli Restaurant application on Render with a single unified server that handles both user and admin functionality.

## What Was Changed

### 1. Unified Server (`unified-server.js`)
- **Combined** both user server (`server.js`) and admin server (`admin-server.js`) into a single Express application
- **Single Port**: Uses only one port (4000 or Render's assigned port)
- **Route Structure**:
  - User routes: `/` (homepage), `/all-menu`, `/orders`
  - Admin routes: `/admin` (admin panel)
  - API routes: `/api/*` (user APIs), `/api/admin/*` (admin APIs)

### 2. Updated Frontend Files
- **Admin Panel**: Updated all API calls to use relative paths (`/api/admin/*`)
- **User Frontend**: Updated all API calls to use relative paths (`/api/*`)
- **Socket.IO**: Updated to connect to the same server (no hardcoded ports)

### 3. Package.json
- **Main Entry**: Changed from `server.js` to `unified-server.js`
- **Start Script**: Updated to run the unified server

## Deployment Steps

### Step 1: Prepare Your Repository
1. **Commit all changes** to your Git repository
2. **Push to GitHub/GitLab** (Render needs access to your code)

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub/GitLab account
3. Connect your repository

### Step 3: Deploy on Render

#### Option A: Web Service (Recommended)
1. **Click "New +"** → **"Web Service"**
2. **Connect Repository**: Select your Grilli repository
3. **Configure Service**:
   - **Name**: `grilli-restaurant-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or upgrade as needed)

#### Option B: Manual Configuration
```yaml
# render.yaml (optional - create this file in your repo root)
services:
  - type: web
    name: grilli-restaurant-app
    env: node
    buildCommand: npm install
    startCommand: npm start
    plan: free
```

### Step 4: Environment Variables (Optional)
If you need custom configuration:
- **JWT_SECRET**: Your secret key for admin authentication
- **PORT**: Render will set this automatically

### Step 5: Deploy
1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Get your URL**: `https://grill-food-web.onrender.com`

## Access Your Deployed App

### User Website
- **URL**: `https://grill-food-web.onrender.com`
- **Features**: Menu browsing, ordering, user authentication

### Admin Panel
- **URL**: `https://grill-food-web.onrender.com/admin`
- **Features**: Menu management, order tracking, admin authentication

## Important Notes

### 1. Single Port Architecture
- ✅ **Render Compatible**: Uses only one port as required by Render
- ✅ **Cost Effective**: No need for multiple services
- ✅ **Simple Management**: One deployment, one URL

### 2. Route Structure
```
https://grill-food-web.onrender.com/           → User homepage
https://grill-food-web.onrender.com/all-menu   → Menu page
https://grill-food-web.onrender.com/orders     → Orders page
https://grill-food-web.onrender.com/admin      → Admin panel
https://grill-food-web.onrender.com/api/*      → User APIs
https://grill-food-web.onrender.com/api/admin/* → Admin APIs
```

### 3. Database
- **Local JSON Database**: Data persists in Render's file system
- **No External Database**: No additional setup required
- **Automatic Backups**: Render handles file persistence

### 4. Real-time Features
- **Socket.IO**: Works seamlessly with the unified server
- **Live Updates**: Menu changes and order updates in real-time
- **Cross-Origin**: Configured to work with Render's domain

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check your package.json has correct start script
"start": "node unified-server.js"
```

#### 2. Port Issues
```javascript
// The unified server automatically uses Render's PORT
const PORT = process.env.PORT || 4000;
```

#### 3. Static File Issues
```javascript
// Static files are served correctly
app.use(express.static(path.join(__dirname, 'grilli-master')));
app.use('/admin', express.static(path.join(__dirname, 'admin-panel')));
```

#### 4. API Endpoint Issues
- **User APIs**: Use `/api/*` (not `http://localhost:4000/api/*`)
- **Admin APIs**: Use `/api/admin/*` (not `http://localhost:4001/api/admin/*`)

### Debugging
1. **Check Render Logs**: Go to your service → "Logs" tab
2. **Test Endpoints**: Use the health check `/api/health`
3. **Verify Routes**: Test both user and admin URLs

## Performance Considerations

### Free Tier Limitations
- **Sleep Mode**: Free apps sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes ~30 seconds
- **Bandwidth**: 100GB/month limit

### Upgrade Options
- **Starter Plan**: $7/month - No sleep mode, better performance
- **Standard Plan**: $25/month - More resources, better reliability

## Security Notes

### 1. Admin Authentication
- **JWT Tokens**: Secure admin authentication
- **Security Keys**: 6-digit security keys for admin access
- **Protected Routes**: All admin APIs require authentication

### 2. CORS Configuration
```javascript
// Configured for Render deployment
cors: {
    origin: "*", // Allow all origins for Render
    methods: ["GET", "POST", "PUT", "DELETE"]
}
```

### 3. Environment Variables
- **JWT_SECRET**: Set a strong secret in Render dashboard
- **No Hardcoded Secrets**: All sensitive data uses environment variables

## Monitoring

### Health Checks
- **Endpoint**: `https://your-app.onrender.com/api/health`
- **Response**: Server status, timestamp, database info

### Logs
- **Access**: Render Dashboard → Your Service → Logs
- **Real-time**: View live logs during development
- **Historical**: Access past logs for debugging

## Success Checklist

- [ ] Repository pushed to GitHub/GitLab
- [ ] Render account created and connected
- [ ] Web service deployed successfully
- [ ] User website accessible at main URL
- [ ] Admin panel accessible at `/admin`
- [ ] Menu items loading correctly
- [ ] Ordering system working
- [ ] Admin authentication working
- [ ] Real-time updates functioning
- [ ] Health check endpoint responding

## Support

### Render Documentation
- [Render Docs](https://render.com/docs)
- [Node.js Deployment](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)

### Your App Structure
```
your-repo/
├── unified-server.js          # Main server file
├── package.json               # Dependencies and scripts
├── local-db.js               # Database layer
├── grilli-master/            # User frontend
├── admin-panel/              # Admin frontend
└── data/                     # JSON data files
```

## Next Steps

1. **Deploy**: Follow the deployment steps above
2. **Test**: Verify all functionality works
3. **Monitor**: Check logs and performance
4. **Scale**: Upgrade plan if needed
5. **Custom Domain**: Add your own domain (optional)

Your Grilli Restaurant app is now ready for production deployment on Render! 🚀
