const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Setting up HTTPS for development...\n');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('✅ Created certs directory');
}

try {
  // Check if mkcert is installed
  try {
    execSync('mkcert -version', { stdio: 'ignore' });
    console.log('✅ mkcert is already installed');
  } catch (error) {
    console.log('❌ mkcert is not installed');
    console.log('\n📋 Please install mkcert first:');
    console.log('Windows (using Chocolatey): choco install mkcert');
    console.log('Windows (using Scoop): scoop install mkcert');
    console.log('macOS: brew install mkcert');
    console.log('Linux: Check https://github.com/FiloSottile/mkcert#installation\n');
    
    console.log('After installing mkcert, run:');
    console.log('1. mkcert -install');
    console.log('2. npm run setup:https');
    process.exit(1);
  }

  // Install the local CA
  console.log('🔧 Installing local CA...');
  execSync('mkcert -install', { stdio: 'inherit' });

  // Generate certificates
  console.log('🔧 Generating SSL certificates...');
  const certPath = path.join(certsDir, 'localhost.pem');
  const keyPath = path.join(certsDir, 'localhost-key.pem');
  
  execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`, { 
    stdio: 'inherit',
    cwd: certsDir 
  });

  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Certificate: ${certPath}`);
  console.log(`📁 Private Key: ${keyPath}`);
  
  console.log('\n🚀 You can now run your server with HTTPS:');
  console.log('npm run dev:https');
  
} catch (error) {
  console.error('❌ Error setting up HTTPS:', error.message);
  console.log('\n🔄 Alternative methods:');
  console.log('1. Use npm run dev:tunnel (with ngrok)');
  console.log('2. Use npm run dev:cloudflare (with cloudflare tunnel)');
  console.log('3. Deploy to Vercel/Netlify for testing');
}
