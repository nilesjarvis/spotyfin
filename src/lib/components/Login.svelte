<script>
  import * as auth from '$lib/auth.svelte.js';
  import * as jf from '$lib/jellyfin.js';
  import Icon from './Icon.svelte';
  let username = $state('');
  let password = $state('');
  let server = $state(jf.getServer() || 'http://127.0.0.1:8096');
  let showPw = $state(false);
  let advanced = $state(false);

  async function submit() {
    await auth.login(username.trim(), password, server.trim());
  }
  const canSubmit = $derived(username.trim().length > 0 && password.length > 0);
</script>

<div class="login-page">
  <header class="login-header">
    <div class="logo-row" aria-label="Spotyfin">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="#1ed760"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.83-1.73-6.4-2.12-10.6-1.16a.75.75 0 0 1-.33-1.46c4.6-1.05 8.6-.6 11.7 1.34.35.22.46.68.26 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.24-1.99-8.18-2.57-12-.02a.94.94 0 0 1-1.06-1.55c4.42-3.04 10-2.4 13.85-.08.44.26.6.84.34 1.29l-.16-.08Zm.13-3.4C16.6 8.5 10.4 8.32 6.73 9.9a1.12 1.12 0 0 1-1-2c4.25-1.87 11.22-1.66 15.65 1.18a1.12 1.12 0 1 1-1.18 1.9l-.1-.05Z"/></svg>
    </div>
  </header>

  <main class="login-card">
    <div class="card-inner">
      <h1>Log in to Spotyfin</h1>
      <p class="powered">powered by your Jellyfin server</p>

      <form onsubmit={ (e) => { e.preventDefault(); submit(); } }>
        <label class="field">
          <span>Username</span>
          <input bind:value={username} type="text" placeholder="marcus" autocomplete="username" />
        </label>
        <label class="field">
          <span>Password</span>
          <div class="pw-wrap">
            <input bind:value={password} type={showPw ? 'text' : 'password'} placeholder="Password" autocomplete="current-password" />
            <button type="button" class="eye" onmousedown={(e)=>{e.preventDefault(); showPw=!showPw;}} aria-label="Show password">
              <Icon name={showPw ? 'disc' : 'disc'} size={18} />
            </button>
          </div>
        </label>

        {#if auth.state.error}
          <div class="error">{auth.state.error}</div>
        {/if}

        <button type="submit" class="login-btn" disabled={!canSubmit || auth.state.loading}>
          {#if auth.state.loading}<span class="spin-ring"></span>{:else}Log In{/if}
        </button>

        <button type="button" class="advanced-toggle" onclick={()=> advanced = !advanced}>
          {advanced ? 'Hide server settings' : 'Server settings'}
          <Icon name="chevron_down" size={14} style="transform:rotate({advanced ? 180 : 0}deg)" />
        </button>
        {#if advanced}
          <label class="field">
            <span>Jellyfin server URL</span>
            <input bind:value={server} type="text" placeholder="http://127.0.0.1:8096" spellcheck="false" />
          </label>
        {/if}
      </form>

      <div class="divider"></div>
      <p class="hint">New to Jellyfin? Contact your server administrator for an account.</p>
    </div>
  </main>
</div>

<style>
  .login-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #ffffff 0%, #f2f2f2 100%);
    color: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--font);
    overflow-y: auto;
  }
  .login-header { width: 100%; display: flex; justify-content: center; padding: 28px 0; }
  .login-card {
    background: #fff;
    width: 100%;
    max-width: 480px;
    margin: 8px 0 80px;
    border-radius: 8px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  }
  .card-inner { padding: 32px 32px 40px; }
  h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-align: center; }
  .powered { text-align: center; color: #6a6a6a; font-size: 13px; margin-top: 6px; margin-bottom: 26px; }
  form { display: flex; flex-direction: column; gap: 18px; }
  .field span { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .field input {
    width: 100%; padding: 14px; border: 1px solid #b3b3b3; border-radius: 50px;
    font-size: 15px; background: #fff; color: #000; outline: none;
  }
  .field input:focus { box-shadow: 0 0 0 1px #000; border-color:#000; }
  .pw-wrap { position: relative; }
  .pw-wrap input { padding-right: 44px; }
  .eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color:#333; }
  .error { color: #ed3241; font-size: 13px; background: rgba(237,50,65,0.08); padding: 10px 14px; border-radius: 6px; }
  .login-btn {
    width: 100%; padding: 15px; border-radius: 50px; background: var(--green);
    color: #000; font-size: 15px; font-weight: 700; letter-spacing: 1px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .login-btn:hover:not(:disabled) { background: var(--green-hover); transform: scale(1.02); }
  .spin-ring { width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.3); border-top-color:#000; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .advanced-toggle { color:#333; font-size: 13px; display:flex; align-items:center; gap:6px; margin: 0 auto; }
  .divider { margin: 26px 0 16px; border-top: 1px solid #eaeaea; }
  .hint { text-align:center; color:#6a6a6a; font-size: 13px; }
</style>
