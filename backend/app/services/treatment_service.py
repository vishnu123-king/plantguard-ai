from typing import Dict, Any

PLANT_DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "early blight": {
        "organic": [
            "Prune infected bottom leaves to prevent soil-splash spore transmission.",
            "Apply copper-based or sulfur organic fungicide sprays every 7-10 days during humid weather.",
            "Apply neem oil or bio-fungicide containing Bacillus subtilis as an early preventative."
        ],
        "chemical": [
            "Apply broad-spectrum synthetic fungicides containing Chlorothalonil or Mancozeb.",
            "Use systemic fungicides containing Difenoconazole or Azoxystrobin for active outbreaks.",
            "Follow product label safety instructions and wear protective eyewear and gloves during application."
        ],
        "prevention": [
            "Practice 3-year crop rotation with non-solanaceous crops.",
            "Avoid overhead irrigation; use drip lines or soak hoses at plant base.",
            "Mulch heavily around plant base to prevent soil splash onto foliage.",
            "Maintain wide plant spacing to maximize airflow and rapid leaf drying."
        ]
    },
    "late blight": {
        "organic": [
            "Immediately destroy and remove infected plants; do not compost diseased tissue.",
            "Apply preventative organic copper octanoate sprays at first sign of humid conditions."
        ],
        "chemical": [
            "Apply specialized late blight fungicides containing Cymoxanil, Propamocarb, or Mandipropamid.",
            "Rotate active ingredients to prevent fungal resistance development."
        ],
        "prevention": [
            "Plant certified disease-free seeds and tubers.",
            "Inspect neighboring vegetation and eliminate wild solanaceous weeds.",
            "Keep foliage dry and ensure drip irrigation is used exclusively."
        ]
    },
    "septoria leaf spot": {
        "organic": [
            "Remove affected leaves at first notice of small circular spots.",
            "Apply copper fungicide or potassium bicarbonate spray biweekly."
        ],
        "chemical": [
            "Spray copper hydroxide, chlorothalonil, or myclobutanil according to label instructions."
        ],
        "prevention": [
            "Destroy crop residue after harvest.",
            "Disinfect stakes, cages, and gardening tools with 10% bleach solution."
        ]
    },
    "powdery mildew": {
        "organic": [
            "Spray potassium bicarbonate (1 tbsp per gallon water) or horticultural neem oil.",
            "Apply bio-fungicides with Bacillus amyloliquefaciens."
        ],
        "chemical": [
            "Apply sulfur or myclobutanil fungicides."
        ],
        "prevention": [
            "Provide full sunlight exposure.",
            "Ensure ample air ventilation around foliage."
        ]
    },
    "healthy": {
        "organic": [
            "Continue organic compost soil enrichment and balanced bio-fertilizer regimen."
        ],
        "chemical": [
            "No chemical fungicide application required for healthy foliage."
        ],
        "prevention": [
            "Regularly inspect undersides of leaves weekly.",
            "Maintain optimal watering schedules and healthy soil biology."
        ]
    }
}

class TreatmentService:
    @staticmethod
    def get_treatments(disease_name: str) -> dict:
        """Looks up organic, chemical, and preventive measures from controlled knowledge base."""
        key = disease_name.lower().strip()
        
        # Match against knowledge base keys
        for kb_key, kb_data in PLANT_DISEASE_KNOWLEDGE_BASE.items():
            if kb_key in key or key in kb_key:
                return kb_data
                
        # Default safety fallback
        return {
            "organic": [
                "Remove and isolate visibly affected leaves to reduce spore spread.",
                "Ensure proper soil drainage and apply organic compost tea or neem oil."
            ],
            "chemical": [
                "Consult a local agricultural extension officer for specific chemical registration in your region.",
                "Always read and follow pesticide product labels carefully and wear PPE."
            ],
            "prevention": [
                "Maintain good air circulation between plants.",
                "Avoid watering plant foliage directly; irrigate at soil level.",
                "Sanitize pruners and gardening tools regularly."
            ]
        }
