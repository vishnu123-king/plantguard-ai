import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  Wind,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Droplets,
  MapPin,
  RefreshCw,
  Info,
  Radio,
  Sparkles,
  Newspaper,
  Compass,
  Edit3,
  Check
} from 'lucide-react';
import {
  SprayWashoutAdvisory,
  HourlySprayWindowPoint,
  DistrictWeatherNewsAlert
} from '../shared/types/weather.types';
import { MobileLocationService } from '../mobile/location.service';

interface SprayWashoutAdvisorProps {
  latitude?: number;
  longitude?: number;
  cropName?: string;
  diseaseName?: string;
  compact?: boolean;
}

export const SprayWashoutAdvisor: React.FC<SprayWashoutAdvisorProps> = ({
  latitude = 11.0168,
  longitude = 76.9558,
  cropName = 'Crop',
  diseaseName = 'Foliar Disease',
  compact = false
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isGpsDetecting, setIsGpsDetecting] = useState<boolean>(false);
  const [isEditingCoords, setIsEditingCoords] = useState<boolean>(false);
  const [advisory, setAdvisory] = useState<SprayWashoutAdvisory | null>(null);
  const [districtAlert, setDistrictAlert] = useState<DistrictWeatherNewsAlert | null>(null);
  
  // Try to load saved custom coordinates first if present
  const saved = MobileLocationService.getSavedCoordinates();
  const initialLat = saved ? saved.latitude : latitude;
  const initialLon = saved ? saved.longitude : longitude;

  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLon, setCurrentLon] = useState<number>(initialLon);
  const [inputLat, setInputLat] = useState<string>(initialLat.toFixed(6));
  const [inputLon, setInputLon] = useState<string>(initialLon.toFixed(6));
  const [coordSource, setCoordSource] = useState<string>(saved ? 'saved_custom' : 'calibrated_default');
  const [simulationMode, setSimulationMode] = useState<'live' | 'rain_simulation' | 'dry_simulation'>('live');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchSprayData = async (lat: number, lon: number, mode: string = simulationMode) => {
    setLoading(true);
    try {
      if (mode === 'rain_simulation') {
        // High rain simulation scenario for demonstration
        const now = new Date();
        const simTimeline: HourlySprayWindowPoint[] = [
          {
            timeIso: new Date(now.getTime() + 3600000).toISOString(),
            hourLabel: new Date(now.getTime() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            hourOffset: 1,
            precipitationMm: 0.0,
            precipitationProbability: 20,
            temperatureC: 27.5,
            relativeHumidityPercent: 78,
            windSpeedKmh: 9.0,
            weatherCode: 2,
            weatherDescription: 'Partly cloudy',
            isRainExpected: false
          },
          {
            timeIso: new Date(now.getTime() + 7200000).toISOString(),
            hourLabel: new Date(now.getTime() + 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            hourOffset: 2,
            precipitationMm: 2.8,
            precipitationProbability: 85,
            temperatureC: 25.0,
            relativeHumidityPercent: 89,
            windSpeedKmh: 14.5,
            weatherCode: 63,
            weatherDescription: 'Moderate rain showers',
            isRainExpected: true
          },
          {
            timeIso: new Date(now.getTime() + 10800000).toISOString(),
            hourLabel: new Date(now.getTime() + 10800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            hourOffset: 3,
            precipitationMm: 4.5,
            precipitationProbability: 95,
            temperatureC: 24.0,
            relativeHumidityPercent: 94,
            windSpeedKmh: 16.0,
            weatherCode: 65,
            weatherDescription: 'Heavy rain showers',
            isRainExpected: true
          },
          {
            timeIso: new Date(now.getTime() + 14400000).toISOString(),
            hourLabel: new Date(now.getTime() + 14400000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            hourOffset: 4,
            precipitationMm: 1.2,
            precipitationProbability: 60,
            temperatureC: 24.5,
            relativeHumidityPercent: 92,
            windSpeedKmh: 11.0,
            weatherCode: 61,
            weatherDescription: 'Light rain',
            isRainExpected: true
          },
          {
            timeIso: new Date(now.getTime() + 18000000).toISOString(),
            hourLabel: new Date(now.getTime() + 18000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            hourOffset: 5,
            precipitationMm: 0.1,
            precipitationProbability: 35,
            temperatureC: 25.5,
            relativeHumidityPercent: 86,
            windSpeedKmh: 8.5,
            weatherCode: 3,
            weatherDescription: 'Overcast',
            isRainExpected: false
          }
        ];

        setAdvisory({
          canSpray: false,
          verdict: 'DO_NOT_SPRAY',
          badgeTitle: '⛔ DO NOT SPRAY (Rain in next 2 hours)',
          headline: 'Severe Washout Hazard: 8.6 mm Rain Forecasted within 5h Window',
          detailedReason: `Chemical and bio-pesticides require at least 4 to 6 continuous hours of dry foliage ('rainfastness window'). Rain showers will arrive in ~2 hours (+2h), which will completely wash off the active ingredients into the soil, causing 100% loss of chemical input costs.`,
          rainProbability5hMax: 95,
          totalRainfall5hMm: 8.6,
          firstRainHour: '+2h',
          dryHoursAvailable: 1,
          rainfastnessRequirementHours: 5,
          windStatus: {
            windSpeedKmh: 14.5,
            isWindSafe: true,
            windDriftRisk: 'MODERATE',
            comment: 'Wind speed is acceptable, but rainfall causes immediate pesticide wash-off.'
          },
          optimalWindowRecommendation: 'Wait for rain system to pass. Best expected window: Tomorrow morning 07:00 AM - 10:30 AM.',
          nextSafeSprayWindow: 'Tomorrow morning after leaf moisture dries completely.',
          hourlyTimeline: simTimeline,
          evaluatedAt: new Date().toISOString()
        });

        setDistrictAlert({
          district: 'Coimbatore',
          state: 'Tamil Nadu',
          country: 'India',
          locality: 'Agro Meteorological Zone',
          coordinates: { latitude: lat, longitude: lon },
          alertLevel: 'ORANGE_ALERT',
          alertColor: '#F97316',
          headline: 'IMD Agromet Advisory: Convective Rain Showers Active in District',
          bulletinText: `Regional Meteorological Centre issues a heavy rain & thunderstorm watch for Coimbatore District. Active cloud bands moving northeast. Soil moisture approaching saturation.`,
          source: 'India Meteorological Department (IMD) Agromet Bulletin',
          issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rainForecastSummary: '85-95% probability of moderate to heavy rain showers over the next 2-5 hours.',
          sprayRecommendation: '⛔ STRICT ADVISORY: Immediately suspend all foliar pesticide & fungicide sprays. Rain will wash off chemicals.'
        });
        setLoading(false);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }

      if (mode === 'dry_simulation') {
        // Clear dry window simulation
        const now = new Date();
        const simTimeline: HourlySprayWindowPoint[] = [1, 2, 3, 4, 5].map((h) => ({
          timeIso: new Date(now.getTime() + h * 3600000).toISOString(),
          hourLabel: new Date(now.getTime() + h * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          hourOffset: h,
          precipitationMm: 0.0,
          precipitationProbability: 5,
          temperatureC: 28.0 + h * 0.4,
          relativeHumidityPercent: 65 - h * 2,
          windSpeedKmh: 7.5,
          weatherCode: 0,
          weatherDescription: 'Clear sunny sky',
          isRainExpected: false
        }));

        setAdvisory({
          canSpray: false ? false : true,
          verdict: 'SAFE_TO_SPRAY',
          badgeTitle: '✅ SAFE TO SPRAY (5h Dry Window Confirmed)',
          headline: 'Optimal Spray Window Active: 0% Rain Probability in Next 5 Hours',
          detailedReason: `Zero precipitation forecasted over the next 5 continuous hours. Foliar fungicides (chemical and organic) will have full uninterrupted time (4–6 hours) to adhere and penetrate leaf tissue.`,
          rainProbability5hMax: 5,
          totalRainfall5hMm: 0.0,
          firstRainHour: null,
          dryHoursAvailable: 5,
          rainfastnessRequirementHours: 5,
          windStatus: {
            windSpeedKmh: 7.5,
            isWindSafe: true,
            windDriftRisk: 'LOW',
            comment: 'Wind speed (7.5 km/h) is optimal for fine foliar mist coverage without droplet drift.'
          },
          optimalWindowRecommendation: 'Current window is ideal. Spray now before midday peak heat.',
          nextSafeSprayWindow: 'Now through next 6 hours.',
          hourlyTimeline: simTimeline,
          evaluatedAt: new Date().toISOString()
        });

        setDistrictAlert({
          district: 'Coimbatore',
          state: 'Tamil Nadu',
          country: 'India',
          locality: 'Field Coordinates Zone',
          coordinates: { latitude: lat, longitude: lon },
          alertLevel: 'GREEN_CLEAR',
          alertColor: '#10B981',
          headline: 'District Agro-Met Bulletin: Dry Weather & Stable Atmospheric Conditions',
          bulletinText: `Gramin Krishi Mausam Sewa confirms fair, stable weather across the district. Low humidity and mild breeze favor agricultural operations.`,
          source: 'IMD / GKMS Agromet Advisory Division',
          issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rainForecastSummary: 'No rain expected in the district over the next 24 to 48 hours.',
          sprayRecommendation: '✅ OPTIMAL CONDITIONS: Proceed with scheduled crop protection and bio-fungicide sprays.'
        });
        setLoading(false);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }

      // Live Open-Meteo & District News Backend API Call
      const res = await fetch(`/api/v1/spray-advisor?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sprayWashoutAdvisory) {
          setAdvisory(data.sprayWashoutAdvisory);
        }
        if (data.districtNewsAlert) {
          setDistrictAlert(data.districtNewsAlert);
        }
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load spray advisor telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprayData(currentLat, currentLon, simulationMode);
  }, [currentLat, currentLon, simulationMode]);

  const handleUseGpsLocation = async () => {
    setIsGpsDetecting(true);
    const result = await MobileLocationService.getCurrentLocation(true);
    setIsGpsDetecting(false);

    if (result.success && result.coordinates) {
      const lat = result.coordinates.latitude;
      const lon = result.coordinates.longitude;
      setCurrentLat(lat);
      setCurrentLon(lon);
      setInputLat(lat.toFixed(6));
      setInputLon(lon.toFixed(6));
      setCoordSource(result.source || 'device_gps');
      fetchSprayData(lat, lon, 'live');
      setSimulationMode('live');
    }
  };

  const handleApplyCustomCoordinates = () => {
    const lat = parseFloat(inputLat);
    const lon = parseFloat(inputLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setCurrentLat(lat);
      setCurrentLon(lon);
      MobileLocationService.saveCoordinates({ latitude: lat, longitude: lon, accuracyM: 2.5 });
      setCoordSource('saved_custom');
      setIsEditingCoords(false);
      fetchSprayData(lat, lon, 'live');
      setSimulationMode('live');
    }
  };

  const isDoNotSpray = advisory?.verdict === 'DO_NOT_SPRAY';
  const isCaution = advisory?.verdict === 'CAUTION_WIND_OR_MARGINAL';
  const isSafe = advisory?.verdict === 'SAFE_TO_SPRAY';

  return (
    <div className="space-y-4">
      {/* Active GPS Coordinates & Location Selector Strip */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white">
                Active Farm Location: {currentLat.toFixed(4)}°N, {currentLon.toFixed(4)}°E
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {coordSource === 'device_gps' ? '📡 Live Phone GPS' : coordSource === 'saved_custom' ? '📍 Saved Custom Coordinates' : '🌐 Regional Baseline'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {districtAlert ? `${districtAlert.district} District, ${districtAlert.state}` : 'Synchronized with Open-Meteo microclimate telemetry'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingCoords(!isEditingCoords)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            {isEditingCoords ? 'Close Input' : 'Edit / Enter Maps Lat & Lng'}
          </button>
          <button
            onClick={handleUseGpsLocation}
            disabled={isGpsDetecting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-xs"
          >
            <Compass className={`w-3.5 h-3.5 ${isGpsDetecting ? 'animate-spin' : ''}`} />
            {isGpsDetecting ? 'Acquiring GPS...' : '📍 Auto-Detect GPS'}
          </button>
        </div>
      </div>

      {/* Expandable Manual Lat/Lng Input (Google Maps compatible) */}
      {isEditingCoords && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" /> Set Exact Lat & Long from Google Maps
            </span>
            <span className="text-[11px] text-slate-400">
              Copy lat/lng directly from Google Maps app (e.g. 13.0827, 80.2707)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Latitude (e.g. 11.016844 or from phone map)
              </label>
              <input
                type="number"
                step="0.000001"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="11.016844"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Longitude (e.g. 76.955832 or from phone map)
              </label>
              <input
                type="number"
                step="0.000001"
                value={inputLon}
                onChange={(e) => setInputLon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="76.955832"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsEditingCoords(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCustomCoordinates}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              <Check className="w-3.5 h-3.5" /> Apply & Sync Weather Forecast
            </button>
          </div>
        </div>
      )}

      {/* Primary 5-Hour Spray Feasibility Card */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-all ${
          isDoNotSpray
            ? 'bg-rose-950/30 border-rose-800/60 text-rose-100'
            : isCaution
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-100'
            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-100'
        }`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isDoNotSpray
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : isCaution
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isDoNotSpray ? (
                <CloudRain className="w-5 h-5" />
              ) : isCaution ? (
                <Wind className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Open-Meteo Spray Washout Engine
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
                  <Clock className="w-3 h-3 text-emerald-400" /> 5-Hour Lookahead
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                {isDoNotSpray ? '⛔ DO NOT SPRAY PESTICIDES' : isCaution ? '⚠️ SPRAY WITH CAUTION' : '✅ SAFE TO SPRAY PESTICIDES'}
              </h3>
            </div>
          </div>

          {/* Quick Refresh & GPS info */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => fetchSprayData(currentLat, currentLon, simulationMode)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleUseGpsLocation}
              disabled={isGpsDetecting}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition"
              title="Use Device GPS"
            >
              <Compass className={`w-3 h-3 text-emerald-400 ${isGpsDetecting ? 'animate-spin' : ''}`} />
              {isGpsDetecting ? 'Detecting...' : 'My GPS'}
            </button>
          </div>
        </div>

        {/* Big Verdict Banner */}
        <div className="mb-4">
          <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            {isDoNotSpray ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{advisory?.headline}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{advisory?.detailedReason}</p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Max Rain Prob (5h)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-lg font-black ${
                  (advisory?.rainProbability5hMax ?? 0) >= 30 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {advisory?.rainProbability5hMax ?? 0}%
              </span>
              <span className="text-[10px] text-slate-400">chance</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total 5h Rainfall</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-lg font-black ${
                  (advisory?.totalRainfall5hMm ?? 0) >= 0.2 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {advisory?.totalRainfall5hMm ?? 0}
              </span>
              <span className="text-[10px] text-slate-400">mm</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Dry Window Left</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-white">{advisory?.dryHoursAvailable ?? 0} / 5</span>
              <span className="text-[10px] text-slate-400">hours</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Wind Drift Safety</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-lg font-black ${
                  (advisory?.windStatus?.windSpeedKmh ?? 0) > 15 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {advisory?.windStatus?.windSpeedKmh ?? 8}
              </span>
              <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>
        </div>

        {/* 5-Hour Step-by-Step Radar Timeline */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Hourly Rain & Spray Risk Radar
            </span>
            <span className="text-[10px] text-slate-400">Min. Rainfastness Required: 4–6 hrs</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(advisory?.hourlyTimeline || []).map((hour, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${
                  hour.isRainExpected
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-[11px] font-bold text-white mb-0.5">+{hour.hourOffset}h</span>
                <span className="text-[10px] text-slate-400 mb-1">{hour.hourLabel}</span>

                {hour.isRainExpected ? (
                  <CloudRain className="w-4 h-4 text-rose-400 mb-1 animate-bounce" />
                ) : (
                  <Sun className="w-4 h-4 text-emerald-400 mb-1" />
                )}

                {/* Rain probability bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 my-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      hour.precipitationProbability >= 50
                        ? 'bg-rose-500'
                        : hour.precipitationProbability >= 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(8, hour.precipitationProbability)}%` }}
                  />
                </div>

                <div className="text-[10px] font-bold mt-0.5">
                  <span className={hour.precipitationProbability >= 30 ? 'text-rose-400' : 'text-slate-300'}>
                    {hour.precipitationProbability}%
                  </span>
                  {hour.precipitationMm > 0 && (
                    <span className="block text-[9px] text-rose-300 font-normal">({hour.precipitationMm}mm)</span>
                  )}
                </div>

                <span
                  className={`mt-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    hour.isRainExpected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {hour.isRainExpected ? 'Washout' : 'Dry'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Optimal Spray Window Recommendation */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Next Optimal Spray Window</span>
            <span className="text-slate-300">{advisory?.nextSafeSprayWindow}</span>
          </div>
        </div>

        {/* Simulation Mode Toggle (For farmer testing) */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" /> Mode:
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSimulationMode('live')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                simulationMode === 'live'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Live Open-Meteo
            </button>
            <button
              onClick={() => setSimulationMode('rain_simulation')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                simulationMode === 'rain_simulation'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌧️ Simulate Rain (Washout)
            </button>
            <button
              onClick={() => setSimulationMode('dry_simulation')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                simulationMode === 'dry_simulation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ☀️ Simulate Dry Window
            </button>
          </div>
        </div>
      </div>

      {/* METHOD 2: GPS District Identification & Official Meteorological Rain News Alert */}
      {districtAlert && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Newspaper className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Method 2: GPS District Weather Bulletin
                </span>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {districtAlert.district} District, {districtAlert.state}
                </h4>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                districtAlert.alertLevel === 'ORANGE_ALERT' || districtAlert.alertLevel === 'RED_WARNING'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : districtAlert.alertLevel === 'YELLOW_WATCH'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {districtAlert.alertLevel.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="font-bold text-white text-sm">{districtAlert.headline}</div>
            <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              {districtAlert.bulletinText}
            </p>

            <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  District Rainfall Forecast
                </span>
                <p className="text-slate-300 text-xs">{districtAlert.rainForecastSummary}</p>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Agronomic Spray Advice
                </span>
                <p className="text-slate-300 text-xs">{districtAlert.sprayRecommendation}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Source: {districtAlert.source}</span>
              <span>Issued: {districtAlert.issuedAt}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rainfastness Guide for Common Pesticides */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300">
        <div className="font-bold text-white flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-emerald-400" /> Agronomic Rainfastness Guide (Foliar Adhesion Time)
        </div>
        <p className="text-slate-400 leading-relaxed mb-3">
          When applying foliar fungicide/pesticide sprays on <strong>{cropName}</strong> to treat <strong>{diseaseName}</strong>, ensure the minimum dry rainfastness interval before rainfall:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Copper Oxychloride</span>
            <span className="font-bold text-emerald-400">4 Hours Dry</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Mancozeb / Dithane</span>
            <span className="font-bold text-emerald-400">5–6 Hours Dry</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Azoxystrobin (Systemic)</span>
            <span className="font-bold text-emerald-400">3–4 Hours Dry</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Neem / Bio-Formulations</span>
            <span className="font-bold text-emerald-400">6 Hours Dry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
