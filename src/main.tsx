import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ResumeDistrict from "./ResumeDistrict";
import "./index.css";
import "./level-up-standard.css";
import "./level-up-shell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ResumeDistrict />
  </StrictMode>,
);
