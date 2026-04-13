/**
 * server.js — Entry point for Render deployment
 * Starts the health check HTTP server, then loads the main bot.
 */

// Health check server (keeps bot alive on Render free tier)
require('./healthcheck');

// Start the WhatsApp bot
require('./index');
