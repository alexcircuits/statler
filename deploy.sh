#!/bin/bash

# Statler Deployment Script
# Automatically sets up and updates the application on a VPS

APP_DIR="/var/www/statler"
REPO_URL="https://github.com/alexcircuits/statler.git"

echo "🚀 Starting Statler deployment..."

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "📂 Creating directory and cloning repository..."
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
else
    echo "🔄 Updating repository..."
    cd $APP_DIR
    git pull origin main
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Handle environment variables
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit $APP_DIR/.env and add your GITHUB_TOKEN if needed."
fi

# Start/Restart with PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting application with PM2..."
    pm2 restart statler || pm2 start server.js --name statler
else
    echo "⚠️  PM2 not found. Starting with node directly (not recommended for production)..."
    npm start &
fi

echo "✅ Deployment complete!"
