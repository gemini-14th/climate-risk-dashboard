import { useState, useEffect, useCallback } from 'react';
import { getForecast, getRiskData, getAlerts } from '../services/api';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const EMPTY_STATE = {
  forecastData: [],
  riskData: { summary: { rainfall24h: 0, droughtSPI: 0, highRiskCounties: 0, totalAtRisk: 0 }, counties: {} },
  alertData: []
};

export function useClimateData() {
  const [data, setData]       = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [forecast, risk, alerts] = await Promise.all([
        getForecast(),
        getRiskData(),
        getAlerts()
      ]);
      setData({ forecastData: forecast, riskData: risk, alertData: alerts });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep showing old data if refresh fails — don't wipe the screen
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refetch: fetchAll
  };
}
