import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ResumeDistrict from "./ResumeDistrict";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ResumeDistrict />
  </StrictMode>,
);
