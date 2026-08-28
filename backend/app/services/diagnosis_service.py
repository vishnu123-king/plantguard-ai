from typing import Dict, Any
from backend.app.services.ai.cloud_provider import MockVisionAIProvider, CloudVisionProvider
from backend.app.services.treatment_service import TreatmentService
from backend.app.services.risk_service import RiskService
from backend.app.core.config import settings

class DiagnosisService:
    def __init__(self):
        if settings.AI_PROVIDER == "cloud" and settings.AI_API_KEY:
            self.ai_provider = CloudVisionProvider(api_key=settings.AI_API_KEY, model_name=settings.AI_MODEL)
        else:
            self.ai_provider = MockVisionAIProvider()

    async def run_diagnosis(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Orchestrates image AI analysis, validation, treatment lookup, and health metrics calculation.
        """
        # 1. Run AI analysis
        ai_raw = await self.ai_provider.analyze_leaf(image_bytes)

        plant_name = ai_raw.get("plant", {}).get("name", "Unknown Plant")
        plant_conf = float(ai_raw.get("plant", {}).get("confidence", 85.0))
        
        disease_name = ai_raw.get("diagnosis", {}).get("disease", "Unknown Condition")
        disease_conf = float(ai_raw.get("diagnosis", {}).get("confidence", 80.0))
        status_str = ai_raw.get("diagnosis", {}).get("status", "diseased")
        
        severity = ai_raw.get("severity", "moderate")
        symptoms = ai_raw.get("symptoms", ["Visible discoloration on leaf surface"])
        img_qual = ai_raw.get("image_quality", {"sufficient": True, "score": 85})

        # 2. Get treatments from knowledge base
        treatment_data = TreatmentService.get_treatments(disease_name)

        # 3. Calculate metrics
        metrics = RiskService.calculate_metrics(
            disease_status=status_str,
            disease_name=disease_name,
            confidence=disease_conf,
            severity=severity,
            image_quality_score=img_qual.get("score", 85)
        )

        # 4. Compile warnings
        warnings = []
        if disease_conf < 60.0 or not img_qual.get("sufficient", True):
            warnings.append("Low Confidence: Image visual evidence is unclear. Please upload a sharper close-up shot.")
        if severity in ["severe", "critical"]:
            warnings.append("Severe Symptoms: Consider consulting your local agricultural extension service or certified plant specialist.")

        return {
            "plant": {
                "name": plant_name,
                "confidence": plant_conf
            },
            "diagnosis": {
                "disease": disease_name,
                "confidence": disease_conf,
                "status": status_str
            },
            "severity": severity,
            "metrics": metrics,
            "symptoms": symptoms,
            "organic_treatment": treatment_data.get("organic", []),
            "chemical_treatment": treatment_data.get("chemical", []),
            "prevention": treatment_data.get("prevention", []),
            "warnings": warnings,
            "image_quality": img_qual
        }
