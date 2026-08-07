<script>
  import * as ui from '$lib/ui.svelte.js';
  import Icon from './Icon.svelte';
  function go(item) { ui.execMenuItem(item); }
</script>

{#if ui.state.menu}
  <div
    class="ctx"
    data-contextmenu
    style="left:{ui.state.menu.x}px; top:{ui.state.menu.y}px;"
    role="menu"
    oncontextmenu={(e)=>e.preventDefault()}
  >
    {#each ui.state.menu.items as item}
      {#if item.separator}
        <div class="sep"></div>
      {:else}
        <button
          class:danger={item.danger}
          class="item"
          onclick={(e)=>{ e.stopPropagation(); go(item); }}
          role="menuitem"
        >
          {#if item.icon}<Icon name={item.icon} size={20} />{/if}
          <span style="margin-left:{item.icon ? '12px' : '0'}">{item.label}</span>
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .ctx {
    position: fixed;
    z-index: 3000;
    min-width: 220px;
    background: #282828;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    animation: menuIn 0.12s ease;
  }
  @keyframes menuIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
  .item {
    display: flex; align-items: center; width: 100%; padding: 10px 12px;
    font-size: 14px; color: #eaeaea; border-radius: 2px; text-align: left;
  }
  .item:hover { background: rgba(255,255,255,0.1); }
  .danger { color: #f15e6c; }
  .sep { height: 1px; background: rgba(255,255,255,0.1); margin: 6px 10px; }
</style>
