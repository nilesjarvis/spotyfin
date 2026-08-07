<script>
  import * as ui from '$lib/ui.svelte.js';
  let value = $state('');
  // keep the value in sync when a new modal opens
  $effect(() => { if (ui.state.textModal) value = ui.state.textModal.initial || ''; });
  function save() { if (!value.trim()) return; ui.state.textModal.onSubmit(value.trim()); ui.closeTextModal(); }
</script>

{#if ui.state.textModal}
  <div class="overlay" onclick={(e)=>{ if(e.target===e.currentTarget) ui.closeTextModal(); }}>
    <div class="panel">
      <h3>{ui.state.textModal.title}</h3>
      <input bind:value placeholder={ui.state.textModal.placeholder} onkeydown={(e)=>{ if(e.key==='Enter') save(); }} autofocus />
      <div class="row">
        <button class="cancel" onclick={()=>ui.closeTextModal()}>Cancel</button>
        <button class="save" onclick={save} disabled={!value.trim()}>{ui.state.textModal.submitLabel || 'Save'}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:5000; display:flex; align-items:center; justify-content:center; }
  .panel{ background:#282828; border-radius:8px; padding:20px; width:380px; max-width:calc(100vw - 40px); }
  h3{ font-size:18px; margin-bottom:14px; }
  input{ width:100%; padding:12px 14px; border-radius:6px; background:#181818; border:1px solid transparent; color:#fff; outline:none; font-size:15px; }
  input:focus{ border-color:var(--green); }
  .row{ display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
  .cancel{ color:#b3b3b3; padding:10px 16px; border-radius:50px; }
  .cancel:hover{ color:#fff; }
  .save{ background:var(--green); color:#000; font-weight:700; padding:10px 20px; border-radius:50px; }
  .save:disabled{ opacity:0.4; }
</style>
