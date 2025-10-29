import { useEffect, useState } from "react";
import type { ViewType, ApiRecItem, Song, UserInfo } from "@/types";
import {
  recommendByDAE,
  recommendBySongTags,
  recommendByTags,
  createPlaylist,
  login,
  signup,
  getMe,
} from "@/services/api";
import { useGenreMap } from "@/hooks/useGenreMap";
import { interleaveDedup } from "@/utils/interleave";
import LoginView from "@/views/LoginView";
import SignupView from "@/views/SignupView";
import DashboardView from "@/views/DashboardView";
import PlaylistView from "@/views/PlaylistView";
import MyPlaylistsView from "@/views/MyPlaylistsView";
import { loadTopSongsCSV } from "@/utils/csv";
import type { TopSong } from "@/utils/csv";

// public/top_tags.csv 는 public에서 직접 fetch
async function loadTopTagsCSV(): Promise<string[]> {
  const res = await fetch("/top_tags.csv");
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  const rows = lines
    .slice(1)
    .map((l) => {
      const [tag, count] = l.split(",");
      return { tag: (tag || "").trim(), count: Number(count || 0) };
    })
    .filter((r) => r.tag);
  return rows
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 500)
    .map((r) => r.tag);
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [user, setUser] = useState<UserInfo | null>(null);

  // 태그
  const [topTags, setTopTags] = useState<string[]>([]);
  const [random30, setRandom30] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 인기곡(상위 500 중 랜덤 20 표기)
  const [random20, setRandom20] = useState<TopSong[]>([]);

  // 선택/플레이어/플레이리스트
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("AI 추천 플레이리스트");
  const [playlistTags, setPlaylistTags] = useState<string[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 좋아요 & 추천 캐시
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [perSongRecs, setPerSongRecs] = useState<Record<number, Song[]>>({});
  const [forYouRecs, setForYouRecs] = useState<Song[]>([]);

  const { mapGenreCodes } = useGenreMap();

  // 플레이리스트 저장 상태
  const [saved, setSaved] = useState(false);

  // ---------- 로그아웃 ----------
  const handleLogout = () => {
    localStorage.removeItem("mr_token");
    setUser(null);
    setCurrentView("login");
  };

  // ---------- 저장된 플레이리스트 열기 ----------
  const openSavedPlaylist = ({
    title,
    tags,
    songs,
  }: {
    title: string;
    tags: string[];
    songs: Song[];
  }) => {
    setPlaylistTitle(title);
    setPlaylistTags(tags);
    setPlaylistSongs(songs);
    setSaved(true);
    setCurrentView("playlist");
  };

  // ---------- 플레이리스트 저장 (백엔드 스키마: items[]) ----------
  const saveCurrentPlaylist = async () => {
    if (!playlistSongs.length) return alert("플레이리스트에 곡이 없어요.");
    const token = localStorage.getItem("mr_token");
    if (!token) {
      alert("로그인이 필요합니다. 로그인 후 다시 시도해주세요.");
      setCurrentView("login");
      return;
    }
    try {
      const items = playlistSongs.map((s) => ({
        song_id: s.id,
        title: s.title,
        artists: s.artist ? s.artist.split(",").map((x) => x.trim()).filter(Boolean) : [],
        genres: s.genre ? s.genre.split(",").map((x) => x.trim()).filter(Boolean) : [],
      }));

      await createPlaylist({
        title: (playlistTitle || "").trim() || "나만의 플레이리스트",
        tags: playlistTags,
        items,
      });

      setSaved(true);
      alert("플레이리스트가 저장되었습니다! 🎉");
    } catch (e: any) {
      alert(e?.message || "저장에 실패했어요. 로그인/토큰을 확인해주세요.");
    }
  };

  // ---------- 공통 유틸 ----------
  const resetSelections = () => {
    setSelectedSongs([]);
    setSelectedTags([]);
    setCurrentSong(null);
    setIsPlaying(false);
  };
  const handleBackToDashboard = () => {
    resetSelections();
    setSaved(false);
    setCurrentView("dashboard");
  };

  // ---------- 초기 로드 ----------
  useEffect(() => {
    (async () => {
      const [tags, songs] = await Promise.all([loadTopTagsCSV(), loadTopSongsCSV()]);
      setTopTags(tags);
      setRandom30([...tags].sort(() => Math.random() - 0.5).slice(0, 30));
      setRandom20([...songs].sort(() => Math.random() - 0.5).slice(0, 20));
    })().catch(console.error);
  }, []);

  // ---------- 좋아요 로컬스토리지 동기화 ----------
  useEffect(() => {
    const raw = localStorage.getItem("mr_favs");
    if (raw) {
      try {
        setFavorites(JSON.parse(raw));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("mr_favs", JSON.stringify(favorites));
  }, [favorites]);

  // ---------- 좋아요별 추천 캐시(병렬) ----------
  useEffect(() => {
    (async () => {
      if (!favorites.length) return;

      const targets = favorites.map((f) => f.id).filter((id) => perSongRecs[id] === undefined);
      if (!targets.length) return;

      const exclude = favorites.map((f) => f.id);

      const results = await Promise.all(
        targets.map(async (id) => {
          const items = await recommendBySongTags(id, 5, exclude);
          return [
            id,
            items.map((r) => ({
              id: r.id,
              title: r.title,
              artist: (r.artists || []).join(", "),
              album: "",
              genre: mapGenreCodes(r.genres ?? "").join(", "),
            })),
          ] as const;
        })
      );

      setPerSongRecs((prev) => {
        const next = { ...prev };
        for (const [id, list] of results) next[id] = list;
        return next;
      });
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites, mapGenreCodes]);

  // ---------- For You (DAE 기반) ----------
  useEffect(() => {
    (async () => {
      if (favorites.length >= 5) {
        const seedIds = favorites.map((f) => f.id);
        const items = await recommendByDAE(seedIds, 5, seedIds);
        setForYouRecs(
          items.map((r) => ({
            id: r.id,
            title: r.title,
            artist: (r.artists || []).join(", "),
            album: "",
            genre: mapGenreCodes(r.genres ?? "").join(", "),
          }))
        );
      } else {
        setForYouRecs([]);
      }
    })().catch(console.error);
  }, [favorites, mapGenreCodes]);

  // ---------- 핸들러들 ----------
  const toggleHeart = (song: Song) => {
    setFavorites((prev) => {
      const exists = prev.find((s) => s.id === song.id);
      return exists ? prev.filter((s) => s.id !== song.id) : [...prev, song];
    });
  };

  const toggleSong = (song: Song) =>
    setSelectedSongs((prev) =>
      prev.find((s) => s.id === song.id) ? prev.filter((s) => s.id !== song.id) : [...prev, song]
    );

  const generatePlaylist = async () => {
    const seedIds = selectedSongs.map((s) => s.id);
    const exclude = [...seedIds];

    const [byTags, byDae] = await Promise.all([
      recommendByTags(selectedTags, 20, exclude),
      recommendByDAE(seedIds, 20, exclude),
    ]);

    const merged = interleaveDedup(byTags, byDae, 20);
    const toSong = (r: ApiRecItem): Song => ({
      id: r.id,
      title: r.title,
      artist: (r.artists || []).join(", "),
      album: "",
      genre: mapGenreCodes(r.genres ?? "").join(", "),
    });

    const owner = user?.name?.trim();
    setPlaylistTitle(owner ? `${owner}님만의 플레이리스트` : "나만의 플레이리스트");

    setPlaylistTags(selectedTags.slice(0, 6));
    setPlaylistSongs(merged.map(toSong));
    setCurrentView("playlist");
  };

  // ✅ 로그인/회원가입: 백엔드 토큰 저장
  const onLogin = async (email: string, password: string) => {
    try {
      const { access_token } = await login(email, password);
      localStorage.setItem("mr_token", access_token);
      const me = await getMe();
      setUser({ name: me.name, email: me.email });
      setCurrentView("dashboard");
    } catch (e: any) {
      alert("로그인 실패: " + (e?.message || ""));
    }
  };

  const onSignup = async (name: string, email: string, password: string) => {
    try {
      const { access_token } = await signup(name, email, password);
      localStorage.setItem("mr_token", access_token);
      setUser({ name, email });
      setCurrentView("login");
    } catch (e: any) {
      alert("회원가입 실패: " + (e?.message || ""));
    }
  };

  // 🔹 제목 변경 전달 핸들러
  const renamePlaylist = (t: string) => setPlaylistTitle(t);

  // ---------- 렌더 ----------
  return (
    <div className="font-sans">
      {currentView === "login" && (
        <LoginView onLogin={onLogin} goSignup={() => setCurrentView("signup")} />
      )}
      {currentView === "signup" && (
        <SignupView onSignup={onSignup} goLogin={() => setCurrentView("login")} />
      )}

      {currentView === "dashboard" && (
        <DashboardView
          user={user}
          topTags={topTags}
          random30={random30}
          randomSongs={random20}
          selectedTags={selectedTags}
          selectedSongs={selectedSongs}
          setSelectedTags={setSelectedTags}
          setRandom30={setRandom30}
          setRandomSongs={setRandom20}
          toggleSong={toggleSong}
          onGenerate={generatePlaylist}
          favorites={favorites}
          perSongRecs={perSongRecs}
          forYouRecs={forYouRecs}
          goLibrary={() => setCurrentView("library" as ViewType)}
          onLogout={handleLogout}
        />
      )}

      {/* ✅ 내 플레이리스트 라이브러리 뷰 분기 */}
      {currentView === ("library" as ViewType) && (
        <MyPlaylistsView onBack={() => setCurrentView("dashboard")} onOpenPlaylist={openSavedPlaylist} />
      )}

      {currentView === "playlist" && (
        <PlaylistView
          title={playlistTitle}
          tags={playlistTags}
          songs={playlistSongs}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onRenameTitle={renamePlaylist}
          onToggleHeart={toggleHeart}
          likedIds={new Set(favorites.map((f) => f.id))}
          onBack={handleBackToDashboard}
          onPlaySong={(s) => {
            setCurrentSong(s);
            setIsPlaying(true);
          }}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onSave={saveCurrentPlaylist} // ✅ 저장
          saved={saved}
        />
      )}
    </div>
  );
}
