import { riskToColour } from '../../utils/riskClassifier';

function CountyDetailPanel({ data, loading, onClose }) {
  if (loading) return (
    <div className="county-panel loading">
      <p>Loading county data...</p>
    </div>
  );

  if (!data) return null;

  const { county, geography, forecast, floodRisk, drought, population, alerts } = data;

  // ── Bar colour helper ─────────────────────────────────
  const barColour = (mm) => {
    if (mm >= 75) return '#dc2626';
    if (mm >= 50) return '#ef4444';
    if (mm >= 35) return '#f59e0b';
    if (mm >= 20) return '#38bdf8';
    return '#4ade80';
  };

  const maxRain = Math.max(...forecast.map(f => f.rainfall), 1);
  const totalRain = forecast.reduce((s, f) => s + f.rainfall, 0);

  // ── SPI Sparkline SVG ─────────────────────────────────
  const spiHistory = drought.history || [];
  const renderSPISparkline = () => {
    if (spiHistory.length === 0) return null;
    const W = 200, H = 60, PAD = 8;
    const vals = spiHistory.map(h => parseFloat(h.spi_value));
    const minV = Math.min(...vals, -2);
    const maxV = Math.max(...vals, 1);
    const range = maxV - minV || 1;
    const points = vals.map((v, i) => {
      const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - 2 * PAD);
      const y = PAD + ((maxV - v) / range) * (H - 2 * PAD);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* Zero line */}
        <line x1={PAD} y1={PAD + ((maxV - 0) / range) * (H - 2 * PAD)}
              x2={W - PAD} y2={PAD + ((maxV - 0) / range) * (H - 2 * PAD)}
              stroke="#334155" strokeWidth="0.5" strokeDasharray="4,3" />
        {/* Area fill */}
        <polygon
          points={`${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`}
          fill="rgba(56,189,248,0.08)"
        />
        {/* Line */}
        <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Dots */}
        {vals.map((v, i) => {
          const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - 2 * PAD);
          const y = PAD + ((maxV - v) / range) * (H - 2 * PAD);
          return <circle key={i} cx={x} cy={y} r="3" fill="#38bdf8" />;
        })}
      </svg>
    );
  };

  // ── Flood score colour ────────────────────────────────
  const scoreColour = floodRisk?.score >= 80 ? '#ef4444'
                    : floodRisk?.score >= 55 ? '#f97316'
                    : floodRisk?.score >= 30 ? '#f59e0b'
                    : '#4ade80';

  return (
    <div className="county-panel">
      {/* Header */}
      <div className="county-panel-header">
        <div>
          <span className="county-panel-name">{county}</span>
          <span className="county-panel-sub">
            {geography.area_km2.toLocaleString()} km² ·{' '}
            {geography.elevation_m.toLocaleString()}m elevation ·{' '}
            Soil: {geography.soil} · Slope: {geography.slope}
          </span>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="county-panel-grid">
        {/* Top-left: 7-day forecast (CSS bars) */}
        <div className="panel-section">
          <p className="panel-section-title">7-DAY RAINFALL FORECAST</p>
          <div className="mini-bar-chart">
            {forecast.map((f, i) => (
              <div key={i} className="mini-bar-col">
                <div className="mini-bar-val">{f.rainfall}</div>
                <div className="mini-bar-track">
                  <div
                    className="mini-bar-fill"
                    style={{
                      height: `${(f.rainfall / maxRain) * 100}%`,
                      background: barColour(f.rainfall)
                    }}
                  />
                </div>
                <div className="mini-bar-label">{f.day}</div>
              </div>
            ))}
          </div>
          <p className="panel-section-note">
            Peak: {maxRain}mm · Total: {totalRain}mm
          </p>
        </div>

        {/* Top-right: Flood risk breakdown */}
        <div className="panel-section">
          <p className="panel-section-title">FLOOD RISK BREAKDOWN</p>
          {floodRisk ? (
            <>
              {/* Total score bar */}
              <div className="score-bar-container">
                <div className="score-label">
                  <span style={{ color: scoreColour, fontSize: 20, fontFamily: 'monospace' }}>
                    {floodRisk.score}
                  </span>
                  <span style={{ fontSize: 11, color: scoreColour, marginLeft: 6 }}>
                    / 100 · {floodRisk.level}
                  </span>
                </div>
                <div className="score-track">
                  <div className="score-fill"
                    style={{ width: `${floodRisk.score}%`, background: scoreColour }} />
                </div>
              </div>
              {/* Sub-scores */}
              {[
                { label: 'Rainfall (40%)',   val: floodRisk.breakdown.rainfall,  max: 40 },
                { label: 'Elevation (30%)',  val: floodRisk.breakdown.elevation, max: 30 },
                { label: 'Soil+Slope (30%)', val: floodRisk.breakdown.soil,      max: 30 },
              ].map(({ label, val, max }) => (
                <div key={label} className="sub-score-row">
                  <span className="sub-score-label">{label}</span>
                  <div className="sub-score-track">
                    <div className="sub-score-fill"
                      style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                  <span className="sub-score-val">{val}</span>
                </div>
              ))}
            </>
          ) : <p className="no-data">Score not yet calculated.</p>}
        </div>

        {/* Bottom-left: SPI trend */}
        <div className="panel-section">
          <p className="panel-section-title">SPI-3 TREND (6 MONTHS)</p>
          <p className="current-spi" style={{
            color: drought.currentSPI < -1.5 ? '#ef4444'
                 : drought.currentSPI < -1.0 ? '#f59e0b'
                 : '#4ade80'
          }}>
            Current SPI: {drought.currentSPI ?? 'N/A'}
          </p>
          {spiHistory.length > 0 ? (
            <div>
              {renderSPISparkline()}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                {spiHistory.map((h, i) => (
                  <span key={i} style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace' }}>
                    {h.year_month}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="no-data">
              SPI history builds over time — check back next month.
            </p>
          )}
        </div>

        {/* Bottom-right: Population */}
        <div className="panel-section">
          <p className="panel-section-title">POPULATION EXPOSURE</p>
          {population ? (
            <>
              <div className="pop-stat">
                <span className="pop-stat-label">Total (2019 census)</span>
                <span className="pop-stat-value">
                  {population.total.toLocaleString()}
                </span>
              </div>
              <div className="pop-stat">
                <span className="pop-stat-label">Estimated at risk</span>
                <span className="pop-stat-value"
                  style={{ color: riskToColour(population.riskLevel) }}>
                  {population.atRisk.toLocaleString()}
                </span>
              </div>
              <div className="pop-stat">
                <span className="pop-stat-label">Exposure rate</span>
                <span className="pop-stat-value">{population.atRiskPct}%</span>
              </div>
              {/* Exposure bar */}
              <div className="score-track" style={{ marginTop: 8 }}>
                <div className="score-fill"
                  style={{
                    width: `${Math.min(population.atRiskPct, 100)}%`,
                    background: riskToColour(population.riskLevel)
                  }} />
              </div>
            </>
          ) : <p className="no-data">Population data unavailable.</p>}

          {/* Active alerts for this county */}
          {alerts?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p className="panel-section-title" style={{ marginBottom: 4 }}>
                ACTIVE ALERTS
              </p>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  fontSize: 10, color: '#94a3b8', padding: '3px 0',
                  borderBottom: '1px solid #1e293b'
                }}>
                  {a.severity === 'CRITICAL' ? '🔴' :
                   a.severity === 'WARNING'  ? '🟡' : '🔵'} {a.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CountyDetailPanel;
