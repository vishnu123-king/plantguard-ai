import React, { useState } from "react";
import { Eye, EyeOff, Sparkles, Layers, Info, CheckCircle2 } from "lucide-react";
import { BoundingRegion } from "../shared/types/explainable.types";

interface AffectedRegionViewerProps {
  imageUrl: string;
  regions?: BoundingRegion[];
  diseaseName: string;
  plantName: string;
  affectedAreaPercent?: number | null;
}

export const AffectedRegionViewer: React.FC<AffectedRegionViewerProps> = ({
  imageUrl,
  regions = [],
  diseaseName,
  plantName,
  affectedAreaPercent
}) => {
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [activeRegionIndex, setActiveRegionIndex] = useState<number | null>(null);

  const hasRegions = regions && regions.length > 0;
  const isHealthy = diseaseName.toLowerCase().includes("healthy");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              Visual Evidence & Affected Regions
            </h3>
            <p className="text-[11px] text-slate-500">
              {isHealthy
                ? "Uniform leaf tissue with no necrotic lesions detected"
                : "AI-estimated symptom zones & lesion localization"}
            </p>
          </div>
        </div>

        {hasRegions && !isHealthy && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOverlay(!showOverlay)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                showOverlay
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {showOverlay ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Highlighting On</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Highlighting Off</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Dual/Interactive View Canvas */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* View 1: Original Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span>Original Leaf Image</span>
              <span className="text-[11px] text-slate-400">Source Photo</span>
            </div>
            <div className="w-full h-64 sm:h-72 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
              <img
                src={imageUrl}
                alt="Original Leaf"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* View 2: AI Visual Evidence Overlay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                AI Visual Evidence
              </span>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                AI-Estimated
              </span>
            </div>

            <div className="w-full h-64 sm:h-72 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative select-none">
              <img
                src={imageUrl}
                alt="AI Visual Evidence Leaf"
                className="w-full h-full object-contain"
              />

              {/* Bounding Box Highlights */}
              {showOverlay && hasRegions && !isHealthy && (
                <div className="absolute inset-0 pointer-events-none">
                  {regions.map((reg, idx) => {
                    const isActive = activeRegionIndex === idx;
                    // Clamp values to valid 0-1 range
                    const left = Math.max(0, Math.min(1, reg.x)) * 100;
                    const top = Math.max(0, Math.min(1, reg.y)) * 100;
                    const width = Math.max(0.05, Math.min(1 - reg.x, reg.width)) * 100;
                    const height = Math.max(0.05, Math.min(1 - reg.y, reg.height)) * 100;

                    return (
                      <div
                        key={idx}
                        className={`absolute rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
                          isActive
                            ? "border-2 border-amber-400 bg-amber-400/25 shadow-lg scale-[1.02] z-20"
                            : "border-2 border-rose-500/90 bg-rose-500/15 hover:border-amber-300 hover:bg-amber-300/20 z-10"
                        }`}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                        onMouseEnter={() => setActiveRegionIndex(idx)}
                        onMouseLeave={() => setActiveRegionIndex(null)}
                      >
                        {/* Region Label Tag */}
                        <div className="absolute -top-6 left-0 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs text-[10px] font-extrabold text-white whitespace-nowrap shadow-xs border border-white/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>{reg.label || `Region #${idx + 1}`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Healthy Leaf Overlay Message */}
              {isHealthy && (
                <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                  <div className="p-2.5 rounded-full bg-emerald-600 text-white shadow-md mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-white bg-slate-900/80 px-3 py-1 rounded-full border border-emerald-400/30">
                    No active foliar lesions identified
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Region Tags & Interaction List */}
        {hasRegions && !isHealthy && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Highlighted Areas:</span>
            {regions.map((reg, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setActiveRegionIndex(idx)}
                onMouseLeave={() => setActiveRegionIndex(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                  activeRegionIndex === idx
                    ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🔍 {reg.label || `Region ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Technical & Ethical Disclaimer Banner */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-normal flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-700">Notice:</strong> Affected regions are AI-estimated visual evidence approximations identified on the uploaded image for agricultural decision support. They do not constitute a laboratory segmentation or a substitute for expert on-site agronomic verification.
          </span>
        </div>
      </div>
    </div>
  );
};
