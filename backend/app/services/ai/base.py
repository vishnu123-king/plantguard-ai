from abc import ABC, abstractmethod

class VisionAIProvider(ABC):
    @abstractmethod
    async def analyze_leaf(self, image_bytes: bytes) -> dict:
        """Analyze a plant leaf image bytes and return structured AI response."""
        raise NotImplementedError
