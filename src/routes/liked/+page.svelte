<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as jf from '$lib/jellyfin.js';
  import * as player from '$lib/player.svelte.js';
  import * as actions from '$lib/actions.js';
  import * as ui from '$lib/ui.svelte.js';
  import TrackList from '$lib/components/TrackList.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import GreenPlayButton from '$lib/components/GreenPlayButton.svelte';
  import { plural } from '$lib/utils.js';

  let tracks = $state([]);
  let loading = $state(true);
  let limit = $state(100);

  async function load() {
    loading = true;
    const r = await jf.getFavoriteSongs({ Limit: limit, SortBy: 'DateCreated', SortOrder: 'Descending' });
    tracks = r.Items || [];
    loading = false;
  }
  onMount(load);

  function onPlay(i){ actions.playNow(tracks, i, { contextTitle: 'Liked Songs', contextType: 'music' }); }
  async function shuffleAll(){ if(tracks.length) actions.playNow(tracks, Math.floor(Math.random()*tracks.length), { contextTitle:'Liked Songs' }); }
  function onAfterFav(track, fav){
    if (!fav) { const i = tracks.findIndex(t=>t.Id===track.Id); if(i>=0) tracks.splice(i,1); }
  }
  const totalSec = $derived(tracks.reduce((a,t)=>a+(t.RunTimeTicks?t.RunTimeTicks/1e7:0),0));
</script>

<div class="like-page fade-in" style="background:linear-gradient(180deg, rgba(73,98,163,0.9) 0%, #121212 34%)">
  <div class="hero-inner">
    <div class="hero-art">
      <span class="heartbig"><Icon name="heart_fill" size={54}/></span>
    </div>
    <div class="hero-meta">
      <div class="type-label">Playlist</div>
      <h1 class="title">Liked Songs</h1>
      <div class="by-line">{tracks.length} {plural(tracks.length,'song','songs')}{tracks.length? ', '+Math.floor(totalSec/60)+' min' : ''}</div>
      <div class="actions">
        {#if tracks.length}
          <GreenPlayButton size={56} onclick={()=>onPlay(0)}/>
          <button class="big-btn" onclick={shuffleAll}>Shuffle</button>
        {/if}
      </div>
    </div>
  </div>

  <div class="body">
    {#if loading && !tracks.length}
      <div class="load">Loading…</div>
    {:else if !tracks.length}
      <div class="empty">
        <p>No liked songs yet.</p>
        <p class="sub">Tap the heart on any song to save it here.</p>
      </div>
    {:else}
      <TrackList tracks={tracks} showAlbum={true} showHeader={true} activeId={player.state.current?.Id} isPlaying={player.state.playing}
                 onPlay={onPlay} onAfterFav={onAfterFav} />
    {/if}
  </div>
</div>

<style>
  .like-page { min-height:100%; padding-bottom:48px; }
  .hero-inner { display:flex; gap:24px; align-items:flex-end; padding: 32px 28px; }
  .hero-art { width:192px; height:192px; flex:0 0 auto; border-radius:6px; overflow:hidden; background:linear-gradient(135deg, #5375ba, #4962a3); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 8px 40px rgba(0,0,0,0.5); }
  .hero-meta { min-width:0; padding-bottom:6px; }
  .type-label{ font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .title { font-size: clamp(32px,5vw,56px); font-weight:700; margin:8px 0; letter-spacing:-0.8px; }
  .by-line{ color:#e4e4e4; font-size:14px; }
  .actions { display:flex; gap:20px; margin-top:22px; }
  .big-btn{ background:transparent; border:1px solid #ccc; color:#fff; font-weight:700; padding:10px 24px; border-radius:50px; font-size:12px; letter-spacing:1px; }
  .big-btn:hover{ transform:scale(1.03); }
  .body { padding: 12px 28px 0; }
  .empty{ padding:40px 0; text-align:center; } .empty p{ font-size:18px; } .empty .sub{ color:var(--text-secondary); font-size:14px; margin-top:6px; }
  .load{ padding:40px; color:var(--text-secondary); }
  @media (max-width:760px){ .hero-inner{flex-direction:column; align-items:flex-start;} .hero-art{width:150px;height:150px;}.heartbig svg{width:44px;height:44px;} }
</style>
