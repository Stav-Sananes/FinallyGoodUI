import { createApp } from "vue";
import "@fontsource/karla/400.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
import "@fontsource/young-serif/400.css";
import "@fontsource/spline-sans-mono/400.css";
import "@fontsource/spline-sans-mono/500.css";
import "./tokens.css";
import "./styles/app.css";
import "./styles/board.css";
import "./styles/pages.css";
import App from "./App.vue";
import { router } from "./router";
import { loadWeek, setTheme, state } from "./store";

setTheme(state.theme);
createApp(App).use(router).mount("#app");
void loadWeek();
