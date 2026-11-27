<script>
  import { onMount } from 'svelte';
  import Toast from './components/fgu/toast/toast.svelte';
  import { toasts, dismissToast } from './components/fgu/toast/toast-store.js';
  import Icon from './lib/Icon.svelte';
  import Book from './screens/Book.svelte';
  import Details from './screens/Details.svelte';
  import Ticket from './screens/Ticket.svelte';
  import Services from './screens/Services.svelte';
  import Visits from './screens/Visits.svelte';
  import { route, startRouter, href } from './lib/router.svelte.js';

  onMount(startRouter);

  const nav = [
    { name: 'book', label: 'Book', icon: 'clock', also: ['details', 'ticket'] },
    { name: 'services', label: 'Services', icon: 'scissors', also: [] },
    { name: 'visits', label: 'Visits', icon: 'tag', also: [] },
  ];
  const here = (n) => route.name === n.name || n.also.includes(route.name);
</script>

<a class="skip" href="#main-content" onclick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>

<div class="shell" data-route={route.name}>
  <header class="top">
    <a class="brand" href={href('book')} aria-label="Pawprint grooming, home">
      <Icon name="paw" size="lg" /><span>Pawprint</span>
    </a>
    <nav class="nav" aria-label="Main">
      <ul>
        {#each nav as n (n.name)}
          <li>
            <a href={href(n.name, route.q.state ? { state: route.q.state } : {})} aria-current={here(n) ? 'page' : undefined}>
              <Icon name={n.icon} /><span>{n.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </header>

  <main id="main-content" tabindex="-1">
    {#if route.name === 'book'}<Book />
    {:else if route.name === 'details'}<Details />
    {:else if route.name === 'ticket'}<Ticket />
    {:else if route.name === 'services'}<Services />
    {:else if route.name === 'visits'}<Visits />
    {/if}
  </main>
</div>

<Toast toasts={$toasts} ondismiss={dismissToast} />
