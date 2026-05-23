import { timeAgo } from '../../utils/formatters';

const severityConfig = {
  CRITICAL: {
    borderColor: '#ef4444',
    bgColor: 'rgba(239,68,68,0.08)',
    icon: '🔴',
    labelBg: '#450a0a',
    labelText: '#fca5a5',
  },
  WARNING: {
    borderColor: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    icon: '🟡',
    labelBg: '#451a03',
    labelText: '#fcd34d',
  },
  WATCH: {
    borderColor: '#38bdf8',
    bgColor: 'rgba(56,189,248,0.08)',
    icon: '🔵',
    labelBg: '#0c1a2e',
    labelText: '#7dd3fc',
  },
};

export default function AlertCard({ alert }) {
  const cfg = severityConfig[alert.severity] || severityConfig.WATCH;

  return (
    <div
      className="alert-card"
      style={{
        borderLeft: `3px solid ${cfg.borderColor}`,
        background: cfg.bgColor,
      }}
    >
      <div className="alert-card__header">
        <span className="alert-card__icon">{cfg.icon}</span>
        <span className="alert-card__title">{alert.title}</span>
      </div>
      <p className="alert-card__desc">{alert.description}</p>
      <div className="alert-card__footer">
        <span className="alert-card__location">📍 {alert.location}</span>
        <div className="alert-card__meta">
          <span
            className="alert-card__badge"
            style={{
              background: cfg.labelBg,
              color: cfg.labelText,
            }}
          >
            {alert.severity}
          </span>
          <span className="alert-card__time">{timeAgo(alert.timestamp)}</span>
        </div>
      </div>

      <style>{`
        .alert-card {
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 8px;
        }
        .alert-card__header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .alert-card__icon {
          font-size: 10px;
        }
        .alert-card__title {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .alert-card__desc {
          font-size: 11px;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .alert-card__footer {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .alert-card__location {
          font-size: 10px;
          color: var(--color-text-muted);
        }
        .alert-card__meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .alert-card__badge {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          letter-spacing: 0.5px;
        }
        .alert-card__time {
          font-size: 10px;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
