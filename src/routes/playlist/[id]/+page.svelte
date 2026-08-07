<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as jf from '$lib/jellyfin.js';
  import * as player from '$lib/player.svelte.js';
  import * as actions from '$lib/actions.js';
  import * as ui from '$lib/ui.svelte.js';
  import TrackList from '$lib/components/TrackList.svelte';
  import Section from '$lib/components/Section.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import GreenPlayButton from '$lib/components/GreenPlayButton.svelte';
  import { plural } from '$lib/utils.js';

  let item = $state(null);
  let tracks = $state([]);
  let loading = $state(true);
  let fav = $state(false);

  const id = $derived(page.params.id);
  $effect(() => { const i = id; if (i) load(); });

  async function load() {
    loading = true; item = null;
    try {
      item = await jf.getItem(id);
      fav = !!(item.UserData && item.UserData.IsFavorite);
      const ch = await jf.getChildren(id, 'Audio');
      tracks = ch.Items || [];
    } catch (e) { /* ignore */ }
    loading = false;
  }

  function onPlay(i) { actions.playNow(tracks, i, { contextTitle: item.Name, contextType: 'playlist' }); }
  async function shuffleAll() { if (tracks.length) actions.playNow(tracks, Math.floor(Math.random()*tracks.length), { contextTitle:item.Name, contextType:'playlist' }); }
  async function toggleFav() { await jf.setFavorite(item.Id, !fav); fav = !fav; ui.toast(fav?'Saved to your library':'Removed from your library','success'); }
  async function removeTrack(track, i) {
    const entry = track;
    try {
      await jf.removeFromPlaylist(item.Id, [entry.Id]);
      tracks.splice(i, 1);
      ui.toast('Removed from playlist','success');
    } catch(e){ ui.toast(e.message,'error'); }
  }
  function openMore(ev) {
    ui.openMenu(ev.clientX, ev.clientY, [
      { label:'Edit details', icon:'pen', action: ()=> ui.openTextModal({ title:'Edit playlist details', initial: item.Name, submitLabel:'Save',
          onSubmit: async (name)=>{ await jf.renameItem(item.Id, name); item.Name = name; ui.toast('Saved','success'); } }) },
      { label:'Delete playlist', icon:'trash', danger:true, action: async ()=>{ await jf.deletePlaylist(item.Id); goto('/'); } }
    ]);
  }
  const totalSec = $derived(tracks.reduce((a,t)=>a+(t.RunTimeTicks?t.RunTimeTicks/1e7:0),0));
  const heroBg = $derived( item && item.ImageTags && item.ImageTags.Primary
    ? 'linear-gradient(180deg, rgba(40,60,110,0.75) 0%, #181818 80%)'
    : 'linear-gradient(180deg, #3a2d5a 0%, #181818 80%)');
</script>

{#if loading || !item}
  <div class="loading">Loading playlist…</div>
{:else}
<div class="pl-page fade-in">
  <div class="hero" style="background:{heroBg}; padding:28px 28px 16px;">
    <div class="hero-inner">
      <div class="hero-art">
        {#if item.ImageTags?.Primary}
          <img src={jf.imgUrl(item,{size:320})} alt=""/>
        {:else}
          <span class="artph"><Icon name="disc" size={48}/></span>
        {/if}
      </div>
      <div class="hero-meta">
        <div class="type-label">Public Playlist</div>
        <h1 class="title">{item.Name}</h1>
        <div class="by-line">{item.Owner || 'Spotify'} • {tracks.length} {plural(tracks.length,'song','songs')}{tracks.length ? ', '+Math.floor(totalSec/60)+' min' : ''}</div>
        <div class="actions">
          <GreenPlayButton size={56} onclick={()=>onPlay(0)}/>
          <button class="big-btn" onclick={shuffleAll}>Shuffle</button>
          <button class="round-act" class:on={fav} onclick={toggleFav}><Icon name={fav?'heart_fill':'heart'} size={28}/></button>
          <button class="round-act" onclick={(e)=>openMore(e)}><Icon name="ellipsis" size={28}/></button>
        </div>
      </div>
    </div>
  </div>

  <div class="body">
    {#if tracks.length}
      <TrackList tracks={tracks} showAlbum={true} showHeader={true} activeId={player.state.current?.Id} isPlaying={player.state.playing}
                 onPlay={onPlay} onRemove={removeTrack} />
    {:else}
      <div class="empty">
        <p>This playlist is empty.</p>
        <button class="add-btn" onclick={()=>ui.openSavePlaylist([], item)}>Add songs</button>
      </div>
    {/if}
  </div>
</div>
{/if}


<style>
  .loading { padding:40px; color:var(--text-secondary); }
  .pl-page { min-height:100%; padding-bottom:48px; }
  .hero { display:flex; align-items:flex-end; min-height:200px; }
  .hero-inner { display:flex; gap:24px; align-items:flex-end; width:100%; }
  .hero-art { width:190px; height:190px; border-radius:6px; overflow:hidden; flex:0 0 auto; box-shadow:0 8px 40px rgba(0,0,0,0.6); background:#282828; }
  .hero-art img { width:100%; height:100%; object-fit:cover; }
  .artph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#b3b3b3; }
  .hero-meta { min-width:0; padding-bottom:6px; }
  .type-label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .title { font-size: clamp(28px,4.5vw,52px); font-weight:700; margin:8px 0; letter-spacing:-0.6px; overflow-wrap:anywhere; }
  .by-line { color:var(--text-secondary); font-size:14px; }
  .actions { display:flex; align-items:center; gap:20px; margin-top:22px; }
  .big-btn { background:transparent; border:1px solid #727272; color:#fff; font-weight:700; padding:10px 24px; border-radius:50px; font-size:12px; letter-spacing:1px; }
  .big-btn:hover { border-color:#fff; transform:scale(1.03); }
  .round-act { display:flex; color:var(--text-secondary); padding:6px; }
  .round-act:hover{ color:#fff; }
  .round-act.on{ color:var(--green); }
  .body { padding: 24px 28px 0; }
  .empty { color:var(--text-secondary); padding: 30px; text-align:center; }
  .add-btn { margin-top:16px; background:var(--green); color:#000; font-weight:700; padding:10px 24px; border-radius:50px; }
  @media (max-width:760px){ .hero-inner{ flex-direction:column; align-items:flex-start;} .hero-art{width:150px;height:150px;} }
</style>
