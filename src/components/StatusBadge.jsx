export default function StatusBadge({ status }) {
  const key = String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '')
  const classMap = {
    active: 'badge-active',
    paid: 'badge-paid',
    ontrack: 'badge-ontrack',
    overdue: 'badge-overdue',
    closed: 'badge-closed',
    noloan: 'badge-noloan',
    pending: 'badge-pending',
  }
  return <span className={`badge ${classMap[key] || 'badge-pending'}`}>{status}</span>
}
