document.addEventListener("DOMContentLoaded", () => {
  const rawData = localStorage.getItem("plantguard_latest_result");
  if (!rawData) {
    window.location.href = "index.html";
    return;
  }

  const data = JSON.parse(rawData);

  // Populate UI
  document.getElementById("disease-title").textContent = data.diagnosis?.disease || "Disease Unknown";
  document.getElementById("plant-species").textContent = `Plant: ${data.plant?.name || "Unknown"}`;
  
  const statusBadge = document.getElementById("status-badge");
  const isHealthy = (data.diagnosis?.status || "").toLowerCase() === "healthy";
  if (isHealthy) {
    statusBadge.textContent = "Healthy";
    statusBadge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2";
  } else {
    statusBadge.textContent = "Diseased";
    statusBadge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 mb-2";
  }

  // Confidence
  const conf = Math.round(data.diagnosis?.confidence || 0);
  document.getElementById("confidence-val").textContent = `${conf}%`;
  document.getElementById("confidence-bar").style.width = `${conf}%`;

  // Metrics
  document.getElementById("risk-score").textContent = data.metrics?.risk_score ?? 50;
  document.getElementById("health-score").textContent = data.metrics?.plant_health_score ?? 50;
  document.getElementById("severity-tag").textContent = (data.severity || "Moderate").toUpperCase();
  document.getElementById("outlook-tag").textContent = data.metrics?.recovery_outlook || "Moderate";

  // Date
  document.getElementById("report-date").textContent = `Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  // Symptoms
  const symptomsList = document.getElementById("symptoms-list");
  symptomsList.innerHTML = "";
  (data.symptoms || ["No visual symptoms recorded"]).forEach(sym => {
    const li = document.createElement("li");
    li.className = "flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100";
    li.innerHTML = `<span class="text-emerald-600 font-bold">•</span> <span>${sym}</span>`;
    symptomsList.appendChild(li);
  });

  // Organic
  const organicList = document.getElementById("organic-list");
  organicList.innerHTML = "";
  (data.organic_treatment || ["Maintain optimal organic compost and soil drainage."]).forEach(org => {
    const li = document.createElement("li");
    li.textContent = org;
    organicList.appendChild(li);
  });

  // Chemical
  const chemicalList = document.getElementById("chemical-list");
  chemicalList.innerHTML = "";
  (data.chemical_treatment || ["No chemical sprays necessary."]).forEach(chem => {
    const li = document.createElement("li");
    li.textContent = chem;
    chemicalList.appendChild(li);
  });

  // Prevention
  const preventionList = document.getElementById("prevention-list");
  preventionList.innerHTML = "";
  (data.prevention || ["Ensure regular watering and proper spacing."]).forEach(prev => {
    const li = document.createElement("li");
    li.className = "flex items-start gap-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100";
    li.innerHTML = `<span class="text-emerald-700">🛡️</span> <span>${prev}</span>`;
    preventionList.appendChild(li);
  });

  // Warnings
  if (data.warnings && data.warnings.length > 0) {
    const warningBox = document.getElementById("warning-box");
    const warningList = document.getElementById("warning-list");
    warningBox.classList.remove("hidden");
    warningList.innerHTML = "";
    data.warnings.forEach(w => {
      const li = document.createElement("li");
      li.textContent = w;
      warningList.appendChild(li);
    });
  }
});
