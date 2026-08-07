<script>
  import Card from './Card.svelte';
  import { goto } from '$app/navigation';
  let { title = '', items = [], link = '', type = 'album', round = false, grid = false, subtitle = '', onMore = null } = $props();
  function go() { if (onMore) onMore(); else if (link) goto(link); }
</script>

{#if items && items.length}
  <div class="section">
    <div class="sec-head">
      <h2 class="sec-title">{title}</h2>
      {#if link}<button class="sec-link" onclick={go}>Show all</button>{/if}
    </div>
    {#if grid}
      <div class="sec-grid">
        {#each items as it}
          <Card item={it} {type} {round} subtitle={it.Subtitle != null ? it.Subtitle : (it._subtitle || subtitle)} />
        {/each}
      </div>
    {:else}
      <div class="sec-row no-scrollbar">
        {#each items as it}
          <div class="cell">
            <Card item={it} {type} {round} subtitle={it._subtitle || subtitle} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .section { margin-top: 24px; }
  .sec-head { display:flex; align-items:baseline; justify-content:space-between; padding: 0 4px; margin-bottom: 12px; }
  .sec-title { font-size: 21px; font-weight: 700; letter-spacing: -0.3px; }

  .sec-link { color:var(--text-secondary); font-size:12px; font-weight:600; letter-spacing:0.5px; }
  .sec-link:hover { text-decoration:underline; color:#fff; }
  .sec-row { display:flex; gap: 18px; overflow-x:auto; padding: 4px; margin: -4px; }
  .cell { flex: 0 0 190px; max-width: 190px; }
  .sec-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 18px; }
</style>
