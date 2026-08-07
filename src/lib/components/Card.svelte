<script>
  import * as jf from '$lib/jellyfin.js';
  import { goto } from '$app/navigation';
  import Icon from './Icon.svelte';
  import GreenPlayButton from './GreenPlayButton.svelte';

  let { item, type = 'album', subtitle = '', round = false, wide = false } = $props();
  const name = $derived(item?.Name || '');
  const href = $derived(
    type === 'playlist' ? `/playlist/${item.Id}` :
    type === 'artist' ? `/artist/${item.Id}` : `/album/${item.Id}`
  );
  function nav() {
    if (type === 'song' && item.AlbumId) { goto(`/album/${item.AlbumId}`); return; }
    goto(href);
  }
  async function onPlay() {
    if (type === 'song') {
      const { playNow } = await import('$lib/actions.js');
      playNow([item], 0, { contextTitle: subtitle || item.Album || 'Song' });
      return;
    }
    const actions = await import('$lib/actions.js');
    if (type === 'playlist') actions.loadAndPlayPlaylist(item);
    else if (type === 'album') actions.loadAndPlayAlbum(item);
    else if (type === 'artist') goto(href);
  }
  function _playOrNav(e) {
    if (e.target.closest && e.target.closest('.playoverlay')) return;
    nav();
  }
  function handleCtx(e) {
    e.preventDefault();
    import('$lib/ui.svelte.js').then((ui) => {
      import('$lib/actions.js').then((actions) => {
        let items;
        if (type === 'album') items = actions.buildAlbumMenu(item);
        else if (type === 'playlist') items = actions.buildPlaylistMenu(item, { onPlay: () => onPlay() });
        else if (type === 'song') items = actions.buildTrackMenu(item);
        else items = [{ label: 'Open', icon: 'external', action: () => goto(href) }];
        ui.openMenu(e.clientX, e.clientY, items);
      });
    });
  }
</script>

{#if wide}
  <button class="card wide" onclick={nav} oncontextmenu={handleCtx}>
    <span class="artwrap" class:round>
      {#if item.ImageTags?.Primary}
        <img src={jf.imgUrl(item, {size:96})} alt="" loading="lazy"/>
      {:else}
        <span class="placeholder"><Icon name="disc" size={28}/></span>
      {/if}
    </span>
    <span class="wlabel">{name}</span>
  </button>
{:else}
  <div class="card" onclick={_playOrNav} oncontextmenu={handleCtx} role="button" tabindex="0"
       onkeydown={(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); _playOrNav(e); } }}>
    <div class="artwrap" class:round={round}>
      {#if item.ImageTags?.Primary}
        <img src={jf.imgUrl(item, {size:320})} alt="" loading="lazy"/>
      {:else}
        <span class="placeholder"><Icon name="disc" size={44}/></span>
      {/if}
      <span class="playoverlay"><GreenPlayButton size={48} onclick={onPlay}/></span>
    </div>
    <div class="ctitle" title={name}>{name}</div>
    {#if subtitle}<div class="csub">{subtitle}</div>{/if}
  </div>
{/if}

<style>
  .card { background: var(--bg-elevated); border-radius: 8px; padding: 16px; cursor: pointer; transition: background 0.2s; position: relative; }
  .card:hover { background: var(--bg-highlight); }
  .artwrap { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background:#333; }
  .artwrap.round { border-radius: 50%; }
  .artwrap img { width:100%; height:100%; object-fit: cover; display: block; }
  .placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#b3b3b3; }
  .playoverlay { position:absolute; right: 10px; bottom: 10px; opacity:0; transform: translateY(8px); transition: opacity 0.25s, transform 0.25s; pointer-events:none; }
  .card:hover .playoverlay { opacity:1; transform: translateY(0); pointer-events:auto; }
  .ctitle { margin-top: 12px; font-size: 15px; font-weight: 600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .csub { margin-top: 2px; font-size: 13px; color: var(--text-secondary); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .card.wide { display:flex; align-items:center; gap:14px; padding: 8px 8px; border-radius:6px; background: rgba(255,255,255,0.16); overflow:hidden; }
  .card.wide:hover { background: rgba(255,255,255,0.24); }
  .card.wide .artwrap { width:56px; height:56px; aspect-ratio:auto; flex:0 0 auto; }
  .wlabel { font-size: 15px; font-weight: 600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
</style>
