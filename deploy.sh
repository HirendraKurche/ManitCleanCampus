#!/bin/bash

echo "🚀 Starting Deployment for MANIT Clean Campus..."

echo "🛑 1. Cleaning up old processes..."
sudo killall -9 node npm pm2 2>/dev/null
sudo fuser -k -9 5000/tcp 2>/dev/null
sudo fuser -k -9 5175/tcp 2>/dev/null
sudo fuser -k -9 5176/tcp 2>/dev/null
sudo fuser -k -9 443/tcp 2>/dev/null
rm -rf ~/.pm2

echo "🗄️  2. Ensuring MongoDB is running..."
sudo systemctl restart mongod

echo "🔐 2b. Ensuring HTTPS certificate exists..."
mkdir -p server/certs
if [ ! -f server/certs/key.pem ] || [ ! -f server/certs/cert.pem ]; then
	cat > /tmp/manit-ssl.cnf <<'EOF'
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = 10.3.1.205

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = 10.3.1.205
IP.2 = 127.0.0.1
DNS.1 = localhost
EOF
	openssl req -x509 -nodes -newkey rsa:2048 \
		-keyout server/certs/key.pem \
		-out server/certs/cert.pem \
		-days 3650 \
		-config /tmp/manit-ssl.cnf \
		-extensions v3_req
fi

echo "📥 3. Pulling latest code..."
# Force reset any local changes so git pull never fails
git reset --hard
git pull

echo "📦 4. Building latest Frontend..."
cd client
npm run build

echo "⚙️  5. Starting Backend Server..."
cd ../server
nohup env PORT=5176 HTTPS_KEY_PATH="$(pwd)/certs/key.pem" HTTPS_CERT_PATH="$(pwd)/certs/cert.pem" node server.js > backend.log 2>&1 &
echo "✅ Secure server started on port 5176"

echo "🎉 Deployment Complete! Open the secure site at https://10.3.1.205:5176"
