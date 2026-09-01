import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpDown,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/format';
import logoImg from '../assets/logo.jpeg';

export function BrandMark({ compact = false, subtitle = null }) {
  return (
    <div className={compact ? 'brand-mark compact' : 'brand-mark'} aria-label="SSMS">
      <span className="brand-symbol">
        <img
          alt="SSMS"
          className="brand-logo-img"
          src={logoImg}
        />
      </span>
      <span className="brand-word">
        <strong>SSMS</strong>
        <small>{subtitle || (!compact ? 'Academic Supervision' : null)}</small>
      </span>
    </div>
  );
}

export function Field({ help, icon: Icon, label: fieldLabel, error, children }) {
  return (
    <label className="field">
      <span>{fieldLabel}</span>
      <div className={`input-shell${Icon ? ' has-icon' : ''}${error ? ' has-error' : ''}`}>
        {Icon ? <Icon size={16} strokeWidth={2.1} /> : null}
        {children}
      </div>
      {error ? <small className="field-error"><AlertCircle size={13} />{error}</small> : null}
      {!error && help ? <small>{help}</small> : null}
    </label>
  );
}

export function PageIntro({ title, subtitle }) {
  return (
    <div className="page-intro">
      <span>SSMS Workspace</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export function Card({ title, description, action, className = '', children }) {
  return (
    <section className={`surface-card ${className}`}>
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ title, value, caption, icon: Icon }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className="metric-icon"><Icon size={17} /></div>
      </div>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}

export function Badge({ value }) {
  return <span className={`badge badge-${String(value).replaceAll('_', '-')}`}>{String(value).replaceAll('_', ' ')}</span>;
}

export function DataTable({ columns, data, empty, loading }) {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ index: 0, direction: 'asc' });
  const pageSize = 8;
  const statusOptions = useMemo(() => {
    return [...new Set(data.map((item) => item.status || (item.readAt ? 'read' : item.readAt === null ? 'unread' : '')).filter(Boolean))];
  }, [data]);
  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return data.filter((item) => {
      const itemStatus = item.status || (item.readAt ? 'read' : item.readAt === null ? 'unread' : '');
      const matchesStatus = !statusFilter || itemStatus === statusFilter;
      const matchesTerm = !term || JSON.stringify(item).toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [data, filter, statusFilter]);
  const sorted = useMemo(() => {
    const [, render] = columns[sort.index] || columns[0];
    return [...filtered].sort((a, b) => {
      const left = String(render(a)?.props ? '' : render(a) ?? '').toLowerCase();
      const right = String(render(b)?.props ? '' : render(b) ?? '').toLowerCase();
      return sort.direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
    });
  }, [columns, filtered, sort]);
  const pageCount = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const emptyProps = typeof empty === 'object' && empty !== null
    ? { icon: Search, ...empty }
    : { icon: Search, text: empty || 'No records.' };

  if (loading) return <SkeletonTable columns={columns.length} />;
  if (!data.length) return <TableState {...emptyProps} />;

  return (
    <div className="data-table">
      <div className="table-toolbar">
        <label className="table-filter">
          <Search size={16} />
          <input aria-label="Filter table records" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter records" />
        </label>
        {statusOptions.length ? (
          <select className="table-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{String(status).replaceAll('_', ' ')}</option>)}
          </select>
        ) : null}
        <span>{filtered.length} records</span>
      </div>
      {!filtered.length ? (
        <TableState icon={Search} text="No records match this filter." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(([name], index) => (
                    <th key={name}>
                      <button
                        className="sort-button"
                        onClick={() => setSort((value) => ({
                          index,
                          direction: value.index === index && value.direction === 'asc' ? 'desc' : 'asc',
                        }))}
                        type="button"
                      >
                        {name}
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <tr key={item._id || item.id}>
                    {columns.map(([name, render]) => <td key={name}>{render(item)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination" aria-label="Table pagination">
            <button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} type="button">Previous</button>
            <span>Page {currentPage} of {pageCount}</span>
            <button disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))} type="button">Next</button>
          </div>
        </>
      )}
    </div>
  );
}

export function SkeletonTable({ columns }) {
  return (
    <div className="skeleton-table" aria-label="Loading records">
      {Array.from({ length: 5 }).map((_, row) => (
        <div className="skeleton-row" key={row} style={{ '--cols': columns }}>
          {Array.from({ length: columns }).map((__, column) => <span key={column} />)}
        </div>
      ))}
    </div>
  );
}

export function TableState({ icon: Icon = Search, text, title, actionLabel, onAction }) {
  return (
    <div className="table-state table-state-rich">
      {Icon ? <div className="table-state-icon"><Icon size={22} /></div> : null}
      {title ? <strong>{title}</strong> : null}
      {text ? <span>{text}</span> : null}
      {onAction ? (
        <button className="primary-button inline" onClick={onAction} type="button">{actionLabel}</button>
      ) : null}
    </div>
  );
}

export function StatusBars({ counts }) {
  const entries = Object.entries(counts);
  if (!entries.length) return <TableState icon={ClipboardList} text="No progress or submissions returned by the API." />;
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return (
    <div className="status-chart">
      <div className="bars">
        {entries.map(([name, value]) => (
          <div className="bar-column" key={name}>
            <div className="bar" style={{ height: `${Math.max((value / max) * 190, 16)}px` }} />
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="legend">
        {entries.map(([name]) => (
          <span key={name}><i />{name.replaceAll('_', ' ')}</span>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeed({ items = [], variant = 'notifications' }) {
  if (!items.length) {
    return (
      <TableState
        icon={MessageSquare}
        title="No activity yet"
        text={variant === 'audit' ? 'Audit records will appear here as users take actions in the system.' : 'No recent activity returned by the API.'}
      />
    );
  }
  return (
    <div className="activity-list">
      {items.slice(0, 6).map((item) => {
        const isAudit = variant === 'audit' || item.action;
        const headline = isAudit
          ? (item.action || item.entityType)
          : (item.title || item.type);
        const body = isAudit
          ? `${item.entityType || 'Record'}${item.actorLabel ? ` · ${item.actorLabel}` : ''}`
          : (item.message || item.entityType || 'Activity record');
        return (
          <article key={item._id || item.id} className="activity-item">
            <i />
            <div>
              <strong>{headline}</strong>
              <p>{body}</p>
              <span>{formatRelativeTime(item.createdAt) || formatDate(item.createdAt)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function RefreshButton({ queryKey }) {
  const queryClient = useQueryClient();
  return (
    <button className="icon-button compact" onClick={() => queryClient.invalidateQueries({ queryKey })} title="Refresh" type="button">
      <RefreshCw size={15} />
    </button>
  );
}

export function MutationError({ mutation }) {
  if (!mutation.error) return null;
  const data = mutation.error.response?.data;
  const details = Array.isArray(data?.details) ? data.details : [];
  return (
    <div className="form-error-block" role="alert">
      <p className="form-error">{data?.message || mutation.error.message}</p>
      {details.length ? (
        <ul className="form-error-list">
          {details.map((item) => (
            <li key={typeof item === 'string' ? item : `${item.field}-${item.message}`}>
              {typeof item === 'string' ? item : item.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FullPageState({ title }) {
  return <div className="full-state">{title}</div>;
}
