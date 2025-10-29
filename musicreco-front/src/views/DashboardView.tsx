import { useEffect, useState } from "react";
import { Music, Play } from "lucide-react";                   // ✅ Play 아이콘 추가
import TagPicker from "@/components/TagPicker";
import type { Song, UserInfo } from "@/types";
import type { TopSong } from "@/utils/csv";
import { searchSongs, searchYoutubeVideoId } from "@/services/api"; // ✅ 유튜브 검색 API 추가
import { useGenreMap } from "@/hooks/useGenreMap";

export default function DashboardView({
  user,
  topTags,
  random30,
  randomSongs,
  selectedTags,
  selectedSongs,
  setSelectedTags,
  setRandom30,
  setRandomSongs,
  toggleSong,
  onGenerate,
  favorites,
  perSongRecs,
  forYouRecs,
  goLibrary,
  onLogout,
}: {
  user: UserInfo | null;
  topTags: string[];
  random30: string[];
  randomSongs: TopSong[];
  selectedTags: string[];
  selectedSongs: Song[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  setRandom30: React.Dispatch<React.SetStateAction<string[]>>;
  setRandomSongs: React.Dispatch<React.SetStateAction<TopSong[]>>;
  toggleSong: (s: Song) => void;
  onGenerate: () => void;
  favorites: Song[];
  perSongRecs: Record<number, Song[]>;
  forYouRecs: Song[];
  goLibrary: () => void;
  onLogout: () => void;
}) {
  // ✅ 좋아요 목록에서 랜덤 4곡 픽
  const [favPicks, setFavPicks] = useState<Song[]>([]);
  useEffect(() => {
    if (!favorites || favorites.length === 0) {
      setFavPicks([]);
      return;
    }
    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
    setFavPicks(shuffled.slice(0, 4));
  }, [favorites]);

  // ✅ 장르 매핑
  const { mapGenreCodes } = useGenreMap();
  const toGenreText = (g?: string) => mapGenreCodes(g ?? "").join(", ");

  // ✅ 노래 검색 상태
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<Song[]>([]);

  // ✅ 대시보드 하단 YouTube 플레이어 상태
  const [videoId, setVideoId] = useState<string | null>(null);

  // ✅ 유튜브 재생 함수 (타이틀/아티스트로 embeddable videoId 조회)
  const playByQuery = async (title: string, artist: string) => {
    const cleanedTitle = title.replace(/\(.*?\)|\[.*?]|official\s*video|mv/gi, "").trim();
    const cleanedArtist = (artist || "").replace(/\(.*?\)|\[.*?]/g, "").trim();
    const q = `${cleanedTitle} ${cleanedArtist} official audio`.trim();
    const vid = await searchYoutubeVideoId(q);
    if (!vid) {
      // 실패 시 새탭 검색(원치 않으면 주석)
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank");
      return;
    }
    setVideoId(vid);
  };

  // ✅ 디바운스 검색
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchSongs(query.trim(), 20);
        const mapped: Song[] = res.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album,
          genre: toGenreText(s.genre),
        }));
        setResults(mapped);
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Music className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">MusicReco</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goLibrary}
              className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              내 플레이리스트 보기
            </button>
            <div className="text-gray-600">안녕하세요, {user?.name}님</div>
            <button
              onClick={onLogout}
              className="text-sm px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 상단 2열: TagPicker | 인기곡/검색 */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TagPicker */}
        <TagPicker
          topTags={topTags}
          randomPool={random30}
          selected={selectedTags}
          onSelect={(t) => setSelectedTags((prev) => (prev.includes(t) ? prev : [...prev, t]))}
          onUnselect={(t) => setSelectedTags((prev) => prev.filter((x) => x !== t))}
          onRandomize={() => {
            const pool = [...topTags].filter((t) => !selectedTags.includes(t));
            const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 30);
            setRandom30(shuffled);
          }}
        />

        {/* 관심 있는 노래 선택 + 검색 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Music className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">관심 있는 노래를 선택하세요</h2>
            <button
              onClick={() => {
                const shuffled = [...randomSongs].sort(() => Math.random() - 0.5).slice(0, 20);
                setRandomSongs(shuffled);
              }}
              className="ml-auto text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              랜덤 새로고침
            </button>
          </div>

          {/* 🔎 검색 인풋 */}
          <div className="mb-4 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="노래 제목이나 가수를 입력하세요"
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); }}
                className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                지우기
              </button>
            )}
          </div>

          {/* 검색 결과 */}
          {query && (
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">
                검색 결과 {searchLoading ? "(불러오는 중...)" : `(${results.length}곡)`}
              </div>
              <div className="space-y-2 max-h-64 overflow-auto border rounded-lg p-2">
                {results.map((r) => {
                  const selected = selectedSongs.some((x) => x.id === r.id);
                  const gtxt = r.genre || "";
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                        selected ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSong({ ...r, genre: gtxt })}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">{r.title}</div>
                        <div className="text-xs text-gray-500">{r.artist}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {gtxt && (
                          <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded">
                            {gtxt}
                          </span>
                        )}
                        {/* 🔊 검색 결과에서도 바로 재생하고 싶으면 버튼 활성화 */}
                        {/* <button onClick={(e)=>{e.stopPropagation(); playByQuery(r.title, r.artist);}}
                                className="p-1 rounded bg-green-500 text-white hover:bg-green-600">
                              <Play className="h-3 w-3" />
                           </button> */}
                      </div>
                    </div>
                  );
                })}
                {!searchLoading && results.length === 0 && (
                  <div className="text-xs text-gray-400 px-2 py-1">검색 결과가 없어요.</div>
                )}
              </div>
            </div>
          )}

          {/* 인기곡 20 랜덤 (선택 영역) */}
          <div className="space-y-3">
            {randomSongs.map((s) => {
              const selected = selectedSongs.some((x) => x.id === s.id);
              const gtxt = toGenreText((s as any).genre);
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    selected ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    toggleSong({ id: s.id, title: s.title, artist: s.artist, album: "", genre: gtxt })
                  }
                >
                  <div>
                    <div className="font-medium text-gray-800">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.artist}</div>
                    {gtxt && (
                      <div className="text-[11px] inline-block mt-1 px-2 py-0.5 rounded bg-green-100 text-green-700">
                        {gtxt}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-sm text-gray-500 mt-4">선택된 곡: {selectedSongs.length}개</div>
        </div>

        {/* 아래 전체 폭: 좋아요 기반 추천 + For You */}
        <div className="lg:col-span-2">
          {favorites.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">최근 좋아요 누른 곡과 비슷한 노래는 어때요?</h3>
                <button
                  onClick={() => {
                    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
                    setFavPicks(shuffled.slice(0, 4));
                  }}
                  className="ml-auto text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  랜덤 새로고침
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favPicks.map((f) => (
                  <div key={f.id} className="border rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-2">#{f.title} — {f.artist}</div>
                    <div className="space-y-2">
                      {(perSongRecs[f.id] || []).map((r) => {
                        const selected = selectedSongs.some((x) => x.id === r.id);
                        return (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                              selected ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                            }`}
                            onClick={() => toggleSong(r)}
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-800">{r.title}</div>
                              <div className="text-xs text-gray-500">{r.artist}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                {r.genre}
                              </span>
                              {/* ▶ 버튼: 장르 옆에 붙여서 재생 */}
                              <button
                                onClick={(e) => { e.stopPropagation(); playByQuery(r.title, r.artist); }}
                                className="p-1 rounded bg-green-500 text-white hover:bg-green-600"
                                title="재생"
                              >
                                <Play className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(!perSongRecs[f.id] || perSongRecs[f.id].length === 0) && (
                        <div className="text-xs text-gray-400">추천 로딩 중...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {favorites.length >= 5 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">좋아요 누른 곡 청취자들이 같이 들은 노래는 어때요?</h3>
              <div className="space-y-2">
                {forYouRecs.map((r) => {
                  const selected = selectedSongs.some((x) => x.id === r.id);
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                        selected ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSong(r)}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">{r.title}</div>
                        <div className="text-xs text-gray-500">{r.artist}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded">
                          {r.genre}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); playByQuery(r.title, r.artist); }}
                          className="p-1 rounded bg-green-500 text-white hover:bg-green-600"
                          title="재생"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {forYouRecs.length === 0 && (
                  <div className="text-xs text-gray-400">추천 로딩 중...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-2 mb-6">
        <button
          onClick={onGenerate}
          disabled={selectedTags.length === 0 && selectedSongs.length === 0}
          className={`px-8 py-4 rounded-xl font-semibold transition ${
            selectedTags.length > 0 || selectedSongs.length > 0
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          AI 플레이리스트 생성하기
        </button>
      </div>

      {/* 🔻 페이지 맨 아래 YouTube 플레이어 */}
      {videoId && (
        <div className="max-w-6xl mx-auto px-4 pb-10">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
              title="YouTube Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
