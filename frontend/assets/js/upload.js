document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const selectBtn = document.getElementById("select-btn");
  const dropZone = document.getElementById("drop-zone");
  const uploadPrompt = document.getElementById("upload-prompt");
  const previewContainer = document.getElementById("preview-container");
  const imagePreview = document.getElementById("image-preview");
  const fileNameDisplay = document.getElementById("file-name");
  const fileSizeDisplay = document.getElementById("file-size");
  const removeBtn = document.getElementById("remove-btn");
  const analyzeBtn = document.getElementById("analyze-btn");
  const errorAlert = document.getElementById("error-alert");
  const errorMessage = document.getElementById("error-message");
  const uploadCard = document.getElementById("upload-card");
  const loadingCard = document.getElementById("loading-card");

  let selectedFile = null;

  if (selectBtn && fileInput) {
    selectBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (dropZone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("drop-zone--active");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("drop-zone--active");
      });
    });

    dropZone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    hideError();
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showError("Invalid file type. Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("File size exceeds 10MB limit.");
      return;
    }

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      fileNameDisplay.textContent = file.name;
      fileSizeDisplay.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      
      uploadPrompt.classList.add("hidden");
      previewContainer.classList.remove("hidden");
      previewContainer.classList.add("flex");

      // Enable Analyze button
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("bg-slate-300", "text-slate-500", "cursor-not-allowed");
      analyzeBtn.classList.add("bg-emerald-600", "hover:bg-emerald-700", "text-white", "shadow-md");
    };
    reader.readAsDataURL(file);
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      selectedFile = null;
      fileInput.value = "";
      imagePreview.src = "";
      
      previewContainer.classList.add("hidden");
      previewContainer.classList.remove("flex");
      uploadPrompt.classList.remove("hidden");

      analyzeBtn.disabled = true;
      analyzeBtn.classList.add("bg-slate-300", "text-slate-500", "cursor-not-allowed");
      analyzeBtn.classList.remove("bg-emerald-600", "hover:bg-emerald-700", "text-white", "shadow-md");
      hideError();
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      if (!selectedFile) return;

      hideError();
      uploadCard.classList.add("hidden");
      loadingCard.classList.remove("hidden");

      const formData = new FormData();
      formData.append("image", selectedFile);

      try {
        const response = await fetch(`${API_BASE_URL}/api/diagnose`, {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || errData.detail?.message || "Diagnosis failed.");
        }

        const data = await response.json();
        // Save result in localStorage for result.html view
        localStorage.setItem("plantguard_latest_result", JSON.stringify(data));
        window.location.href = "result.html";
      } catch (err) {
        loadingCard.classList.add("hidden");
        uploadCard.classList.remove("hidden");
        showError(err.message || "Unable to connect to AI server. Please try again.");
      }
    });
  }

  function showError(msg) {
    if (errorMessage && errorAlert) {
      errorMessage.textContent = msg;
      errorAlert.classList.remove("hidden");
    }
  }

  function hideError() {
    if (errorAlert) {
      errorAlert.classList.add("hidden");
    }
  }
});
