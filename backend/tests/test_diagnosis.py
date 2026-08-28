import io
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def create_test_image():
    file = io.BytesIO()
    image = Image.new("RGB", (200, 200), color="green")
    image.save(file, "jpeg")
    file.seek(0)
    return file

def test_diagnose_valid_image():
    img_file = create_test_image()
    response = client.post(
        "/api/diagnose",
        files={"image": ("test_leaf.jpg", img_file, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "plant" in data
    assert "diagnosis" in data
    assert "metrics" in data
    assert data["plant"]["name"] == "Tomato"
