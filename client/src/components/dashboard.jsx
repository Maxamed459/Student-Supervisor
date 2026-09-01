import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Users } from 'lucide-react';
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

export function DashboardHeader({ subtitle }) {
  return (
    <header className="dash-header">
      <h1>Dashboard</h1>
      <p>{subtitle}</p>
    </header>
  );
}

export function DashboardStatCard({
  label: cardLabel,
  value,
  delta,
  linkLabel = 'View details',
  linkTo,
  tone = 'blue',
}) {
  return (
    <article className={`dash-stat-card dash-stat-card--${tone}`}>
      <span className="dash-stat-label">{cardLabel}</span>
      <div className="dash-stat-value-row">
        <strong>{value}</strong>
        {delta ? <small className="dash-stat-delta">{delta}</small> : null}
      </div>
      {linkTo ? (
        <Link className={`dash-stat-link dash-stat-link--${tone}`} to={linkTo}>
          {linkLabel}
        </Link>
      ) : null}
    </article>
  );
}

export function DashboardCTACard({ text, actionLabel, actionTo }) {
  return (
    <article className="dash-stat-card dash-stat-card--peach dash-stat-card--cta">
      <p>{text}</p>
      {actionTo ? (
        <Link className="dash-stat-link dash-stat-link--peach" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}

function formatShortNumber(value) {
  const num = Number(value) || 0;
  if (num >= 1000) {
    const rounded = (num / 1000).toFixed(1);
    return `${rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded}k`;
  }
  return String(num);
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function countCreatedToday(items = []) {
  const today = startOfDay(new Date());
  return items.filter((item) => {
    const created = item.createdAt || item.updatedAt;
    if (!created) return false;
    return startOfDay(new Date(created)).getTime() === today.getTime();
  }).length;
}

function buildActivityBuckets(items = [], days = 30) {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const bucketCount = days <= 30 ? 6 : 6;
  const bucketSize = Math.ceil(days / bucketCount);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + index * bucketSize);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + bucketSize);
    return {
      label: bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      submitted: 0,
      reviewed: 0,
    };
  });

  items.forEach((item) => {
    const created = item.createdAt ? new Date(item.createdAt) : null;
    const updated = item.updatedAt ? new Date(item.updatedAt) : null;

    if (created && created >= start && created <= end) {
      const dayOffset = Math.floor((startOfDay(created) - start) / (1000 * 60 * 60 * 24));
      const index = Math.min(Math.floor(dayOffset / bucketSize), bucketCount - 1);
      if (index >= 0) buckets[index].submitted += 1;
    }

    if (updated && updated >= start && updated <= end && item.status && item.status !== 'pending') {
      const dayOffset = Math.floor((startOfDay(updated) - start) / (1000 * 60 * 60 * 24));
      const index = Math.min(Math.floor(dayOffset / bucketSize), bucketCount - 1);
      if (index >= 0) buckets[index].reviewed += 1;
    }
  });

  return buckets;
}

export function DashboardActivityChart({ submissions = [] }) {
  const [range, setRange] = useState('30');

  const days = range === '90' ? 90 : 30;
  const buckets = useMemo(() => buildActivityBuckets(submissions, days), [submissions, days]);

  const maxValue = Math.max(
    ...buckets.flatMap((bucket) => [bucket.submitted, bucket.reviewed]),
    1,
  );
  const axisMax = Math.max(Math.ceil(maxValue / 5) * 5, 5);
  const yTicks = [axisMax, Math.round(axisMax * 0.66), Math.round(axisMax * 0.33), 0];

  const weekAvg = useMemo(() => {
    const lastWeek = submissions.filter((item) => {
      const stamp = item.updatedAt || item.createdAt;
      if (!stamp) return false;
      const date = new Date(stamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    return lastWeek;
  }, [submissions]);

  return (
    <section className="dash-chart-card">
      <div className="dash-chart-header">
        <div className="dash-chart-title">
          <span className="dash-chart-icon" aria-hidden="true">
            <Users size={18} />
          </span>
          <h3>Submission activity for the last {range === '90' ? '3 months' : '1 month'}</h3>
        </div>
        <label className="dash-chart-range">
          <select
            aria-label="Activity time range"
            onChange={(event) => setRange(event.target.value)}
            value={range}
          >
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
      </div>

      <div className="dash-chart-metric">
        <span>Avg this week</span>
        <strong>
          {weekAvg.toLocaleString()}
          <small>submissions</small>
        </strong>
      </div>

      <div className="dash-chart-body">
        <div className="dash-chart-y-axis">
          {yTicks.map((tick) => (
            <span key={tick}>{tick >= 1000 ? formatShortNumber(tick) : tick}</span>
          ))}
        </div>
        <div className="dash-chart-plot">
          <div className="dash-chart-grid">
            {yTicks.slice(0, -1).map((tick) => (
              <span className="dash-chart-gridline" key={tick} style={{ bottom: `${(tick / axisMax) * 100}%` }} />
            ))}
          </div>
          <div className="dash-chart-bars">
            {buckets.map((bucket) => (
              <div className="dash-chart-group" key={bucket.label}>
                <div className="dash-chart-bar-pair">
                  <div className="dash-chart-bar-wrap">
                    <span className="dash-chart-bar-value">{formatShortNumber(bucket.submitted)}</span>
                    <div
                      className="dash-chart-bar dash-chart-bar--light"
                      style={{ height: `${(bucket.submitted / axisMax) * 100}%` }}
                    />
                  </div>
                  <div className="dash-chart-bar-wrap">
                    <span className="dash-chart-bar-value">{formatShortNumber(bucket.reviewed)}</span>
                    <div
                      className="dash-chart-bar dash-chart-bar--dark"
                      style={{ height: `${(bucket.reviewed / axisMax) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="dash-chart-x-label">{bucket.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-chart-legend">
        <span><i className="dash-legend-swatch dash-legend-swatch--light" />Submitted</span>
        <span><i className="dash-legend-swatch dash-legend-swatch--dark" />Reviewed</span>
      </div>
    </section>
  );
}

export function PendingActions({ reviews = [], milestones = [], role }) {
  const overdueMilestones = (milestones || []).filter(
    (item) => item.dueAt && new Date(item.dueAt) < new Date() && item.status !== 'closed',
  ).slice(0, 3);
  const items = [
    ...reviews.slice(0, 3).map((item) => ({
      title: 'Review submission',
      meta: `${label(item.student)} - ${item.status}`,
    })),
    ...overdueMilestones.map((item) => ({
      title: role === 'student' ? 'Milestone due' : 'Milestone needs attention',
      meta: `${item.title} - ${formatDate(item.dueAt)}`,
    })),
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

export { countCreatedToday };
