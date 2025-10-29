// views/MyPlaylistsView.tsx
import { useEffect, useState } from "react";
import { FileMusic, FolderOpen, Trash2, Music } from "lucide-react";
import { listMyPlaylists, getPlaylistDetail, deletePlaylist } from "@/services/api";
import type { Song } from "@/types";

type MinimalPlaylist = {
  id: number;
  title: string;
  tags: string[];
  song_count: number;
  created_at: string;
};

export default function MyPlaylistsView({
  onBack,
  onOpenPlaylist, // 상세 불러와서 App의 PlaylistView로 전환
}: {
  onBack: () => void;
  onOpenPlaylist: (payload: { title: string; tags: string[]; songs: Song[] }) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MinimalPlaylist[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setErr(null);
    try {
        const list = await listMyPlaylists(); // 이제 배열 그대로 옴
        // song_count는 items 길이로 보정
        const norm = (list || []).map((pl: any) => ({
        id: pl.id,
        title: pl.title,
        tags: pl.tags || [],
        song_count: (pl.items?.length ?? 0),
        created_at: pl.created_at || "",
        }));
        setItems(norm);
    } catch (e) {
        setErr("목록을 불러오지 못했어요.");
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    fetchList();
  }, []);

  // 상세 열기도 응답이 바로 PlaylistOut이므로 그대로 사용
    const openOne = async (id: number) => {
    try {
        const data = await getPlaylistDetail(id); // {id,title,tags,items:[...]}
        const songs: Song[] = (data.items || []).map((r: any) => ({
        id: r.song_id,
        title: r.title,
        artist: (r.artists || []).join(", "),
        album: "",
        genre: (r.genres || []).join(", "),
        }));
        onOpenPlaylist({ title: data.title || "플레이리스트", tags: data.tags || [], songs });
    } catch {
        alert("플레이리스트를 열 수 없어요.");
    }
    };

  const removeOne = async (id: number) => {
    if (!confirm("정말 삭제할까요?")) return;
    const ok = await deletePlaylist(id);
    if (ok) fetchList();
    else alert("삭제 실패");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="text-green-500 hover:text-green-600">← 돌아가기</button>
            <Music className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">내 플레이리스트</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && <div className="text-gray-500">불러오는 중...</div>}
        {err && <div className="text-red-500">{err}</div>}

        {!loading && items.length === 0 && (
          <div className="text-gray-500">저장된 플레이리스트가 없어요.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((pl) => (
            <div key={pl.id} className="bg-white rounded-xl shadow-sm p-4 border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-800">{pl.title}</div>
                  {pl.created_at && (
                    <div className="text-xs text-gray-400 mt-1">
                        {new Date(pl.created_at).toLocaleString()}
                    </div>
                    )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openOne(pl.id)}
                    className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 flex items-center gap-1"
                    title="열기"
                  >
                    <FolderOpen className="h-4 w-4" /> 열기
                  </button>
                  <button
                    onClick={() => removeOne(pl.id)}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" /> 삭제
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(pl.tags || []).slice(0, 6).map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">#{t}</span>
                ))}
                {pl.tags?.length > 6 && <span className="text-xs text-gray-400">+{pl.tags.length - 6}</span>}
              </div>
              <div className="text-sm text-gray-600 mt-3 flex items-center gap-1">
                <FileMusic className="h-4 w-4" /> {pl.song_count}곡
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
