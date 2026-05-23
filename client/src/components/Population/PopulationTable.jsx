import { formatNumber } from '../../utils/formatters';

const riskOrder = { HIGH: 0, MODERATE: 1, LOW: 2 };

const badgeStyles = {
  HIGH:     { background: '#450a0a', color: '#fca5a5' },
  MODERATE: { background: '#451a03', color: '#fcd34d' },
  LOW:      { background: '#052e16', color: '#86efac' },
};

export default function PopulationTable({ counties }) {
  const rows = Object.entries(counties)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => (riskOrder[a.floodRisk] ?? 3) - (riskOrder[b.floodRisk] ?? 3));

  return (
    <div className="pop-table">
      <div className="pop-table__header">
        <span className="pop-table__title">Counties at Risk</span>
      </div>
      {rows.map((row) => (
        <div key={row.name} className="pop-row">
          <span className="pop-row__name">{row.name}</span>
          <div className="pop-row__right">
            <span className="pop-row__pop">{formatNumber(row.population)}</span>
            <span
              className="pop-row__badge"
              style={badgeStyles[row.floodRisk] || badgeStyles.LOW}
            >
              {row.floodRisk}
            </span>
          </div>
        </div>
      ))}

      <style>{`
        .pop-table {
          display: flex;
          flex-direction: column;
        }
        .pop-table__header {
          margin-bottom: 6px;
        }
        .pop-table__title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text-muted);
        }
        .pop-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid rgba(51, 65, 85, 0.4);
        }
        .pop-row:last-child {
          border-bottom: none;
        }
        .pop-row__name {
          font-size: 12px;
          color: var(--color-text-primary);
          font-weight: 500;
        }
        .pop-row__right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pop-row__pop {
          font-size: 11px;
          color: var(--color-text-muted);
          font-family: 'Space Mono', monospace;
        }
        .pop-row__badge {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
