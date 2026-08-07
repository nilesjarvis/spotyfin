<script>
  import * as player from '$lib/player.svelte.js';
  import * as jf from '$lib/jellyfin.js';
  import * as actions from '$lib/actions.js';
  import * as ui from '$lib/ui.svelte.js';
  import { goto } from '$app/navigation';
  import Icon from './Icon.svelte';
  import Slider from './Slider.svelte';
  import { fmtDurationMs, artistStr } from '$lib/utils.js';

  let tab = $state('queue');
  let fav = $state(false);

  $effect(() => { const id = player.state.current?.Id; if (!id) { fav=false; return; } jf.isFavorite(id).then(v=>fav=!!v).catch(()=>{}); });
  async function toggleFav(){ if(!player.state.current) return; await jf.setFavorite(player.state.current.Id, !fav); fav=!fav; }
  function onPlay(i){ player.playTrackAt(i); }
  const ratio = $derived(player.state.duration ? player.state.time / player.state.duration : 0);
  const art = $derived(player.state.current ? (jf.imgUrl(player.state.current, {size:480}) || null) : null);
  const bg = $derived(player.state.current ? (jf.backImgUrl(player.state.current)) : null);

  function openItemMenu(e, track, i) {
    e.stopPropagation();
    ui.openMenu(e.clientX, e.clientY, actions.buildTrackMenu(track, {}));
  }
</script>

<div class="np fade-in">
  {#if bg}<div class="np-bg" style="background-image:url({bg})"></div>{/if}
  <div class="np-scrim"></div>

  <div class="np-top">
    <button class="np-close" onclick={()=>player.state.expanded=false}><Icon name="chevron_down" size={24}/></button>
    <div class="np-nowlabel">Now playing</div>
    <div class="np-topright">
      <button title="Queue" class="on" onclick={()=>{player.state.expanded=false; player.state.queueVisible=true;}}><Icon name="queue" size={20}/></button>
    </div>
  </div>

  {#if player.state.current}
  <div class="np-body">
    <div class="np-main">
      <div class="np-art" style="box-shadow: 0 24px 60px rgba(0,0,0,0.7);">
        {#if art}
          <img src={art} alt=""/>
        {:else}
          <span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#282828;"><Icon name="disc" size={80}/></span>
        {/if}
      </div>
      <div class="np-title">{player.state.current.Name}</div>
      <div class="np-artist">
        <a href="/album/{player.state.current.AlbumId||''}" onclick={(e)=>{e.preventDefault(); player.state.expanded=false; goto(`/album/${player.state.current.AlbumId||''}`);}}>{player.state.current.Album || ''}</a>
        <span> • </span>
        <span>{artistStr(player.state.current)}</span>
      </div>
      {#if player.state.current.Genres && player.state.current.Genres.length}
        <div class="np-genre">{player.state.current.Genres.slice(0,3).join(', ')}</div>
      {/if}
      <button class="heart" class:on={fav} onclick={toggleFav}><Icon name={fav?'heart_fill':'heart'} size={24}/></button>
    </div>

    <div class="np-side">
      <div class="np-tabs">
        <button class="nptab" class:active={tab==='queue'} onclick={()=>tab='queue'}>Queue</button>
        <button class="nptab" class:active={tab==='now'} onclick={()=>tab='now'}>Now playing</button>
        <button class="nptab" class:active={tab==='lyrics'} onclick={()=>tab='lyrics'}>Lyrics</button>
      </div>
      <div class="np-tabcontent">
        {#if tab==='queue'}
          <div class="queue-head">Up next</div>
          <div class="qlist">
            {#each player.state.queue as t, i}
              <button class="qrow" class:cur={i===player.state.currentIndex} onclick={()=>onPlay(i)}
                      oncontextmenu={(e)=>openItemMenu(e,t,i)}>
                <span class="qnum">{i+1}</span>
                <span class="qart">
                  {#if t.ImageTags?.Primary}<img src={jf.imgUrl(t,{size:60})} alt=""/>{:else}<Icon name="disc" size={16}/>{/if}
                </span>
                <span class="qmeta">
                  <span class="qname" class:cur={i===player.state.currentIndex}>{t.Name}</span>
                  <span class="qartist">{artistStr(t)}</span>
                </span>
                <span class="qdur">{fmtDurationMs(t.RunTimeTicks ? t.RunTimeTicks/1e4 : 0)}</span>
              </button>
            {/each}
          </div>
        {:else if tab==='now'}
          <div class="queue-head">Currently playing</div>
          <div class="qrow cur">
            <span class="qart">
              {#if art}<img src={art} alt=""/>{:else}<Icon name="disc" size={16}/>{/if}
            </span>
            <span class="qmeta"><span class="qname cur">{player.state.current.Name}</span><span class="qartist">{artistStr(player.state.current)}</span></span>
          </div>
        {:else}
          <div class="lyrics">
            <p class="lyr-h">Lyrics</p>
            <p class="lyr-sub">Lyrics aren't available for this song from your Jellyfin server. Connect a lyrics provider in Jellyfin to see them here.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="np-bottom">
    <div class="np-progress">
      <span class="time">{fmtDurationMs(player.state.time*1000)}</span>
      <div class="pslider">
        <Slider value={ratio} onchange={(r)=>player.seekByRatio(r)} disabled={false} ariaLabel="Seek"/>
      </div>
      <span class="time">{fmtDurationMs(player.state.duration*1000)}</span>
    </div>
    <div class="np-controls">
      <button class:active={player.state.shuffle} onclick={player.toggleShuffle} title="Enable shuffle"><Icon name="shuffle" size={20}/></button>
      <button onclick={player.prev}><Icon name="skip_prev" size={26}/></button>
      <button class="npplay" onclick={player.togglePlay}><Icon name={player.state.playing?'pause':'play'} size={30} style="fill:#000"/></button>
      <button onclick={()=>player.next(false)}><Icon name="skip_next" size={26}/></button>
      <button class:active={player.state.repeat!=='off'} onclick={player.cycleRepeat} title="Repeat"><Icon name={player.state.repeat==='one'?'repeat_one':'repeat'} size={20}/></button>
    </div>
  </div>
  {:else}
    <div class="np-empty">Nothing playing</div>
  {/if}
</div>

<style>
  .np { position: fixed; inset:0; z-index:2000; background:#121212; display:flex; flex-direction:column; overflow:hidden; }
  .np-bg { position:absolute; inset:-60px; background-size:cover; background-position:center; filter: blur(80px) saturate(1.2); opacity:0.35; transform:scale(1.1); }
  .np-scrim { position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,0.4), rgba(18,18,18,0.6) 60%, #121212 100%); }
  .np-top { position:relative; display:flex; align-items:center; justify-content:space-between; padding: 18px 24px; z-index:3; }
  .np-close { color:#fff; display:flex; }
  .np-nowlabel { font-size:13px; font-weight:600; color:#b3b3b3; }
  .np-topright { display:flex; }
  .np-topright button { color:#b3b3b3; display:flex; padding:6px; } .np-topright button:hover{color:#fff;}
  .np-body { position:relative; flex:1; min-height:0; display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:40px; align-items:center; padding: 0 48px 12px; z-index:2; }
  .np-main { display:flex; flex-direction:column; align-items:center; text-align:center; min-width:0; }
  .np-art { width:min(55vh, 420px); aspect-ratio:1; border-radius:10px; overflow:hidden; background:#282828; }
  .np-art img{ width:100%; height:100%; object-fit:cover; }
  .np-title { font-size: clamp(24px, 3vw, 34px); font-weight:700; margin-top:20px; letter-spacing:-0.4px; }
  .np-artist { color:var(--text-secondary); font-size:15px; margin-top:8px; text-align:center; }
  .np-artist a:hover{ color:#fff; text-decoration:underline; }
  .np-genre { color:var(--text-subdued); font-size:13px; margin-top:14px; }
  .heart { margin-top: 18px; color:var(--text-secondary); display:flex; } .heart.on{ color:var(--green);} .heart:hover{color:#fff;}
  .np-side { height: 100%; max-height: 100%; display:flex; flex-direction:column; min-height:0; min-width:0; }
  .np-tabs { display:flex; gap: 8px; margin-bottom: 10px; }
  .nptab { font-size:14px; font-weight:600; color:var(--text-secondary); padding:8px 12px; border-radius:4px; }
  .nptab.active { color:#fff; }
  .np-tabcontent { flex:1; min-height:0; overflow-y:auto; }
  .queue-head { font-size:14px; font-weight:700; color:#fff; margin-bottom: 10px; }
  .qlist { display:flex; flex-direction:column; gap:2px; }
  .qrow { display:flex; align-items:center; gap:12px; padding:8px; border-radius:6px; width:100%; text-align:left; }
  .qrow:hover { background: rgba(255,255,255,0.06); }
  .qrow.cur { background: rgba(255,255,255,0.08); }
  .qnum { width:20px; color:var(--text-subdued); font-size:13px; text-align:center; }
  .qart { width:42px; height:42px; border-radius:4px; overflow:hidden; background:#282828; display:flex; align-items:center; justify-content:center; color:#b3b3b3; flex:0 0 auto; }
  .qart img{width:100%;height:100%;object-fit:cover;}
  .qmeta{ min-width:0; flex:1; display:flex; flex-direction:column; }
  .qname { font-size:14px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .qname.cur { color:#fff; font-weight:600; }
  .qartist { font-size:12px; color:var(--text-subdued); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .qdur { color:var(--text-subdued); font-size:13px; }
  .lyrics { padding: 12px 4px; } .lyr-h{ font-size:16px; font-weight:700; margin-bottom:8px;} .lyr-sub{ color:var(--text-secondary); font-size:14px; line-height:1.5; }
  .np-bottom { position:relative; z-index:2; padding: 8px 24px 20px; }
  .np-progress { display:flex; align-items:center; gap:14px; max-width:820px; margin: 0 auto; }
  .time { font-size:12px; color:var(--text-secondary); font-variant-numeric:tabular-nums; min-width:40px; text-align:center; }
  .pslider { flex:1; }
  .np-controls { display:flex; align-items:center; justify-content:center; gap: 30px; margin-top: 12px; }
  .np-controls button { color:#fff; display:flex; } .np-controls button.active{ color:var(--green); }
  .npplay { width:46px; height:46px; border-radius:50%; background:var(--green); align-items:center; justify-content:center; color:#000; }
  .npplay:hover{ transform:scale(1.05); }
  .np-empty{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); z-index:3; }
  @media (max-width: 900px){ .np-body { grid-template-columns: 1fr; overflow-y:auto; gap:16px; padding: 0 24px; } .np-side{ display:none; } }
</style>
