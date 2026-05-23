import AlertCard from './AlertCard';

const severityOrder = { CRITICAL: 0, WARNING: 1, WATCH: 2 };

export default function AlertPanel({ alerts }) {
  const sorted = [...alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  return (
    <div className="alert-panel">
      {sorted.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
