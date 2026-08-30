import { CheckCircle2 } from 'lucide-react';
import { formatDate, label } from '../utils/format';
import { TableState } from './common';

export function SummaryTile({ title, value, caption }) {
  return (
    <article className="summary-tile">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}

export function PendingActions({ reviews, meetings, milestones, role }) {
  const overdueMilestones = milestones.filter((item) => item.dueAt && new Date(item.dueAt) < new Date() && item.status !== 'closed').slice(0, 3);
  const items = [
    ...reviews.slice(0, 3).map((item) => ({ title: 'Review submission', meta: `${label(item.student)} - ${item.status}` })),
    ...meetings.map((item) => ({ title: 'Upcoming meeting', meta: `${item.title || 'Meeting'} - ${formatDate(item.startsAt)}` })),
    ...overdueMilestones.map((item) => ({ title: role === 'student' ? 'Milestone due' : 'Milestone needs attention', meta: `${item.title} - ${formatDate(item.dueAt)}` })),
  ].slice(0, 5);

  if (!items.length) return <TableState icon={CheckCircle2} text="No pending actions returned by current records." />;

  return (
    <div className="pending-list">
      {items.map((item, index) => (
        <article className="pending-item" key={`${item.title}-${index}`}>
          <span>{index + 1}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.meta}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
