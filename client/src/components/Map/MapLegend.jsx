import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

export default function MapLegend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div style="
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 10px;
          color: #e2e8f0;
          backdrop-filter: blur(8px);
        ">
          <div style="font-weight:600;margin-bottom:5px;letter-spacing:0.5px;text-transform:uppercase;font-size:9px;color:#64748b;">Flood Risk</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="width:12px;height:12px;background:#ef4444;border-radius:2px;display:inline-block;"></span>
            <span>High</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="width:12px;height:12px;background:#f59e0b;border-radius:2px;display:inline-block;"></span>
            <span>Moderate</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;background:#4ade80;border-radius:2px;display:inline-block;"></span>
            <span>Low</span>
          </div>
        </div>
      `;
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}
