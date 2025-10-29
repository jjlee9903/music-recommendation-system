import { Heart, Music, Play } from "lucide-react"; // ✅ 필요한 아이콘만
import { useState } from "react";
import type { Song } from "@/types";
import { searchYoutubeVideoId } from "@/services/api"; 

export default function PlaylistView({
  title,
  tags,
  songs,
  currentSong,
  isPlaying,          // (하단 컨트롤과 연동 안 하면 그냥 보관만)
  onBack,
  onPlaySong,
  onTogglePlay,       // (하단 컨트롤과 연동 안 하면 그냥 보관만)
  onToggleHeart,
  likedIds,
  onRenameTitle,
  onSave,
  saved,
}: {
  title: string;
  tags: string[];
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onBack: () => void;
  onPlaySong: (s: Song) => void;
  onTogglePlay: () => void;
  onToggleHeart: (s: Song) => void;
  likedIds: Set<number>;
  onRenameTitle: (t: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  // ✅ YouTube 검색용 쿼리 상태
   const [videoId, setVideoId] = useState<string | null>(null);

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft(title);
  };
  const saveEdit = () => {
    const t = draft.trim() || title;
    onRenameTitle(t);
    setEditing(false);
  };

  // 곡 클릭 → 백엔드로 embeddable videoId 조회 → iframe 재생
  const playByQuery = async (song: Song) => {
    const cleanedTitle = song.title.replace(/\(.*?\)|\[.*?]|official\s*video|mv/gi, "").trim();
    const cleanedArtist = (song.artist || "").replace(/\(.*?\)|\[.*?]/g, "").trim();
    const q = `${cleanedTitle} ${cleanedArtist}`.trim();

    const vid = await searchYoutubeVideoId(q);
    if (!vid) {
      // 최후 수단: 새 탭으로 유튜브 검색 열기
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank");
      return;
    }
    setVideoId(vid);
    onPlaySong(song);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="text-green-500 hover:text-green-600">
              ← 돌아가기
            </button>
            <Music className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">추천 플레이리스트</h1>
          </div>
          <button
            onClick={onSave}
            disabled={saved}
            className={`px-4 py-2 rounded-full text-white font-medium ${
              saved ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {saved ? "저장 완료" : "내 플레이리스트로 저장"}
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 아트/제목/태그 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Music className="h-16 w-16 text-white" />
          </div>

          {!editing ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
              <button onClick={startEdit} className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200">
                제목 수정
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="w-80 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="플레이리스트 제목"
                autoFocus
              />
              <button onClick={saveEdit} className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600">
                저장
              </button>
              <button onClick={cancelEdit} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
                취소
              </button>
            </div>
          )}

          <p className="text-gray-600 mb-4">선택한 태그와 노래에 기반한 추천 플레이리스트</p>

          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>

          {songs[0] && (
            <button
              onClick={() => playByQuery(songs[0])}
              className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 transition flex items-center space-x-2 mx-auto"
            >
              <Play className="h-5 w-5" />
              <span>전체 재생</span>
            </button>
          )}
        </div>

        {/* 곡 목록 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">곡 목록</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {songs.map((song, idx) => {
              const liked = likedIds.has(song.id);
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${
                    isCurrent ? "bg-green-50" : ""
                  }`}
                  onClick={() => playByQuery(song)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 text-center text-sm text-gray-400">{idx + 1}</div>
                    <div>
                      <div className="font-medium text-gray-800">{song.title}</div>
                      <div className="text-sm text-gray-500">{song.artist}</div>
                    </div>
                  </div>

                  <button
                    className={`transition ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHeart(song);
                    }}
                    aria-label={liked ? "좋아요 취소" : "좋아요"}
                    title={liked ? "좋아요 취소" : "좋아요"}
                  >
                    {liked ? <Heart className="h-4 w-4" fill="currentColor" /> : <Heart className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ YouTube iframe (videoId 기반) */}
            {videoId && (
                <div className="mt-10">
                    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                        <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
                        title="YouTube Music Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        />
                    </div>
                </div>
        )}
      </div>
    </div>
  );
}
