<script>
  import * as player from '$lib/player.svelte.js';
  import * as jf from '$lib/jellyfin.js';
  import * as ui from '$lib/ui.svelte.js';
  import * as actions from '$lib/actions.js';
  import Icon from './Icon.svelte';
  import Slider from './Slider.svelte';
  import { fmtDurationMs, artistStr } from '$lib/utils.js';
  import { goto } from '$app/navigation';

  let scrubRatio = $state(0);
  let scrubbing = $state(false);
  const ratio = $derived(scrubbing ? scrubRatio * (player.state.duration||0) : player.state.time);
  let fav = $state(false);
  let loaded = $state(false);

  $effect(() => {
    const id = player.state.current?.Id;
    if (!id) { fav = false; return; }
    loaded = false;
    jf.isFavorite(id).then(v => { fav = !!v; loaded = true; }).catch(()=>{});
  });

  async function toggleFav() {
    if (!player.state.current) return;
    const id = player.state.current.Id;
    await jf.setFavorite(id, !fav);
    fav = !fav;
    ui.toast(fav ? 'Added to Liked Songs' : 'Removed from Liked Songs', 'success');
  }

  function onSeek(r) { player.seekByRatio(r); }

  const currentTitle = $derived(player.state.current?.Name || '');
  const currentArtist = $derived(artistStr(player.state.current || {}));
</script>

<div class="player-bar">
  <!-- left: now playing -->
  <div class="now-play" onclick={(e)=>{ if(e.target.closest('a,button')) return; player.state.expanded = true; }}>
    {#if player.state.current}
      <a class="art" href="/album/{player.state.current.AlbumId || ''}" onclick={(e)=>{ e.preventDefault(); goto(`/album/${player.state.current.AlbumId||''}`); }}>
        {#if player.state.current.ImageTags?.Primary}
          <img src={jf.imgUrl(player.state.current, {size:128})} alt="" />
        {:else}
          <span class="artph"><Icon name="disc" size={24}/></span>
        {/if}
      </a>
      <div class="meta">
        <span class="tname">{player.state.current.Name}</span>
        <span class="tartist">{player.state.current.Artists?.[0] || player.state.current.AlbumArtist || 'Unknown'}</span>
      </div>
      <button class="heart" class:on={fav} onclick={(e)=>{ e.stopPropagation(); toggleFav(); }} title="Save to your Liked Songs">
        <Icon name={fav ? 'heart_fill':'heart'} size={16}/>
      </button>
    {/if}
  </div>

  <!-- center: controls + progress -->
  <div class="center">
    <div class="controls">
      <button class="ctl" class:active={player.state.shuffle} onclick={player.toggleShuffle} title="Shuffle"><Icon name="shuffle" size={18}/></button>
      <button class="ctl" onclick={player.prev} title="Previous"><Icon name="skip_prev" size={22}/></button>
      <button class="play" onclick={player.togglePlay} title={player.state.playing?'Pause':'Play'}>
        <Icon name={player.state.playing ? 'pause':'play'} size={24} style="fill:#000"/>
      </button>
      <button class="ctl" onclick={()=>player.next(false)} title="Next"><Icon name="skip_next" size={22}/></button>
      <button class="ctl" class:active={player.state.repeat!=='off'} onclick={player.cycleRepeat} title={player.state.repeat==='one'?'Repeat one':'Repeat all'}>
        <Icon name={player.state.repeat==='one' ? 'repeat_one':'repeat'} size={18}/>
      </button>
    </div>
    <div class="progress-row">
      <span class="time">{fmtDurationMs(player.state.time*1000)}</span>
      <div class="progress-slider">
        <Slider
          value={player.state.duration ? (player.state.time/player.state.duration) : 0}
          onchange={(r)=>{
            player.seekByRatio(r);
            if (!player.state.current) return;
          }}
          ariaLabel="Seek"
          disabled={!player.state.current}
        />
      </div>
      <span class="time">{fmtDurationMs(player.state.duration*1000)}</span>
    </div>
  </div>

  <!-- right: extras -->
  <div class="right">
    <button class="xtra" title="Queue" onclick={()=>player.state.queueVisible=!player.state.queueVisible}><Icon name="queue" size={20}/></button>
    <div class="vol">
      <button class="xtra" onclick={player.toggleMute} title="Mute">
        <Icon name={player.state.volume===0 ? 'volume_muted':'volume'} size={20}/>
      </button>
      <div class="vol-slider"><Slider value={player.state.volume} onchange={(r)=>player.setVolume(r)} disabled={false} ariaLabel="Volume"/></div>
    </div>
  </div>
</div>

<style>
  .player-bar { height: var(--player-height); background: var(--bg-player); border-top: 1px solid #282828; display:grid; grid-template-columns: minmax(180px, 30%) 1fr minmax(180px,30%); align-items:center; padding: 0 16px; gap: 8px; }
  .now-play { display:flex; align-items:center; gap:12px; min-width:0; cursor:pointer; }
  .art { width:56px; height:56px; border-radius:4px; overflow:hidden; flex:0 0 auto; background:#282828; }
  .art img, .artph { width:100%; height:100%; object-fit:cover; }
  .artph{ display:flex; align-items:center; justify-content:center; color:#b3b3b3;}
  .meta { min-width:0; }
  .tname { display:block; font-size:14px; font-weight:500; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tartist { display:block; font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .heart { color:var(--text-secondary); margin-left:auto; padding:6px; }
  .heart:hover { color:#fff; }
  .heart.on { color:var(--green); }

  .center { display:flex; flex-direction:column; align-items:center; gap:6px; min-width:0; }
  .controls { display:flex; align-items:center; gap:20px; }
  .ctl { color:var(--text-secondary); display:flex; }
  .ctl:hover, .ctl.active { color:#fff; }
  .ctl.active { color: var(--green); }
  .play { width:32px; height:32px; border-radius:50%; background:var(--green); display:flex; align-items:center; justify-content:center; color:#000; }
  .play:hover { transform: scale(1.05); }
  .progress-row { display:flex; align-items:center; gap:10px; width:100%; max-width: 640px; }
  .progress-slider { flex:1; }
  .time { font-size:11px; color:var(--text-secondary); font-variant-numeric: tabular-nums; min-width:36px; text-align:center; }

  .right { display:flex; align-items:center; justify-content:flex-end; gap:12px; }
  .xtra { color:var(--text-secondary); display:flex; padding:6px; }
  .xtra:hover, .xtra.active { color:#fff; }
  .vol { display:flex; align-items:center; gap:8px; }
  .vol-slider { width:100px; }
</style>
