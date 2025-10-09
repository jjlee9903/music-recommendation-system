export function parseTopTagsCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const rows = lines.slice(1).map(l => {
    const [tag, count] = l.split(",");
    return { tag: (tag || "").trim(), count: Number(count || 0) };
  }).filter(r => r.tag);
  return rows.sort((a,b)=> (b.count||0)-(a.count||0)).slice(0, 500).map(r => r.tag);
}

export interface TopSong {
  id: number;
  title: string;
  artist: string;
}

export async function loadTopSongsCSV(): Promise<TopSong[]> {
  const res = await fetch("/top_songs.csv");
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  const rows = lines.slice(1).map((l) => {
    const [id, title, artist] = l.split(",");
    return {
      id: Number(id?.trim()),
      title: (title || "").trim(),
      artist: (artist || "").trim(),
    };
  });
  return rows.slice(0, 500); // 상위 500개만 사용
}
