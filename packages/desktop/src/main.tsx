import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Import design system — local copy so tailwindcss resolves from desktop's node_modules
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
