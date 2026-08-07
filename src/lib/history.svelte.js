// Simple in-app navigation history for the back/forward buttons.
import { goto } from '$app/navigation';

export const hist = $state({ stack: [], idx: -1, suppress: false });

export function register(path) {
  if (hist.suppress) { hist.suppress = false; return; }
  if (hist.stack[hist.idx] === path) return;
  hist.stack = hist.stack.slice(0, hist.idx + 1);
  hist.stack.push(path);
  hist.idx = hist.stack.length - 1;
  if (hist.stack.length > 200) { hist.stack.shift(); hist.idx--; }
}
export function goBack() {
  if (hist.idx > 0) { hist.idx--; hist.suppress = true; goto(hist.stack[hist.idx]); }
}
export function goForward() {
  if (hist.idx < hist.stack.length - 1) { hist.idx++; hist.suppress = true; goto(hist.stack[hist.idx]); }
}
export function canGoBack() { return hist.idx > 0; }
export function canGoForward() { return hist.idx < hist.stack.length - 1; }
