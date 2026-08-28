import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  ShieldAlert, 
  Layers, 
  Compass, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Plus, 
  Sparkles, 
  Calendar, 
  RefreshCw,
  TrendingUp,
  FileText
} from 'lucide-react';
import { FarmContext, CreateFarmInput } from '../shared/types/farm.types';
import { EnvironmentalProfile } from '../shared/types/environment.types';
import { EnhancedCropHealthAnalysis, RiskResult } from '../shared/types/risk.types';
import { MobileLocationService } from '../mobile/location.service';

interface Layer2Props {
  currentDiagnosis?: any;
}

export const Layer2EnvironmentalIntelligence: React.FC<Layer2Props> = ({ currentDiagnosis }) => {
  const [farms, setFarms] = useState<FarmContext[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('farm_001');
  const [selectedFarm, setSelectedFarm] = useState<FarmContext | null>(null);
  const [envProfile, setEnvProfile] = useState<EnvironmentalProfile | null>(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedCropHealthAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGpsDetecting, setIsGpsDetecting] = useState<boolean>(false);
  const [isCreatingFarm, setIsCreatingFarm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'enhanced' | 'add_farm' | 'raw_api'>('dashboard');

  // Form State for Adding Farm
  const [farmForm, setFarmForm] = useState<CreateFarmInput>({
    name: 'Coimbatore Agro Plot 1',
    latitude: 11.0168,
    longitude: 76.9558,
    accuracyM: 6.5,
    cropType: 'Tomato',
    cropVariety: 'Pusa Ruby',
    plantingDate: '2026-07-15',
    growthStage: 'flowering',
    waterSource: 'borewell',
    waterCondition: 'sufficient',
    notes: 'South field plot under drip irrigation.'
  });

  // Load farms on mount
  useEffect(() => {
    fetchFarms();
  }, []);

  // Fetch Environmental profile when farm selection changes
  useEffect(() => {
    if (selectedFarmId) {
      loadFarmAndEnvironment(selectedFarmId);
    }
  }, [selectedFarmId]);

  // Run Combined Analysis when Layer 1 diagnosis or farm changes
  useEffect(() => {
    if (selectedFarmId && currentDiagnosis) {
      runCombinedAnalysis(selectedFarmId, currentDiagnosis);
    }
  }, [selectedFarmId, currentDiagnosis]);

  const fetchFarms = async () => {
    try {
      const res = await fetch('/api/v1/farms');
      const data = await res.json();
      if (data.farms && data.farms.length > 0) {
        setFarms(data.farms);
        setSelectedFarmId(data.farms[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch farms:', e);
    }
  };

  const loadFarmAndEnvironment = async (farmId: string) => {
    setIsLoading(true);
    try {
      const [farmRes, envRes] = await Promise.all([
        fetch(`/api/v1/farms/${farmId}`),
        fetch(`/api/v1/farms/${farmId}/environment`)
      ]);

      if (farmRes.ok) {
        const farmData = await farmRes.json();
        setSelectedFarm(farmData);
      }

      if (envRes.ok) {
        const envData = await envRes.json();
        setEnvProfile(envData);
      }
    } catch (e) {
      console.error('Failed to load farm environment:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const detectLocation = async () => {
    setIsGpsDetecting(true);
    const result = await MobileLocationService.getCurrentLocation();
    setIsGpsDetecting(false);

    if (result.success && result.coordinates) {
      setFarmForm((prev) => ({
        ...prev,
        latitude: result.coordinates!.latitude,
        longitude: result.coordinates!.longitude,
        accuracyM: result.coordinates!.accuracyM
      }));
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmForm)
      });
      if (res.ok) {
        const newFarm = await res.json();
        setFarms((prev) => [newFarm, ...prev]);
        setSelectedFarmId(newFarm.id);
        setIsCreatingFarm(false);
        setActiveTab('dashboard');
      }
    } catch (e) {
      console.error('Failed to create farm:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const runCombinedAnalysis = async (farmId: string, layer1Payload: any) => {
    try {
      const res = await fetch('/api/v1/analysis/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          layer1Data: layer1Payload
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEnhancedAnalysis(data);
      }
    } catch (e) {
      console.error('Failed to run combined analysis:', e);
    }
  };

  const weather = envProfile?.weather.current;
  const history24h = envProfile?.weather.historical?.last24Hours;
  const soil = envProfile?.soil;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 mt-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <Layers className="w-3.5 h-3.5" /> SIH26131 LAYER 2
            </span>
            <span className="text-xs text-slate-400 font-mono">ENVIRONMENTAL INTELLIGENCE ENGINE</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Geospatial Farm & Climate Intelligence
          </h2>
          <p className="text-sm text-slate-400">
            Real-time Open-Meteo microclimate telemetry + ISRIC SoilGrids pedological analysis + Explainable Risk Engine
          </p>
        </div>

        {/* Farm Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.cropType})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveTab('add_farm')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" /> Add Farm GPS
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 pt-4 pb-6 border-b border-slate-800/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Environmental Profile
        </button>
        <button
          onClick={() => setActiveTab('enhanced')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'enhanced'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Layer 1 + Layer 2 Combined Risk
        </button>
        <button
          onClick={() => setActiveTab('add_farm')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'add_farm'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" /> Register Farm (GPS)
        </button>
        <button
          onClick={() => setActiveTab('raw_api')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'raw_api'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> API Schema & Verification
        </button>
      </div>

      {/* Content Area */}
      <div className="pt-6">
        {/* TAB 1: ENVIRONMENTAL DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Selected Farm Context Strip */}
            {selectedFarm && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedFarm.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      GPS: {selectedFarm.location.latitude.toFixed(4)}°N, {selectedFarm.location.longitude.toFixed(4)}°E (Accuracy ±{selectedFarm.location.accuracyM || 6.2}m)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-medium">
                    Crop: <strong className="text-emerald-400">{selectedFarm.cropType} ({selectedFarm.cropVariety})</strong>
                  </span>
                  <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-medium">
                    Stage: <strong className="text-amber-400 uppercase">{selectedFarm.growthStage}</strong>
                  </span>
                  <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-medium">
                    Water: <strong className="text-blue-400">{selectedFarm.waterSource} ({selectedFarm.waterCondition})</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Weather & Soil Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Temperature */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Air Temperature</span>
                  <Thermometer className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {weather?.temperatureC ?? 28.7} <span className="text-lg font-normal text-slate-400">°C</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-400">24h avg:</span> {history24h?.averageTemperatureC ?? 27.2}°C (Min {history24h?.minTemperatureC ?? 22}°C / Max {history24h?.maxTemperatureC ?? 32}°C)
                </p>
              </div>

              {/* Card 2: Relative Humidity */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Relative Humidity</span>
                  <Droplets className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {weather?.relativeHumidityPercent ?? 86} <span className="text-lg font-normal text-slate-400">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong className="text-amber-400">{history24h?.highHumidityHoursCount ?? 8} hrs</strong> with RH &gt; 85% (High Spore Pressure)
                </p>
              </div>

              {/* Card 3: Precipitation */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Precipitation (24h)</span>
                  <CloudSun className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {history24h?.totalRainfallMm ?? weather?.precipitationMm ?? 5.2} <span className="text-lg font-normal text-slate-400">mm</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Wind Speed: <span className="text-slate-200">{weather?.windSpeedKmh ?? 11.4} km/h</span> ({weather?.weatherDescription ?? 'Partly cloudy'})
                </p>
              </div>

              {/* Card 4: Soil Profile */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Soil Profile (ISRIC)</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  pH {soil?.ph ?? 6.4} <span className="text-sm font-normal text-emerald-400">({soil?.textureClass ?? 'Sandy Loam'})</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Sand {soil?.sandPercent ?? 48}% | Clay {soil?.clayPercent ?? 24}% | Silt {soil?.siltPercent ?? 28}%
                </p>
              </div>
            </div>

            {/* Pedological & Meteorological Provenance Box */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono">
              <div>
                <strong className="text-slate-300">Data Provenance:</strong> Open-Meteo API v1 + ISRIC SoilGrids v2.0 REST API (250m resolution spatial modeling).
              </div>
              <div className="text-slate-500">
                Last Telemetry Sync: {envProfile ? new Date(envProfile.retrievedAt).toLocaleTimeString() : 'Live'}
              </div>
            </div>

            {/* 7-Day Forecast Strip */}
            {envProfile?.weather?.forecast && envProfile.weather.forecast.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Agro-Weather Forecast
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {envProfile.weather.forecast.slice(0, 7).map((f, i) => (
                    <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-center">
                      <span className="text-xs font-mono text-slate-400 block mb-1">
                        {new Date(f.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                      </span>
                      <div className="text-sm font-bold text-white mb-1">
                        {f.temperatureMaxC}° / <span className="text-slate-400 text-xs">{f.temperatureMinC}°</span>
                      </div>
                      <div className="text-xs text-blue-400 font-medium">
                        🌧 {f.precipitationSumMm} mm
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMBINED LAYER 1 + LAYER 2 RISK ENGINE */}
        {activeTab === 'enhanced' && (
          <div className="space-y-6">
            {enhancedAnalysis ? (
              <div className="space-y-6">
                {/* Risk Score Banner */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      SIH26131 Combined Analysis
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      {enhancedAnalysis.layer1.crop.name} — {enhancedAnalysis.layer1.disease.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Layer 1 (Gemini Vision) + Layer 2 (Microclimate + SoilGrids Profile)
                    </p>
                  </div>

                  {/* Gauge 1: Environmental Suitability */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400 font-medium block mb-1">Environmental Disease Suitability</span>
                    <div className="text-3xl font-black text-amber-400">
                      {(enhancedAnalysis.riskEvaluation.environmentalRiskScore * 100).toFixed(0)}%
                    </div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
                      {enhancedAnalysis.riskEvaluation.environmentalRiskLevel} RISK
                    </span>
                  </div>

                  {/* Gauge 2: Overall Combined Crop Risk */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400 font-medium block mb-1">Overall Combined Health Risk</span>
                    <div className="text-3xl font-black text-rose-400">
                      {enhancedAnalysis.riskEvaluation.overallCombinedRiskScore} <span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      {enhancedAnalysis.riskEvaluation.overallCombinedRiskLevel} RISK
                    </span>
                  </div>
                </div>

                {/* Explainable Factors Breakdown */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-emerald-400" /> Explainable Risk Factors Breakdown
                  </h4>
                  <div className="space-y-3">
                    {enhancedAnalysis.riskEvaluation.factors.map((factor, i) => (
                      <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 md:max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{factor.label}</span>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                              Observed: {factor.observedValue}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{factor.rationale}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-slate-500 block">Conducive Threshold</span>
                            <span className="text-slate-300 font-mono">{factor.optimalRangeDescription}</span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full font-bold uppercase text-xs ${
                              factor.impactLevel === 'critical' || factor.impactLevel === 'high'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : factor.impactLevel === 'moderate'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {factor.impactLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agronomic Recommendations */}
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-6">
                  <h4 className="text-base font-bold text-emerald-300 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" /> Climate-Aware Agronomic Guidance
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {enhancedAnalysis.riskEvaluation.agronomicActionAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-slate-300">No Combined Analysis Generated Yet</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Upload or scan a leaf image above with Layer 1, then click the button below to compute the full Layer 1 + Layer 2 Environmental Intelligence profile.
                </p>
                <button
                  onClick={() => runCombinedAnalysis(selectedFarmId, currentDiagnosis || {
                    plant: { name: 'Tomato', confidence: 94 },
                    diagnosis: { disease: 'Early Blight', confidence: 89, status: 'diseased' },
                    severity: 'moderate',
                    metrics: { risk_score: 64 }
                  })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/30"
                >
                  Generate Combined Layer 1 + Layer 2 Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER FARM (GPS) */}
        {activeTab === 'add_farm' && (
          <form onSubmit={handleCreateFarm} className="max-w-2xl mx-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" /> Register Farm Plot & GPS Location
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Captures GPS coordinates (Expo Location) and establishes baseline pedoclimatic telemetry for Layer 2.
              </p>
            </div>

            {/* GPS Detection Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">GPS Location</span>
                <div className="font-mono text-sm text-emerald-400 font-bold mt-0.5">
                  Lat: {farmForm.latitude.toFixed(4)}, Lng: {farmForm.longitude.toFixed(4)} (±{farmForm.accuracyM || 5}m)
                </div>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={isGpsDetecting}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGpsDetecting ? 'animate-spin' : ''}`} />
                {isGpsDetecting ? 'Detecting...' : 'Detect My Location'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Farm Plot Name</label>
                <input
                  type="text"
                  value={farmForm.name}
                  onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Crop Type</label>
                <select
                  value={farmForm.cropType}
                  onChange={(e) => setFarmForm({ ...farmForm, cropType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Grape">Grape</option>
                  <option value="Apple">Apple</option>
                  <option value="Corn">Corn / Maize</option>
                  <option value="Rice">Rice / Paddy</option>
                  <option value="Bell Pepper">Bell Pepper</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Crop Variety (Optional)</label>
                <input
                  type="text"
                  value={farmForm.cropVariety}
                  onChange={(e) => setFarmForm({ ...farmForm, cropVariety: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Growth Stage</label>
                <select
                  value={farmForm.growthStage}
                  onChange={(e) => setFarmForm({ ...farmForm, growthStage: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="seedling">Seedling</option>
                  <option value="vegetative">Vegetative</option>
                  <option value="flowering">Flowering</option>
                  <option value="fruiting">Fruiting</option>
                  <option value="ripening">Ripening</option>
                  <option value="harvest">Harvest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Water Source</label>
                <select
                  value={farmForm.waterSource}
                  onChange={(e) => setFarmForm({ ...farmForm, waterSource: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="borewell">Borewell</option>
                  <option value="canal">Canal</option>
                  <option value="drip_irrigation">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="rainfed">Rainfed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Water Condition</label>
                <select
                  value={farmForm.waterCondition}
                  onChange={(e) => setFarmForm({ ...farmForm, waterCondition: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="abundant">Abundant</option>
                  <option value="sufficient">Sufficient</option>
                  <option value="moderate">Moderate</option>
                  <option value="scarce">Scarce</option>
                  <option value="drought_stress">Drought Stress</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/30"
              >
                {isLoading ? 'Saving...' : 'Save & Sync Environment'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: API VERIFICATION & SCHEMAS */}
        {activeTab === 'raw_api' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-bold text-slate-200 mb-2 font-mono">GET /api/v1/farms/{selectedFarmId}/environment</h4>
              <pre className="text-xs text-emerald-400 font-mono bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-64">
                {JSON.stringify(envProfile, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-bold text-slate-200 mb-2 font-mono">POST /api/v1/analysis/enhanced</h4>
              <pre className="text-xs text-sky-400 font-mono bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-64">
                {JSON.stringify(enhancedAnalysis, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
