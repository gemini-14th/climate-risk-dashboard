import { GeoJSON } from 'react-leaflet';
import { riskToColour } from '../../utils/riskClassifier';
import { formatNumber, formatSPI } from '../../utils/formatters';

export default function CountyLayer({ geoData, counties, onCountyClick, selectedCounty }) {
  const styleFeature = (feature) => {
    const name       = feature.properties.NAME_1;
    const countyData = counties[name];
    const isSelected = name === selectedCounty;
    const fillColor  = countyData
      ? riskToColour(countyData.floodRisk)
      : '#334155';

    return {
      fillColor,
      fillOpacity: isSelected ? 0.9 : 0.65,
      color:       isSelected ? '#ffffff' : '#0f172a',
      weight:      isSelected ? 2.5 : 1,
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.NAME_1;
    const data = counties[name] || {};

    // Hover tooltip with risk breakdown
    layer.bindTooltip(`
      <div style="font-family:monospace;font-size:11px;line-height:1.6">
        <strong>${name}</strong><br/>
        Flood Risk: <span style="color:${riskToColour(data.floodRisk)}">${data.floodRisk || 'N/A'}</span><br/>
        SPI: ${data.droughtSPI != null ? formatSPI(data.droughtSPI) : 'N/A'}<br/>
        At Risk: ${data.population ? formatNumber(data.population) : 'N/A'} people<br/>
        <em style="color:#94a3b8">Click for full detail</em>
      </div>
    `, { sticky: true, opacity: 0.95 });

    // Click opens the county detail panel
    layer.on('click', () => {
      if (onCountyClick) onCountyClick(name);
    });
  };

  return (
    <GeoJSON
      key={selectedCounty || 'default'}
      data={geoData}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}
