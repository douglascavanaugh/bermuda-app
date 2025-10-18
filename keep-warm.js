#!/usr/bin/env node

// Keep Render server warm by pinging every 14 minutes
const https = require('https');

const RENDER_URL = 'https://bermuda-app.onrender.com/';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

function pingServer() {
  const startTime = Date.now();
  
  https.get(RENDER_URL, (res) => {
    const duration = Date.now() - startTime;
    console.log(`✅ Ping successful: ${res.statusCode} (${duration}ms) - ${new Date().toISOString()}`);
  }).on('error', (err) => {
    console.log(`❌ Ping failed: ${err.message} - ${new Date().toISOString()}`);
  });
}

console.log(`🔥 Starting keep-warm service for ${RENDER_URL}`);
console.log(`⏰ Pinging every ${PING_INTERVAL / 60000} minutes`);

// Ping immediately
pingServer();

// Set up interval
setInterval(pingServer, PING_INTERVAL);
