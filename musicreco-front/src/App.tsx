import { useEffect, useState } from "react";
import type { ViewType, ApiRecItem, Song, UserInfo } from "@/types";
import { recommendByDAE, recommendByTags } from "@/services/api";
import { useGenreMap } from "@/hooks/useGenreMap";
import { interleaveDedup } from "@/utils/interleave";
import LoginView from "@/views/LoginView";
import SignupView from "@/views/SignupView";
import DashboardView from "@/views/DashboardView";
import PlaylistView from "@/views/PlaylistView";
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
  return rows.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 500).map((r) => r.tag);
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [user, setUser] = useState<UserInfo | null>(null);

  const [topTags, setTopTags] = useState<string[]>([]);
  const [random30, setRandom30] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 인기곡(상위 500 중 랜덤 20 표기)
  const [random20, setRandom20] = useState<TopSong[]>([]);

  // 플레이리스트/플레이어 상태
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("AI 추천 플레이리스트");
  const [playlistTags, setPlaylistTags] = useState<string[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { mapGenreCodes } = useGenreMap();

  // 초기 로드: 태그 500 + 인기곡 500
  useEffect(() => {
    (async () => {
      const [tags, songs] = await Promise.all([loadTopTagsCSV(), loadTopSongsCSV()]);
      setTopTags(tags);
      setRandom30([...tags].sort(() => Math.random() - 0.5).slice(0, 30));
      setRandom20([...songs].sort(() => Math.random() - 0.5).slice(0, 20));
    })().catch(console.error);
  }, []);

  const toggleSong = (song: Song) =>
    setSelectedSongs((prev) => (prev.find((s) => s.id === song.id) ? prev.filter((s) => s.id !== song.id) : [...prev, song]));

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

    setPlaylistTitle("AI 추천 플레이리스트");
    setPlaylistTags(selectedTags.slice(0, 6));
    setPlaylistSongs(merged.map(toSong));
    setCurrentView("playlist");
  };

  const onLogin = (email: string) => {
    setUser({ name: "음악러버", email });
    setCurrentView("dashboard");
  };
  const onSignup = (name: string, email: string) => {
    setUser({ name, email });
    setCurrentView("dashboard");
  };

  return (
    <div className="font-sans">
      {currentView === "login" && <LoginView onLogin={onLogin} goSignup={() => setCurrentView("signup")} />}
      {currentView === "signup" && <SignupView onSignup={onSignup} goLogin={() => setCurrentView("login")} />}
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
        />
      )}
      {currentView === "playlist" && (
        <PlaylistView
          title={playlistTitle}
          tags={playlistTags}
          songs={playlistSongs}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onBack={() => setCurrentView("dashboard")}
          onPlaySong={(s) => {
            setCurrentSong(s);
            setIsPlaying(true);
          }}
          onTogglePlay={() => setIsPlaying((p) => !p)}
        />
      )}
    </div>
  );
}
