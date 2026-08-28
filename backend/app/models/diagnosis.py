import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from backend.app.database.database import Base

class DiagnosisRecord(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    image_filename = Column(String, nullable=False)
    plant_name = Column(String, nullable=False)
    disease_name = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    plant_health_score = Column(Integer, nullable=False)
    recovery_outlook = Column(String, nullable=False)
    
    symptoms = Column(JSON, nullable=False, default=list)
    organic_treatment = Column(JSON, nullable=False, default=list)
    chemical_treatment = Column(JSON, nullable=False, default=list)
    prevention = Column(JSON, nullable=False, default=list)
    warnings = Column(JSON, nullable=False, default=list)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
