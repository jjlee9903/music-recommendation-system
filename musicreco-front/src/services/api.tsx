import type { ApiRecItem } from "@/types";

const API = import.meta.env.VITE_API_URL as string;

function bearer() {
  const t = localStorage.getItem("mr_token") || "";
  return { Authorization: `Bearer ${t}` };
}

// ---------- Auth ----------
export async function signup(name: string, email: string, password: string) {
  const r = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { access_token: string };
}

export async function login(email: string, password: string) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { access_token: string };
}

export async function getMe() {
  const r = await fetch(`${import.meta.env.VITE_API_URL as string}/auth/me`, {
    headers: bearer(),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { name: string; email: string };
}

// ---------- Recommend (기존 유지) ----------
export async function recommendBySongTags(songId: number, k = 5, exclude: number[] = []) {
  const r = await fetch(`${API}/recommend/by-song-tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_id: songId, k, exclude }),
  });
  const j = await r.json();
  return (j.items || []) as ApiRecItem[];
}

export async function recommendByTags(tags: string[], k = 20, exclude: number[] = []) {
  if (!tags.length) return [] as ApiRecItem[];
  const r = await fetch(`${API}/recommend/by-tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags, k, exclude }),
  });
  const j = await r.json();
  return (j.items || []) as ApiRecItem[];
}

export async function recommendByDAE(seedIds: number[], k = 20, exclude: number[] = []) {
  if (!seedIds.length) return [] as ApiRecItem[];
  const r = await fetch(`${API}/recommend/by-dae`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed_song_ids: seedIds, k, exclude }),
  });
  const j = await r.json();
  return (j.items || []) as ApiRecItem[];
}

// ---------- Playlist ----------
type MinimalPlaylist = {
  id: number;
  title: string;
  tags: string[];
  created_at?: string;
  items?: Array<{ position: number }>;
  // 백엔드 PlaylistOut 스키마에 맞춰 유연하게
};

// ✅ 백엔드 스펙: POST /playlists, body = { title, tags, items:[{song_id,title,artists[],genres[]}, ...] }
export async function createPlaylist(payload: {
  title: string;
  tags: string[];
  items: Array<{ song_id: number; title: string; artists: string[]; genres: string[] }>;
}) {
  const r = await fetch(`${API}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer() },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`createPlaylist failed: ${await r.text()}`);
  return await r.json();
}

// ✅ GET /playlists (리스트를 그대로 배열로 반환)
export async function listMyPlaylists(): Promise<MinimalPlaylist[]> {
  const r = await fetch(`${API}/playlists`, { headers: bearer() });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as MinimalPlaylist[];
}

// ✅ GET /playlists/{id}
export async function getPlaylistDetail(id: number) {
  const r = await fetch(`${API}/playlists/${id}`, { headers: bearer() });
  if (!r.ok) throw new Error(await r.text());
  return await r.json(); // PlaylistOut
}

// ✅ DELETE /playlists/{id}
export async function deletePlaylist(id: number) {
  const r = await fetch(`${API}/playlists/${id}`, {
    method: "DELETE",
    headers: bearer(),
  });
  return r.ok;
}

// Song Search 
export async function searchSongs(q: string, limit = 20) {
  const r = await fetch(`${API}/songs/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  // 반환: [{id,title,artist,album,genre}]
  return (j.songs || []) as Array<{
    id: number; title: string; artist: string; album: string; genre: string;
  }>;
}

// YouTube Search (videoId만 반환)
export async function searchYoutubeVideoId(q: string): Promise<string | null> {
  const API = import.meta.env.VITE_API_URL || "";
  const r = await fetch(`${API}/yt/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) return null;
  const j = await r.json();
  return j.videoId || null;
}

