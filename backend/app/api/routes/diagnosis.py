import os
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.schemas.diagnosis import DiagnosisResponse, ErrorResponse
from backend.app.services.image_service import ImageService
from backend.app.services.diagnosis_service import DiagnosisService
from backend.app.core.security import sanitize_filename
from backend.app.database.database import get_db
from backend.app.models.diagnosis import DiagnosisRecord

router = APIRouter()
diagnosis_service = DiagnosisService()

@router.post("/diagnose", response_model=DiagnosisResponse, responses={400: {"model": ErrorResponse}}, summary="Analyze Leaf Image")
async def diagnose_leaf(image: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a leaf image for AI disease diagnosis, risk scoring, and treatment recommendations.
    """
    if not image or not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "NO_FILE", "message": "No image file uploaded."}
        )

    # 1. Read file bytes
    contents = await image.read()

    # 2. Validate & preprocess image
    processed_bytes = ImageService.validate_and_process(contents, image.filename)

    # 3. Save file locally
    safe_name = sanitize_filename(image.filename)
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(processed_bytes)

    # 4. Perform diagnosis workflow
    result = await diagnosis_service.run_diagnosis(processed_bytes, safe_name)

    # 5. Persist diagnosis record to DB
    record = DiagnosisRecord(
        image_filename=safe_name,
        plant_name=result["plant"]["name"],
        disease_name=result["diagnosis"]["disease"],
        confidence=result["diagnosis"]["confidence"],
        severity=result["severity"],
        risk_score=result["metrics"]["risk_score"],
        plant_health_score=result["metrics"]["plant_health_score"],
        recovery_outlook=result["metrics"]["recovery_outlook"],
        symptoms=result["symptoms"],
        organic_treatment=result["organic_treatment"],
        chemical_treatment=result["chemical_treatment"],
        prevention=result["prevention"],
        warnings=result["warnings"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    return result

@router.get("/history", summary="Get Diagnosis History")
async def get_history(db: Session = Depends(get_db)):
    """Retrieve all stored diagnosis records."""
    records = db.query(DiagnosisRecord).order_by(DiagnosisRecord.created_at.desc()).all()
    return records

@router.delete("/history/{record_id}", summary="Delete Diagnosis Record")
async def delete_history(record_id: int, db: Session = Depends(get_db)):
    """Delete a diagnosis record by ID."""
    record = db.query(DiagnosisRecord).filter(DiagnosisRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}
