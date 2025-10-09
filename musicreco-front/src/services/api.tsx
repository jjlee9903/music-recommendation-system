import type { ApiRecItem } from "@/types";

const API = import.meta.env.VITE_API_URL as string;

export async function fetchTopTags(limit = 60) {
  const r = await fetch(`${API}/tags?limit=${limit}`);
  const j = await r.json();
  return (j.tags || []) as string[];
}

export async function fetchSampleSongs(limit = 30) {
  const r = await fetch(`${API}/songs/sample?limit=${limit}`);
  const j = await r.json();
  return (j.songs || []) as any[];
}

export async function recommendByTags(tags: string[], k = 20, exclude: number[] = []) {
  if (!tags.length) return [] as ApiRecItem[];
  const r = await fetch(`${API}/recommend/by-tags`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags, k, exclude }),
  });
  const j = await r.json();
  return (j.items || []) as ApiRecItem[];
}

export async function recommendByDAE(seedIds: number[], k = 20, exclude: number[] = []) {
  if (!seedIds.length) return [] as ApiRecItem[];
  const r = await fetch(`${API}/recommend/by-dae`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed_song_ids: seedIds, k, exclude }),
  });
  const j = await r.json();
  return (j.items || []) as ApiRecItem[];
}
