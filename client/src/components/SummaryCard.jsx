/**
 * SummaryCard — AI-style group summary card
 */
import { getCategoryIcon } from '../utils/helpers';

function SummarySection({ icon, title, items, color }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>
        {icon} {title}
      </div>
      {items.map((m, i) => (
        <div key={i} style={{
          padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)',
          fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5,
          marginBottom: 4, borderLeft: `3px solid ${color}`
        }}>
          <span style={{ fontWeight: 600, opacity: 0.7 }}>{m.sender}: </span>
          {m.message.length > 100 ? m.message.slice(0, 100) + '…' : m.message}
        </div>
      ))}
    </div>
  );
}

export default function SummaryCard({ summary }) {
  if (!summary) return null;

  const isEmpty = !summary.announcements?.length &&
                  !summary.doubts?.length &&
                  !summary.important?.length &&
                  !summary.studyMaterials?.length;

  return (
    <div className="summary-card">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>
          AI Group Summary
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>
          📱 {summary.chatName}
        </div>
      </div>

      {isEmpty ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          No categorized messages yet for this group.
        </div>
      ) : (
        <>
          <SummarySection icon="📢" title="Announcements" items={summary.announcements} color="#34d399" />
          <SummarySection icon="❓" title="Doubts / Questions" items={summary.doubts} color="#fbbf24" />
          <SummarySection icon="🔴" title="Important" items={summary.important} color="#f87171" />
          <SummarySection icon="📚" title="Study Materials" items={summary.studyMaterials} color="#93c5fd" />
        </>
      )}
    </div>
  );
}
