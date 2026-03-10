/**
 * ChatStruct API Routes
 */
const express             = require('express');
const router              = express.Router();
const processor           = require('./messageProcessor');

// ─── POST /api/message ────────────────────────────────────────────────────────
// Receive a new message (from WhatsApp bot or external), process & store it
router.post('/message', async (req, res) => {
  try {
    const raw       = req.body;
    const processed = await processor.processMessage(raw);

    // Broadcast via Socket.io (injected on app init)
    const io = req.app.get('io');
    if (io) io.emit('new_message', processed);

    res.json({ success: true, data: processed });
  } catch (err) {
    console.error('Error processing message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/messages/demo ─────────────────────────────────────────────────
router.post('/messages/demo', async (req, res) => {
  try {
    const demoMessages = [
      {
        sender: "Professor Smith",
        chat: "General Chat",
        message: "Join us for the AI Seminar tomorrow at 3 PM in the Auditorium",
        isGroup: true
      },
      {
        sender: "Tech Club",
        chat: "General Chat",
        message: "Web Development Workshop Tuesday 10 AM in Lab 204",
        isGroup: true
      },
      {
        sender: "Admin",
        chat: "General Chat",
        message: "Reminder: Database assignment deadline Monday 11:59 PM",
        isGroup: true
      }
    ];

    const processedMessages = [];
    const io = req.app.get('io');

    for (const raw of demoMessages) {
      const processed = await processor.processMessage(raw);
      processedMessages.push(processed);
      if (io) io.emit('new_message', processed);
    }

    res.json({ success: true, data: processedMessages });
  } catch (err) {
    console.error('Error injecting demo messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/messages ───────────────────────────────────────────────────────
router.get('/messages', (req, res) => {
  const { category, tag, chat, search } = req.query;

  let results = processor.getAllMessages();

  if (category && category !== 'All') {
    results = processor.getByCategory(category);
  } else if (tag) {
    results = processor.getByTag(tag);
  } else if (chat) {
    results = processor.getByChat(chat);
  }

  if (search) {
    results = processor.searchMessages(search);
  }

  res.json({ success: true, data: results });
});

// ─── GET /api/chats ───────────────────────────────────────────────────────────
router.get('/chats', (req, res) => {
  res.json({ success: true, data: processor.getUniqueChats() });
});

// ─── GET /api/summary/:chat ──────────────────────────────────────────────────
router.get('/summary/:chat', (req, res) => {
  const summary = processor.generateGroupSummary(
    decodeURIComponent(req.params.chat)
  );
  res.json({ success: true, data: summary });
});

// ─── PATCH /api/message/:id/tag ──────────────────────────────────────────────
router.patch('/message/:id/tag', (req, res) => {
  const { tag } = req.body;
  const updated = processor.addManualTag(req.params.id, tag);
  if (!updated) return res.status(404).json({ success: false, error: 'Message not found' });

  const io = req.app.get('io');
  if (io) io.emit('message_updated', updated);

  res.json({ success: true, data: updated });
});

// ─── PATCH /api/message/:id/pin ──────────────────────────────────────────────
router.patch('/message/:id/pin', (req, res) => {
  const updated = processor.togglePin(req.params.id);
  if (!updated) return res.status(404).json({ success: false, error: 'Message not found' });

  const io = req.app.get('io');
  if (io) io.emit('message_updated', updated);

  res.json({ success: true, data: updated });
});

// ─── PATCH /api/message/:id/important ────────────────────────────────────────
router.patch('/message/:id/important', (req, res) => {
  const updated = processor.toggleImportant(req.params.id);
  if (!updated) return res.status(404).json({ success: false, error: 'Message not found' });

  const io = req.app.get('io');
  if (io) io.emit('message_updated', updated);

  res.json({ success: true, data: updated });
});

// ─── PATCH /api/message/:id/note ─────────────────────────────────────────────
router.patch('/message/:id/note', (req, res) => {
  const updated = processor.convertToNote(req.params.id);
  if (!updated) return res.status(404).json({ success: false, error: 'Message not found' });

  const io = req.app.get('io');
  if (io) io.emit('message_updated', updated);

  res.json({ success: true, data: updated });
});

// ─── DELETE /api/message/:id ─────────────────────────────────────────────────
router.delete('/message/:id', (req, res) => {
  const deleted = processor.deleteMessage(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Message not found' });

  const io = req.app.get('io');
  if (io) io.emit('message_deleted', req.params.id);

  res.json({ success: true, data: deleted });
});

// ─── GET /api/stats ──────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const all = processor.getAllMessages();
  const stats = {
    total:         all.length,
    studyMaterials:all.filter(m => m.category === 'Study Materials').length,
    announcements: all.filter(m => m.category === 'Announcements').length,
    doubts:        all.filter(m => m.category === 'Doubts').length,
    important:     all.filter(m => m.category === 'Important').length,
    general:       all.filter(m => m.category === 'General').length,
    pinned:        all.filter(m => m.pinned).length,
    groups:        processor.getUniqueChats().length
  };
  res.json({ success: true, data: stats });
});

// ─── DELETE /api/messages — clear all (wipe demo data) ───────────────────────
router.delete('/messages', (req, res) => {
  processor.clearMessages();
  const io = req.app.get('io');
  if (io) io.emit('messages_cleared');
  res.json({ success: true, message: 'All messages cleared.' });
});

// ─── GET /api/events ─────────────────────────────────────────────────────────
router.get('/events', (req, res) => {
  const events = processor.getUpcomingEvents();
  res.json({ success: true, data: events });
});

// ─── POST /api/whatsapp/logout ───────────────────────────────────────────────
router.post('/whatsapp/logout', async (req, res) => {
  try {
    const whatsappBot = require('./whatsappBot');
    await whatsappBot.logoutWhatsApp();
    res.json({ success: true, message: 'WhatsApp session logged out and resetting.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/whatsapp/qr ────────────────────────────────────────────────────
router.get('/whatsapp/qr', (req, res) => {
  const whatsappBot = require('./whatsappBot');
  const qr = whatsappBot.getLatestQR();
  const status = whatsappBot.getBotStatus();
  res.json({ success: true, data: { qr, status } });
});

module.exports = router;
