<script>
  let { value = 0, onchange, disabled = false, className = '', thumb = true, ariaLabel = 'progress' } = $props();
  let dragging = $state(false);
  let hover = $state(false);
  let wrap = $state(null);

  function pct(e) {
    const r = wrap.getBoundingClientRect();
    let p = (e.clientX - r.left) / r.width;
    return Math.max(0, Math.min(1, p));
  }
  function start(e) {
    if (disabled) return;
    dragging = true;
    onchange?.(pct(e));
    e.target.setPointerCapture?.(e.pointerId);
  }
  function move(e) { if (dragging) onchange?.(pct(e)); }
  function end(e) { dragging = false; }
</script>

<div class="slider {className}" bind:this={wrap}
     class:dragging onpointerdown={start} onpointermove={(e)=>dragging&&move(e)}
     onpointerup={end} onpointerleave={(e)=>{hover=false; end(e);}}
     onpointerenter={()=>hover=true}
     role="slider" aria-label={ariaLabel} aria-valuenow={Math.round(value*100)} tabindex="0"
     onkeydown={(e)=>{ if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); onchange?.(Math.min(1, value+0.05)); } else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); onchange?.(Math.max(0, value-0.05)); } }}>
  <div class="track">
    <div class="fill" style="width: {value*100}%;"></div>
  </div>
  {#if thumb}
    <div class="thumb" style="left: {value*100}%;" class:show={dragging || hover}></div>
  {/if}
</div>

<style>
  .slider { position:relative; height:12px; display:flex; align-items:center; cursor:pointer; touch-action:none; }
  .track { width:100%; height:4px; border-radius:2px; background: rgba(255,255,255,0.15); overflow:hidden; }
  .dragging .track, .slider:hover .track { height:4px; }
  .fill { height:100%; background: var(--green); border-radius:2px; }
  .dragging .fill, .slider:hover .fill { background: var(--green); }
  .thumb { position:absolute; top:50%; transform: translate(-50%,-50%); width:12px; height:12px; border-radius:50%; background:#fff; opacity:0; }
  .thumb.show { opacity:1; }
  :global(.bar-white .fill){ background:#fff; }
</style>
