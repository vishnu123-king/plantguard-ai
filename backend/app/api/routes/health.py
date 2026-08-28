from fastapi import APIRouter

router = APIRouter()

@router.get("/health", summary="Health Check")
async def health_check():
    """Returns the operational status of the PlantGuard AI API service."""
    return {"status": "ok"}
