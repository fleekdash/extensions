import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApiDemo } from "./ApiDemo";
import "./api-demo.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiDemo />
  </StrictMode>,
);
