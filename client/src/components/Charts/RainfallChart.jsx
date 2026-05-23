import { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getBarColour } from '../../utils/riskClassifier';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Custom plugin to draw the alert threshold line
const thresholdLinePlugin = {
  id: 'thresholdLine',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const yValue = scales.y.getPixelForValue(35);
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.moveTo(chartArea.left, yValue);
    ctx.lineTo(chartArea.right, yValue);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Alert: 35mm', chartArea.right - 62, yValue - 5);
    ctx.restore();
  },
};

export default function RainfallChart({ forecastData }) {
  const labels = forecastData.map((d) => d.day);
  const values = forecastData.map((d) => d.rainfall);
  const colors = values.map((v) => getBarColour(v));

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 18,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y}mm`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
    },
  };

  return (
    <div className="rainfall-chart">
      <div className="rainfall-chart__header">
        <span className="rainfall-chart__title">7-Day Rainfall Forecast</span>
      </div>
      <div className="rainfall-chart__canvas" style={{ position: 'relative', height: '90px' }}>
        <Bar data={data} options={options} plugins={[thresholdLinePlugin]} />
      </div>
      <div className="rainfall-chart__legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }} />
          <span>&gt;50mm Critical</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f59e0b' }} />
          <span>&gt;35mm Warning</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#38bdf8' }} />
          <span>&gt;20mm Watch</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4ade80' }} />
          <span>Normal</span>
        </div>
      </div>

      <style>{`
        .rainfall-chart {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 12px;
        }
        .rainfall-chart__header {
          margin-bottom: 8px;
        }
        .rainfall-chart__title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-muted);
        }
        .rainfall-chart__legend {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--color-text-muted);
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
