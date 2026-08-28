import re
import uuid
import os

def sanitize_filename(filename: str) -> str:
    """Generate a safe, UUID-prefixed filename."""
    name, ext = os.path.splitext(filename)
    safe_ext = ext.lower().replace(".", "")
    unique_id = str(uuid.uuid4())[:8]
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '', name)[:20]
    return f"{clean_name}_{unique_id}.{safe_ext}"
