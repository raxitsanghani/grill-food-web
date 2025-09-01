# Grilli Restaurant Login System

## Overview
This project now includes a complete login system that:
1. Shows a grill animation on page load
2. Displays a login/signup modal
3. Updates contact information based on logged-in user
4. Maintains customer care contact details separately

## How It Works

### 1. Initial Load
- Page starts with a grill animation (3 seconds)
- Main content is hidden initially
- Login modal appears after animation

### 2. Login/Signup Process
- Users can switch between login and signup forms
- Signup requires: email, phone, password, confirm password
- Login requires: email and password
- Data is stored in browser localStorage

### 3. After Successful Login
- Login modal disappears
- Main content becomes visible
- Top bar contact info updates to user's details
- Logout button appears in header

### 4. Customer Care Section
- Located in footer
- Always shows: raxitsanghani@gmail.com and +91 9510261149
- These are static contact details for customer support

## Testing the System

### Option 1: Test with Main Site
1. Open `index.html` in a web browser
2. You should see the grill animation first
3. Then the login modal appears
4. Create a new account or login with existing credentials
5. After login, the main restaurant site will be visible

### Option 2: Test with Simple Test Page
1. Open `test.html` in a web browser
2. This provides a simplified test environment
3. Same login flow but with minimal content

## Test Credentials
- Create a new account using the signup form
- Or use these sample credentials (after creating them):
  - Email: test@example.com
  - Phone: 1234567890
  - Password: test123

## Features
- ✅ Grill animation on load
- ✅ Login/signup modal with blur background
- ✅ Form validation
- ✅ User data persistence (localStorage)
- ✅ Dynamic contact information updates
- ✅ Logout functionality
- ✅ Customer care section with static contact details
- ✅ All original restaurant features preserved

## File Structure
- `index.html` - Main restaurant site with login system
- `test.html` - Simple test page for login system
- `assets/css/login.css` - Login modal and animation styles
- `assets/js/login.js` - Login system functionality
- `assets/css/style.css` - Original restaurant styles
- `assets/js/script.js` - Original restaurant functionality

## Troubleshooting
If the login system doesn't work:
1. Check browser console for JavaScript errors
2. Ensure all files are in the correct directories
3. Verify that localStorage is enabled in your browser
4. Try opening the test.html file first to isolate issues

## Browser Compatibility
- Modern browsers with ES6 support
- localStorage enabled
- CSS backdrop-filter support (for blur effect)
