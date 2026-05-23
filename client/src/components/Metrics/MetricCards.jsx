import { formatNumber } from '../../utils/formatters';

const cards = [
  {
    label: 'Rainfall 24h',
    key: 'rainfall24h',
    suffix: 'mm',
    color: '#38bdf8',
  },
  {
    label: 'Drought Index',
    key: 'droughtSPI',
    suffix: ' SPI',
    color: '#f59e0b',
  },
  {
    label: 'Flood Risk',
    key: 'highRiskCounties',
    suffix: ' counties',
    color: '#ef4444',
  },
  {
    label: 'At-Risk Pop.',
    key: 'totalAtRisk',
    suffix: '',
    color: '#a78bfa',
  },
];

export default function MetricCards({ summary }) {
  return (
    <div className="metric-cards">
      {cards.map((card) => {
        const rawValue = summary[card.key];
        const displayValue =
          card.key === 'totalAtRisk'
            ? formatNumber(rawValue)
            : card.key === 'droughtSPI'
            ? rawValue.toFixed(1)
            : rawValue;

        return (
          <div key={card.key} className="metric-card">
            <span className="metric-card__label">{card.label}</span>
            <span
              className="metric-card__value"
              style={{ color: card.color }}
            >
              {displayValue}
              {card.suffix}
            </span>
            <span className="metric-card__trend">
              <svg width="60" height="16" viewBox="0 0 60 16">
                <polyline
                  fill="none"
                  stroke={card.color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.5"
                  points="0,12 10,8 20,10 30,4 40,6 50,2 60,5"
                />
              </svg>
            </span>
          </div>
        );
      })}

      <style>{`
        .metric-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 768px) {
          .metric-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .metric-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metric-card__label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .metric-card__value {
          font-family: 'Space Mono', monospace;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.2;
        }
        .metric-card__trend {
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
