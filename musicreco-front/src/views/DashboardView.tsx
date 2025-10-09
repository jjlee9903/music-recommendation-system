import React from "react";
import { Music } from "lucide-react";
import TagPicker from "@/components/TagPicker";
import type { Song, UserInfo } from "@/types";
import type { TopSong } from "@/utils/csv";

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
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Music className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">MusicReco</h1>
          </div>
          <div className="text-gray-600">안녕하세요, {user?.name}님</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 태그 선택 */}
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

        {/* 인기곡 20 랜덤 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-6">
            <Music className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">최근 관심 있는 노래</h2>
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

          <div className="space-y-3">
            {randomSongs.map((s) => {
              const selected = selectedSongs.find((x) => x.id === s.id);
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    selected ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    toggleSong({
                      id: s.id,
                      title: s.title,
                      artist: s.artist,
                      album: "",
                      genre: "", // 필요하면 genre_map 연동해서 뱃지 표시 확장 가능
                    })
                  }
                >
                  <div>
                    <div className="font-medium text-gray-800">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.artist}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-sm text-gray-500 mt-4">선택된 곡: {selectedSongs.length}개</div>
        </div>
      </div>

      <div className="text-center mt-2 mb-12">
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
    </div>
  );
}
