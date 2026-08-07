<script>
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import * as auth from '$lib/auth.svelte.js';
  import * as player from '$lib/player.svelte.js';
  import * as hist from '$lib/history.svelte.js';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Topbar from '$lib/components/Topbar.svelte';
  import PlayerBar from '$lib/components/PlayerBar.svelte';
  import NowPlaying from '$lib/components/NowPlaying.svelte';
  import QueueDrawer from '$lib/components/QueueDrawer.svelte';
  import ContextMenu from '$lib/components/ContextMenu.svelte';
  import Toasts from '$lib/components/Toasts.svelte';
  import SavePlaylistModal from '$lib/components/SavePlaylistModal.svelte';
  import TextModal from '$lib/components/TextModal.svelte';
  import Login from '$lib/components/Login.svelte';
  import '../app.css';

  onMount(() => { auth.init(); });
  afterNavigate((n) => { hist.register(n.to ? n.to.url.pathname : '/'); });

  function onKey(e) {
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    if (e.code === 'Space') { e.preventDefault(); player.togglePlay(); }
    else if ((e.key === 'ArrowRight') && e.ctrlKey) { e.preventDefault(); player.next(false); }
    else if ((e.key === 'ArrowLeft') && e.ctrlKey) { e.preventDefault(); player.prev(); }
    else if ((e.key === 'm' || e.key === 'M')) { player.toggleMute(); }
    else if ((e.key === 's' || e.key === 'S')) { player.toggleShuffle(); }
  }
</script>

<svelte:head>
  <title>Spotify</title>
</svelte:head>

{#if !auth.state.user}
  <Login />
{:else}
  <div class="app-root">
    <aside class="sidebar-col">
      <Sidebar />
    </aside>
    <main class="main-col">
      <Topbar />
      <div class="content-scroll">
        <slot />
      </div>
    </main>
  </div>
  {#if player.state.expanded}
    <NowPlaying />
  {:else}
    <PlayerBar />
  {/if}
  <QueueDrawer />
{/if}

<ContextMenu />
<Toasts />
<SavePlaylistModal />
<TextModal />

<style>
  .app-root {
    display: flex;
    height: calc(100vh - var(--player-height));
    padding: 8px;
    gap: 8px;
    background: #000;
  }
  .sidebar-col { width: var(--sidebar-width); flex: 0 0 auto; min-height: 0; }
  .main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .content-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; background: transparent; }
  @media (max-width: 720px) {
    .sidebar-col { width: 96px; }
  }
</style>
