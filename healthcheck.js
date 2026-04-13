/**
 * healthcheck.js
 * Simple HTTP server for Render's health check.
 * Import this in your index.js to keep the bot alive on Render's free tier.
 *
 * Usage: Add this line near the top of your index.js:
 *   require('./healthcheck');
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bot: 'xemirates-bot',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`[HealthCheck] Server running on port ${PORT}`);
});

module.exports = server;
