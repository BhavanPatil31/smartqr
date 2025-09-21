const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Check if SSL certificates exist
  const certPath = path.join(__dirname, 'certs', 'localhost.pem');
  const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');
  
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('❌ SSL certificates not found!');
    console.log('📋 Please run: npm run setup:https');
    console.log('Or use alternative methods:');
    console.log('- npm run dev:tunnel (ngrok)');
    console.log('- npm run dev:cloudflare (cloudflare tunnel)');
    process.exit(1);
  }

  // HTTPS options
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  // Create HTTPS server
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error('❌ HTTPS Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log('🔒 HTTPS Server ready!');
      console.log(`🌐 Local: https://${hostname}:${port}`);
      console.log(`📱 Network: https://[your-ip]:${port}`);
      console.log('');
      console.log('✅ Camera access should now work on mobile devices!');
      console.log('📋 Make sure to use the HTTPS URL when testing on mobile.');
    });
});
