document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("history-container");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const filterStatus = document.getElementById("filter-status");

  let allRecords = [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/history`);
    if (response.ok) {
      allRecords = await response.json();
    }
  } catch (e) {
    console.error("Failed to load history from API:", e);
  }

  renderRecords(allRecords);

  if (searchInput) {
    searchInput.addEventListener("input", filterAndRender);
  }
  if (filterStatus) {
    filterStatus.addEventListener("change", filterAndRender);
  }

  function filterAndRender() {
    const query = (searchInput.value || "").toLowerCase();
    const statusFilter = filterStatus.value;

    const filtered = allRecords.filter(r => {
      const matchQuery = (r.plant_name || "").toLowerCase().includes(query) ||
                         (r.disease_name || "").toLowerCase().includes(query);
      
      const isHealthy = (r.disease_name || "").toLowerCase().includes("healthy") ||
                        (r.severity || "").toLowerCase() === "none";
      
      let matchStatus = true;
      if (statusFilter === "diseased") matchStatus = !isHealthy;
      if (statusFilter === "healthy") matchStatus = isHealthy;

      return matchQuery && matchStatus;
    });

    renderRecords(filtered);
  }

  function renderRecords(records) {
    if (!records || records.length === 0) {
      container.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    container.classList.remove("hidden");
    container.innerHTML = "";

    records.forEach(rec => {
      const card = document.createElement("div");
      card.className = "bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4";

      const dateStr = formatDate(rec.created_at);
      const isHealthy = (rec.disease_name || "").toLowerCase().includes("healthy") || rec.severity === "none";

      card.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            ${isHealthy ? "🌿" : "🍂"}
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-extrabold text-slate-800 text-base">${rec.plant_name}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                ${rec.disease_name}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Confidence: <span class="font-semibold text-slate-700">${Math.round(rec.confidence)}%</span> • 
              Risk Score: <span class="font-semibold text-amber-600">${rec.risk_score}/100</span> • 
              ${dateStr}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button data-id="${rec.id}" class="view-btn px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition">
            View Details
          </button>
          <button data-id="${rec.id}" class="delete-btn px-3 py-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition">
            Delete
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    // Attach listeners
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        const record = allRecords.find(r => r.id === id);
        if (record) {
          const formatted = {
            id: record.id,
            plant: { name: record.plant_name, confidence: record.confidence },
            diagnosis: { disease: record.disease_name, confidence: record.confidence, status: record.severity === "none" ? "healthy" : "diseased" },
            severity: record.severity,
            metrics: { risk_score: record.risk_score, plant_health_score: record.plant_health_score, recovery_outlook: record.recovery_outlook },
            symptoms: record.symptoms || [],
            organic_treatment: record.organic_treatment || [],
            chemical_treatment: record.chemical_treatment || [],
            prevention: record.prevention || [],
            warnings: record.warnings || []
          };
          localStorage.setItem("plantguard_latest_result", JSON.stringify(formatted));
          window.location.href = "result.html";
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        try {
          await fetch(`${API_BASE_URL}/api/history/${id}`, { method: "DELETE" });
          allRecords = allRecords.filter(r => r.id !== id);
          filterAndRender();
        } catch (err) {
          console.error("Failed to delete record:", err);
        }
      });
    });
  }
});
