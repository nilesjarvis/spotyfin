import { streamUrl, secToTicks, report, reportStop } from './jellyfin.js';
import { artistStr } from './utils.js';

// ---------- reactive state ----------
export const state = $state({
  queue: _loadQueue(),
  currentIndex: -1,
  current: null,
  playing: false,
  shuffle: false,
  repeat: 'off',
  volume: Number(localStorage.getItem('jf_volume') ?? 0.7),
  muted: false,
  time: 0,
  duration: 0,
  buffered: 0,
  expanded: false,
  loading: false,
  error: null,
  queueVisible: false,
  contextTitle: '',
  contextType: 'music'
});

export const REPEAT_OPTIONS = ['off', 'all', 'one'];

function _loadQueue() {
  try { return JSON.parse(sessionStorage.getItem('jf_queue') || '[]'); } catch { return []; }
}
function _syncCurrent() {
  state.current = state.queue[state.currentIndex] ?? null;
}

// ---------- history ----------
let _recent = [];
try { _recent = JSON.parse(localStorage.getItem('jf_recent') || '[]'); } catch {}
export const recent = $state(_recent);
export function clearRecent() { recent.length = 0; localStorage.setItem('jf_recent', '[]'); }
function saveRecent() { try { localStorage.setItem('jf_recent', JSON.stringify(recent)); } catch {} }
export function recordRecent(track) {
  if (!track) return;
  const tile = {
    id: track.AlbumId || track.ParentId || track.Id,
    name: track.Album || track.Name,
    artist: artistStr(track),
    imageTag: (track.ImageTags && track.ImageTags.Primary) || null,
    type: 'album',
    albumId: track.AlbumId,
    albumName: track.Album
  };
  const idx = recent.findIndex(r => r.id === tile.id);
  if (idx >= 0) recent.splice(idx, 1);
  recent.unshift(tile);
  if (recent.length > 24) recent.length = 24;
  saveRecent();
}

// ---------- audio singleton ----------
let audio = null;
function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'auto';
  audio.volume = state.muted ? 0 : state.volume;
  audio.addEventListener('timeupdate', () => { state.time = audio.currentTime; });
  audio.addEventListener('durationchange', () => { state.duration = isFinite(audio.duration) ? audio.duration : 0; });
  audio.addEventListener('loadedmetadata', () => { state.duration = isFinite(audio.duration) ? audio.duration : 0; });
  audio.addEventListener('progress', () => { if (audio.buffered.length) state.buffered = audio.buffered.end(audio.buffered.length - 1); });
  audio.addEventListener('play', () => { state.playing = true; state.loading = false; });
  audio.addEventListener('pause', () => { state.playing = false; });
  audio.addEventListener('playing', () => { state.loading = false; });
  audio.addEventListener('waiting', () => { if (state.playing) state.loading = true; });
  audio.addEventListener('error', () => { state.error = 'Playback error: unable to load stream.'; state.loading = false; });
  audio.addEventListener('canplay', () => { state.loading = false; });
  audio.addEventListener('loadeddata', () => { state.loading = false; });
  audio.addEventListener('ended', () => {
    reportStopIfNeeded();
    if (state.repeat === 'one') { restart(); return; }
    next(true);
  });
  return audio;
}

let reportTimer = null, psid = null, reportingId = null;
function reportIfNeeded() {
  const a = ensureAudio();
  if (!reportingId) return;
  report(true, reportingId, { positionTicks: secToTicks(a ? a.currentTime : 0), isPaused: !state.playing, playSessionId: psid });
  if (reportTimer) clearInterval(reportTimer);
  reportTimer = setInterval(() => {
    if (!reportingId) return;
    report(false, reportingId, { positionTicks: secToTicks(a ? a.currentTime : 0), isPaused: !state.playing, playSessionId: psid });
  }, 10000);
}
function reportStopIfNeeded() {
  const a = ensureAudio();
  if (reportTimer) { clearInterval(reportTimer); reportTimer = null; }
  if (reportingId) reportStop(reportingId, { positionTicks: secToTicks(a ? a.currentTime : 0), playSessionId: psid });
  reportingId = null; psid = null;
}
function restart() {
  const a = ensureAudio(); state.time = 0;
  if (a) { a.currentTime = 0; a.play().catch(() => {}); }
}

export function playTracks(tracks, index = 0, opts = {}) {
  const a = ensureAudio();
  if (!tracks || !tracks.length) return;
  state.queue = tracks.slice();
  state.currentIndex = Math.max(0, Math.min(index, tracks.length - 1));
  _syncCurrent();
  state.contextTitle = opts.contextTitle || '';
  state.contextType = opts.contextType || 'music';
  state.error = null;
  try { sessionStorage.setItem('jf_queue', JSON.stringify(state.queue)); } catch {}
  loadCurrent();
}
export function loadAndPlay(tracks, index = 0, opts = {}) {
  playTracks(tracks, index, opts);
  const a = ensureAudio();
  if (a) a.play().catch(() => {});
}
function loadCurrent() {
  const a = ensureAudio();
  const t = state.current;
  if (!t || !a) return;
  reportStopIfNeeded();
  state.loading = true; state.error = null;
  reportingId = t.Id;
  psid = 'ps-' + Math.random().toString(36).slice(2, 10);
  a.src = streamUrl(t.Id);
  a.volume = state.muted ? 0 : state.volume;
  a.play().catch(() => { state.loading = false; });
}
export function togglePlay() {
  const a = ensureAudio();
  if (!a || !state.current) return;
  if (a.paused) { a.play().catch(() => {}); reportIfNeeded(); }
  else { a.pause(); reportStopIfNeeded(); state.playing = false; }
}
function pickRandomIndex(exclude) {
  if (!state.queue.length) return -1;
  let i = Math.floor(Math.random() * state.queue.length), guard = 0;
  while (i === exclude && state.queue.length > 1 && guard < 20) { i = Math.floor(Math.random() * state.queue.length); guard++; }
  return i;
}
export function next(auto = false) {
  const a = ensureAudio();
  if (!a || !state.queue.length) return;
  if (state.queue.length === 1) { if (state.repeat !== 'off') restart(); return; }
  reportStopIfNeeded();
  let ni;
  if (state.shuffle) ni = pickRandomIndex(state.currentIndex);
  else {
    ni = state.currentIndex + 1;
    if (ni >= state.queue.length) ni = state.repeat === 'all' ? 0 : -1;
  }
  if (ni < 0) return;
  state.currentIndex = ni; _syncCurrent();
  loadCurrent();
  recordRecent(state.current);
}
export function prev() {
  const a = ensureAudio();
  if (!a || !state.queue.length) return;
  if (a.currentTime > 3) { a.currentTime = 0; state.time = 0; return; }
  if (state.shuffle) { state.currentIndex = pickRandomIndex(state.currentIndex); _syncCurrent(); loadCurrent(); return; }
  reportStopIfNeeded();
  const ni = state.currentIndex - 1;
  if (ni < 0) { a.currentTime = 0; state.time = 0; return; }
  state.currentIndex = ni; _syncCurrent(); loadCurrent();
}
export function seek(sec) {
  const a = ensureAudio();
  if (!a) return;
  sec = Math.max(0, Math.min(sec, state.duration || a.duration || 0));
  a.currentTime = sec; state.time = sec;
}
export function seekByRatio(r) {
  const a = ensureAudio();
  const d = state.duration || (a && a.duration) || 0;
  if (d > 0) seek(r * d);
}
export function toggleShuffle() { state.shuffle = !state.shuffle; }
export function cycleRepeat() {
  const i = REPEAT_OPTIONS.indexOf(state.repeat);
  state.repeat = REPEAT_OPTIONS[(i + 1) % REPEAT_OPTIONS.length];
}
export function setVolume(v) {
  v = Math.max(0, Math.min(1, v));
  state.volume = v; state.muted = v === 0;
  localStorage.setItem('jf_volume', String(v));
  const a = ensureAudio(); if (a) a.volume = v;
}
export function toggleMute() {
  const a = ensureAudio();
  state.muted = !state.muted;
  if (a) a.volume = state.muted ? 0 : state.volume;
}
export function stop() {
  const a = ensureAudio();
  if (a) { reportStopIfNeeded(); a.pause(); a.removeAttribute('src'); a.load(); }
  state.queue = []; state.currentIndex = -1; state.playing = false; state.time = 0; state.duration = 0; _syncCurrent();
}
export function playTrackAt(index) {
  const a = ensureAudio();
  if (!a || index === undefined || index < 0 || index >= state.queue.length) return;
  reportStopIfNeeded();
  state.currentIndex = index; _syncCurrent();
  loadCurrent();
}
