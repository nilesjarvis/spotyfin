export function fmtDurationMs(ms) {
  if (ms == null) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  if (isNaN(totalSec)) return '0:00';
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function fmtDurationTicks(ticks) {
  if (!ticks) return '0:00';
  return fmtDurationMs(ticks / 1e4);
}

export function artistList(item) {
  if (item.Artists && item.Artists.length) return item.Artists;
  if (item.ArtistItems && item.ArtistItems.length) return item.ArtistItems.map(a => a.Name);
  if (item.AlbumArtist) return [item.AlbumArtist];
  if (item.AlbumArtists && item.AlbumArtists.length) return item.AlbumArtists.map(a => a.Name);
  return item.ArtistName ? [item.ArtistName] : [];
}
export function artistStr(item) {
  return artistList(item).join(', ');
}
export function firstArtistId(item) {
  if (item.ArtistItems && item.ArtistItems.length) return item.ArtistItems[0].Id;
  if (item.AlbumArtists && item.AlbumArtists.length) return item.AlbumArtists[0].Id;
  return null;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function plural(n, word, word2) {
  return n === 1 ? `${n} ${word}` : `${n} ${word2 || word + 's'}`;
}

export function readableCount(n) {
  if (n == null) return '';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}
