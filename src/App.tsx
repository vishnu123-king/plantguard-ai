import React, { useState, useEffect, useRef } from "react";
import {
  Leaf,
  Upload,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  ShieldAlert,
  Activity,
  Sparkles,
  Info,
  Clock,
  ArrowLeft,
  Droplets,
  Sprout,
  Pill,
  Eye,
  X,
  ExternalLink,
  ChevronRight,
  Compass,
  Layers
} from "lucide-react";
import { Layer2EnvironmentalIntelligence } from "./components/Layer2EnvironmentalIntelligence";

interface HealthMetrics {
  risk_score: number;
  plant_health_score: number;
  recovery_outlook: string;
}

interface ImageQuality {
  sufficient: boolean;
  score: number;
}

interface DiagnosisResult {
  id?: number;
  image_filename?: string;
  plant: {
    name: string;
    confidence: number;
  };
  diagnosis: {
    disease: string;
    confidence: number;
    status: string;
  };
  severity: string;
  metrics: HealthMetrics;
  symptoms: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  prevention: string[];
  warnings: string[];
  image_quality?: ImageQuality;
  created_at?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"diagnose" | "history" | "about">("diagnose");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [currentResult, setCurrentResult] = useState<DiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "diseased" | "healthy">("all");
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<DiagnosisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on initial mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Invalid file format. Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setFileDimensions({ width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFileDimensions(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const runDiagnosis = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setLoadingStep(1);
    setErrorMessage(null);

    // Simulated progress steps for smooth user experience
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 800);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.detail?.message || "Failed to analyze image.");
      }

      const data: DiagnosisResult = await res.json();
      setCurrentResult(data);
      fetchHistory(); // Refresh history list
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (selectedHistoryDetail?.id === id) {
          setSelectedHistoryDetail(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  // Filtered history list
  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase();
    const plantMatch = (item.plant_name || item.plant?.name || "").toLowerCase().includes(query);
    const diseaseMatch = (item.disease_name || item.diagnosis?.disease || "").toLowerCase().includes(query);
    const matchesQuery = plantMatch || diseaseMatch;

    const isHealthy =
      (item.disease_name || item.diagnosis?.disease || "").toLowerCase().includes("healthy") ||
      item.severity === "none";

    let matchesStatus = true;
    if (filterStatus === "diseased") matchesStatus = !isHealthy;
    if (filterStatus === "healthy") matchesStatus = isHealthy;

    return matchesQuery && matchesStatus;
  });

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score <= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    if (score <= 80) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case "none":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "mild":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "severe":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">PlantGuard</span>
              <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                AI Vision
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 text-sm font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab("diagnose")}
              className={`px-3.5 py-2 rounded-lg transition ${
                activeTab === "diagnose"
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              Diagnose
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-2 rounded-lg transition relative ${
                activeTab === "history"
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              History
              {history.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("layer2")}
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "layer2"
                  ? "bg-emerald-950 text-emerald-400 font-bold border border-emerald-800"
                  : "hover:text-emerald-700 hover:bg-slate-50 text-emerald-800 font-medium"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Layer 2 Intelligence
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-3.5 py-2 rounded-lg transition ${
                activeTab === "about"
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "hover:text-emerald-700 hover:bg-slate-50"
              }`}
            >
              About
            </button>
          </nav>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* ================= DIAGNOSE TAB ================= */}
        {activeTab === "diagnose" && (
          <div>
            {/* Hero Heading */}
            {!currentResult && (
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Multimodal AI Leaf Pathology Engine
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                  AI Plant Leaf Disease Detection
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Upload a clear image of an affected leaf to receive instant AI diagnosis, risk scoring, health metrics, and targeted organic & chemical treatment plans.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="max-w-xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">Error</span>
                  <span>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Active Analysis Result View */}
            {currentResult ? (
              <div className="space-y-6">
                {/* Back to Upload button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentResult(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Analyze Another Leaf
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    Report ID: #{currentResult.id || "LIVE"}
                  </span>
                </div>

                {/* Main Results Summary */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Image & Diagnosis Status Card */}
                  <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center text-center">
                    <div className="w-full h-52 bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-200 flex items-center justify-center relative">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Analyzed Leaf" className="w-full h-full object-cover" />
                      ) : (
                        <Leaf className="w-16 h-16 text-emerald-300" />
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${
                        currentResult.diagnosis.status.toLowerCase() === "healthy"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}
                    >
                      {currentResult.diagnosis.status}
                    </span>

                    <h2 className="text-xl font-extrabold text-slate-900 mb-1">
                      {currentResult.diagnosis.disease}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mb-4">
                      Plant: <span className="text-slate-800">{currentResult.plant.name}</span>
                    </p>

                    {/* Confidence Meter */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(currentResult.diagnosis.confidence)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex justify-between w-full px-1">
                      <span>AI Confidence</span>
                      <span className="font-bold text-slate-800">
                        {Math.round(currentResult.diagnosis.confidence)}%
                      </span>
                    </div>
                  </div>

                  {/* Metrics Dashboard */}
                  <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                    {/* Disease Risk Score */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Disease Risk Score
                          </span>
                          <Activity className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-amber-600">
                            {currentResult.metrics.risk_score}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2">
                        Calculated risk index based on symptom severity and spread velocity.
                      </p>
                    </div>

                    {/* Plant Health Index */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Plant Health Index
                          </span>
                          <Sprout className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-emerald-600">
                            {currentResult.metrics.plant_health_score}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2">
                        Estimated foliage vigor and photosynthetic health rating.
                      </p>
                    </div>

                    {/* Severity Rating */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Severity Rating
                        </span>
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border ${getSeverityBadge(
                            currentResult.severity
                          )}`}
                        >
                          {currentResult.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2">
                        Visual tissue damage and lesion density classification.
                      </p>
                    </div>

                    {/* Recovery Outlook */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Recovery Outlook
                        </span>
                        <span className="text-2xl font-black text-slate-800">
                          {currentResult.metrics.recovery_outlook}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2">
                        Estimated recovery probability with timely treatment execution.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warnings Box */}
                {currentResult.warnings && currentResult.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm">
                    <div className="font-bold flex items-center gap-2 mb-1.5 text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> Agricultural Safety Notice
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                      {currentResult.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Symptoms Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" /> Detected Leaf Symptoms
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {currentResult.symptoms.map((sym, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                        <span>{sym}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treatments Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Organic Treatments */}
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-2xs">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <Sprout className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-extrabold text-emerald-900">
                        Organic & Bio-Control Methods
                      </h3>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {currentResult.organic_treatment.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical Treatments */}
                  <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-2xs">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                        <Pill className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-extrabold text-blue-900">
                        Chemical Active Guidance
                      </h3>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700 mb-3">
                      {currentResult.chemical_treatment.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-normal flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Chemical applications should adhere strictly to regional pesticide registration laws and manufacturer label safety specifications.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prevention Plan */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-600" /> Long-Term Prevention & Agronomic Practices
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700">
                    {currentResult.prevention.map((prev, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{prev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layer 2 Environmental Intelligence & Risk Engine */}
                <Layer2EnvironmentalIntelligence currentDiagnosis={currentResult} />
              </div>
            ) : (
              /* Upload & Interactive Form */
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative">
                  {/* File Upload Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center min-h-[220px] text-center ${
                      selectedFile
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-300 hover:border-emerald-500 bg-slate-50/60 cursor-pointer"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />

                    {!selectedFile ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3 shadow-2xs">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-slate-800 font-bold text-base mb-1">
                          Drop your plant leaf image here or click to upload
                        </p>
                        <p className="text-xs text-slate-400 mb-4">
                          Supported formats: JPG, PNG, WEBP (Max 10MB)
                        </p>
                        <button
                          type="button"
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition shadow-2xs"
                        >
                          Select Image File
                        </button>
                      </div>
                    ) : (
                      /* Image Selected Preview */
                      <div className="w-full flex flex-col items-center">
                        <img
                          src={imagePreview!}
                          alt="Leaf Preview"
                          className="max-h-64 rounded-xl shadow-xs border border-slate-200 mb-4 object-contain"
                        />
                        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 mb-3">
                          <span className="font-semibold text-slate-800">{selectedFile.name}</span>
                          <span>•</span>
                          <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          {fileDimensions && (
                            <>
                              <span>•</span>
                              <span>
                                {fileDimensions.width} × {fileDimensions.height} px
                              </span>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedImage();
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove & Select Different Image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Loading State Overlay / Progress */}
                  {isLoading ? (
                    <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="inline-block animate-spin text-emerald-600">
                        <RefreshCw className="w-8 h-8" />
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-base">
                        Analyzing Leaf Foliage with AI...
                      </h3>
                      <div className="max-w-xs mx-auto space-y-2 text-xs text-left">
                        <div className={`flex items-center gap-2 ${loadingStep >= 1 ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                          <CheckCircle2 className="w-4 h-4" /> 1. Image format & resolution verified
                        </div>
                        <div className={`flex items-center gap-2 ${loadingStep >= 2 ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                          <CheckCircle2 className="w-4 h-4" /> 2. Preprocessing tensor matrix
                        </div>
                        <div className={`flex items-center gap-2 ${loadingStep >= 3 ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                          <CheckCircle2 className="w-4 h-4" /> 3. Multimodal vision model identifying pathogen
                        </div>
                        <div className={`flex items-center gap-2 ${loadingStep >= 4 ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                          <CheckCircle2 className="w-4 h-4" /> 4. Compiling organic & chemical treatment options
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Analyze Button */
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={runDiagnosis}
                        disabled={!selectedFile}
                        className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-2xs ${
                          selectedFile
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" /> Analyze Leaf Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <Search className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-xs text-slate-900 mb-1">Instant Species Identification</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Recognizes crop types and specific spot pathogens automatically.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <Activity className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-xs text-slate-900 mb-1">Health Index & Risk Score</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Evaluates plant health percentage, severity index, and recovery outlook.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <Sprout className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-xs text-slate-900 mb-1">Dual Treatment Plans</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Provides both eco-friendly organic methods and approved chemical active ingredient guidelines.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= HISTORY TAB ================= */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Diagnosis History</h1>
                <p className="text-xs text-slate-500">
                  Review previously saved plant disease reports and treatment logs
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentResult(null);
                  setActiveTab("diagnose");
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition self-start sm:self-auto"
              >
                + New Diagnosis
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by plant or disease name..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="all">All Diagnoses</option>
                <option value="diseased">Diseased Plants</option>
                <option value="healthy">Healthy Plants</option>
              </select>
            </div>

            {/* History Items List */}
            {filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((rec) => {
                  const plantName = rec.plant_name || rec.plant?.name || "Plant";
                  const diseaseName = rec.disease_name || rec.diagnosis?.disease || "Condition";
                  const confidence = rec.confidence || rec.diagnosis?.confidence || 0;
                  const riskScore = rec.risk_score ?? rec.metrics?.risk_score ?? 50;
                  const isHealthy = diseaseName.toLowerCase().includes("healthy") || rec.severity === "none";

                  return (
                    <div
                      key={rec.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 font-bold ${
                            isHealthy ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isHealthy ? "🌿" : "🍂"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-extrabold text-slate-900 text-sm">{plantName}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isHealthy
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-rose-100 text-rose-800 border-rose-200"
                              }`}
                            >
                              {diseaseName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Confidence: <span className="font-bold text-slate-700">{Math.round(confidence)}%</span> • Risk Score:{" "}
                            <span className="font-bold text-amber-600">{riskScore}/100</span>
                            {rec.created_at && (
                              <span>
                                {" "}
                                • {new Date(rec.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedHistoryDetail(rec);
                          }}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                        {rec.id && (
                          <button
                            onClick={() => deleteHistoryItem(rec.id!)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <Leaf className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-sm mb-1">No diagnosis records found</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Upload a leaf image to start building your diagnosis history.
                </p>
                <button
                  onClick={() => setActiveTab("diagnose")}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-2xs"
                >
                  Analyze a Leaf Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal for History Item Detail */}
        {selectedHistoryDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl relative border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">Diagnosis Detail Report</h3>
                <button
                  onClick={() => setSelectedHistoryDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xl">
                  🌿
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {selectedHistoryDetail.plant_name || selectedHistoryDetail.plant?.name}
                  </h4>
                  <p className="text-xs text-slate-600 font-semibold">
                    Condition: {selectedHistoryDetail.disease_name || selectedHistoryDetail.diagnosis?.disease}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Disease Risk</span>
                  <span className="text-xl font-extrabold text-amber-900">
                    {selectedHistoryDetail.risk_score ?? selectedHistoryDetail.metrics?.risk_score}/100
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Plant Health</span>
                  <span className="text-xl font-extrabold text-emerald-900">
                    {selectedHistoryDetail.plant_health_score ?? selectedHistoryDetail.metrics?.plant_health_score}/100
                  </span>
                </div>
              </div>

              {selectedHistoryDetail.symptoms && (
                <div>
                  <h5 className="font-extrabold text-xs text-slate-800 mb-2">Detected Symptoms:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {selectedHistoryDetail.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedHistoryDetail.organic_treatment && (
                <div>
                  <h5 className="font-extrabold text-xs text-emerald-800 mb-2">Organic Treatment:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {selectedHistoryDetail.organic_treatment.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedHistoryDetail.chemical_treatment && (
                <div>
                  <h5 className="font-extrabold text-xs text-blue-800 mb-2">Chemical Treatment:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {selectedHistoryDetail.chemical_treatment.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedHistoryDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= LAYER 2 TAB ================= */}
        {activeTab === "layer2" && (
          <div className="space-y-6">
            <Layer2EnvironmentalIntelligence currentDiagnosis={currentResult} />
          </div>
        )}

        {/* ================= ABOUT TAB ================= */}
        {activeTab === "about" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  🌿
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">About PlantGuard AI</h1>
                  <p className="text-xs text-slate-500">AI-Powered Agricultural Advisory Platform</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                PlantGuard AI uses multimodal vision AI model architecture to analyze digital photos of crop and plant leaves.
                The system detects potential spot lesions, blight patches, mildew powder, and rust spots to estimate disease risk and provide actionable organic and chemical recovery measures.
              </p>

              <hr className="border-slate-100" />

              <h3 className="font-extrabold text-sm text-slate-900">Agricultural Safety & Advisory Notice</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All metrics including Plant Health Score, Disease Risk Score, and Recovery Outlook are AI-assisted estimates derived from visual evidence in the uploaded photo.
                This tool is designed to support agricultural decision-making and is not a substitute for certified on-site diagnostic testing by local agricultural extension officers or crop pathologists.
              </p>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                <span className="font-extrabold block">Best Practices for Reliable Leaf Analysis:</span>
                <p>• Capture images under clear, direct lighting without motion blur.</p>
                <p>• Take close-up shots of affected leaf areas showing distinct lesions.</p>
                <p>• Avoid uploading out-of-focus or distant whole-bush photos.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PlantGuard AI © 2026. AI Agricultural Decision Support System.</span>
          <span className="text-[11px] text-slate-400">Powered by Gemini Multimodal AI</span>
        </div>
      </footer>
    </div>
  );
}
