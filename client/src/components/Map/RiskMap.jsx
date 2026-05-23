import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CountyLayer from './CountyLayer';
import MapLegend from './MapLegend';

export default function RiskMap({ counties, onCountyClick, selectedCounty }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/kenya-counties.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  return (
    <div className="map-container">
      <MapContainer
        center={[0.0236, 37.9062]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && (
          <CountyLayer
            geoData={geoData}
            counties={counties}
            onCountyClick={onCountyClick}
            selectedCounty={selectedCounty}
          />
        )}
        <MapLegend />
      </MapContainer>
    </div>
  );
}
