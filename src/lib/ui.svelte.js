// Global UI state.
export const state = $state({
  toasts: [],
  menu: null,
  savePlaylistModal: { open: false, itemIds: [], track: null },
  textModal: null,
  highlighted: null
});

let tid = 0;
export function toast(message, type = 'default') {
  const id = ++tid;
  state.toasts = state.toasts.concat([{ id, message, type }]);
  setTimeout(() => closeToast(id), 3400);
}
export function closeToast(id) {
  state.toasts = state.toasts.filter(t => t.id !== id);
}

let menuListener = null;
export function openMenu(x, y, items) {
  state.menu = { x, y, items };
  if (menuListener) document.removeEventListener('click', menuListener, true);
  menuListener = (e) => {
    if (e.target?.closest && e.target.closest('[data-contextmenu]')) return;
    closeMenu();
  };
  document.addEventListener('click', menuListener, true);
}
export function closeMenu() {
  state.menu = null;
  if (menuListener) { document.removeEventListener('click', menuListener, true); menuListener = null; }
}
export function execMenuItem(item) {
  closeMenu();
  if (item.action) item.action();
}
export function openSavePlaylist(itemIds, track = null) {
  state.savePlaylistModal = { open: true, itemIds, track };
}
export function closeSavePlaylist() {
  state.savePlaylistModal = { open: false, itemIds: [], track: null };
}
export function setHighlight(id) { state.highlighted = id; }
export function openTextModal(opts) { state.textModal = opts; }
export function closeTextModal() { state.textModal = null; }
