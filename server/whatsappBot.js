/**
 * ChatStruct WhatsApp Bot
 * Uses whatsapp-web.js to relay incoming messages to the backend API
 * QR code is stored and served via GET /qr as an image
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode                = require('qrcode-terminal');
const http                  = require('http');
const fs                    = require('fs');
const path                  = require('path');

// Store latest QR string so server.js can serve it as an image
let latestQR  = null;
let botStatus = 'initializing'; // 'initializing' | 'awaiting_qr' | 'authenticated' | 'ready'
let isDestroying = false;

function getLatestQR()  { return latestQR; }
function getBotStatus() { return botStatus; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function postToServer(payload) {
  const data    = JSON.stringify(payload);
  const options = {
    hostname: 'localhost',
    port:     3001,
    path:     '/api/message',
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => (body += chunk));
    res.on('end', () => {
      try { console.log('[Bot] Sent to server:', JSON.parse(body).data?.category); }
      catch (_) { /* ignore */ }
    });
  });

  req.on('error', err => console.error('[Bot] Failed to send to server:', err.message));
  req.write(data);
  req.end();
}

function replyWithSummaryText(msg, summary) {
  const lines = [`📊 *Summary for ${summary.chatName}*\n`];

  if (summary.announcements.length) {
    lines.push('📢 *Announcements:*');
    summary.announcements.forEach(m => lines.push(`• ${m.message}`));
  }
  if (summary.doubts.length) {
    lines.push('\n❓ *Questions:*');
    summary.doubts.forEach(m => lines.push(`• ${m.message}`));
  }
  if (summary.important.length) {
    lines.push('\n🔴 *Important:*');
    summary.important.forEach(m => lines.push(`• ${m.message}`));
  }
  if (summary.studyMaterials.length) {
    lines.push('\n📝 *Study Materials:*');
    summary.studyMaterials.forEach(m => lines.push(`• ${m.message}`));
  }

  if (lines.length === 1) lines.push('No categorized messages yet.');
  msg.reply(lines.join('\n'));
}

// ─── Bot Commands ─────────────────────────────────────────────────────────────
function handleBotCommand(msg, text, chatName) {
  const processor = require('./messageProcessor');
  const lower     = text.toLowerCase().trim();

  if (lower === 'struct summary') {
    const summary = processor.generateGroupSummary(chatName);
    replyWithSummaryText(msg, summary);
    return true;
  }

  if (lower === 'struct study materials') {
    const studyMaterials = processor.getByCategory('Study Materials').filter(m => m.chat === chatName).slice(0, 5);
    if (!studyMaterials.length) { msg.reply('No study materials found for this group.'); return true; }
    const lines = ['📝 *Recent Study Materials:*', ...studyMaterials.map(n => `• ${n.message}`)];
    msg.reply(lines.join('\n'));
    return true;
  }

  return false;
}

function createClient() {
  return new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });
}

// ─── Init & Auto-Reinit ───────────────────────────────────────────────────────
function attachClientHandlers() {
  client.on('qr', qr => {
    latestQR  = qr;
    botStatus = 'awaiting_qr';

    console.log('\n====================================================');
    console.log('  ChatStruct WhatsApp Bot — Scan QR from browser:');
    console.log('  👉  http://localhost:3001/qr');
    console.log('====================================================\n');
    qrcode.generate(qr, { small: true });
    
    // Emit QR update via Socket.io
    try {
      const { io } = require('./server');
      if (io) io.emit('whatsapp_qr', qr);
    } catch (_) { /* server may not be ready yet */ }
  });

  client.on('ready', () => {
    latestQR  = null;
    botStatus = 'ready';
    console.log('\n✅ WhatsApp Bot connected and ready!\n');

    try {
      const { io } = require('./server');
      if (io) io.emit('whatsapp_connected');
    } catch (_) {}
  });

  client.on('authenticated', () => {
    botStatus = 'authenticated';
    console.log('🔐 WhatsApp session authenticated.');
  });

  client.on('auth_failure', msg => {
    botStatus = 'auth_failure';
    console.error('❌ WhatsApp authentication failed:', msg);
  });

  client.on('disconnected', reason => {
    if (isDestroying) return;
    botStatus = 'disconnected';
    console.warn('⚠️  WhatsApp bot disconnected:', reason);
    try {
      const { io } = require('./server');
      if (io) io.emit('whatsapp_disconnected');
    } catch (_) {}
  });

  client.on('message', async msg => {
    try {
      const chat    = await msg.getChat();
      const contact = await msg.getContact();
      const text    = msg.body || '';
      const chatName = chat.name || contact.pushname || 'Private Chat';

      if (handleBotCommand(msg, text, chatName)) return;

      const payload = {
        messageId: msg.id?.id || `wa-${Date.now()}`,
        sender:    contact.pushname || contact.number || 'Unknown',
        chat:      chatName,
        message:   text,
        timestamp: msg.timestamp,
        isGroup:   chat.isGroup
      };

      postToServer(payload);
    } catch (err) {
      console.error('[Bot] Error handling message:', err.message);
    }
  });
}

// Module-level client reference (created in startBot)
let client = null;

function startBot() {
  console.log('🤖 Initializing WhatsApp bot...');
  botStatus = 'initializing';
  client = createClient();       // ← create fresh client first
  attachClientHandlers();        // ← then attach listeners
  client.initialize().catch(err => {
    console.error('Bot init error:', err);
  });
}

async function logoutWhatsApp() {
  console.log('🔄 Logout requested. Destroying session...');
  isDestroying = true;
  
  try {
    await client.logout();
  } catch (err) {
    console.warn('Logout skipped or failed:', err.message);
  }

  try {
    await client.destroy();
  } catch (err) {
    console.warn('Destroy skipped or failed:', err.message);
  }

  botStatus = 'disconnected';
  latestQR = null;

  // Forcefully remove auth folder so LocalAuth starts fresh
  const authPath = path.join(__dirname, '.wwebjs_auth');
  if (fs.existsSync(authPath)) {
    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log('🗑️ Force deleted .wwebjs_auth session folder.');
    } catch (e) {
      console.error('Failed to delete auth folder:', e.message);
    }
  }

  try {
    const { io } = require('./server');
    if (io) io.emit('whatsapp_disconnected');
  } catch (_) {}

  isDestroying = false;

  console.log('⏳ Waiting 2 seconds before re-initializing...');
  setTimeout(() => {
    // Re-init the client with the same strategy to get a new QR code automatically
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    console.log('🤖 Re-initializing WhatsApp bot for new QR...');
    botStatus = 'initializing';
    attachClientHandlers();
    client.initialize().catch(err => console.error('Re-init failed:', err));
  }, 2000);
}

module.exports = { startBot, logoutWhatsApp, client, getLatestQR, getBotStatus };
