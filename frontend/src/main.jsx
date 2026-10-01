import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/geist";
import "./styles.css";
import App from "./App.jsx";
import { MenuProvider } from "./menu.jsx";
import { CartProvider } from "./cart.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <MenuProvider>
      <CartProvider>
      <App />
    </CartProvider>
    </MenuProvider>
  </BrowserRouter>
);
