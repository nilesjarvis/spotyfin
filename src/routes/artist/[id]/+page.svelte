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
  import BlurredHero from '$lib/components/BlurredHero.svelte';
  import GreenPlayButton from '$lib/components/GreenPlayButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { plural } from '$lib/utils.js';

  let item = $state(null);
  let popular = $state([]);
  let albums = $state([]);
  let singles = $state([]);
  let similar = $state([]);
  let loading = $state(true);
  let fav = $state(false);

  const id = $derived(page.params.id);

  $effect(() => { const i = id; if (i) load(); });
  async function load() {
    loading = true; item = null;
    try {
      item = await jf.getItem(id);
      fav = !!(item.UserData && item.UserData.IsFavorite);
      const [pop, albs] = await Promise.all([
        jf.getItems({ ArtistIds: id, IncludeItemTypes: 'Audio', Recursive: true, SortBy: 'PlayCount', SortOrder: 'Descending', Limit: 5 }),
        jf.getItems({ AlbumArtistIds: id, IncludeItemTypes: 'MusicAlbum', Recursive: true, SortBy: 'SortName', Limit: 100 })
      ]);
      popular = pop.Items || []; albums = albs.Items || [];
      // similar artists by shared first genre
      if (item.Genres && item.Genres.length) {
        const gid = (await jf.getGenres({ Limit: 10 })).Items?.find(g => item.Genres.includes(g.Name))?.Id;
        if (gid) {
          const rec = (await jf.getItems({ GenreIds: gid, IncludeItemTypes: 'MusicAlbum', Recursive: true, Limit: 30 })).Items || [];
          const seen = new Set([id]);
          const out = [];
          for (const a of rec) {
            for (const ar of (a.AlbumArtists || [])) {
              if (!seen.has(ar.Id) && ar.Id) { seen.add(ar.Id); out.push({ Id: ar.Id, Name: ar.Name, ImageTags: {} }); }
            }
          }
          similar = out.slice(0, 12);
        }
      }
    } catch (e) { /* ignore */ }
    loading = false;
  }

  function playPopular() { if (popular.length) actions.playNow(popular, 0, { contextTitle: item.Name, contextType: 'artist' }); }
  async function shuffleAll() {
    const more = (await jf.getItems({ ArtistIds: id, IncludeItemTypes: 'Audio', Recursive: true, Limit: 50 })).Items || [];
    if (more.length) actions.playNow(more, Math.floor(Math.random()*more.length), { contextTitle: item.Name, contextType: 'artist' });
  }
  async function toggleFav() { await jf.setFavorite(item.Id, !fav); fav = !fav; ui.toast(fav?'Saved to your library':'Removed from your library','success'); }
  function openMore(ev) {
    ui.openMenu(ev.clientX, ev.clientY, [
      { label: 'Play', icon: 'play', action: playPopular },
      { label: 'Add to queue', icon: 'queue', action: async()=>{ const tr=(await jf.getItems({ArtistIds:id,IncludeItemTypes:'Audio',Recursive:true,Limit:50})).Items||[]; await actions.addToQueue(tr); } },
      { label: fav ? 'Stop following' : 'Follow', icon: fav?'heart':'heart_fill', action: toggleFav }
    ]);
  }
</script>

{#if loading || !item}
  <div class="loading">Loading artist…</div>
{:else}
<div class="artist-page fade-in">
  <BlurredHero bg={jf.backImgUrl(item)}>
    <div class="hero-inner">
      <div class="hero-art circle">
        {#if item.ImageTags?.Primary}
          <img src={jf.imgUrl(item, {size:320})} alt=""/>
        {:else}
          <span class="artph"><Icon name="user" size={56}/></span>
        {/if}
      </div>
      <div class="hero-meta">
        <div class="type-label">Artist</div>
        <h1 class="title">{item.Name}</h1>
        <div class="follower-line">{albums.length} {plural(albums.length,'album','albums')}{item.Overview ? ' • '+item.Overview.replace(/\s+/g,' ').slice(0,80) : ''}</div>
        <div class="actions">
          <GreenPlayButton size={56} onclick={playPopular}/>
          <button class="big-btn" onclick={shuffleAll}>Shuffle</button>
          <button class="round-act" class:on={fav} onclick={toggleFav}><Icon name={fav?'heart_fill':'heart'} size={28}/></button>
          <button class="round-act" onclick={(e)=>openMore(e)}><Icon name="ellipsis" size={28}/></button>
        </div>
      </div>
    </div>
  </BlurredHero>

  <div class="body">
    {#if popular.length}
      <section>
        <h2 class="sec-h">Popular</h2>
        <TrackList tracks={popular} showAlbum={false} showHeader={false} activeId={player.state.current?.Id} isPlaying={player.state.playing}
                   onPlay={(i)=>actions.playNow(popular, i, { contextTitle:item.Name, contextType:'artist' })} />
      </section>
    {/if}
    {#if albums.length}
      <Section title="Albums" items={albums} type="album" />
    {/if}
    {#if similar.length}
      <Section title="Fans also like" items={similar} type="artist" round={true} />
    {/if}
  </div>
</div>
{/if}

<style>
  .loading { padding:40px; color:var(--text-secondary); }
  .artist-page { min-height:100%; padding-bottom:48px; }
  .hero-inner { display:flex; gap:24px; align-items:flex-end; }
  .hero-art { width:192px; height:192px; flex:0 0 auto; overflow:hidden; background:#282828; }
  .hero-art.circle { border-radius:50%; box-shadow: 0 8px 40px rgba(0,0,0,0.6); }
  .hero-art img { width:100%; height:100%; object-fit:cover; }
  .artph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#b3b3b3; }
  .hero-meta { min-width:0; padding-bottom:6px; }
  .type-label { font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#fff; }
  .title { font-size: clamp(32px, 6vw, 60px); font-weight:700; line-height:1.05; margin:10px 0; letter-spacing:-0.8px; overflow-wrap:anywhere; }
  .follower-line { color:#fff; font-size:14px; }
  .actions { display:flex; align-items:center; gap:18px; margin-top:22px; }
  .big-btn { background:transparent; border:1px solid #727272; color:#fff; font-weight:700; padding:10px 24px; border-radius:50px; letter-spacing:1px; font-size:12px; }
  .big-btn:hover { border-color:#fff; transform: scale(1.03); }
  .round-act { display:flex; color:var(--text-secondary); padding:6px; }
  .round-act:hover { color:#fff; }
  .round-act.on { color:var(--green); }
  .body { padding: 24px 28px 0; }
  .sec-h { font-size:21px; font-weight:700; margin: 8px 0 14px; }
  @media (max-width:760px){ .hero-inner{ flex-direction:column; align-items:flex-start;} .hero-art{ width:150px;height:150px;} }
</style>
