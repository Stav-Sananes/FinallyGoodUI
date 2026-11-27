import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./tokens.css";
import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css"; // last, so its overrides win ties against the component layers

mount(App, { target: document.getElementById("app") });
