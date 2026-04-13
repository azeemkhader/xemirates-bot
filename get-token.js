/**
 * get-token.js
 * Run this ONCE to get your Shopify access token.
 * It opens your browser, you click "Install", and the token is saved to .env automatically.
 *
 * Usage: node get-token.js
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Your App Credentials ────────────────────────────────────────────────────
const CLIENT_ID     = 'df82b02a23d879490b90688d7bf759f4';
const CLIENT_SECRET = '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';
const SHOP          = 'xemirates-5.myshopify.com';
const REDIRECT_URI  = 'http://localhost:3000/callback';
const SCOPES        = 'read_customers,write_customers,write_draft_orders,read_draft_orders,read_orders,write_orders,read_products';
// ─────────────────────────────────────────────────────────────────────────────

const STATE = crypto.randomBytes(16).toString('hex');
const ENV_FILE = path.join(__dirname, '.env');

// Build the OAuth URL
const authUrl = `https://${SHOP}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}&grant_options[]=offline`;

console.log('\n🚀 xemirates-bot — Shopify Token Setup\n');
console.log('Opening your browser...');
console.log('If it does not open, paste this URL manually:\n');
console.log(authUrl + '\n');

// Open browser
const openCmd = process.platform === 'darwin' ? `open "${authUrl}"` :
                process.platform === 'win32'   ? `start "" "${authUrl}"` :
                                                 `xdg-open "${authUrl}"`;
exec(openCmd);

// Start local HTTP server to catch the callback
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');

  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (state !== STATE) {
    res.writeHead(400);
    res.end('State mismatch — possible CSRF attack. Please try again.');
    server.close();
    return;
  }

  // Exchange code for access token
  const postData = JSON.stringify({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code:          code,
  });

  const options = {
    hostname: SHOP,
    path:     '/admin/oauth/access_token',
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let body = '';
    apiRes.on('data', chunk => body += chunk);
    apiRes.on('end', () => {
      try {
        const data = JSON.parse(body);

        if (!data.access_token) {
          console.error('\n❌ Error getting token:', body);
          res.writeHead(500);
          res.end('Error getting token. Check terminal for details.');
          server.close();
          return;
        }

        const token = data.access_token;
        console.log('\n✅ Access token received!');
        console.log('Token:', token);

        // Update .env file
        let envContent = '';
        if (fs.existsSync(ENV_FILE)) {
          envContent = fs.readFileSync(ENV_FILE, 'utf8');
        }

        // Update or add ACCESS_TOKEN
        if (envContent.includes('ACCESS_TOKEN=')) {
          envContent = envContent.replace(/ACCESS_TOKEN=.*/g, `ACCESS_TOKEN=${token}`);
        } else {
          envContent += `\nACCESS_TOKEN=${token}`;
        }

        // Update or add SHOP_DOMAIN
        if (envContent.includes('SHOP_DOMAIN=')) {
          envContent = envContent.replace(/SHOP_DOMAIN=.*/g, `SHOP_DOMAIN=${SHOP}`);
        } else {
          envContent += `\nSHOP_DOMAIN=${SHOP}`;
        }

        fs.writeFileSync(ENV_FILE, envContent);
        console.log('✅ Token saved to .env file!');
        console.log('\n🎉 Setup complete! You can now run your WhatsApp bot.');
        console.log('   Run: node index.js\n');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0f9f0">
            <h1 style="color:#2e7d32">✅ Token saved successfully!</h1>
            <p style="font-size:18px">Your Shopify access token has been saved to .env</p>
            <p>You can close this tab and run your bot: <code>node index.js</code></p>
          </body></html>
        `);

        server.close();
      } catch (e) {
        console.error('Parse error:', e);
        res.writeHead(500);
        res.end('Parse error');
        server.close();
      }
    });
  });

  apiReq.on('error', (e) => {
    console.error('Request error:', e);
    res.writeHead(500);
    res.end('Request error');
    server.close();
  });

  apiReq.write(postData);
  apiReq.end();
});

server.listen(3000, () => {
  console.log('⏳ Waiting for you to click "Install" in your browser...\n');
});

server.on('close', () => {
  setTimeout(() => process.exit(0), 500);
});
