#!/bin/bash

echo "🚀 Starting Deployment for MANIT Clean Campus..."

echo "🛑 1. Cleaning up old processes..."
sudo killall -9 node npm pm2 2>/dev/null
sudo fuser -k -9 5000/tcp 2>/dev/null
sudo fuser -k -9 5175/tcp 2>/dev/null
sudo fuser -k -9 5176/tcp 2>/dev/null
rm -rf ~/.pm2

echo "🗄️  2. Ensuring MongoDB is running..."
sudo systemctl restart mongod

echo "📥 3. Pulling latest code..."
# Force reset any local changes so git pull never fails
git reset --hard
git pull

echo "📦 4. Building latest Frontend..."
cd client
npm run build

echo "⚙️  5. Starting Backend Server..."
cd ../server
nohup node server.js > backend.log 2>&1 &
echo "✅ Backend started on port 5000"

echo "🌐 6. Starting Frontend Server..."
cd ../client
nohup npm run preview -- --port 5176 --host > frontend.log 2>&1 &
echo "✅ Frontend started on port 5176"

echo "🎉 Deployment Complete! The app is permanently live at http://10.3.1.205:5176"
