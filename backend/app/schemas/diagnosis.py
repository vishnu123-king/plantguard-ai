from typing import List, Optional
from pydantic import BaseModel, Field

class PlantInfo(BaseModel):
    name: str = Field(..., example="Tomato")
    confidence: float = Field(..., example=95.0)

class DiagnosisInfo(BaseModel):
    disease: str = Field(..., example="Early Blight")
    confidence: float = Field(..., example=92.0)
    status: str = Field(..., example="diseased")

class HealthMetrics(BaseModel):
    risk_score: int = Field(..., ge=0, le=100, example=67)
    plant_health_score: int = Field(..., ge=0, le=100, example=58)
    recovery_outlook: str = Field(..., example="Moderate")

class ImageQuality(BaseModel):
    sufficient: bool = Field(..., example=True)
    score: int = Field(..., ge=0, le=100, example=88)

class TreatmentStep(BaseModel):
    title: str
    description: str

class DiagnosisResponse(BaseModel):
    id: Optional[int] = None
    plant: PlantInfo
    diagnosis: DiagnosisInfo
    severity: str
    metrics: HealthMetrics
    symptoms: List[str]
    organic_treatment: List[str]
    chemical_treatment: List[str]
    prevention: List[str]
    warnings: List[str]
    image_quality: ImageQuality

class ErrorResponse(BaseModel):
    error: str
    message: str
