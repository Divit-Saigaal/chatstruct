/**
 * ChatStruct Message Processor
 * Handles categorization, tagging, and storage of WhatsApp messages using Gemini AI
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Gemini AI Setup ──────────────────────────────────────────────────────────
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY' 
  ? new GoogleGenerativeAI(geminiApiKey) 
  : null;
const aiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

// ─── In-Memory Store ────────────────────────────────────────────────────────
const messages = [];
const events = [];
let messageIdCounter = 1;

// ─── Category Rules ──────────────────────────────────────────────────────────
const categoryKeywordMap = {
  'Study Materials': [
    'pdf', 'ppt', 'material', 'slides', 'assignment', 'book', 'syllabus',
    'note', 'notes', 'lecture', 'summary', 'topic', 'chapter', 'slide',
    'reference', 'resource', 'link', 'document', 'doc', 'share', 'upload'
  ],
  Announcements: [
    'announcement', 'deadline', 'schedule', 'exam date', 'class cancelled',
    'postponed', 'rescheduled', 'notice', 'inform', 'reminder', 'date',
    'meeting', 'session', 'semester', 'holiday', 'event', 'webinar', 'workshop'
  ],
  Doubts: [
    '?', 'how', 'why', 'what', 'when', 'where', 'doubt', 'can someone explain',
    'help me', 'confused', 'understand', 'clarify', 'anyone know', 'is it',
    'difference between', 'explain', 'question', 'stuck', 'issue'
  ],
  Important: [
    'urgent', 'important', 'must read', 'project deadline', 'critical',
    'priority', 'immediately', 'asap', 'attention', 'required', 'mandatory',
    'compulsory', 'final', 'last date', 'submission', 'submit by', 'warning'
  ]
};

// ─── Tag Rules ────────────────────────────────────────────────────────────────
const tagKeywordMap = {
  '#Assignment': ['assignment', 'submit', 'deadline', 'project', 'homework', 'hw', 'task'],
  '#Exam':       ['exam', 'quiz', 'midsem', 'endsem', 'viva', 'test', 'finals'],
  '#Project':    ['project', 'presentation', 'github', 'repo', 'mini project', 'major project', 'projec'],
  '#Reminder':   ['reminder', 'remember', 'don\'t forget', 'remind', 'deadline'],
  '#StudyMaterial': ['pdf', 'ppt', 'material', 'slides', 'notes', 'book', 'note', 'document'],
  '#Important':  ['important', 'urgent', 'asap', 'critical', 'must read']
};

// ─── Categorization ───────────────────────────────────────────────────────────
function categorizeMessage(text) {
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywordMap)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }

  return 'General';
}

// ─── Event Extraction Regex ───────────────────────────────────────────────────
function extractEventDetails(text) {
  const lower = text.toLowerCase();
  
  // 1. Date/Day extraction
  const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i);
  const dateMatch = lower.match(/\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);
  let date = 'Upcoming';
  if (dateMatch) date = dateMatch[0];
  else if (dayMatch) date = dayMatch[0];
  
  // 2. Time extraction
  const timeMatch = lower.match(/\b(1[0-2]|0?[1-9])(:[0-5][0-9])?\s*(am|pm)\b/i);
  let time = 'TBD';
  if (timeMatch) time = timeMatch[0];
  
  // 3. Location extraction
  const locMatch = text.match(/\b(room|lab|hall|auditorium)[\s\w\d-]+\b/i);
  let location = 'TBD';
  if (locMatch) location = locMatch[0];
  
  // 4. Title extraction (first part of message)
  // 4. Title extraction (first part of message)
  let titleRaw = text.split(/[\n\.]/)[0].replace(/📢|important:|announcement:|join us for( the)?/ig, '').trim();
  let titleParts = titleRaw.split(/\b(tomorrow|today|at|scheduled for)\b/i);
  let title = titleParts[0].trim().replace(/^[^a-zA-Z0-9]+/, '');
  
  if (!title) title = "Upcoming Event";
  if (title.length > 40) title = title.substring(0, 40) + '...';
  
  // Formatting
  if (date !== 'Upcoming') date = date.replace(/\b\w/g, l => l.toUpperCase());
  if (time !== 'TBD') time = time.toUpperCase();
  if (location !== 'TBD') location = location.replace(/\b\w/g, l => l.toUpperCase());
  title = title.replace(/\b\w/g, l => l.toUpperCase());
  
  return { title, date, time, location };
}

// ─── Auto Tagging ─────────────────────────────────────────────────────────────
function autoTag(text) {
  const lower = text.toLowerCase();
  const tags = [];

  for (const [tag, keywords] of Object.entries(tagKeywordMap)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        if (!tags.includes(tag)) tags.push(tag);
        break;
      }
    }
  }

  return tags;
}

// ─── AI Classification ────────────────────────────────────────────────────────
async function classifyWithGemini(text) {
  if (!aiModel) return null;

  const prompt = `
You are an AI assistant that organizes WhatsApp group messages for students.

Classify the following message into ONE exact category from this list:
"Study Materials"
"Announcements"
"Doubts"
"Important"
"General"

Also generate an array of up to 3 relevant tags. Use specific tags like #Assignment, #Exam, #Project, #Reminder, #StudyMaterial, #Important if they apply.

If the message is an Announcement and contains event information like date, time, location, or day names (e.g. Monday, Tuesday), also extract those details into an "event" object. The "date" field should ideally be well-formatted like "YYYY-MM-DD" or "MMM DD, YYYY" to allow sorting, or the day of the week if exact date isn't clear.

Return ONLY a valid JSON object in this exact format:
{
  "category": "category_name",
  "tags": ["#tag1", "#tag2"],
  "event": {
    "title": "Event Name",
    "date": "YYYY-MM-DD or Day",
    "time": "Time (e.g., 3:00 PM)",
    "location": "Location or Room"
  }
} // Omit the "event" key entirely if the message is not an event announcement.

Message: "${text}"
  `;

  try {
    const result = await aiModel.generateContent(prompt);
    const responseText = result.response.text().trim();
    // Parse JSON safely by removing markdown codeblocks if they exist
    const jsonStr = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    // Ensure the category is valid
    const validCategories = ['Study Materials', 'Announcements', 'Doubts', 'Important', 'General'];
    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'General';
    }
    
    return parsed;
  } catch (err) {
    console.error('[Gemini API] Failed to classify message:', err.message);
    return null;
  }
}

// ─── Process Incoming Message ─────────────────────────────────────────────────
async function processMessage(rawMessage, skipAI = false) {
  const { sender, chat, message, timestamp, isGroup, messageId } = rawMessage;

  let category = 'General';
  let tags = [];
  let eventDetails = null;

  // 1. Try AI categorization if enabled and ready
  if (!skipAI && aiModel) {
    const aiResult = await classifyWithGemini(message);
    if (aiResult) {
      category = aiResult.category;
      tags = aiResult.tags || [];
      if (aiResult.event) eventDetails = aiResult.event;
    } else {
      // Fallback if AI fails
      category = categorizeMessage(message);
      tags = autoTag(message);
    }
  } else {
    // 2. Keyword categorization fallback
    category = categorizeMessage(message);
    tags = autoTag(message);
  }

  const processed = {
    id:          messageId || `msg-${messageIdCounter++}`,
    sender:      sender || 'Unknown',
    chat:        chat   || 'Unknown Chat',
    message,
    timestamp:   timestamp || Math.floor(Date.now() / 1000),
    isGroup:     isGroup !== undefined ? isGroup : true,
    category,
    tags,
    pinned:      false,
    important:   category === 'Important',
    isStudyMaterial: category === 'Study Materials',
    isStudyMaterial: category === 'Study Materials',
    createdAt:   new Date().toISOString()
  };

  messages.unshift(processed); // newest first

  // Only process events if category is Announcements and has event keywords or date/time
  if (category === 'Announcements' && message.match(/event|seminar|session|meeting|workshop|talk|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i)) {
    const eventObj = extractEventDetails(message);

    events.push({
      id: processed.id,
      title: eventObj.title,
      description: message,
      date: eventObj.date,
      time: eventObj.time,
      location: eventObj.location,
      chat: processed.chat
    });
  }

  // Keep in-memory store bounded
  if (messages.length > 500) messages.pop();

  return processed;
}

// ─── Group Summary Generator ──────────────────────────────────────────────────
function generateGroupSummary(chatName) {
  const chatMessages = messages.filter(m => m.chat === chatName);

  const announcements = chatMessages.filter(m => m.category === 'Announcements').slice(0, 5);
  const doubts        = chatMessages.filter(m => m.category === 'Doubts').slice(0, 5);
  const important     = chatMessages.filter(m => m.important).slice(0, 5);
  const studyMaterials= chatMessages.filter(m => m.category === 'Study Materials').slice(0, 5);

  return { chatName, announcements, doubts, important, studyMaterials };
}

// ─── Events Helpers ───────────────────────────────────────────────────────────
function getUpcomingEvents() {
  const futureEvents = events.filter(e => {
    // Basic heuristics: if we can parse the date to something extremely old, skip it.
    // For simplicity of this demo, we just sort whatever is in the events array.
    return true;
  });

  return futureEvents.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    
    // If parsing fails, fall back to maintaining normal order
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    
    return dateA - dateB;
  }).slice(0, 5);
}

// ─── Query Helpers ────────────────────────────────────────────────────────────
function getAllMessages()          { return messages; }
function getByCategory(category)  { return messages.filter(m => m.category === category); }
function getByChat(chat)          { return messages.filter(m => m.chat === chat); }
function getByTag(tag)            { return messages.filter(m => m.tags.includes(tag)); }

function searchMessages(query) {
  const q = query.toLowerCase();
  return messages.filter(m =>
    m.message.toLowerCase().includes(q) ||
    m.sender.toLowerCase().includes(q)  ||
    m.chat.toLowerCase().includes(q)    ||
    m.tags.some(t => t.toLowerCase().includes(q))
  );
}

function getUniqueChats() {
  return [...new Set(messages.map(m => m.chat))];
}

function clearMessages() {
  messages.length = 0;
  messageIdCounter = 1;
}

function deleteMessage(messageId) {
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    const deleted = messages[index];
    messages.splice(index, 1);
    return deleted;
  }
  return null;
}

function addManualTag(messageId, tag) {
  const msg = messages.find(m => m.id === messageId);
  if (msg && !msg.tags.includes(tag)) {
    msg.tags.push(tag);
    return msg;
  }
  return null;
}

function togglePin(messageId) {
  const msg = messages.find(m => m.id === messageId);
  if (msg) { msg.pinned = !msg.pinned; return msg; }
  return null;
}

function toggleImportant(messageId) {
  const msg = messages.find(m => m.id === messageId);
  if (msg) { msg.important = !msg.important; return msg; }
  return null;
}

function convertToNote(messageId) {
  const msg = messages.find(m => m.id === messageId);
  if (msg) {
    msg.category = 'Study Materials';
    msg.isStudyMaterial = true;
    if (!msg.tags.includes('#StudyMaterial')) msg.tags.push('#StudyMaterial');
    return msg;
  }
  return null;
}

module.exports = {
  processMessage,
  generateGroupSummary,
  getAllMessages,
  getByCategory,
  getByChat,
  getByTag,
  searchMessages,
  getUniqueChats,
  clearMessages,
  deleteMessage,
  addManualTag,
  togglePin,
  toggleImportant,
  convertToNote,
  categorizeMessage,
  autoTag,
  getUpcomingEvents
};
