import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { UnitProvider } from "./lib/units.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UnitProvider>
      <App />
    </UnitProvider>
  </React.StrictMode>
);
