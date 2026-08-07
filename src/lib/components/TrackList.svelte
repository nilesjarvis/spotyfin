<script>
  import * as jf from '$lib/jellyfin.js';
  import * as ui from '$lib/ui.svelte.js';
  import * as actions from '$lib/actions.js';
  import Icon from './Icon.svelte';
  import { fmtDurationMs, artistStr } from '$lib/utils.js';

  let { tracks = [], showAlbum = false, showHeader = true, activeId = '', isPlaying = false,
        onPlay = null, onRemove = null, onAfterFav = null } = $props();
  let hoverIdx = $state(-1);

  async function toggleFav(track) {
    const nv = !track.UserData?.IsFavorite;
    await jf.setFavorite(track.Id, nv);
    if (track.UserData) track.UserData.IsFavorite = nv;
    if (onAfterFav) onAfterFav(track, nv);
  }
  function rowMenu(e, track, i) {
    e.preventDefault();
    const items = actions.buildTrackMenu(track, { onRemoveFromPlaylist: onRemove ? () => onRemove(track, i) : null });
    ui.openMenu(e.clientX, e.clientY, items);
  }
</script>

<div class="tracklist">
  {#if showHeader}
    <div class="trow thead">
      <span class="c-num">#</span>
      <span class="c-title">Title</span>
      {#if showAlbum}<span class="c-album">Album</span>{/if}
      <span class="c-spacer"></span>
      <span class="c-dur"><Icon name="clock" size={16}/></span>
      <span class="c-more"></span>
    </div>
  {/if}
  {#each tracks as track, i}
    {@const isCur = track.Id === activeId}
    {@const art = track.ImageTags?.Primary}
    <div class="trow" class:active={isCur} class:hovered={hoverIdx===i}
         onmouseenter={()=>hoverIdx=i} onmouseleave={()=>hoverIdx=-1}
         ondblclick={()=> onPlay && onPlay(i)}
         onclick={()=> onPlay && onPlay(i)}
         oncontextmenu={(e)=>rowMenu(e, track, i)}>
      <span class="c-num">
        {#if hoverIdx===i}
          <button class="rowplay" onclick={(e)=>{e.stopPropagation(); onPlay && onPlay(i);}}><Icon name="play" size={15} style="fill:#000"/></button>
        {:else if isCur && isPlaying}
          <span class="eq"><i></i><i></i><i></i><i></i></span>
        {:else if isCur}
          <Icon name="volume_muted" size={12}/>
        {:else}
          {i+1}
        {/if}
      </span>
      <span class="c-title">
        {#if art}
          <span class="tart"><img src={jf.imgUrl(track,{size:96})} alt=""/></span>
        {/if}
        <span class="tt-wrap">
          <span class="tt">{track.Name}</span>
          <span class="ta" class:green={isCur}>{artistStr(track)}</span>
        </span>
      </span>
      {#if showAlbum}
        <span class="c-album">
          {#if track.AlbumId}
            <a class="album-link" href="/album/{track.AlbumId}" onclick={(e)=>{ e.stopPropagation(); }}>{track.Album || ''}</a>
          {:else}{track.Album || ''}{/if}
        </span>
      {/if}
      <span class="c-spacer"></span>
      <span class="c-dur">{fmtDurationMs(track.RunTimeTicks ? track.RunTimeTicks/1e4 : 0)}</span>
      <span class="c-more">
        <button class="heart" class:on={track.UserData?.IsFavorite} onclick={(e)=>{e.stopPropagation(); toggleFav(track);}} title="Like">
          <Icon name={track.UserData?.IsFavorite ? 'heart_fill':'heart'} size={16}/>
        </button>
        <button class="more" onclick={(e)=>{e.stopPropagation(); rowMenu(e, track, i);}} title="More options">
          <Icon name="ellipsis" size={16}/>
        </button>
      </span>
    </div>
  {/each}
</div>


<style>
  .tracklist { display:flex; flex-direction:column; min-width:0; }
  .thead { color:var(--text-subdued); border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom: 8px; padding: 0 10px 8px; font-size:13px; }
  .trow { display:flex; align-items:center; padding: 6px 10px; border-radius: 6px; gap: 8px; }
  .c-num { width: 40px; flex:0 0 auto; }
  .c-title { flex: 1 1 0; }
  .c-album { flex: 1.4 1 0; min-width: 90px; }
  .c-dur { width: 70px; flex: 0 0 auto; }
  .c-spacer { flex: 0 0 12px; }
  .c-more { width: 84px; flex: 0 0 auto; }
  .trow:not(.thead):hover { background: rgba(255,255,255,0.06); }
  .trow.nointeract { cursor: default; }
  .c-num { text-align:center; color:var(--text-subdued); font-size:14px; display:flex; align-items:center; justify-content:center; }
  .rowplay { width:24px; height:24px; border-radius:50%; background:var(--green); display:flex; align-items:center; justify-content:center; }
  .c-title { display:flex; align-items:center; gap:12px; min-width:0; }
  .tart { width:40px; height:40px; border-radius:4px; overflow:hidden; flex:0 0 auto; background:#333; }
  .tart img { width:100%; height:100%; object-fit:cover; }
  .tt-wrap { min-width:0; display:flex; flex-direction:column; }
  .tt { font-size:14px; font-weight:500; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ta { font-size:13px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ta.green { color:var(--green); }
  .c-album { color:var(--text-secondary); font-size:14px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .album-link:hover { color:#fff; text-decoration:underline; }
  .c-dur { color:var(--text-subdued); font-size:13px; text-align:right; font-variant-numeric: tabular-nums; }
  .c-spacer { min-width: 16px; }
  .c-more { display:flex; align-items:center; gap:16px; justify-content:flex-end; }
  .heart, .more { color:var(--text-subdued); display:flex; opacity:0; }
  .trow.hovered .heart, .trow.hovered .more, .trow:not(.thead):hover .heart, .trow:not(.thead):hover .more { opacity:1; }
  .heart:hover { color:#fff; }
  .heart.on { color:var(--green); opacity:1; }
  .more:hover { color:#fff; }
  .eq { display:inline-flex; align-items:flex-end; gap:2px; height:14px; }
  .eq i { width:3px; background:var(--green); animation: eq 1s ease-in-out infinite; }
  .eq i:nth-child(1){ height:6px; } .eq i:nth-child(2){ height:13px; animation-delay:0.2s;} .eq i:nth-child(3){ height:9px; animation-delay:0.4s;} .eq i:nth-child(4){ height:12px; animation-delay:0.1s;}
  @keyframes eq { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
</style>
