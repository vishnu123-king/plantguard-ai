class RiskService:
    @staticmethod
    def calculate_metrics(disease_status: str, disease_name: str, confidence: float, severity: str, image_quality_score: int) -> dict:
        """
        Calculates disease risk score, plant health score, and recovery outlook.
        Inputs:
        - disease_status: "healthy" or "diseased"
        - confidence: AI confidence percentage (0-100)
        - severity: "none", "mild", "moderate", "severe", "critical"
        - image_quality_score: 0-100
        """
        if disease_status.lower() == "healthy" or disease_name.lower() in ["healthy", "healthy leaf"]:
            return {
                "risk_score": 10,
                "plant_health_score": 95,
                "recovery_outlook": "Excellent"
            }

        severity_weights = {
            "none": (10, 95, "Excellent"),
            "mild": (30, 80, "Good"),
            "moderate": (65, 55, "Moderate"),
            "severe": (85, 30, "Poor"),
            "critical": (95, 15, "Critical")
        }

        base_risk, base_health, outlook = severity_weights.get(severity.lower(), (60, 50, "Moderate"))

        # Adjust for confidence factor
        conf_factor = (confidence / 100.0)
        risk_score = int(base_risk * conf_factor)
        plant_health_score = int(base_health / (0.8 + 0.2 * conf_factor))

        # Clamp scores 0-100
        risk_score = max(0, min(100, risk_score))
        plant_health_score = max(0, min(100, plant_health_score))

        return {
            "risk_score": risk_score,
            "plant_health_score": plant_health_score,
            "recovery_outlook": outlook
        }
