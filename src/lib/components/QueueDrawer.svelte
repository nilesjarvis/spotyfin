<script>
  import * as player from '$lib/player.svelte.js';
  import * as jf from '$lib/jellyfin.js';
  import * as actions from '$lib/actions.js';
  import * as ui from '$lib/ui.svelte.js';
  import Icon from './Icon.svelte';
  import { fmtDurationMs, artistStr } from '$lib/utils.js';

  function onPlay(i){ player.playTrackAt(i); }
  function openItemMenu(e, t, i){
    e.stopPropagation();
    ui.openMenu(e.clientX, e.clientY, actions.buildTrackMenu(t, {}));
  }
</script>

{#if player.state.queueVisible}
  <div class="qoverlay" onclick={(e)=>{ if(e.target===e.currentTarget) player.state.queueVisible=false; }}>
    <aside class="qpanel" onclick={(e)=>e.stopPropagation()} style="animation: slideIn 0.25s ease;">
      <div class="qhead">
        <h3>Queue</h3>
        <button class="close" onclick={()=>player.state.queueVisible=false}><Icon name="x" size={18}/></button>
      </div>
      <div class="now-block">
        <div class="ub-h">NOW PLAYING</div>
        {#if player.state.current}
          <div class="ub-row cur">
            <span class="ub-art">
              {#if player.state.current.ImageTags?.Primary}<img src={jf.imgUrl(player.state.current,{size:60})} alt=""/>{:else}<Icon name="disc" size={16}/>{/if}
            </span>
            <span class="ub-meta">
              <span class="ub-name">{player.state.current.Name}</span>
              <span class="ub-artist">{artistStr(player.state.current)}</span>
            </span>
            <span class="eq"><i></i><i></i><i></i></span>
          </div>
        {:else}<div class="ub-none">Nothing playing</div>{/if}
        <div class="ub-h" style="margin-top:18px">UP NEXT</div>
        <div class="ub-list">
          {#each player.state.queue as t, i}
            {#if i > player.state.currentIndex || (i < player.state.currentIndex && player.state.shuffle)}
              <button class="ub-row" onclick={()=>onPlay(i)} oncontextmenu={(e)=>openItemMenu(e,t,i)}>
                <span class="ub-art">
                  {#if t.ImageTags?.Primary}<img src={jf.imgUrl(t,{size:60})} alt=""/>{:else}<Icon name="disc" size={16}/>{/if}
                </span>
                <span class="ub-meta">
                  <span class="ub-name">{t.Name}</span>
                  <span class="ub-artist">{artistStr(t)}</span>
                </span>
                <span class="ub-dur">{fmtDurationMs(t.RunTimeTicks ? t.RunTimeTicks/1e4 : 0)}</span>
              </button>
            {/if}
          {/each}
        </div>
      </div>
    </aside>
  </div>
{/if}

<style>
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .qoverlay { position:fixed; inset:0; z-index:1500; background:rgba(0,0,0,0.5); }
  .qpanel { position:absolute; right:0; top:0; bottom:0; width: 420px; max-width: 90vw; background:#121212; border-left:1px solid #2a2a2a; padding:20px; overflow-y:auto; }
  .qhead{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
  .qhead h3{ font-size:20px; font-weight:700; }
  .close{ color:var(--text-secondary); display:flex; padding:6px;} .close:hover{color:#fff;}
  .ub-h{ font-size:12px; font-weight:700; letter-spacing:0.8px; color:var(--text-secondary); margin-bottom:10px; }
  .ub-row{ display:flex; align-items:center; gap:12px; padding:8px; border-radius:6px; width:100%; text-align:left; }
  .ub-row:hover{ background:rgba(255,255,255,0.06); }
  .ub-row.cur{ background:rgba(30,215,96,0.08); }
  .ub-art{ width:42px;height:42px;border-radius:4px;overflow:hidden;background:#282828;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:#b3b3b3;}
  .ub-art img{width:100%;height:100%;object-fit:cover;}
  .ub-meta{ flex:1; min-width:0; display:flex; flex-direction:column; }
  .ub-name{ font-size:14px; white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .ub-row.cur .ub-name{ color:var(--green); }
  .ub-artist, .ub-dur{ color:var(--text-secondary); font-size:12px; }
  .ub-dur{ white-space:nowrap; }
  .ub-none{ color:var(--text-secondary); padding:12px 8px; font-size:14px; }
  .eq{ display:inline-flex; align-items:flex-end; gap:2px; height:14px; }
  .eq i{ width:3px; background:var(--green); animation:eq 1s infinite ease-in-out; } .eq i:nth-child(2){height:12px;animation-delay:.15s}.eq i:nth-child(3){height:8px;animation-delay:.3s}
  @keyframes eq{0%,100%{opacity:.4}50%{opacity:1}}
</style>
