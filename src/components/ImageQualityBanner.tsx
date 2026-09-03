import React from "react";
import { AlertTriangle, RefreshCw, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { ImageQualityInfo } from "../shared/types/explainable.types";

interface ImageQualityBannerProps {
  imageQuality?: ImageQualityInfo;
  onRetake?: () => void;
}

export const ImageQualityBanner: React.FC<ImageQualityBannerProps> = ({
  imageQuality,
  onRetake
}) => {
  if (!imageQuality) return null;

  const isInsufficient = imageQuality.status === "INSUFFICIENT" || imageQuality.score < 40;
  const isFair = imageQuality.status === "FAIR" || (imageQuality.score >= 40 && imageQuality.score < 70);

  if (!isInsufficient && !isFair) return null;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isInsufficient
          ? "bg-rose-50/90 border-rose-200 text-rose-900"
          : "bg-amber-50/90 border-amber-200 text-amber-900"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
              isInsufficient ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs uppercase tracking-wider">
                {isInsufficient ? "⚠ Image Quality is Insufficient" : "Image Quality Notice (Fair)"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isInsufficient
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                Quality Score: {imageQuality.score}/100
              </span>
            </div>

            {imageQuality.issues && imageQuality.issues.length > 0 && (
              <ul className="list-disc list-inside text-xs space-y-0.5 pt-1">
                {imageQuality.issues.map((issue, idx) => (
                  <li key={idx} className="leading-snug">
                    {issue}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs pt-1 font-medium">
              {imageQuality.suggestions ||
                "Move closer to the affected leaf, ensure steady focus, and capture the image in bright, even lighting."}
            </p>
          </div>
        </div>

        {onRetake && (
          <button
            type="button"
            onClick={onRetake}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition self-start sm:self-center flex-shrink-0 ${
              isInsufficient
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake / Select Image
          </button>
        )}
      </div>
    </div>
  );
};
