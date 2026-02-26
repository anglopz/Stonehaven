# 🚀 Stonehaven - Setup Guide

## 📋 Project Overview

**Stonehaven** is a full-stack campground application built with:
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Template Engine**: EJS
- **Authentication**: Passport.js (Local Strategy)
- **Image Storage**: Cloudinary
- **Maps**: Mapbox
- **Security**: Helmet, Express Mongo Sanitize, Sanitize HTML

## ✅ Prerequisites

Before starting, ensure you have installed:
- **Node.js** (v14 or higher) - ✅ Detected: v20.20.0
- **npm** (comes with Node.js)
- **MongoDB** (local or MongoDB Atlas account)
- **Cloudinary** account (for image uploads)
- **Mapbox** account (for maps)

## 🔧 Setup Steps

### 1. Install Dependencies

Dependencies have been installed. If you need to reinstall:

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

#### Required Environment Variables:

```env
# Database Configuration
DB_URL=mongodb://127.0.0.1:27017/stonehaven
# Or for MongoDB Atlas:
# DB_URL=mongodb+srv://username:password@cluster.mongodb.net/stonehaven

# Session Secret (use a strong random string)
SECRET=your-secret-key-here-change-in-production

# Mapbox API Token
MAPBOX_TOKEN=your-mapbox-token-here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_KEY=your-cloudinary-api-key
CLOUDINARY_SECRET=your-cloudinary-api-secret

# Environment
NODE_ENV=development
```

#### Getting API Keys:

1. **MongoDB Atlas** (if using cloud):
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Replace `<password>` and `<dbname>` in the connection string

2. **Mapbox**:
   - Sign up at https://www.mapbox.com/
   - Go to Account → Access Tokens
   - Copy your default public token

3. **Cloudinary**:
   - Sign up at https://cloudinary.com/
   - Go to Dashboard
   - Copy Cloud Name, API Key, and API Secret

### 3. Database Setup

#### Local MongoDB:
```bash
# Start MongoDB service (varies by OS)
# Linux:
sudo systemctl start mongod

# macOS:
brew services start mongodb-community

# Windows:
net start MongoDB
```

#### MongoDB Atlas:
- Use the connection string from your Atlas cluster
- Make sure your IP is whitelisted in Atlas Network Access

### 4. Run the Application

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The application will run on **http://localhost:3000**

## 📁 Project Structure

```
stonehaven/
├── app.js                 # Main application entry point
├── controllers/           # Route controllers
│   ├── campgrounds.js
│   ├── home.js
│   ├── reviews.js
│   └── users.js
├── models/               # Mongoose models
│   ├── campground.js
│   ├── review.js
│   └── user.js
├── routes/               # Express routes
│   ├── campgrounds.js
│   ├── home.js
│   ├── reviews.js
│   └── users.js
├── views/               # EJS templates
│   ├── campgrounds/
│   ├── users/
│   └── partials/
├── public/              # Static assets
│   ├── javascripts/
│   └── stylesheets/
├── middleware.js       # Custom middleware
├── schemas.js          # Joi validation schemas
├── seeds/             # Database seed files
└── utils/             # Utility functions
```

## 🔒 Security Features

- **Helmet**: Sets various HTTP headers for security
- **Express Mongo Sanitize**: Prevents NoSQL injection attacks
- **Sanitize HTML**: Cleans user input HTML
- **Session Security**: HTTP-only cookies, secure session storage

## 🐛 Troubleshooting

### MongoDB Connection Issues:
- Verify MongoDB is running: `mongosh` or `mongo`
- Check connection string format
- Ensure database name matches in connection string

### Port Already in Use:
- Change port in `app.js` (line 177) or set `PORT` environment variable
- Kill process using port 3000: `lsof -ti:3000 | xargs kill`

### Environment Variables Not Loading:
- Ensure `.env` file is in root directory
- Check that `dotenv` is configured correctly (only loads in non-production)

## 📝 Notes

- The application uses **Express 5.x** (latest version)
- Session storage is configured to use MongoDB via `connect-mongo`
- Image uploads are handled via Multer and stored in Cloudinary
- Maps are integrated using Mapbox GL JS

## 🚀 Next Steps

1. Set up your `.env` file with real credentials
2. Ensure MongoDB is running
3. Run `npm run dev` to start development server
4. Visit http://localhost:3000 to see the application

---

**Happy Coding! 🎉**
