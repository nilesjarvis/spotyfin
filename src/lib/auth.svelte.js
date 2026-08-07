import * as jf from './jellyfin.js';

export const state = $state({ user: null, loading: false, error: null });

export function init() {
  if (jf.isAuthed() && !state.user) refresh();
}
export async function refresh() {
  try { state.user = await jf.getUser(); }
  catch (e) { state.user = null; }
}
export async function login(username, password, serverUrl) {
  state.error = null;
  if (serverUrl) jf.setServer(serverUrl);
  state.loading = true;
  try {
    state.user = await jf.authenticate(username, password);
    return true;
  } catch (e) {
    state.error = e.message || 'Login failed';
    return false;
  } finally { state.loading = false; }
}
export function logout() {
  jf.clearCredentials();
  state.user = null;
}
export function setServerUrl(url) { jf.setServer(url); }
export function getServerUrl() { return jf.getServer(); }
