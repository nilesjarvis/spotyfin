<script>
  import { onMount } from 'svelte';
  import * as jf from '$lib/jellyfin.js';
  import * as player from '$lib/player.svelte.js';
  import * as actions from '$lib/actions.js';
  import Section from '$lib/components/Section.svelte';
  import { greeting } from '$lib/utils.js';
  import Icon from '$lib/components/Icon.svelte';

  let quick = $state([]);
  let recent = $state([]);
  let newAlbs = $state([]);
  let topArtists = $state([]);
  let favSongs = $state([]);
  let recommended = $state([]);
  let madeFor = $state([]);
  let loading = $state(true);

  async function load() {
    loading = true;
    recent = player.recent.slice(0, 10).map(r => ({
      Id: r.id, Name: r.name, ImageTags: r.imageTag ? { Primary: r.imageTag } : null,
      Artists: r.artist ? [r.artist] : [], AlbumId: r.albumId, _subtitle: r.artist
    }));
    try {
      const [newR, artistR, favR, madeR] = await Promise.all([
        jf.getItems({ IncludeItemTypes: 'MusicAlbum', Recursive: true, SortBy: 'DateCreated', SortOrder: 'Descending', Limit: 24 }),
        jf.getAlbumArtists({ SortBy: 'SortName', Limit: 20 }),
        jf.getFavoriteSongs({ Limit: 30 }),
        jf.getItems({ IncludeItemTypes: 'MusicAlbum', Recursive: true, SortBy: 'PlayCount', SortOrder: 'Descending', Limit: 24 })
      ]);
      newAlbs = newR.Items || [];
      topArtists = (artistR.Items || []).slice(0, 20);
      favSongs = favR.Items || [];
      madeFor = madeR.Items || [];
    } catch (e) { /* ignore */ }
    // recommended by genre of last played
    try {
      const last = player.recent[0];
      if (last) {
        const r = await jf.search(last.name || '', { Limit: 3, IncludeItemTypes: 'MusicAlbum' });
        recommended = (r.Items || []).slice(0, 3);
      }
    } catch (e) {}
    // quick picks: Liked songs + recent
    const q = [];
    if (player.recent.length) { q.push(player.recent.map(r => ({ Id: r.id, Name: r.name, ImageTags: r.imageTag?{Primary:r.imageTag}:null, _sub:'album' })).slice(0,6)); }
    buildQuick();
    loading = false;
  }

  function buildQuick() {
    const list = [];
    favSongs.length > 0 && list.push({ Id: 'liked', Name: 'Liked Songs', special: 'liked' });
    player.recent.map(r => ({ Id: 'r_'+r.id, _rid: r.id, Name: r.name, _recent: r })).forEach(r => list.push(r));
    const seen = new Set();
    const out = [];
    for (const it of list) { if (out.length >= 6) break; if (seen.has(it.Name)) continue; seen.add(it.Name); out.push(it); }
    quick = out;
  }

  function clickQuick(it) {
    if (it.special === 'liked') { import('$app/navigation').then(m=>m.goto('/liked')); return; }
    if (it._recent) { import('$app/navigation').then(m=>m.goto(`/album/${it._recent.albumId}`)); }
  }

  onMount(load);
</script>

<svelte:window on:resume={load} />

<div class="home fade-in" style="background:linear-gradient(180deg,#1a2b20 0%,#121212 34%)">
  <div class="inner">
    <h1 class="greeting">{greeting()}</h1>

    {#if quick.length}
      <div class="quick-grid">
        {#each quick as it}
          <div class="qcell" onclick={()=>clickQuick(it)}>
            <span class="qart">
              {#if it.special==='liked'}
                <Icon name="heart_fill" size={26}/>
              {:else if it.ImageTags?.Primary}
                <img src={jf.imageUrlRaw(it.Id, it.ImageTags.Primary, 96)} alt="" loading="lazy"/>
              {:else}
                <Icon name="disc" size={24}/>
              {/if}
            </span>
            <span class="qname">{it.Name}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if recent.length}
      <Section title="Recently played" items={recent} type="album"
               link={recent.length? '/collection/albums' : ''} />
    {/if}
    {#if madeFor.length}
      <Section title="Made for You" items={madeFor.map(a=>({...a, _subtitle: a.AlbumArtist || ''}))} type="album" />
    {/if}
    {#if favSongs.length}
      <Section title="Your Liked Songs" items={favSongs} type="song" subtitle="Liked songs" />
    {/if}
    {#if newAlbs.length}
      <Section title="Recently added" items={newAlbs.map(a=>({...a, _subtitle: a.AlbumArtist||''}))} type="album"
               link="/collection/albums" />
    {/if}
    {#if topArtists.length}
      <Section title="Your artists" items={topArtists} type="artist" subtitle="" round={true} />
    {/if}
    {#if recommended.length}
      <Section title="Recommended" items={recommended} type="album" />
    {/if}
    {#if loading}
      <div class="skeleton-block">Loading your music…</div>
    {/if}
  </div>
</div>



<style>
  .home { min-height: 100%; padding: 16px 24px 48px; }
  .inner { padding-top: 6px; }
  .greeting { font-size: 32px; font-weight: 700; letter-spacing:-0.5px; margin-bottom: 20px; }
  .quick-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 10px; margin-bottom: 8px; }
  .qcell { display:flex; align-items:center; gap:10px; background: rgba(255,255,255,0.08); border-radius:6px; overflow:hidden; cursor:pointer; transition: background 0.2s; }
  .qcell:hover { background: rgba(255,255,255,0.16); }
  .qart { width:56px; height:56px; background:#333; display:flex; align-items:center; justify-content:center; color:#b3b3b3; flex:0 0 auto; }
  .qart img{ width:100%; height:100%; object-fit:cover; }
  .qname { font-size:15px; font-weight:600; padding-right: 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .skeleton-block { color: var(--text-subdued); padding: 20px 0; }
</style>
