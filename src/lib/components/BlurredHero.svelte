<script>
  let { bg = null, children } = $props();
</script>

<div class="blur-hero">
  {#if bg}
    <div class="bh-img" style="background-image:url({bg})"></div>
  {/if}
  <div class="bh-overlay"></div>
  <div class="bh-content">{@render children?.()}</div>
</div>

<style>
  .blur-hero { position: relative; padding: 28px 28px 16px; min-height: 220px; display:flex; align-items:flex-end; overflow:hidden; }
  .bh-img { position:absolute; inset:-40px; background-size:cover; background-position:center; filter: blur(30px) saturate(1.1); transform: scale(1.1); opacity:0.45; }
  .bh-overlay { position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(18,18,18,0.25) 60%, rgba(18,18,18,0.95) 100%); }
  .bh-content { position:relative; z-index:2; width:100%; display:flex; }
</style>
