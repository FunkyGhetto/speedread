import type { Bookmark } from "../types/config";

let bookmarks = $state<Bookmark[]>([]);

export function getBookmarks() { return bookmarks; }

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.slice(0, 500));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function addBookmark(
  text: string,
  title: string,
  wordIndex: number,
  wpm: number,
  totalWords: number
) {
  const textHash = await hashText(text);
  const existing = bookmarks.findIndex(b => b.textHash === textHash);
  const bookmark: Bookmark = { textHash, title, wordIndex, wpm, timestamp: Date.now(), totalWords };
  if (existing >= 0) {
    bookmarks = [...bookmarks.slice(0, existing), bookmark, ...bookmarks.slice(existing + 1)];
  } else {
    bookmarks = [...bookmarks, bookmark];
  }
  return bookmark;
}

export async function findBookmark(text: string): Promise<Bookmark | null> {
  const textHash = await hashText(text);
  return bookmarks.find(b => b.textHash === textHash) || null;
}

export function removeBookmark(textHash: string) {
  bookmarks = bookmarks.filter(b => b.textHash !== textHash);
}

export function loadBookmarks(bm: Bookmark[]) {
  bookmarks = bm;
}
