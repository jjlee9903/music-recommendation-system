import { Heart, Music, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import type { Song } from "@/types";

export default function PlaylistView({
  title, tags, songs, currentSong, isPlaying,
  onBack, onPlaySong, onTogglePlay,
}:{ title:string; tags:string[]; songs:Song[];
   currentSong: Song|null; isPlaying:boolean;
   onBack:()=>void; onPlaySong:(s:Song)=>void; onTogglePlay:()=>void; }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="text-green-500 hover:text-green-600">← 돌아가기</button>
            <Music className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">추천 플레이리스트</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Music className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">AI가 당신의 취향에 맞춘 결과</p>
          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {tags.map(tag => <span key={tag} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">#{tag}</span>)}
          </div>
          {songs[0] && (
            <button onClick={() => onPlaySong(songs[0])}
              className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 transition flex items-center space-x-2 mx-auto">
              <Play className="h-5 w-5" /><span>전체 재생</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">곡 목록</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {songs.map((song, idx) => (
              <div key={song.id}
                   className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${currentSong?.id === song.id ? "bg-green-50" : ""}`}
                   onClick={() => onPlaySong(song)}>
                <div className="flex items-center space-x-4">
                  <div className="w-8 text-center">
                    {currentSong?.id === song.id && isPlaying ? <Pause className="h-4 w-4 text-green-500" /> : <span className="text-sm text-gray-400">{idx+1}</span>}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{song.title}</div>
                    <div className="text-sm text-gray-500">{song.artist}{song.album ? ` • ${song.album}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">{song.genre}</span>
                  <button className="text-gray-400 hover:text-red-400"><Heart className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-800">{currentSong.title}</div>
                <div className="text-sm text-gray-500">{currentSong.artist}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600"><SkipBack className="h-5 w-5" /></button>
              <button onClick={onTogglePlay} className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button className="text-gray-400 hover:text-gray-600"><SkipForward className="h-5 w-5" /></button>
              <button className="text-gray-400 hover:text-gray-600"><Volume2 className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
