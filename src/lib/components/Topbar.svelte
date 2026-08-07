<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import * as auth from '$lib/auth.svelte.js';
  import * as hist from '$lib/history.svelte.js';
  import Icon from './Icon.svelte';

  let menuOpen = $state(false);

  function logout() { auth.logout(); goto('/'); }
  const initial = $derived(auth.state.user?.Name?.charAt(0)?.toUpperCase() || 'U');
function labelFor(path) {
    if (path === '/' || path === '/search' || path.startsWith('/album/') || path.startsWith('/artist/') || path.startsWith('/playlist/') || path === '/liked') return '';
    if (path.startsWith('/collection/')) return 'Your Library';
    return '';
  }
</script>

<header class="topbar">
  <div class="nav-btns">
    <button class="round-btn" disabled={!hist.canGoBack()} onclick={()=>hist.goBack()} aria-label="Go back">
      <Icon name="arrow_left" size={18} />
    </button>
    <button class="round-btn" disabled={!hist.canGoForward()} onclick={()=>hist.goForward()} aria-label="Go forward">
      <Icon name="arrow_right" size={18} />
    </button>
  </div>

  <div class="topbar-center">
    <span class="page-title">{labelFor(page.url.pathname)}</span>
  </div>

  <div class="right">
    <div class="profile-wrap">
      <button class="profile" onclick={()=>menuOpen=!menuOpen} aria-haspopup="true">
        <span class="avatar">{initial}</span>
        <span class="uname" title={auth.state.user?.Name}>{auth.state.user?.Name}</span>
      </button>
      {#if menuOpen}
        <div class="profile-drop">
          <div class="drow info">{auth.state.user?.Name}</div>
          <div class="dsep"></div>
          <button class="drow" onclick={()=>{menuOpen=false; goto('/collection/playlists');}}>Your Library</button>
          <button class="drow" onclick={logout}>Log out</button>
        </div>
      {/if}
    </div>
  </div>
</header>

<svelte:window onclick={(e)=>{ if(!e.target.closest('.profile-wrap')) menuOpen=false; }} />


<style>
  .topbar { display:flex; align-items:center; gap:16px; padding: 12px 24px; min-height: var(--topbar-height); }
  .nav-btns { display:flex; gap:8px; }
  .round-btn { width:32px; height:32px; border-radius:50%; background: rgba(0,0,0,0.6); color:#fff; display:flex; align-items:center; justify-content:center; }
  .round-btn:disabled { color: rgba(255,255,255,0.3); opacity:0.6; }
  .topbar-center { flex:1; min-width:0; }
  .page-title { font-size: 22px; font-weight: 700; }
  .right { display:flex; align-items:center; gap:8px; }
  .profile-wrap { position:relative; }
  .profile { display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.6); border-radius: 50px; padding: 2px; }
  .avatar { width:28px; height:28px; border-radius:50%; background:#333; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:#fff; }
  .uname { padding-right:10px; font-size:14px; font-weight:600; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .profile:hover { background:#181818; }
  .profile-drop { position:absolute; right:0; top: 44px; background:#282828; border-radius:6px; min-width:200px; padding:4px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 200; }
  .drow { display:block; width:100%; text-align:left; padding: 12px; font-size:14px; font-weight:600; border-radius:3px; }
  .drow:hover { background:rgba(255,255,255,0.1); }
  .dsep { height:1px; background:rgba(255,255,255,0.1); margin:4px 8px; }
  .drow.info { color:var(--text-secondary); font-weight:600; cursor:default; }
</style>
