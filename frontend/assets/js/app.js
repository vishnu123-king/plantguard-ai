/* Global application configuration & utilities */
const API_BASE_URL = window.location.origin;

// Common helper function to format dates
function formatDate(isoString) {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
