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
  Bug,
  Eye,
  EyeOff,
  History,
  TrendingDown,
  TrendingUp,
  Minus
} from "lucide-react";
import { PestDetectionResult, PestDetectionItem } from "../shared/types/pest.types";

interface AIPestDetectionPanelProps {
  result: PestDetectionResult;
  imageUrl: string;
  onScanAgain?: () => void;
  history?: any[]; // To support comparison with previous pest scans
}

export const AIPestDetectionPanel: React.FC<AIPestDetectionPanelProps> = ({
  result,
  imageUrl,
  onScanAgain,
  history = []
}) => {
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [activePestIndex, setActivePestIndex] = useState<number | null>(null);
  const [isIpmOpen, setIsIpmOpen] = useState<boolean>(true);
  const [isTechOpen, setIsTechOpen] = useState<boolean>(false);

  if (result.status === "image_quality_insufficient") {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-rose-950 text-base">Image Quality Unsuitable for Diagnostics</h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              PlantGuard could not reliably identify the plant or analyze pests due to image quality issues.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 text-xs text-slate-700 space-y-2">
          <span className="font-bold text-rose-900 block flex items-center gap-1.5">
            <Info className="w-4 h-4 text-rose-600" />
            Farmer Suggestions for Better Quality Capture:
          </span>
          <div className="grid sm:grid-cols-2 gap-2 pl-2">
            <p className="flex items-start gap-1">
              <span className="text-rose-600 font-bold">•</span>
              <span><strong>Improve Lighting:</strong> Capture in bright daylight, avoiding harsh shadows or dark conditions.</span>
            </p>
            <p className="flex items-start gap-1">
              <span className="text-rose-600 font-bold">•</span>
              <span><strong>Adjust Focus:</strong> Ensure the insect or leaves are sharp, avoiding camera movement blur.</span>
            </p>
            <p className="flex items-start gap-1">
              <span className="text-rose-600 font-bold">•</span>
              <span><strong>Optimize Framing:</strong> Move closer (within 10-20 cm) so the insect fills at least 15% of the frame.</span>
            </p>
            <p className="flex items-start gap-1">
              <span className="text-rose-600 font-bold">•</span>
              <span><strong>Clear Occlusions:</strong> Ensure the pest is not completely hidden behind other leaves.</span>
            </p>
          </div>
          {result.imageQuality?.issues && result.imageQuality.issues.length > 0 && (
            <div className="pt-2 border-t border-rose-100 flex flex-wrap gap-1.5 items-center">
              <span className="font-bold text-slate-500">Detected Issues:</span>
              {result.imageQuality.issues.map((issue, i) => (
                <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                  {issue}
                </span>
              ))}
            </div>
          )}
        </div>

        {onScanAgain && (
          <button
            onClick={onScanAgain}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
          >
            Capture Again
          </button>
        )}
      </div>
    );
  }

  const primaryPest = result.pests?.[0];
  const hasPests = result.pests && result.pests.length > 0;
  const pestImageQuality = result.imageQuality;

  // Find previous pest scan for comparison
  const previousPestScan = history?.find(
    (h) => h.type === "pest" && h.plant?.name === result.plant?.name && h.id !== result.id
  );

  const getSeverityColor = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "LOW":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "MODERATE":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "HIGH":
        return "text-rose-700 bg-rose-50 border-rose-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "LOW":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "MODERATE":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "HIGH":
        return "text-rose-600 bg-rose-50 border-rose-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Visual Canvas Bounding Box Viewer */}
        <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Bug className="w-3.5 h-3.5 text-emerald-600" />
                Pest Object Detection Map
              </span>
              {hasPests && (
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                >
                  {showOverlay ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showOverlay ? "Hide Boxes" : "Show Boxes"}
                </button>
              )}
            </div>

            <div className="w-full h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center select-none">
              <img src={imageUrl} alt="Pest Analysis" className="w-full h-full object-contain" />

              {/* Render Bounding Boxes */}
              {showOverlay &&
                hasPests &&
                result.pests.map((pest, idx) => {
                  if (!pest.boundingBox) return null;
                  const [ymin, xmin, ymax, xmax] = pest.boundingBox;
                  const left = xmin / 10;
                  const top = ymin / 10;
                  const width = (xmax - xmin) / 10;
                  const height = (ymax - ymin) / 10;

                  const isActive = activePestIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`absolute rounded transition-all duration-200 pointer-events-auto cursor-pointer ${
                        isActive
                          ? "border-2 border-yellow-400 bg-yellow-400/25 z-20 scale-[1.02]"
                          : "border-2 border-emerald-500 bg-emerald-500/10 z-10 hover:border-yellow-300"
                      }`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`
                      }}
                      onMouseEnter={() => setActivePestIndex(idx)}
                      onMouseLeave={() => setActivePestIndex(null)}
                    >
                      <div className="absolute -top-5 left-0 px-1.5 py-0.2 bg-slate-900/90 text-[8px] font-bold text-white rounded whitespace-nowrap border border-white/20">
                        {pest.commonName}
                      </div>
                    </div>
                  );
                })}

              {result.status === "no_confident_pest_detected" && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white">
                  <HelpCircle className="w-10 h-10 text-slate-400 mb-2" />
                  <span className="text-xs font-bold block mb-1">No Active Pest Objects Detected</span>
                  <p className="text-[10px] text-slate-300 max-w-xs leading-normal">
                    Foliar damage may be present, but no live insect or pest vectors were confidently captured.
                  </p>
                </div>
              )}
            </div>

            {hasPests && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {result.pests.map((p, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setActivePestIndex(idx)}
                    onMouseLeave={() => setActivePestIndex(null)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition border ${
                      activePestIndex === idx
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {p.commonName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center text-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${getSeverityColor(
                result.infestation?.visibleLevel
              )}`}
            >
              Infestation: {result.infestation?.visibleLevel || "UNKNOWN"}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              {primaryPest?.commonName || "No Confident Pest Detected"}
            </h2>
            <p className="text-[10px] text-slate-500 italic font-semibold">
              {primaryPest?.scientificName || "Pathology Damage Only"}
            </p>
            {primaryPest && (
              <div className="w-full mt-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                  <span>Detection Confidence</span>
                  <span>{primaryPest.confidenceScore}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${primaryPest.confidenceScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Risk Indicators & Comparative Change Analysis */}
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          {/* Classification & Visual Change comparison */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">
                Primary Factor Classification
              </span>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                  Problem Diagnosis Group
                </span>
                <span className="text-lg font-black text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {result.classification?.replace("_", " ")}
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {result.disclaimer}
                </p>
              </div>
            </div>

            {/* Follow-up Scan Visual Change Estimator */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Comparative Observation Scan
              </span>
              {previousPestScan ? (
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
                  {result.infestation?.visibleLevel === "LOW" && previousPestScan.infestation?.visibleLevel === "HIGH" ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <span className="text-slate-700 font-semibold">
                        AI-Estimated Visual Change: Infestation level reduced since previous scan.
                      </span>
                    </>
                  ) : result.infestation?.visibleLevel === "HIGH" && previousPestScan.infestation?.visibleLevel === "LOW" ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-rose-600" />
                      <span className="text-slate-700 font-semibold">
                        AI-Estimated Visual Change: Infestation symptoms increased. Action advised.
                      </span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 font-medium">
                        No clear visual deviation in infestation level compared to previous scan.
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">
                  First record of this pest/crop combination. Future scans will display visual change metrics.
                </span>
              )}
            </div>
          </div>

          {/* Plant Damage & Pest Risk Indicator */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">
                Damage Analysis
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Type</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {result.damage?.damageType || "unknown"}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Severity</span>
                  <span className={`font-black ${getSeverityColor(result.damage?.severity)}`}>
                    {result.damage?.severity || "UNKNOWN"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Affected Part: <span className="font-bold text-slate-700">{result.damage?.affectedPlantPart || "Leaves"}</span>
              </p>
            </div>

            {/* Pest Risk */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  AI-assisted pest risk estimate
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getRiskColor(
                    result.risk?.level
                  )}`}
                >
                  {result.risk?.level || "UNKNOWN"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {result.risk?.explanation || "Combines pest load, plant damage, and environment factors."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Explainable AI: "Why PlantGuard thinks this is [PEST]" */}
      {hasPests && primaryPest && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Why PlantGuard thinks this is {primaryPest.commonName}
              </h3>
              <p className="text-xs text-slate-500">
                Visual markers and botanical rationale observed in the image
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {primaryPest.visualEvidence?.map((ev, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-semibold">{ev}</span>
              </div>
            ))}
          </div>

          {primaryPest.identificationUncertainty && (
            <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">Clinical Uncertainty Notice:</span>
                <p className="mt-0.5 text-amber-800">{primaryPest.identificationUncertainty}</p>
              </div>
            </div>
          )}

          {primaryPest.alternativeIdentifications && primaryPest.alternativeIdentifications.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-2">Alternative Matches Considered:</span>
              <div className="flex flex-wrap gap-2">
                {primaryPest.alternativeIdentifications.map((alt, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {alt.name} ({alt.confidence}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Integrated Pest Management (IPM) Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          onClick={() => setIsIpmOpen(!isIpmOpen)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition border-b border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Integrated Pest Management (IPM) Plan
              </h3>
              <p className="text-xs text-slate-500">
                Eco-focused, biological, cultural, and label-compliant chemical controls
              </p>
            </div>
          </div>
          {isIpmOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {isIpmOpen && (
          <div className="p-6 bg-slate-50/20 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Immediate Actions */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  1. Immediate Actions
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 pl-3">
                  {result.recommendations?.immediate?.map((rec, i) => (
                    <li key={i} className="list-disc leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monitoring & Scout Guidance */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  2. Field Monitoring & Scouting
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 pl-3">
                  {result.recommendations?.monitoring?.map((rec, i) => (
                    <li key={i} className="list-disc leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cultural Controls */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  3. Cultural & Physical Controls
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 pl-3">
                  {result.recommendations?.cultural?.map((rec, i) => (
                    <li key={i} className="list-disc leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Biological Option */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  4. Biological & Low-Risk Controls
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 pl-3">
                  {result.recommendations?.biological?.map((rec, i) => (
                    <li key={i} className="list-disc leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Chemical & Prevention Controls */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Chemical Controls */}
              <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  5. Chemical Guidance (Label Compliant)
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 pl-3">
                  {result.recommendations?.chemical?.map((rec, i) => (
                    <li key={i} className="list-disc leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
                <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-[10px] text-slate-500 leading-normal">
                  ⚠️ <strong>Advisory Notice:</strong> Chemical applications are general guidelines. Farm operators must adhere to local pesticide registration approvals, safety labels, and local regulations.
                </div>
              </div>

              {/* Long Term Prevention */}
              <div className="space-y-3 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  6. Proactive Prevention Practices
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 pl-3">
                  {result.recommendations?.prevention?.map((rec, i) => (
                    <li key={i} className="list-disc leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Technical Telemetry Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          onClick={() => setIsTechOpen(!isTechOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diagnostic Metadata & Image Quality Telemetry
            </span>
            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              Expert Metadata
            </span>
          </div>
          {isTechOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isTechOpen && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Detected Crop</span>
                <span className="font-extrabold text-slate-900">{result.plant?.name || "Unknown"}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Pest Group</span>
                <span className="font-extrabold text-slate-900">{primaryPest?.category || "Unknown"}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Quality Score</span>
                <span className="font-extrabold text-slate-900">{pestImageQuality?.score || 100}/100</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Quality Status</span>
                <span className="font-extrabold text-slate-900">{pestImageQuality?.status || "GOOD"}</span>
              </div>
            </div>

            {pestImageQuality?.issues && pestImageQuality.issues.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Foliage Image Issues</span>
                <p className="text-slate-700">{pestImageQuality.issues.join(", ")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
