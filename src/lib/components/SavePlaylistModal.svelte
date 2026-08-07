<script>
  import * as ui from '$lib/ui.svelte.js';
  import * as jf from '$lib/jellyfin.js';
  import * as player from '$lib/player.svelte.js';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  let playlists = $state([]);
  let newName = $state('');

  async function load() {
    try {
      const r = await jf.getPlaylists({ Limit: 100 });
      playlists = r.Items || [];
    } catch (e) { playlists = []; }
  }
  async function addTo(p) {
    try {
      await jf.addToPlaylist(p.Id, ui.state.savePlaylistModal.itemIds);
      ui.toast(`Added to ${p.Name}`, 'success');
      ui.closeSavePlaylist();
    } catch (e) { ui.toast(e.message || 'Could not add', 'error'); }
  }
  async function create() {
    if (!newName.trim()) return;
    try {
      const p = await jf.createPlaylist(newName.trim());
      if (ui.state.savePlaylistModal.itemIds.length) {
        await jf.addToPlaylist(p.Id, ui.state.savePlaylistModal.itemIds);
      } else if (ui.state.savePlaylistModal.track) {
        await jf.addToPlaylist(p.Id, [ui.state.savePlaylistModal.track.Id]);
      }
      ui.toast(`Created ${newName.trim()}`, 'success');
      ui.closeSavePlaylist();
    } catch (e) { ui.toast(e.message || 'Could not create', 'error'); }
  }
  onMount(() => { load(); });
</script>

{#if ui.state.savePlaylistModal.open}
  <div class="overlay" onclick={(e)=>{ if(e.target===e.currentTarget) ui.closeSavePlaylist(); }}>
    <div class="panel">
      <h3>Add to playlist</h3>
      <div class="list">
        {#each playlists as p}
          <button class="prow" onclick={()=>addTo(p)}>
            <div class="pimg"><Icon name="disc" size={22}/></div>
            <span>{p.Name}</span>
          </button>
        {:else}
          <p class="empty">No playlists yet. Create one below.</p>
        {/each}
      </div>
      <div class="create-row">
        <input bind:value={newName} placeholder="Name of new playlist" onkeydown={(e)=>{ if(e.key==='Enter') create(); }} />
        <button class="create" onclick={create} disabled={!newName.trim()}>Create</button>
      </div>
      <button class="cancel" onclick={()=>ui.closeSavePlaylist()}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 5000; display:flex; align-items:center; justify-content:center; }
  .panel { background:#282828; border-radius:8px; width: 400px; max-width: calc(100vw - 40px); max-height: 78vh; display:flex; flex-direction:column; padding: 20px; }
  h3 { font-size:20px; font-weight:700; margin-bottom:16px; }
  .list { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px; }
  .prow { display:flex; align-items:center; gap:12px; padding:8px; border-radius:4px; }
  .prow:hover { background:rgba(255,255,255,0.08); }
  .pimg { width:42px; height:42px; background:#333; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#b3b3b3; }
  .empty { color:#b3b3b3; font-size:14px; padding: 12px; }
  .create-row { display:flex; gap:10px; margin-top:14px; }
  .create-row input { flex:1; padding:10px 14px; border-radius:50px; background:#181818; border:1px solid transparent; color:#fff; outline:none; }
  .create-row input:focus { border-color:var(--green); }
  .create { background:var(--green); color:#000; font-weight:700; padding:0 18px; border-radius:50px; }
  .create:disabled{opacity:0.4;}
  .cancel { margin-top:12px; color:#b3b3b3; font-size:13px; }
</style>
