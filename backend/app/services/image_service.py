import io
from PIL import Image
from fastapi import HTTPException, status
from backend.app.core.config import settings

class ImageService:
    @staticmethod
    def validate_and_process(image_bytes: bytes, filename: str) -> bytes:
        """
        Validates image existence, format, size, and dimensions using Pillow.
        Returns optimized JPEG image bytes.
        """
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "INVALID_IMAGE", "message": "Uploaded file is empty."}
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(image_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "OVERSIZED_IMAGE",
                    "message": f"Image exceeds maximum permitted size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                }
            )

        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()  # Verify image integrity
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "CORRUPTED_IMAGE", "message": "Uploaded file is not a valid or supported image."}
            )

        # Reopen for processing after verify()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Format check
        fmt = (image.format or "").lower()
        if fmt not in ["jpeg", "jpg", "png", "webp"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "UNSUPPORTED_FORMAT", "message": f"Format {fmt.upper()} is not supported. Use JPG, PNG, or WEBP."}
            )

        # Dimension check
        width, height = image.size
        if width < 100 or height < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "LOW_IMAGE_QUALITY", "message": "Image resolution too low. Minimum 100x100 pixels required."}
            )

        # Convert RGBA/P to RGB and optimize/resize if very large
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        max_dim = 1920
        if width > max_dim or height > max_dim:
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        output = io.BytesIO()
        image.save(output, format="JPEG", quality=88)
        return output.getvalue()
