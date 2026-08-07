<script>
  import * as ui from '$lib/ui.svelte.js';
  import Icon from './Icon.svelte';
</script>

<div class="toasts">
  {#each ui.state.toasts as t}
    <div class="toast" class:err={t.type==='error'} class:ok={t.type==='success'}>
      <span class="tmsg">{t.message}</span>
      <button class="tx" onclick={()=>ui.closeToast(t.id)}><Icon name="x" size={14}/></button>
    </div>
  {/each}
</div>

<style>
  .toasts { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); z-index: 4000; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
  .toast { display:flex; align-items:center; gap:8px; background:#2a2a2a; color:#fff; padding: 12px 16px; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); font-size:13px; pointer-events:auto; animation: slideIn 0.2s ease; }
  .toast.ok { background: var(--green-dark); }
  .toast.err { background: #8b1e2d; }
  .tx { color:#fff; opacity:0.7; }
  @keyframes slideIn { from { opacity:0; transform: translateY(-10px);} to { opacity:1; transform:none;} }
</style>
