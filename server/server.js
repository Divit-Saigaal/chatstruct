/**
 * ChatStruct Server Entry Point
 * Express + Socket.io backend for real-time WhatsApp message organization
 */

const express    = require('express');
require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const QRCode     = require('qrcode');
const routes     = require('./routes');
const processor  = require('./messageProcessor');

const PORT = process.env.PORT || 3001;

// ─── App & Server Setup ───────────────────────────────────────────────────────
const app    = express();
const server = createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ status: 'ChatStruct server running', timestamp: Date.now() });
});

// ─── QR Code endpoint — serves QR as scannable image in browser ───────────────
app.get('/qr', async (req, res) => {
  try {
    const { getLatestQR, getBotStatus } = require('./whatsappBot');
    const qr     = getLatestQR();
    const status = getBotStatus();

    if (status === 'ready') {
      return res.send(`
        <!DOCTYPE html><html><head>
        <title>ChatStruct — WhatsApp</title>
        <meta charset="UTF-8">
        <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f6fa;} .card{background:white;border-radius:20px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.1);text-align:center;} h1{color:#1e293b;} p{color:#22c55e;font-size:18px;font-weight:600;}</style>
        </head><body>
        <div class="card">
          <div style="font-size:60px">✅</div>
          <h1>WhatsApp Connected!</h1>
          <p>Bot is ready and listening for messages.</p>
          <a href="http://localhost:5173" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#6366f1;color:white;border-radius:10px;text-decoration:none;font-weight:600;">Go to Dashboard →</a>
        </div>
        </body></html>
      `);
    }

    if (!qr) {
      // QR not yet available — auto-refresh
      return res.send(`
        <!DOCTYPE html><html><head>
        <title>ChatStruct — WhatsApp QR</title>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="3">
        <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f6fa;} .card{background:white;border-radius:20px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.1);text-align:center;}</style>
        </head><body>
        <div class="card">
          <div style="font-size:48px;animation:spin 1s linear infinite">⏳</div>
          <h2 style="color:#1e293b">Generating QR code...</h2>
          <p style="color:#64748b">This page will refresh automatically.</p>
          <p style="color:#94a3b8;font-size:13px">Status: ${status}</p>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </body></html>
      `);
    }

    // QR available — render as image
    const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
    res.send(`
      <!DOCTYPE html><html><head>
      <title>ChatStruct — Scan WhatsApp QR</title>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="20">
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Segoe UI',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;}
        .card{background:white;color:#1e293b;border-radius:24px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,0.4);text-align:center;max-width:380px;width:90%;}
        h1{font-size:22px;font-weight:800;margin-bottom:6px;}
        p{color:#64748b;font-size:14px;margin-bottom:20px;}
        img{border-radius:12px;border:4px solid #f1f5f9;}
        .steps{text-align:left;margin-top:24px;background:#f8fafc;border-radius:12px;padding:16px;}
        .step{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;font-size:13px;color:#374151;}
        .num{width:22px;height:22px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .badge{margin-top:16px;background:#fef3c7;color:#92400e;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;}
        a{display:inline-block;margin-top:16px;padding:10px 24px;background:#6366f1;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;}
      </style>
      </head><body>
      <div style="margin-bottom:20px;text-align:center;">
        <div style="font-size:32px;font-weight:800;color:white;">💬 ChatStruct</div>
        <div style="color:#94a3b8;font-size:14px;">WhatsApp Bot Setup</div>
      </div>
      <div class="card">
        <h1>Scan to Connect</h1>
        <p>Scan this QR code with WhatsApp to link your account</p>
        <img src="${qrDataUrl}" width="260" height="260" alt="WhatsApp QR Code" />
        <div class="steps">
          <div class="step"><div class="num">1</div><div>Open <strong>WhatsApp</strong> on your phone</div></div>
          <div class="step"><div class="num">2</div><div>Tap <strong>⋮ Menu → Linked Devices</strong></div></div>
          <div class="step"><div class="num">3</div><div>Tap <strong>"Link a Device"</strong></div></div>
          <div class="step"><div class="num">4</div><div>Point your camera at this QR code</div></div>
        </div>
        <div class="badge">⏱ QR refreshes every 20 seconds automatically</div>
        <br>
        <a href="http://localhost:5173">← Go to Dashboard</a>
      </div>
      </body></html>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bot status API ────────────────────────────────────────────────────────────
app.get('/api/bot-status', (req, res) => {
  try {
    const { getLatestQR, getBotStatus } = require('./whatsappBot');
    res.json({ status: getBotStatus(), hasQR: !!getLatestQR() });
  } catch { res.json({ status: 'not_started', hasQR: false }); }
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.emit('initial_data', {
    messages: processor.getAllMessages(),
    chats:    processor.getUniqueChats()
  });

  // Send current QR/status on connect
  try {
    const { getLatestQR, getBotStatus } = require('./whatsappBot');
    socket.emit('qr_update', { qr: getLatestQR(), status: getBotStatus() });
  } catch (_) {}

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Seed Demo Data ───────────────────────────────────────────────────────────
function seedDemoData() {
  if (processor.getAllMessages().length > 0) return; // Don't re-seed
  const demoMessages = [
    { sender: 'Prof. Sharma',  chat: 'Operating Systems Group',  message: 'Assignment 3 deadline is tomorrow midnight. Please submit on the portal.', timestamp: Date.now()/1000 - 3600 },
    { sender: 'Riya Kapoor',   chat: 'Operating Systems Group',  message: "Can someone explain the difference between paging and segmentation?", timestamp: Date.now()/1000 - 3000 },
    { sender: 'Arjun Mehta',   chat: 'DBMS Study Group',         message: "I've uploaded the notes PDF for Unit 4 on the drive. Check pinned messages.", timestamp: Date.now()/1000 - 2500 },
    { sender: 'Prof. Gupta',   chat: 'DBMS Study Group',         message: 'Exam date has been announced: March 20th. Syllabus covers Units 1-5.', timestamp: Date.now()/1000 - 2000 },
    { sender: 'Sneha Rao',     chat: 'Web Dev Batch 2024',       message: 'Urgent! Project deadline moved to Friday. Submit your GitHub links.', timestamp: Date.now()/1000 - 1500 },
    { sender: 'Kiran Doshi',   chat: 'Web Dev Batch 2024',       message: 'How do I center a div in CSS? Tried flexbox but not working', timestamp: Date.now()/1000 - 1200 },
    { sender: 'Dr. Patel',     chat: 'Machine Learning Club',    message: 'Workshop on Neural Networks tomorrow 3PM in Lab 201. Must attend.', timestamp: Date.now()/1000 - 900 },
    { sender: 'Ankit Verma',   chat: 'Machine Learning Club',    message: 'Assignment 2 solution PDF attached. Study this before the quiz.', timestamp: Date.now()/1000 - 700 },
    { sender: 'Priya Singh',   chat: 'Operating Systems Group',  message: 'Good morning everyone!', timestamp: Date.now()/1000 - 600 },
    { sender: 'Rohan Kumar',   chat: 'DBMS Study Group',         message: 'What time does the library close today?', timestamp: Date.now()/1000 - 400 },
    { sender: 'Admin',         chat: 'Web Dev Batch 2024',       message: 'Class cancelled tomorrow. Rescheduled to Monday 9AM.', timestamp: Date.now()/1000 - 300 },
    { sender: 'Neha Joshi',    chat: 'Machine Learning Club',    message: 'Important: Final project presentations are on Friday. Be prepared!', timestamp: Date.now()/1000 - 200 },
    { sender: 'Vijay Menon',   chat: 'DBMS Study Group',         message: 'Why is normalization important in database design? Anyone explain?', timestamp: Date.now()/1000 - 150 },
    { sender: 'Prof. Sharma',  chat: 'Operating Systems Group',  message: 'Reminder: Viva for OS lab this week. Check schedule.', timestamp: Date.now()/1000 - 100 },
    { sender: 'Tanvi Agarwal', chat: 'Web Dev Batch 2024',       message: 'Sharing React lecture slides - link in description', timestamp: Date.now()/1000 - 60 }
  ];

  (async () => {
    for (const m of demoMessages) {
      await processor.processMessage({ ...m, messageId: `demo-${Date.now()}-${Math.random()}`, isGroup: true }, true);
    }
    console.log(`✅ Seeded ${demoMessages.length} demo messages.`);
  })();
}

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 ChatStruct Server running on http://localhost:${PORT}`);
  console.log(`📱 WhatsApp QR code page: http://localhost:${PORT}/qr\n`);
  seedDemoData();

  try {
    const { startBot } = require('./whatsappBot');
    startBot();
  } catch (err) {
    console.warn('⚠️  WhatsApp bot could not start:', err.message);
  }
});

module.exports = { app, io };
