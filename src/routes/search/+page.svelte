<script>
  import { onMount } from 'svelte';
  import * as jf from '$lib/jellyfin.js';
  import * as actions from '$lib/actions.js';
  import * as player from '$lib/player.svelte.js';
  import Section from '$lib/components/Section.svelte';
  import TrackList from '$lib/components/TrackList.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let q = $state('');
  let filter = $state('all');
  let results = $state({ songs: [], albums: [], artists: [], playlists: [] });
  let genres = $state([]);
  let searching = $state(false);

  let timer;
  async function doSearch() {
    const term = q.trim();
    if (!term) { results = { songs:[], albums:[], artists:[], playlists:[] }; return; }
    searching = true;
    try {
      const [songs, albums, artists, playlists] = await Promise.all([
        jf.search(term, { IncludeItemTypes: 'Audio', Limit: 20 }),
        jf.search(term, { IncludeItemTypes: 'MusicAlbum', Limit: 20 }),
        jf.getItems({ SearchTerm: term, IncludeItemTypes: 'MusicArtist', Recursive: true, Limit: 20 }),
        jf.search(term, { IncludeItemTypes: 'Playlist', Limit: 20 })
      ]);
      results = { songs: songs.Items || [], albums: albums.Items || [], artists: artists.Items || [], playlists: playlists.Items || [] };
    } catch (e) { results = { songs:[], albums:[], artists:[], playlists:[] }; }
    searching = false;
  }
  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(doSearch, 250);
  }

  async function loadGenres() {
    try { const r = await jf.getGenres({ SortBy: 'SortName', StartIndex: 0, Limit: 40 }); genres = r.Items || []; } catch(e){ genres=[]; } 
  }
  onMount(loadGenres);

  const genreColors = [
    '#8d67ab','#e13300','#e61e32','#1e3264','#e8115b','#27856a','#148a08','#a56752',
    '#4d0264','#509bf5','#8c1932','#777777','#608108','#537aa1','#503750','#7d4b32','#056952'
  ];
  function genreColor(i){ return genreColors[i % genreColors.length]; }
  function genreClick(g) { q = g.Name; doSearch(); }
  function playSongs() { if (results.songs.length) actions.playNow(results.songs, 0, { contextTitle: 'Search results' }); }

  const hasAny = $derived(results.songs.length + results.albums.length + results.artists.length + results.playlists.length);
</script>

<div class="search fade-in">
  <div class="searchbar">
    <Icon name="search" size={20}/>
    <input bind:value={q} oninput={onInput} placeholder="What do you want to listen to?" spellcheck="false" autocomplete="off"/>
    {#if q}<button class="clear" onclick={()=>{q=''; results={songs:[],albums:[],artists:[],playlists:[]};}}><Icon name="x" size={18}/></button>{/if}
  </div>

  {#if q.trim()}
    <!-- results view -->
    <div class="filters">
      {#each [['all','All'],['songs','Songs'],['albums','Albums'],['artists','Artists'],['playlists','Playlists']] as [id,label]}
        <button class="chip" class:active={filter===id} onclick={()=>filter=id}>{label}</button>
      {/each}
    </div>
    {#if searching && !hasAny}
      <div class="empty">Searching…</div>
    {:else if !hasAny}
      <div class="empty">No results found for “{q}”</div>
    {/if}

    {#if filter==='all' || filter==='songs'}
      {#if results.songs.length}
        <div class="group">
          <div class="ghd"><h2>Songs</h2><button class="all-link" onclick={()=>filter='songs'}>See all</button></div>
          <TrackList tracks={results.songs} showHeader={false} activeId={player.state.current?.Id} isPlaying={player.state.playing}
                     onPlay={(i)=>actions.playNow(results.songs, i, { contextTitle:'Search results' })} />
        </div>
      {/if}
    {/if}
    {#if filter==='all' || filter==='albums'}
      {#if results.albums.length}
        <Section title="Albums" items={results.albums} type="album" onMore={()=>filter='albums'} />
      {/if}
    {/if}
    {#if filter==='all' || filter==='artists'}
      {#if results.artists.length}
        <Section title="Artists" items={results.artists} type="artist" round={true} onMore={()=>filter='artists'} />
      {/if}
    {/if}
    {#if filter==='all' || filter==='playlists'}
      {#if results.playlists.length}
        <Section title="Playlists" items={results.playlists} type="playlist" onMore={()=>filter='playlists'} />
      {/if}
    {/if}
  {:else}
    <!-- browse all -->
    <h2 class="browse-title">Browse all</h2>
    <div class="cat-grid">
      {#each [
        {name:'Albums', c:'#1e3264', act:()=>filter='albums'},
        {name:'Artists', c:'#b02897', act:()=>filter='artists'},
        {name:'Playlists', c:'#e13300', act:()=>filter='playlists'},
        {name:'Songs', c:'#d84000', act:()=>filter='songs'},
        {name:'Your Liked Songs', c:'#4962a3', act:()=>import('$app/navigation').then(m=>m.goto('/liked'))}
      ] as cat}
        <button class="cat" style="background:{cat.c}" onclick={cat.act}>
          <span class="cat-name">{cat.name}</span>
        </button>
      {/each}
      {#each genres as g, i}
        <button class="cat" style="background:{genreColor(i)}" onclick={()=>genreClick(g)}>
          <span class="cat-name">{g.Name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search { min-height:100%; padding: 8px 24px 48px; }
  .searchbar { display:flex; align-items:center; gap:10px; background:#fff; color:#000; border-radius: 50px; padding: 8px 16px; max-width: 620px; margin: 0 auto; }
  .searchbar input { flex:1; background:transparent; border:none; outline:none; font-size:16px; color:#000; }
  .searchbar .clear { color:#000; display:flex; }
  .filters { display:flex; gap:6px; margin: 20px 0 14px; flex-wrap:wrap; }
  .chip { background:#232323; font-size:13px; font-weight:500; padding:6px 14px; border-radius:50px; color:#fff; }
  .chip.active { background:var(--green); color:#000; font-weight:700; }
  .group { margin-top: 16px; }
  .ghd { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .ghd h2 { font-size:21px; font-weight:700; }
  .all-link { color:var(--text-secondary); font-size:12px; font-weight:600; }
  .all-link:hover { text-decoration:underline; color:#fff; }
  .empty { text-align:center; color:var(--text-secondary); padding: 40px 0; font-size:15px; }
  .browse-title { font-size:22px; font-weight:700; margin: 12px 0 16px; }
  .cat-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 16px; }
  .cat { position:relative; aspect-ratio: 1.4; border-radius:8px; overflow:hidden; text-align:left; box-shadow: inset 0 -40px 40px -20px rgba(0,0,0,0.4); transition: transform 0.15s; }
  .cat:hover { transform: scale(1.02); }
  .cat-name { position:absolute; left:10px; bottom:10px; font-size:15px; font-weight:700; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,0.4); }
</style>
