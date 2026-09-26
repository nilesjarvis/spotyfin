// Jellyfin API client for the Spotify-style app.
// Talks directly to the configured Jellyfin server (CORS enabled).

const CLIENT = {
  name: 'Spotyfin',
  version: '1.0.0',
  deviceName: 'Spotyfin'
};

let _server = localStorage.getItem('jf_server') || defaultServer();
function defaultServer() {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return 'http://127.0.0.1:8096';
  const h = window.location.hostname;
  // If the app is being viewed from another device (non-loopback host), point at the
  // Jellyfin server on the same host so it works automatically on the local network.
  if (h !== 'localhost' && !h.startsWith('127.') && !h.endsWith('.local')) return `http://${h}:8096`;
  return 'http://127.0.0.1:8096';
}
let _token = localStorage.getItem('jf_token') || '';
let _userId = localStorage.getItem('jf_userId') || '';
let _userName = localStorage.getItem('jf_userName') || '';
let _deviceId = localStorage.getItem('jf_deviceId') || makeId();

export function makeId() {
  return 'dev-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getServer() { return _server; }
export function getToken() { return _token; }
export function setServer(url) { _server = (url || '').replace(/\/+$/, ''); localStorage.setItem('jf_server', _server); }
export function getUserId() { return _userId; }
export function setCredentials({ token, userId, userName }) {
  _token = token; _userId = userId; _userName = userName;
  localStorage.setItem('jf_token', token || '');
  localStorage.setItem('jf_userId', userId || '');
  localStorage.setItem('jf_userName', userName || '');
}
export function clearCredentials() {
  _token = ''; _userId = ''; _userName = '';
  localStorage.removeItem('jf_token');
  localStorage.removeItem('jf_userId');
  localStorage.removeItem('jf_userName');
}
export function isAuthed() { return !!(_token && _userId); }
export function getDisplayName() { return _userName || 'User'; }

function headers(token = true) {
  const h = { 'Content-Type': 'application/json' };
  // Jellyfin 12.1 dropped the legacy X-Emby-Token header; it only accepts
  // the token in the Authorization header (MediaBrowser Token="...").
  if (token && _token) h['Authorization'] = `MediaBrowser Token="${_token}"`;
  return h;
}


async function maybeJson(res) {
  if (!res.ok) {
    let msg = `request failed (${res.status})`;
    try { const j = await res.json(); msg = j.Error?.Message || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204 || res.status === 200) {
    const txt = await res.text();
    try { return txt ? JSON.parse(txt) : {}; } catch { return {}; }
  }
  return {};
}

function authHeader() {
  return `MediaBrowser Client="${CLIENT.name}", Device="${CLIENT.deviceName}", DeviceId="${_deviceId}", Version="${CLIENT.version}"`;
}

// ---- auth ----
export async function authenticate(username, password) {
  const body = JSON.stringify({ Username: username, Pw: password });
  const res = await fetch(`${_server}/Users/AuthenticateByName`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Emby-Authorization': authHeader() }, body
  });
  if (!res.ok) {
    let msg = `Login failed (${res.status})`;
    try { const j = await res.json(); msg = j.Error?.Message || j.Error?.ActualErrorMessage || msg; } catch {}
    throw new Error(msg);
  }
  const j = await res.json();
  _token = j.AccessToken; _userId = j.User.Id; _userName = j.User.Name;
  setCredentials({ token: _token, userId: _userId, userName: _userName });
  return j.User;
}

export async function getUser() {
  if (!isAuthed()) return null;
  const res = await fetch(`${_server}/Users/${_userId}`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

// ---- items ----
function qs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    p.append(k, Array.isArray(v) ? v.join(',') : v);
  }
  return p.toString();
}

const DEFAULT_FIELDS = 'PrimaryImageAspectRatio,Genres,AlbumArtists,Artists,DateCreated,MediaSources';

export async function getItem(id, userId = _userId) {
  const res = await fetch(`${_server}/Users/${userId}/Items/${id}?${qs({ Fields: DEFAULT_FIELDS })}`, { headers: headers() });
  if (!res.ok) throw new Error(`load item ${id} failed (${res.status})`);
  return res.json();
}

export async function getItems(params) {
  const p = { Fields: params.Fields || DEFAULT_FIELDS, EnableImageTypes: 'Primary,Backdrop,Thumb', ...params };
  const res = await fetch(`${_server}/Users/${_userId}/Items?${qs(p)}`, { headers: headers() });
  if (!res.ok) throw new Error(`items failed (${res.status})`);
  return res.json();
}

export async function getChildren(parentId, includeTypes = 'Audio') {
  return getItems({
    ParentId: parentId, IncludeItemTypes: includeTypes, SortBy: 'ParentIndexNumber,IndexNumber',
    SortOrder: 'Ascending', EnableUserData: true
  });
}

// artists index
export async function getArtists(params = {}) {
  const p = { Fields: DEFAULT_FIELDS + ',ItemCounts', EnableImageTypes: 'Primary', ...params };
  const res = await fetch(`${_server}/Artists/AlbumArtists?${qs(p)}`, { headers: headers() });
  if (!res.ok) throw new Error(`artists failed (${res.status})`);
  const j = await res.json();
  return { Items: j.Items, TotalRecordCount: j.TotalRecordCount };
}

export async function getAlbumArtists(params = {}) {
  const p = { Fields: DEFAULT_FIELDS + ',ItemCounts', EnableImageTypes: 'Primary', ...params };
  const res = await fetch(`${_server}/Artists/AlbumArtists?${qs(p)}`, { headers: headers() });
  if (!res.ok) throw new Error(`album artists failed (${res.status})`);
  const j = await res.json();
  return { Items: j.Items, TotalRecordCount: j.TotalRecordCount };
}

export async function getGenres(params = {}) {
  const res = await fetch(`${_server}/Genres?${qs(params)}`, { headers: headers() });
  if (!res.ok) throw new Error(`genres failed (${res.status})`);
  return res.json();
}

// ---- search ----
export async function search(term, params = {}) {
  return getItems({
    SearchTerm: term, Recursive: true,
    IncludeItemTypes: params.IncludeItemTypes || 'Audio,MusicAlbum,MusicArtist,Playlist',
    Limit: params.Limit || 60,
    MediaTypes: 'Audio'
  });
}

// ---- favorites ----
export async function isFavorite(itemId) {
  const it = await getItem(itemId);
  return !!(it.UserData && it.UserData.IsFavorite);
}
export async function setFavorite(itemId, fav) {
  const url = `${_server}/Users/${_userId}/FavoriteItems/${itemId}`;
  const res = await fetch(url, { method: fav ? 'POST' : 'DELETE', headers: headers() });
  return maybeJson(res);
}
export async function getFavoriteSongs(params = {}) {
  return getItems({ Filters: 'IsFavorite', IncludeItemTypes: 'Audio', Recursive: true, SortBy: 'SortName', ...params });
}

// ---- playlists ----
export async function getPlaylists(params = {}) {
  return getItems({ IncludeItemTypes: 'Playlist', Recursive: true, SortBy: 'SortName', EnableUserData: true, ...params });
}
export async function createPlaylist(name) {
  const res = await fetch(`${_server}/Playlists?${qs({ Name: name, userId: _userId })}`, { method: 'POST', headers: headers() });
  return maybeJson(res);
}
export async function addToPlaylist(playlistId, itemIds) {
  const res = await fetch(`${_server}/Playlists/${playlistId}/Items?${qs({ Ids: itemIds, userId: _userId })}`, { method: 'POST', headers: headers() });
  return maybeJson(res);
}
export async function removeFromPlaylist(playlistId, entryIds) {
  const res = await fetch(`${_server}/Playlists/${playlistId}/Items?${qs({ EntryIds: entryIds })}`, { method: 'DELETE', headers: headers() });
  return maybeJson(res);
}
export async function deletePlaylist(playlistId) {
  const res = await fetch(`${_server}/Items/${playlistId}`, { method: 'DELETE', headers: headers() });
  if (!res.ok) throw new Error(`delete playlist failed (${res.status})`);
  return maybeJson(res);
}
export async function renameItem(id, name) {
  const res = await fetch(`${_server}/Items/${id}?${qs({ newName: name })}`, { method: 'POST', headers: headers() });
  return maybeJson(res);
}

// ---- library / home ----
export async function getViews() {
  const res = await fetch(`${_server}/Users/${_userId}/Views`, { headers: headers() });
  if (!res.ok) throw new Error('views failed');
  return res.json().then(j => j.Items || []);
}
export async function getMusicLibraries() {
  const views = await getViews();
  return views.filter(v => v.CollectionType === 'music' || v.CollectionType === 'musicvideos' || v.CollectionType === 'playlists');
}
export async function getLatest(params = {}) {
  return getItems({
    Recursive: true, SortBy: 'DateCreated', SortOrder: 'Descending',
    IncludeItemTypes: 'Audio,MusicAlbum', Limit: 60,
    EnableUserData: true, ...params
  });
}

// ---- genres / artists top ----
export async function getRecentlyPlayedSongs() {
  return getItems({
    Recursive: true, SortBy: 'DateLastPlayed', SortOrder: 'Descending',
    IncludeItemTypes: 'Audio', EnableUserData: true, Limit: 30
  }).then(j => j.Items.filter(i => i.UserData && i.UserData.LastPlayedDate));
}

// ---- images & streams (plain URLs for <img>/<audio>) ----
export function imgUrl(item, { size = 640, fallback = null } = {}) {
  if (!item) return fallback;
  const tag = item.ImageTags && item.ImageTags.Primary;
  if (!tag) return fallback;
  return `${_server}/Items/${item.Id}/Images/Primary?maxWidth=${size}&quality=90&tag=${tag}&api_key=${_token}`;
}
export function backImgUrl(item, size = 1200) {
  if (!item) return null;
  if (item.BackdropImageTags && item.BackdropImageTags.length) {
    return `${_server}/Items/${item.Id}/Images/Backdrop?maxWidth=${size}&quality=80&api_key=${_token}`;
  }
  if (item.ImageTags && item.ImageTags.Primary) {
    return `${_server}/Items/${item.Id}/Images/Primary?maxWidth=${size}&quality=80&api_key=${_token}`;
  }
  return null;
}
export function streamUrl(itemId) {
  return `${_server}/Audio/${itemId}/stream?static=true&deviceId=${_deviceId}&api_key=${_token}`;
}
export function imageUrlRaw(id, tag, size = 640) {
  return `${_server}/Items/${id}/Images/Primary?maxWidth=${size}&quality=90&tag=${tag}&api_key=${_token}`;
}

// ---- playback reporting ----
export async function report(started, itemId, { positionTicks = 0, isPaused = false, playSessionId, volume = 100 } = {}) {
  const body = {
    ItemId: itemId,
    PlayMethod: 'DirectStream',
    MediaSourceId: itemId,
    AudioStreamIndex: 0,
    SubtitleStreamIndex: null,
    PositionTicks: positionTicks,
    PlaySessionId: playSessionId,
    IsPaused: isPaused,
    IsMuted: false,
    VolumeLevel: volume
  };
  const endpoint = started ? `${_server}/Sessions/Playing` : `${_server}/Sessions/Playing/Progress`;
  try {
    await fetch(endpoint, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  } catch (e) { /* ignore */ }
}
export async function reportStop(itemId, { positionTicks = 0, playSessionId } = {}) {
  const body = {
    ItemId: itemId, PlayMethod: 'DirectStream', MediaSourceId: itemId,
    PositionTicks: positionTicks, PlaySessionId: playSessionId,
    IsPaused: false, IsMuted: false
  };
  try {
    await fetch(`${_server}/Sessions/Playing/Stopped`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  } catch (e) { /* ignore */ }
}

export function ticksToSec(t) { return t ? t / 1e7 : 0; }
export function secToTicks(s) { return Math.max(0, Math.round(s * 1e7)); }
