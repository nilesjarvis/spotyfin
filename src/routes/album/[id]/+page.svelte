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
  import { fmtDurationMs, plural, artistList } from '$lib/utils.js';

  let item = $state(null);
  let tracks = $state([]);
  let loading = $state(true);
  let more = $state([]);
  let likeIt = $state([]);
  let fav = $state(false);

  const id = $derived(page.params.id);

  async function load() {
    loading = true;
    item = null; tracks = [];
    try {
      item = await jf.getItem(id);
      const ch = await jf.getChildren(id, 'Audio');
      tracks = ch.Items || [];
      fav = !!(item.UserData && item.UserData.IsFavorite);
      const artistId = (item.AlbumArtists && item.AlbumArtists[0]?.Id) || (item.ArtistItems && item.ArtistItems[0]?.Id);
      if (artistId) {
        more = (await jf.getItems({ AlbumArtistIds: artistId, IncludeItemTypes: 'MusicAlbum', Recursive: true, ExcludeItemIds: id, Limit: 10, SortBy: 'SortName' })).Items || [];
      }
      if (item.Genres && item.Genres.length) {
        const gid = (await jf.getGenres({ Limit: 6 })).Items?.find(g => item.Genres.includes(g.Name))?.Id;
        if (gid) {
          likeIt = (await jf.getItems({ GenreIds: gid, IncludeItemTypes: 'MusicAlbum', Recursive: true, ExcludeItemIds: id, Limit: 10 })).Items || [];
        }
      }
    } catch (e) { /* ignore */ }
    loading = false;
  }
  onMount(load);
  $effect(() => { const i = id; if (i) load(); });

  const year = $derived(item?.ProductionYear || (item && item.PremiereDate && item.PremiereDate.slice(0,4)));
  const totalSec = $derived(tracks.reduce((a,t)=> a + (t.RunTimeTicks ? t.RunTimeTicks/1e7 : 0), 0));
  const totalMin = $derived(Math.floor(totalSec/60));
  const totalRemSec = $derived(Math.round(totalSec % 60));

  function onPlay(i) {
    actions.playNow(tracks, i, { contextTitle: item.Name, contextType: 'album' });
  }
  async function toggleFavAlbum() {
    await jf.setFavorite(item.Id, !fav);
    fav = !fav;
    ui.toast(fav ? 'Saved to your library' : 'Removed from your library', 'success');
  }
  function openMore(ev) {
    ui.openMenu(ev.clientX, ev.clientY, [
      { label: 'Play', icon: 'play', action: onPlay.bind(null, 0) },
      { label: 'Add to playlist', icon: 'plus', action: () => ui.openSavePlaylist([item.Id], item) },
      { label: fav ? 'Remove from Liked Songs' : 'Save to Liked Songs', icon: fav?'heart':'heart_fill', action: toggleFavAlbum }
    ]);
  }
</script>

{#if loading || !item}
  <div class="loading">Loading album…</div>
{:else}
<div class="album-page fade-in">
  <BlurredHero bg={jf.backImgUrl(item)}>
    <div class="hero-inner">
      <div class="hero-art">
        {#if item.ImageTags?.Primary}
          <img src={jf.imgUrl(item, {size:320})} alt=""/>
        {:else}
          <span class="artph"><Icon name="disc" size={48}/></span>
        {/if}
      </div>
      <div class="hero-meta">
        <div class="type-label">Album</div>
        <h1 class="title">{item.Name}</h1>
        {#if artistList(item).length}
          <div class="byline">
            {#each artistList(item) as a, i}
              {#if item.AlbumArtists?.[i]}
                <a href="/artist/{item.AlbumArtists[i].Id}" onclick={(e)=>{e.preventDefault(); goto(`/artist/${item.AlbumArtists[i].Id}`);}} class="artist-link">{a}</a>
              {:else}<span>{a}</span>{/if}
              {i < artistList(item).length - 1 ? ', ' : ''}
            {/each}
          </div>
        {/if}
        <div class="meta-line">
          {#if year}<span>{year}</span>{/if}
          {#if tracks.length}<span>{tracks.length} songs{year ? ',' : ''} {totalMin} min {totalRemSec} sec</span>{/if}
        </div>
        <div class="actions">
          <GreenPlayButton size={56} onclick={()=>onPlay(0)}/>
          <button class="round-act" class:on={fav} onclick={toggleFavAlbum} title="Save to your library">
            <Icon name={fav ? 'heart_fill':'heart'} size={28}/>
          </button>
          <button class="round-act" onclick={(e)=>openMore(e)} title="More options"><Icon name="ellipsis" size={28}/></button>
        </div>
      </div>
    </div>
  </BlurredHero>

  <div class="body">
    {#if tracks.length}
      <TrackList tracks={tracks} showAlbum={false} showHeader={true}
                 activeId={player.state.current?.Id} isPlaying={player.state.playing} onPlay={onPlay} />
    {/if}

    {#if more.length}
      <Section title={'More by ' + artistList(item)[0]} items={more} type="album" link="/search" />
    {/if}
    {#if likeIt.length}
      <Section title="You might also like" items={likeIt} type="album" />
    {/if}
  </div>
</div>
{/if}

<style>
  .loading { padding: 40px; color: var(--text-secondary); }
  .album-page { min-height: 100%; padding-bottom: 48px; }
  .hero-inner { display:flex; gap: 24px; align-items:flex-end; }
  .hero-art { width: 210px; height: 210px; border-radius: 6px; overflow:hidden; flex:0 0 auto; box-shadow: 0 8px 40px rgba(0,0,0,0.6); background:#282828; }
  .hero-art img { width:100%; height:100%; object-fit:cover; }
  .artph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#b3b3b3; }
  .hero-meta { min-width:0; padding-bottom: 6px; }
  .type-label { font-size: 12px; font-weight:600; letter-spacing:0.5px; text-transform: uppercase; }
  .title { font-size: clamp(30px, 5vw, 56px); font-weight: 700; line-height:1.1; margin: 8px 0; letter-spacing:-0.6px; overflow-wrap:anywhere; }
  .byline { font-size: 14px; color:#fff; }
  .artist-link:hover { text-decoration: underline; }
  .meta-line { color: var(--text-secondary); font-size: 13px; margin-top: 6px; }
  .actions { display:flex; align-items:center; gap: 18px; margin-top: 20px; }
  .round-act { display:flex; color:var(--text-secondary); padding:6px; }
  .round-act:hover { color:#fff; transform: scale(1.05); }
  .round-act.on { color: var(--green); }
  .body { padding: 24px 28px 0; }
  @media (max-width: 760px) {
    .hero-inner { flex-direction: column; align-items:flex-start; }
    .hero-art { width: 160px; height:160px; }
  }
</style>
