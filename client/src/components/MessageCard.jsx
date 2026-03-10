/**
 * MessageCard — displays one categorized WhatsApp message
 */
import { useState } from 'react';
import { Star, Pin, FileText, X, Tag, Trash2, BookOpen } from 'lucide-react';
import { formatTime, getCategoryColor, getCategoryIcon, getInitials, stringToColor } from '../utils/helpers';
import { api } from '../services/api';

export default function MessageCard({ msg, onUpdate }) {
  const [tagging, setTagging] = useState(false);
  const [newTag,  setNewTag]  = useState('');
  const [loading, setLoading] = useState(false);

  const colors = getCategoryColor(msg.category);

  async function handlePin() {
    setLoading(true);
    try { const updated = await api.pinMessage(msg.id); onUpdate(updated); } 
    catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleImportant() {
    setLoading(true);
    try { const updated = await api.markImportant(msg.id); onUpdate(updated); } 
    catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleNote() {
    setLoading(true);
    try { const updated = await api.convertToNote(msg.id); onUpdate(updated); } 
    catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleAddTag(e) {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
    setLoading(true);
    try {
      const updated = await api.addTag(msg.id, tag);
      onUpdate(updated);
      setNewTag('');
      setTagging(false);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Delete this message?')) return;
    setLoading(true);
    try { await api.deleteMessage(msg.id); } 
    catch(err) { console.error(err); }
    // No need to set loading false if deleted, component unmounts; but just in case it fails:
    setLoading(false);
  }

  const avatarColor = stringToColor(msg.sender);

  return (
    <div className={`message-card fade-in ${msg.pinned ? 'pinned' : ''} ${msg.important ? 'important' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: avatarColor, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'white'
          }}>
            {getInitials(msg.sender)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {msg.sender}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              📱 {msg.chat}
            </div>
          </div>
        </div>
        {/* Category badge */}
        <div style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
          whiteSpace: 'nowrap', letterSpacing: '0.3px'
        }}>
          {getCategoryIcon(msg.category)} {msg.category}
        </div>
      </div>

      {/* Message text */}
      <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>
        {msg.message}
      </div>

      {/* Tags */}
      {msg.tags && msg.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {msg.tags.map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      )}

      {/* Add tag input */}
      {tagging && (
        <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input
            autoFocus
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder="#MyTag"
            style={{
              flex: 1, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
              fontSize: 13, outline: 'none'
            }}
          />
          <button type="submit" style={{ padding: '5px 10px', borderRadius: 8, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Add
          </button>
          <button type="button" onClick={() => setTagging(false)} style={{ padding: '5px 8px', borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </form>
      )}

      {/* Footer: time + action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
          🕐 {formatTime(msg.timestamp)}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleImportant}
            disabled={loading}
            className={`action-btn ${msg.important ? 'active' : ''}`}
            title="Mark Important"
          >
            <Star size={13} fill={msg.important ? 'currentColor' : 'none'} />
            ⭐
          </button>
          <button
            onClick={handlePin}
            disabled={loading}
            className={`action-btn ${msg.pinned ? 'active' : ''}`}
            title="Pin"
          >
            <Pin size={13} />
            📌
          </button>
          <button
            onClick={handleNote}
            disabled={loading}
            className="action-btn"
            title="Convert to Study Material"
          >
            <BookOpen size={13} />
            📚
          </button>
          <button
            onClick={() => setTagging(t => !t)}
            className={`action-btn ${tagging ? 'active' : ''}`}
            title="Add Tag"
          >
            <Tag size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="action-btn"
            title="Delete Message"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
