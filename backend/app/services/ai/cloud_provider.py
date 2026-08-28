import os
import json
import logging
from backend.app.services.ai.base import VisionAIProvider

logger = logging.getLogger("plantguard.ai")

class MockVisionAIProvider(VisionAIProvider):
    async def analyze_leaf(self, image_bytes: bytes) -> dict:
        """Mock AI analysis for testing and offline development."""
        logger.info("Using MockVisionAIProvider for leaf analysis")
        return {
            "plant": {
                "name": "Tomato",
                "confidence": 95.0
            },
            "diagnosis": {
                "status": "diseased",
                "disease": "Early Blight",
                "confidence": 92.0
            },
            "symptoms": [
                "Brown circular lesions with concentric rings",
                "Yellowing foliage surrounding leaf spots",
                "Dark spots on leaf surface",
                "Progressive tissue necrosis"
            ],
            "severity": "moderate",
            "image_quality": {
                "sufficient": True,
                "score": 88
            },
            "alternative_diagnoses": [
                {"name": "Septoria Leaf Spot", "confidence": 12.0}
            ]
        }

class CloudVisionProvider(VisionAIProvider):
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("AI_API_KEY", "")
        self.model_name = model_name

    async def analyze_leaf(self, image_bytes: bytes) -> dict:
        """Calls cloud multimodal AI vision API (Gemini) to analyze leaf image."""
        if not self.api_key:
            logger.warning("No AI API key set. Falling back to MockVisionAIProvider.")
            mock = MockVisionAIProvider()
            return await mock.analyze_leaf(image_bytes)

        try:
            # Using google-genai SDK when configured
            from google import genai
            client = genai.Client(api_key=self.api_key)
            
            prompt = """
You are an agricultural plant disease analysis assistant.
Analyze the provided plant leaf image carefully.

Return structured JSON ONLY matching this schema:
{
  "plant": { "name": "Plant Name", "confidence": 90 },
  "diagnosis": { "status": "diseased|healthy", "disease": "Disease Name or Healthy", "confidence": 88 },
  "symptoms": ["symptom 1", "symptom 2"],
  "severity": "none|mild|moderate|severe|critical",
  "image_quality": { "sufficient": true, "score": 85 },
  "alternative_diagnoses": [{"name": "Disease Name", "confidence": 15}]
}
"""
            # Call vision model with image bytes
            response = client.models.generate_content(
                model=self.model_name,
                contents=[
                    genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt
                ]
            )
            
            text = response.text.strip()
            # Clean JSON markdown formatting if present
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            
            data = json.loads(text.strip())
            return data
            
        except Exception as e:
            logger.error(f"Cloud AI analysis failed: {str(e)}")
            mock = MockVisionAIProvider()
            return await mock.analyze_leaf(image_bytes)
