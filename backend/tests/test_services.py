from backend.app.services.risk_service import RiskService
from backend.app.services.treatment_service import TreatmentService

def test_risk_calculation():
    metrics = RiskService.calculate_metrics(
        disease_status="diseased",
        disease_name="Early Blight",
        confidence=90.0,
        severity="moderate",
        image_quality_score=90
    )
    assert 0 <= metrics["risk_score"] <= 100
    assert 0 <= metrics["plant_health_score"] <= 100
    assert metrics["recovery_outlook"] in ["Excellent", "Good", "Moderate", "Poor", "Critical"]

def test_treatment_lookup():
    treatments = TreatmentService.get_treatments("Early Blight")
    assert len(treatments["organic"]) > 0
    assert len(treatments["chemical"]) > 0
    assert len(treatments["prevention"]) > 0
