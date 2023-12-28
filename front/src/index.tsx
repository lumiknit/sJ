/* @refresh reload */
import { render } from "solid-js/web";

// scss
import "@/styles/default.scss";
import "@/styles/light.scss";
import "@/styles/dark.scss";

import "@/dark-mode-detect";

// Main app
import App from "@/App";

// Render
const root = document.getElementById("root");

render(() => <App />, root!);
