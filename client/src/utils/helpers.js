/**
 * Utility helpers
 */

export function formatTime(timestamp) {
  const date = new Date(
    typeof timestamp === 'number' && timestamp < 1e12
      ? timestamp * 1000
      : timestamp
  );
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7)  return `${diffDay}d ago`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getCategoryColor(category) {
  const map = {
    'Study Materials': { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
    Announcements: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    Doubts:        { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    Important:     { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    General:       { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
  };
  return map[category] || map.General;
}

export function getCategoryIcon(category) {
  const map = {
    'Study Materials': '📚',
    Announcements: '📢',
    Doubts:        '❓',
    Important:     '🔴',
    General:       '💬',
  };
  return map[category] || '💬';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function stringToColor(str) {
  const colors = [
    '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
    '#3b82f6','#14b8a6','#f43f5e','#a855f7','#06b6d4'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
