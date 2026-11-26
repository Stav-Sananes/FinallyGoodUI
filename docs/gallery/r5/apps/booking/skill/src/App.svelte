<script>
import { onMount } from "svelte";
import Toast from "./components/fgu/toast/toast.svelte";
import Icon from "./lib/Icon.svelte";
import Who from "./screens/Who.svelte";
import When from "./screens/When.svelte";
import Review from "./screens/Review.svelte";
import Done from "./screens/Done.svelte";
import Visits from "./screens/Visits.svelte";
import { app, dismissToast } from "./lib/store.svelte.js";

const ORDER = ["book", "when", "review", "done"];
let online = $state(typeof navigator === "undefined" ? true : navigator.onLine);

function parse() {
  const [, top, sub] = (location.hash || "#/book").split("/");
  const next = top === "visits" ? "visits" : top === "book" && ORDER.includes(sub) ? sub : "book";
  return next;
}
function sync() {
  let next = parse();
  if ((next === "when" || next === "review") && !app.serviceId) next = "book";
  if (next === "review" && !app.slot) next = "when";
  if (next === "done" && !app.lastBooked) next = "book";
  const from = ORDER.indexOf(app.route), to = ORDER.indexOf(next);
  app.dir = from >= 0 && to >= 0 && to < from ? -1 : 1;
  app.route = next;
  window.scrollTo({ top: 0 });
  document.title = `${TITLES[next]} · Tailwag Grooming`;
}
const TITLES = { book: "Book a groom", when: "Pick a time", review: "Review and book", done: "Booked", visits: "My visits" };

onMount(() => {
  sync();
  const goOnline = () => (online = true), goOffline = () => (online = false);
  window.addEventListener("hashchange", sync);
  window.addEventListener("online", goOnline);
  window.addEventListener("offline", goOffline);
  return () => {
    window.removeEventListener("hashchange", sync);
    window.removeEventListener("online", goOnline);
    window.removeEventListener("offline", goOffline);
  };
});

const inFlow = $derived(app.route === "when" || app.route === "review");
const section = $derived(app.route === "visits" ? "visits" : "book");
const upcoming = $derived(app.visits.filter((v) => v.status === "booked" && new Date(v.start) > new Date()).length);
</script>

<a class="skip" href="#main">Skip to content</a>

<div class="shell" data-flow={inFlow}>
  <header class="topbar">
    <a class="brand" href="#/book" aria-label="Tailwag Grooming, home">
      <span class="brand-mark"><Icon name="paw" /></span>
      <span class="brand-name">Tailwag</span>
    </a>
    <nav class="nav-desktop" aria-label="Main">
      <a href="#/book" aria-current={section === "book" ? "page" : undefined}>Book a groom</a>
      <a href="#/visits" aria-current={section === "visits" ? "page" : undefined}>My visits{#if upcoming}<span class="pip">{upcoming}</span>{/if}</a>
    </nav>
  </header>

  {#if !online}
    <p class="banner" role="alert"><Icon name="wifi" size="sm" /> You are offline. Times and booking need a connection; what you've picked stays put.</p>
  {/if}

  <main id="main" tabindex="-1">
    {#key app.route}
      <div class="step" data-dir={app.dir}>
        {#if app.route === "book"}<Who />
        {:else if app.route === "when"}<When {online} />
        {:else if app.route === "review"}<Review />
        {:else if app.route === "done"}<Done />
        {:else}<Visits />{/if}
      </div>
    {/key}
  </main>

  <nav class="tabbar" aria-label="Main">
    <a href="#/book" aria-current={section === "book" ? "page" : undefined}><Icon name="paw" /><span>Book</span></a>
    <a href="#/visits" aria-current={section === "visits" ? "page" : undefined}>
      <Icon name="list" /><span>Visits</span>{#if upcoming}<span class="pip" aria-label="{upcoming} upcoming">{upcoming}</span>{/if}
    </a>
  </nav>
</div>

<Toast toasts={app.toasts} ondismiss={dismissToast} />
