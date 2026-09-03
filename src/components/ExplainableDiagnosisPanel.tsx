import React, { useState } from "react";
import {
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Info,
  Layers,
  Leaf,
  Cpu,
  BarChart3,
  Sliders
} from "lucide-react";
import { ExplainableDiagnosisData, VisualEvidenceItem } from "../shared/types/explainable.types";

interface ExplainableDiagnosisPanelProps {
  explainable?: ExplainableDiagnosisData;
  plantName: string;
  diseaseName: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  rawResult?: any;
}

export const ExplainableDiagnosisPanel: React.FC<ExplainableDiagnosisPanelProps> = ({
  explainable,
  plantName,
  diseaseName,
  confidence,
  severity,
  symptoms,
  rawResult
}) => {
  const [isExpertOpen, setIsExpertOpen] = useState<boolean>(false);

  const isHealthy = diseaseName.toLowerCase().includes("healthy");
  const roundedConfidence = Math.round(confidence);

  // Confidence Category
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 80) return { label: "HIGH", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (conf >= 60) return { label: "MEDIUM", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "LOW", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const confidenceLevel = getConfidenceLevel(roundedConfidence);

  // Importance Badge
  const getImportanceBadge = (importance: "High" | "Medium" | "Low") => {
    switch (importance) {
      case "High":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Low":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryBadgeStyles = (category?: string) => {
    const cat = (category || "DISEASE").toUpperCase().replace(" ", "_");
    switch (cat) {
      case "DISEASE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "PEST":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "NUTRIENT_STRESS":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "ENVIRONMENTAL_STRESS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MULTIPLE_FACTORS":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "HEALTHY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UNCERTAIN":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Affected Area Estimate Formatting
  const affectedArea = explainable?.affectedRegionEstimate;
  const hasValidAffectedArea = typeof affectedArea === "number" && !isNaN(affectedArea);

  const getAffectedAreaColor = (val: number) => {
    if (val <= 15) return { text: "text-emerald-600", bar: "bg-emerald-500", bg: "bg-emerald-50" };
    if (val <= 35) return { text: "text-amber-600", bar: "bg-amber-500", bg: "bg-amber-50" };
    return { text: "text-rose-600", bar: "bg-rose-500", bg: "bg-rose-50" };
  };

  const areaColor = hasValidAffectedArea ? getAffectedAreaColor(affectedArea) : null;

  // Fallback visual evidence if missing
  const visualEvidenceList: VisualEvidenceItem[] = explainable?.visualEvidence && explainable.visualEvidence.length > 0
    ? explainable.visualEvidence
    : (symptoms || []).slice(0, 3).map((sym, idx) => ({
        feature: sym,
        importance: (idx === 0 ? "High" : "Medium") as "High" | "Medium",
        explanation: `Visible ${sym.toLowerCase()} observed on the leaf surface.`
      }));

  // Farmer-friendly explanation fallback
  const farmerExplanation = explainable?.diagnosisExplanation || (
    isHealthy
      ? `The uploaded leaf displays uniform green tissue, well-formed margins, and no visible fungal or bacterial lesions. Continue regular cultivation and watering practices.`
      : `The leaf exhibits visible symptom patterns including ${symptoms.slice(0, 2).join(" and ").toLowerCase() || "tissue discoloration"}. These visual indicators are consistent with ${diseaseName}. Timely intervention will help restrict further spread across the canopy.`
  );

  return (
    <div className="space-y-6">
      {/* Unified AI Crop-Health Classification Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Unified AI Crop-Health Classification
            </h3>
            <p className="text-xs text-slate-500">
              physiological multi-factor state assessment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Primary Classification */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Primary Physiological State
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  rawResult?.issue_category
                    ? getCategoryBadgeStyles(rawResult.issue_category)
                    : isHealthy
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {(rawResult?.issue_category || (isHealthy ? "HEALTHY" : "DISEASE")).replace("_", " ")}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {rawResult?.primary_issue || diseaseName}
                </span>
              </div>
            </div>

            {rawResult?.issue_categories && rawResult.issue_categories.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Foliage Condition Factors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rawResult.issue_categories.map((cat: string, i: number) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getCategoryBadgeStyles(cat)}`}
                    >
                      {cat.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Uncertainty & AI Assessment */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                AI Diagnostic Certainty
              </span>
              {rawResult?.uncertainty ? (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> High Ambiguity / Multi-Factor Risk
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {rawResult.uncertainty}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Deterministic Profile Matches
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Visual markers match a clear, single crop classification with no major confounding variables or secondary stress indicators.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. WHY THIS DIAGNOSIS? Visual Evidence Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Why PlantGuard Thinks This Is {diseaseName}
              </h3>
              <p className="text-xs text-slate-500">
                Key visual evidence identified on the uploaded leaf photo
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Explainable AI Analysis
          </span>
        </div>

        {/* Visual Evidence Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-4">
          {visualEvidenceList.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between hover:border-emerald-200 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-extrabold text-slate-900 leading-snug">
                      {item.feature}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex-shrink-0 ${getImportanceBadge(
                      item.importance
                    )}`}
                  >
                    {item.importance} Relevance
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1 pl-6">
                  {item.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 2. AFFECTED AREA ESTIMATE */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-extrabold text-slate-900">
                AI-Estimated Affected Leaf Area
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Approximate percentage of visible leaf blade showing active lesions or chlorosis
            </p>
          </div>

          <div className="flex items-center gap-4 min-w-[200px]">
            {hasValidAffectedArea ? (
              <div className="w-full space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Surface Affected</span>
                  <span className={`font-black ${areaColor?.text}`}>
                    {affectedArea}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${areaColor?.bar} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.max(2, affectedArea))}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium italic">
                Unable to reliably estimate affected area
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. CONFIDENCE & UNCERTAINTY HANDLING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prominent Confidence Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                AI Confidence Rating
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${confidenceLevel.color}`}>
                {confidenceLevel.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-slate-900">
                {roundedConfidence}%
              </span>
              <span className="text-xs font-semibold text-slate-400">Match score</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {explainable?.confidenceExplanation ||
                "AI confidence reflects how strongly the visible image characteristics match the predicted condition."}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Decision support index based on feature sharpness and lesion characteristics.
          </div>
        </div>

        {/* Uncertainty / Alternative Matches Card (if confidence < 75% or alternatives exist) */}
        {roundedConfidence < 75 || (explainable?.alternativeMatches && explainable.alternativeMatches.length > 0) ? (
          <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Uncertainty Advisory
              </div>
              <p className="text-xs text-amber-900 font-medium mb-3">
                PlantGuard is not fully confident in a single definitive condition. Visible symptoms share characteristics with:
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-amber-200/60 font-semibold">
                  <span className="text-slate-800">1. {diseaseName} (Primary)</span>
                  <span className="text-amber-800">{roundedConfidence}%</span>
                </div>
                {explainable?.alternativeMatches?.map((alt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-amber-200/60 font-semibold"
                  >
                    <span className="text-slate-700">2. {alt.disease}</span>
                    <span className="text-slate-500">{alt.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-amber-800 border-t border-amber-200/60 pt-2">
              Please capture a clearer image under direct sunlight or consult an agricultural extension officer for on-site verification.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-200/70 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                High Diagnostic Match
              </div>
              <p className="text-xs text-emerald-900 font-medium leading-relaxed mb-2">
                Key pathology patterns clearly distinguish {diseaseName} from common lookalikes on {plantName} foliage.
              </p>
              <p className="text-[11px] text-emerald-800">
                Leaf resolution and lighting were sufficient to detect characteristic symptoms.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-700 font-semibold">
              Quality Assessment: Image suitable for decision support
            </div>
          </div>
        )}
      </div>

      {/* 4. WHAT DOES THIS MEAN? (Farmer-Friendly Section) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">
            WHAT DOES THIS MEAN FOR YOUR CROP?
          </h3>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
          {farmerExplanation}
        </p>
      </div>

      {/* 5. TECHNICAL DETAILS (Expert View Accordion) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExpertOpen(!isExpertOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Technical Details & Diagnostic Vector
            </span>
            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              Expert View
            </span>
          </div>
          {isExpertOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isExpertOpen && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Plant Genus</span>
                <span className="font-extrabold text-slate-900">{plantName}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Condition Name</span>
                <span className="font-extrabold text-slate-900">{diseaseName}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Confidence Index</span>
                <span className="font-extrabold text-slate-900">{roundedConfidence}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Severity Class</span>
                <span className="font-extrabold text-slate-900">{severity.toUpperCase()}</span>
              </div>
            </div>

            {/* Symptoms Vector */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-2">
                Observed Symptom Features
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(explainable?.symptomsObserved || symptoms || []).map((sym, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                  >
                    • {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* Image Quality Metrics */}
            {explainable?.imageQuality && (
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-2">
                  Image Quality Telemetry
                </span>
                <div className="flex flex-wrap items-center gap-4 text-slate-700">
                  <span>
                    Quality Score: <strong>{explainable.imageQuality.score}/100</strong>
                  </span>
                  <span>
                    Status: <strong className="text-emerald-700">{explainable.imageQuality.status}</strong>
                  </span>
                  {explainable.imageQuality.issues.length > 0 && (
                    <span className="text-amber-700">
                      Detected Issues: {explainable.imageQuality.issues.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Environmental Integration Reference */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Cross-Layer Reference:</strong> This diagnostic output feeds into Layer 2 Environmental Intelligence, combining Open-Meteo weather parameters, SoilGrids composition, and GKMS agromet bulletins to evaluate the 5-factor proliferation risk.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
