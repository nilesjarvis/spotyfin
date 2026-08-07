import * as player from './player.svelte.js';
import * as jf from './jellyfin.js';
import * as ui from './ui.svelte.js';
import { goto } from '$app/navigation';
import { artistStr, firstArtistId } from './utils.js';

// Queue helpers
export function playNow(tracks, startIndex = 0, opts = {}) {
  player.loadAndPlay(tracks, startIndex, opts);
  if (tracks[startIndex]) player.recordRecent(tracks[startIndex]);
}
export async function addToQueue(tracks, opts = {}) {
  if (!tracks.length) return;
  if (player.state.queue.length === 0) {
    player.playTracks(tracks, 0, opts);
    return 'Playing now';
  }
  player.state.queue = player.state.queue.concat(tracks);
  return 'Added to queue';
}

export function buildTrackMenu(track, ctx = {}) {
  const items = [];
  const isFav = !!(track.UserData && track.UserData.IsFavorite);
  const albumId = track.AlbumId;
  const artistId = ctx.artistId || firstArtistId(track);
  const albumArtist = artistStr(track);

  items.push({ label: 'Play', icon: 'play', action: () => playNow(ctx.albums || [track], ctx.albumsIndex || 0) });
  items.push({ label: 'Add to queue', icon: 'queue', action: async () => { await addToQueue([track]); ui.toast('Added to queue', 'success'); } });
  items.push({ label: isFav ? 'Remove from your Liked Songs' : 'Save to your Liked Songs', icon: isFav ? 'heart' : 'heart_fill', action: async () => { await jf.setFavorite(track.Id, !isFav); if (ctx.onChange) ctx.onChange(); } });
  items.push({ separator: true });
  items.push({ label: 'Add to playlist', icon: 'plus', action: () => ui.openSavePlaylist([track.Id], track) });

  if (ctx.onRemoveFromPlaylist) {
    items.push({ separator: true });
    items.push({ label: 'Remove from this playlist', icon: 'x', danger: true, action: ctx.onRemoveFromPlaylist });
  }
  return items;
}

export function buildAlbumMenu(album) {
  const items = [];
  items.push({ label: 'Play', icon: 'play', action: () => playAlbum(album) });
  items.push({ label: 'Add to queue', icon: 'queue', action: async () => { const tracks = await getAlbumTracks(album.Id); await addToQueue(tracks); ui.toast('Added to queue','success'); } });
  items.push({ label: 'Add to playlist', icon: 'plus', action: () => ui.openSavePlaylist([album.Id], { Id: album.Id, Name: album.Name }) });
  return items;
}

export function buildPlaylistMenu(playlist, ctx = {}) {
  const items = [];
  items.push({ label: 'Play', icon: 'play', action: () => ctx.onPlay && ctx.onPlay() });
  items.push({ label: 'Add to queue', icon: 'queue', action: async () => { const tracks = await getPlaylistTracks(playlist.Id); await addToQueue(tracks); ui.toast('Added to queue','success'); } });
  items.push({ separator: true });
  items.push({ label: 'Edit details', icon: 'pen', action: () => ctx.onRename && ctx.onRename() });
  items.push({ label: 'Delete', icon: 'trash', danger: true, action: () => ctx.onDelete && ctx.onDelete() });
  return items;
}

export async function getAlbumTracks(albumId) {
  const r = await jf.getChildren(albumId, 'Audio');
  return r.Items || [];
}
export async function getPlaylistTracks(playlistId) {
  const r = await jf.getChildren(playlistId, 'Audio');
  return r.Items || [];
}

export async function loadAndPlayAlbum(album, startIndex = 0) {
  const tracks = await getAlbumTracks(album.Id);
  playNow(tracks, startIndex, { contextTitle: album.Name, contextType: 'album' });
  return tracks;
}
export async function loadAndPlayPlaylist(playlist, startIndex = 0) {
  const tracks = await getPlaylistTracks(playlist.Id);
  playNow(tracks, startIndex, { contextTitle: playlist.Name, contextType: 'playlist' });
  return tracks;
}
