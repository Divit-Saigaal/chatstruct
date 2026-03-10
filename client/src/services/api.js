/**
 * ChatStruct API service layer
 */
import axios from 'axios';

const BASE = '/api';

export const api = {
  getMessages: (params = {}) =>
    axios.get(`${BASE}/messages`, { params }).then(r => r.data.data),

  getStats: () =>
    axios.get(`${BASE}/stats`).then(r => r.data.data),

  getChats: () =>
    axios.get(`${BASE}/chats`).then(r => r.data.data),

  getSummary: (chat) =>
    axios.get(`${BASE}/summary/${encodeURIComponent(chat)}`).then(r => r.data.data),

  getEvents: () =>
    axios.get(`${BASE}/events`).then(r => r.data.data),

  getWhatsAppInfo: () =>
    axios.get(`${BASE}/whatsapp/qr`).then(r => r.data.data),

  logoutWhatsApp: () =>
    axios.post(`${BASE}/whatsapp/logout`).then(r => r.data),

  pinMessage: (id) =>
    axios.patch(`${BASE}/message/${id}/pin`).then(r => r.data.data),

  markImportant: (id) =>
    axios.patch(`${BASE}/message/${id}/important`).then(r => r.data.data),

  convertToNote: (id) =>
    axios.patch(`${BASE}/message/${id}/note`).then(r => r.data.data),

  addTag: (id, tag) =>
    axios.patch(`${BASE}/message/${id}/tag`, { tag }).then(r => r.data.data),

  sendMessage: (payload) =>
    axios.post(`${BASE}/message`, payload).then(r => r.data.data),

  clearMessages: () =>
    axios.delete(`${BASE}/messages`).then(r => r.data),

  deleteMessage: (id) =>
    axios.delete(`${BASE}/message/${id}`).then(r => r.data),
};
