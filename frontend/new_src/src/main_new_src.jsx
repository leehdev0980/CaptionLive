import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { getRouter } from "./router";
import { RouterProvider } from "@tanstack/react-router";

import "./styles.css";

function Root() {
  const router = getRouter();
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
