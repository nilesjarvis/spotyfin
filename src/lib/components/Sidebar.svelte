<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as jf from '$lib/jellyfin.js';
  import * as ui from '$lib/ui.svelte.js';
  import * as actions from '$lib/actions.js';
  import Icon from './Icon.svelte';

  let playlists = $state([]);
  let artists = $state([]);
  let albums = $state([]);
  let songs = $state([]);
  let tab = $state('all');
  let loading = $state(true);

  const tabs = [
    { id: 'all', label: 'All' }, { id: 'playlists', label: 'Playlists' },
    { id: 'artists', label: 'Artists' }, { id: 'albums', label: 'Albums' }, { id: 'songs', label: 'Songs' }
  ];

  async function load() {
    loading = true;
    try {
      const [pl, ar, al, so] = await Promise.all([
        jf.getPlaylists({ Limit: 300 }),
        jf.getAlbumArtists({ Limit: 150 }),
        jf.getItems({ IncludeItemTypes: 'MusicAlbum', Recursive: true, SortBy: 'SortName', Limit: 300 }),
        jf.getItems({ IncludeItemTypes: 'Audio', Recursive: true, SortBy: 'SortName', Limit: 300 })
      ]);
      playlists = pl.Items || []; artists = al.Items || []; albums = ar.Items || []; songs = so.Items || [];
    } catch (e) { /* ignore */ }
    loading = false;
  }
  onMount(load);

  function isActive(path) { return page.url.pathname === path; }

  function createPlaylist() {
    ui.openTextModal({
      title: 'Create new playlist', placeholder: 'Playlist name', submitLabel: 'Create',
      onSubmit: async (name) => {
        try {
          await jf.createPlaylist(name);
          ui.toast(`Created playlist "${name}"`, 'success');
          load();
        } catch (e) { ui.toast(e.message, 'error'); }
      }
    });
  }

  const visible = $derived.by(() => {
    const t = tab;
    if (t === 'playlists') return playlists.map(p => ({ ...p, _ctype: 'playlist' }));
    if (t === 'artists') return artists.map(a => ({ ...a, _ctype: 'artist' }));
    if (t === 'albums') return albums.map(a => ({ ...a, _ctype: 'album' }));
    if (t === 'songs') return songs.map(s => ({ ...s, _ctype: 'song' }));
    return [
      ...playlists.map(p => ({ ...p, _ctype: 'playlist' })),
      ...artists.map(a => ({ ...a, _ctype: 'artist' }))
    ];
  });

  function rowClick(item) {
    if (item._ctype === 'playlist') goto(`/playlist/${item.Id}`);
    else if (item._ctype === 'artist') goto(`/artist/${item.Id}`);
    else if (item._ctype === 'album') goto(`/album/${item.Id}`);
    else if (item._ctype === 'song') actions.playNow([item], 0, { contextTitle: 'Your Songs' });
  }

  function playSidebarItem(item, e) {
    e.stopPropagation();
    if (item._ctype === 'playlist') actions.loadAndPlayPlaylist(item);
    else if (item._ctype === 'album') actions.loadAndPlayAlbum(item);
    else if (item._ctype === 'artist') goto(`/artist/${item.Id}`);
    else if (item._ctype === 'song') actions.playNow([item], 0, { contextTitle: 'Your Songs' });
  }

  function openLibMenu(item, x, y) {
    if (item._ctype === 'playlist') {
      ui.openMenu(x, y, actions.buildPlaylistMenu(item, {
        onPlay: () => actions.loadAndPlayPlaylist(item),
        onRename: () => ui.openTextModal({ title: 'Edit playlist', initial: item.Name, submitLabel: 'Save',
          onSubmit: async (name) => { await jf.renameItem(item.Id, name); load(); } }),
        onDelete: async () => { await jf.deletePlaylist(item.Id); load(); }
      }));
    } else if (item._ctype === 'artist') {
      ui.openMenu(x, y, [{ label: 'Open artist', icon: 'user', action: () => goto(`/artist/${item.Id}`) }]);
    } else if (item._ctype === 'album') {
      ui.openMenu(x, y, actions.buildAlbumMenu(item));
    } else if (item._ctype === 'song') {
      ui.openMenu(x, y, actions.buildTrackMenu(item));
    }
  }
</script>

<div class="sidebar">
  <div class="logo" onclick={()=>goto('/')}>
    <svg class="logo-glyph" width="30" height="30" viewBox="0 0 24 24" fill="#1ed760"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.83-1.73-6.4-2.12-10.6-1.16a.75.75 0 0 1-.33-1.46c4.6-1.05 8.6-.6 11.7 1.34.35.22.46.68.26 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.24-1.99-8.18-2.57-12-.02a.94.94 0 0 1-1.06-1.55c4.42-3.04 10-2.4 13.85-.08.44.26.6.84.34 1.29l-.16-.08Zm.13-3.4C16.6 8.5 10.4 8.32 6.73 9.9a1.12 1.12 0 0 1-1-2c4.25-1.87 11.22-1.66 15.65 1.18a1.12 1.12 0 1 1-1.18 1.9l-.1-.05Z"/></svg>
    <span class="logo-text">Spotyfin</span>
  </div>

  <nav class="topnav">
    <a class="nav-item" class:active={isActive('/')} href="/" onclick={(e)=>{ if(e.metaKey||e.ctrlKey) return; e.preventDefault(); goto('/'); }}>
      <Icon name="home_fill" size={24} /> <span>Home</span>
    </a>
    <a class="nav-item" class:active={isActive('/search')} href="/search" onclick={(e)=>{ if(e.metaKey||e.ctrlKey) return; e.preventDefault(); goto('/search'); }}>
      <Icon name="search_fill" size={24} /> <span>Search</span>
    </a>
  </nav>

  <div class="lib">
    <div class="lib-header">
      <button class="lib-label" onclick={()=>goto('/collection/playlists')}>
        <Icon name="library" size={24} />
        <span>Your Library</span>
      </button>
      <div class="lib-actions">
        <button class="icon-btn" title="Create playlist" onclick={createPlaylist}><Icon name="plus" size={20}/></button>
        <button class="icon-btn" title="Your Library" onclick={()=>goto('/collection/playlists')}><Icon name="chevron_right" size={20}/></button>
      </div>
    </div>

    <div class="tabs no-scrollbar">
      {#each tabs as t}
        <button class="tab" class:active={tab===t.id} onclick={()=>tab=t.id}>{t.label}</button>
      {/each}
    </div>

    <div class="lib-scroll">
      <div class="lib-list">
        {#each visible as item}
          <button class="lrow" onclick={(e)=>rowClick(item)}
                  oncontextmenu={(e)=>{ e.preventDefault(); openLibMenu(item, e.clientX, e.clientY); }}>
            <span class="lart" class:round={item._ctype==='artist'}>
              {#if item.ImageTags?.Primary}
                <img src={jf.imgUrl(item, {size:64})} alt="" loading="lazy"/>
              {:else}
                <Icon name="disc" size={20}/>
              {/if}
            </span>
            <span class="linfo">
              <span class="lname">{item.Name}</span>
              <span class="ldesc">
                {#if item._ctype==='playlist'}Playlist{:else if item._ctype==='artist'}Artist{:else if item._ctype==='album'}Album{:else}{item.Artists?.[0] || 'Song'}{/if}
              </span>
            </span>
            <span class="lplay" onclick={(e)=>playSidebarItem(item,e)}>
              <Icon name="play" size={15} fill="#000"/>
            </span>
          </button>
        {/each}
        {#if loading}<div class="ld-load">Loading…</div>{/if}
        {#if !loading && visible.length===0}<div class="ld-load none">Nothing here yet</div>{/if}
      </div>
    </div>
  </div>
</div>

<style>
  .sidebar { height: 100%; display:flex; flex-direction:column; background: var(--bg-sidebar); border-radius: 8px; overflow:hidden; }
  .logo { display:flex; align-items:center; gap:8px; padding: 18px 16px 14px 24px; cursor:pointer; }
  .logo-text { font-size: 21px; font-weight: 700; letter-spacing: -0.5px; color:#fff; }
  .topnav { display:flex; flex-direction:column; gap:2px; padding: 0 8px; }
  .nav-item { display:flex; align-items:center; gap:16px; padding: 10px 12px; border-radius:6px; font-size:16px; font-weight:600; color:var(--text-secondary); }
  .nav-item:hover { color:#fff; }
  .nav-item.active { color:#fff; }
  .nav-item svg { flex: 0 0 auto; }

  .lib { flex:1; min-height:0; margin-top:16px; display:flex; flex-direction:column; background:var(--bg-base); border-radius:8px; }
  .lib-header { display:flex; align-items:center; justify-content:space-between; padding: 12px 8px 4px 16px; }
  .lib-label { display:flex; align-items:center; gap:12px; color:var(--text-secondary); font-size:16px; font-weight:600; padding:8px; border-radius:4px; }
  .lib-label:hover { color:#fff; }
  .lib-actions { display:flex; }
  .icon-btn { color:var(--text-secondary); padding:8px; border-radius:50%; display:flex; }
  .icon-btn:hover { color:#fff; }

  .tabs { display:flex; gap:6px; padding: 6px 12px; overflow-x:auto; }
  .tab { flex:0 0 auto; font-size:13px; font-weight:500; color:#fff; background:#232323; padding: 5px 12px; border-radius: 50px; }
  .tab.active { background: var(--green); color:#000; font-weight:700; }

  .lib-scroll { flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; padding-top: 4px; }
  .lib-list { display:flex; flex-direction:column; padding: 0 8px 8px; }
  .lrow { display:flex; align-items:center; gap:12px; width:100%; padding: 8px; border-radius:6px; text-align:left; }
  .lrow:hover, .lrow:focus-visible { background: #1f1f1f; }
  .lart { width:46px; height:46px; border-radius:4px; background:#282828; flex:0 0 auto; overflow:hidden; display:flex; align-items:center; justify-content:center; color:#b3b3b3; }
  .lart.round { border-radius:50%; }
  .lart img { width:100%; height:100%; object-fit:cover; }
  .linfo { flex:1; min-width:0; }
  .lname { display:block; color:#fff; font-size:15px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ldesc { font-size:13px; color:var(--text-secondary); }
  .lplay { display:none; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; background:var(--green); flex:0 0 auto; }
  .lrow:hover .lplay { display:flex; }
  .ld-load { padding: 12px 16px; color: var(--text-subdued); font-size: 13px; }
</style>
