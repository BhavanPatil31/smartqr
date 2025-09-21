# HTTPS Setup Guide for SmartQR

## 🔒 Why HTTPS is Required

Camera access on mobile devices requires a secure HTTPS connection. Without HTTPS, mobile browsers will block camera access for security reasons.

## 🚀 Quick Setup Methods

### Method 1: Local HTTPS with mkcert (Recommended)

#### Step 1: Install mkcert

**Windows:**
```bash
# Using Chocolatey
choco install mkcert

# Using Scoop
scoop install mkcert

# Using winget
winget install FiloSottile.mkcert
```

**macOS:**
```bash
brew install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v*-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

#### Step 2: Setup SSL Certificates
```bash
npm run setup:https
```

#### Step 3: Run HTTPS Server
```bash
npm run dev:https
```

Your app will be available at: `https://localhost:3000`

---

### Method 2: Using ngrok (Instant HTTPS tunnel)

#### Step 1: Run your regular dev server
```bash
npm run dev
```

#### Step 2: In another terminal, create HTTPS tunnel
```bash
npm run dev:tunnel
```

This will give you a public HTTPS URL like: `https://abc123.ngrok.io`

---

### Method 3: Using Cloudflare Tunnel

#### Step 1: Run your regular dev server
```bash
npm run dev
```

#### Step 2: In another terminal, create Cloudflare tunnel
```bash
npm run dev:cloudflare
```

This will give you a public HTTPS URL like: `https://abc-123.trycloudflare.com`

---

### Method 4: Deploy to Vercel (For testing)

#### Quick deployment for testing:
```bash
npx vercel --prod
```

This gives you a production HTTPS URL for testing on mobile devices.

---

## 📱 Testing on Mobile

### Option A: Same Network (Local HTTPS)
1. Use Method 1 (mkcert) to run HTTPS locally
2. Find your computer's IP address:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` or `ip addr`
3. Access from mobile: `https://[your-ip]:3000`
4. Accept the security warning (it's safe for local development)

### Option B: Public Tunnel (ngrok/Cloudflare)
1. Use Method 2 or 3 to create a public HTTPS tunnel
2. Access the provided HTTPS URL from any device
3. No security warnings needed

---

## 🔧 Troubleshooting

### SSL Certificate Issues
```bash
# Reinstall mkcert CA
mkcert -uninstall
mkcert -install

# Regenerate certificates
npm run setup:https
```

### Port Already in Use
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Mobile Still Shows "Not Secure"
- Make sure you're using the HTTPS URL (not HTTP)
- For local development, accept the security warning
- For production, use a proper SSL certificate

---

## 🎯 Recommended Workflow

### For Development:
1. **Local testing**: Use `npm run dev:https` with mkcert
2. **Mobile testing**: Use `npm run dev:tunnel` for quick mobile testing
3. **Team sharing**: Use Cloudflare tunnel for sharing with team

### For Production:
- Deploy to Vercel, Netlify, or any hosting service with automatic HTTPS

---

## 📋 Commands Summary

```bash
# Setup (one-time)
npm run setup:https

# Development
npm run dev:https          # Local HTTPS
npm run dev:tunnel         # ngrok tunnel
npm run dev:cloudflare     # Cloudflare tunnel

# Regular development (HTTP only)
npm run dev
```

---

## 🔍 Verification

After setting up HTTPS, verify it's working:

1. ✅ URL shows `https://` in browser
2. ✅ Lock icon appears in address bar
3. ✅ Camera access works on mobile
4. ✅ No "Not Secure" warnings

---

## 💡 Tips

- **For quick mobile testing**: Use ngrok tunnel
- **For regular development**: Use local HTTPS with mkcert
- **For team collaboration**: Share ngrok or Cloudflare tunnel URLs
- **Always test camera features on actual mobile devices**

---

## 🆘 Need Help?

If you encounter issues:

1. Check the console for error messages
2. Verify certificates exist in `/certs` folder
3. Try alternative methods (ngrok/Cloudflare)
4. Ensure no other process is using port 3000
