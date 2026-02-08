import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary.tsx";
import "./index.css";

// Handle chunk load errors globally (for dynamic imports outside React tree)
window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event.reason?.message || event.reason || "");
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Loading chunk")
  ) {
    const lastReload = sessionStorage.getItem("chunk_reload_time");
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem("chunk_reload_time", String(now));
      window.location.reload();
    }
    event.preventDefault();
  }
});

// Force clean render
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <ChunkErrorBoundary>
        <App />
      </ChunkErrorBoundary>
    </React.StrictMode>
  );
}
