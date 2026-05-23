import { useState, useEffect } from 'react';
import './App.css';
import { useClimateData } from './hooks/useClimateData';
import { getCountyDetail } from './services/api';
import MetricCards from './components/Metrics/MetricCards';
import RiskMap from './components/Map/RiskMap';
import RainfallChart from './components/Charts/RainfallChart';
import AlertPanel from './components/Alerts/AlertPanel';
import PopulationTable from './components/Population/PopulationTable';
import CountyDetailPanel from './components/County/CountyDetailPanel';

function App() {
  const { forecastData, riskData, alertData, loading, error, lastUpdated } = useClimateData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // County drill-down state
  const [selectedCounty, setSelectedCounty]     = useState(null);
  const [countyDetail, setCountyDetail]         = useState(null);
  const [countyLoading, setCountyLoading]       = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleCountyClick = async (countyName) => {
    setSelectedCounty(countyName);
    setCountyLoading(true);
    try {
      const detail = await getCountyDetail(countyName);
      setCountyDetail(detail);
    } catch (err) {
      console.error('County detail fetch failed:', err.message);
    } finally {
      setCountyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Fetching climate data for all 47 counties...</p>
        <p className="loading-sub">Connecting to Open-Meteo API</p>
      </div>
    );
  }

  if (error && !riskData?.counties) {
    return (
      <div className="error-screen">
        <p className="error-title">Data Unavailable</p>
        <p className="error-msg">{error}</p>
        <p className="error-hint">
          The data service is temporarily unavailable.
          Please try again in a moment.
        </p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* ── Top Bar ── */}
      <header className="top-bar">
        <div className="top-bar__title">
          <span>CLIMATEWATCH</span> Kenya / Impact Risk Dashboard
        </div>
        <div className="top-bar__status">
          <span>{formattedTime}</span>
          {lastUpdated && (
            <span className="last-updated">
              Updated {lastUpdated.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span className="live-dot" />
          <span className="live-text">LIVE</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="body-layout">
        {/* ── Left / Main Panel ── */}
        <main className="main-panel">
          <MetricCards summary={riskData.summary} />
          <RiskMap
            counties={riskData.counties}
            onCountyClick={handleCountyClick}
            selectedCounty={selectedCounty}
          />
          <div className="bottom-row">
            <RainfallChart forecastData={forecastData} />
            <PopulationTable counties={riskData.counties} />
          </div>
          {countyDetail && (
            <CountyDetailPanel
              data={countyDetail}
              loading={countyLoading}
              onClose={() => { setSelectedCounty(null); setCountyDetail(null); }}
            />
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="right-panel">
          <div className="right-panel__title">Active Alerts</div>
          <AlertPanel alerts={alertData} />
        </aside>
      </div>
    </div>
  );
}

export default App;
