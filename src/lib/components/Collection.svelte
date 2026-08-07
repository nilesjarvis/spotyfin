<script>
  import { onMount } from 'svelte';
  import * as jf from '$lib/jellyfin.js';
  import Card from './Card.svelte';
  import Icon from './Icon.svelte';
  import { goto } from '$app/navigation';

  let { contentType = 'playlists' } = $props();
  let items = $state([]);
  let loading = $state(true);
  let sort = $state('recent');
  let view = $state('grid');

  async function load() {
    loading = true;
    try {
      let r;
      if (contentType === 'playlists') r = await jf.getPlaylists({ Limit: 500 });
      else if (contentType === 'albums') r = await jf.getItems({ IncludeItemTypes:'MusicAlbum', Recursive:true, SortBy:'DateCreated', SortOrder:'Descending', Limit:500 });
      else if (contentType === 'artists') r = await jf.getAlbumArtists({ Limit: 500 });
      items = r.Items || [];
    } catch(e){ items = []; }
    loading = false;
  }
  onMount(load);

  const sorted = $derived.by(() => {
    const arr = items.slice();
    if (sort === 'az') arr.sort((a,b)=>(a.Name||'').localeCompare(b.Name||''));
    else if (sort === 'recent') { /* DateCreated desc already for albums; playlists by sortname */ }
    return arr;
  });
</script>

<div class="collection fade-in">
  <h1 class="title">Your Library</h1>

  <div class="toolbar">
    <div class="tabs">
      <button class="tab" class:active={contentType==='playlists'} onclick={()=>goto('/collection/playlists')}>Playlists</button>
      <button class="tab" class:active={contentType==='albums'} onclick={()=>goto('/collection/albums')}>Albums</button>
      <button class="tab" class:active={contentType==='artists'} onclick={()=>goto('/collection/artists')}>Artists</button>
    </div>
    <div class="sort-controls">
      <button class="sort-btn" onclick={()=>sort = sort==='az' ? 'recent' : 'az'}>
        <Icon name="menu" size={14}/> <span>{sort==='az' ? 'A–Z' : 'Recent'}</span>
      </button>
      <span class="view-toggle">
        <button class:active={view==='grid'} onclick={()=>view='grid'}><Icon name="grid" size={18}/></button>
        <button class:active={view==='list'} onclick={()=>view='list'}><Icon name="menu" size={18}/></button>
      </span>
      <button class="filter-btn" title="Filters"><Icon name="more_horiz" size={18}/></button>
    </div>
  </div>

  {#if contentType==='playlists'}
    <div class="pinned">
      <button class="quickcard" onclick={()=>goto('/liked')}>
        <span class="qc-art"><Icon name="heart_fill" size={26}/></span>
        <span class="qc-name">Liked Songs</span>
      </button>
      <button class="quickcard" onclick={()=> import('$lib/ui.svelte.js').then(ui=>ui.openTextModal({title:'Create new playlist',placeholder:'Playlist name',submitLabel:'Create',onSubmit:async(name)=>{ try{await jf.createPlaylist(name); load();}catch(e){}} }))}>
        <span class="qc-art dim"><Icon name="plus" size={26}/></span>
        <span class="qc-name">Create Playlist</span>
      </button>
    </div>
  {/if}

  {#if loading && !items.length}
    <div class="load">Loading…</div>
  {:else if !items.length}
    <div class="empty">Nothing here yet</div>
  {:else}
    <div class="grid">
      {#each sorted as it (it.Id)}
        <Card item={it}
              type={contentType==='artists' ? 'artist' : contentType==='albums' ? 'album' : 'playlist'}
              round={contentType==='artists'}
              subtitle={contentType==='albums' ? (it.AlbumArtist||'') : contentType==='artists' ? '' : 'Playlist'} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .collection { min-height:100%; padding: 12px 24px 48px; }
  .title { font-size: 26px; font-weight: 700; margin-bottom: 12px; }
  .toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom: 8px; }
  .tabs { display:flex; gap:8px; }
  .tab { font-size:14px; font-weight:500; color:#fff; background:#232323; padding:7px 14px; border-radius:50px; }
  .tab.active { background:var(--green); color:#000; font-weight:700; }
  .sort-controls { display:flex; align-items:center; gap:12px; color:var(--text-secondary); }
  .sort-btn { display:flex; align-items:center; gap:6px; font-size:13px; }
  .sort-btn:hover, .view-toggle button:hover, .filter-btn:hover { color:#fff; }
  .view-toggle { display:flex; gap:8px; }
  .pinned { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap:14px; margin-bottom: 24px; }
  .quickcard { display:flex; align-items:center; gap:14px; background:var(--bg-elevated); border-radius:8px; padding:12px; transition:background 0.2s; }
  .quickcard:hover { background: var(--bg-highlight); }
  .qc-art { width:52px; height:52px; border-radius:6px; background:linear-gradient(135deg,#5375ba,#4962a3); display:flex; align-items:center; justify-content:center; color:#fff; }
  .qc-art.dim { background:#2424a4; color:#b3b3b3; }
  .qc-name { font-size:15px; font-weight:600; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(170px,1fr)); gap:18px; }
  .load,.empty { color:var(--text-secondary); padding: 30px; }
</style>
