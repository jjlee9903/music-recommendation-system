import React, { useState } from 'react';
import { Play, Pause, Heart, User, Music, Hash, ChevronRight, Shuffle, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
}

interface Playlist {
  id: number;
  title: string;
  songs: Song[];
  tags: string[];
  like_cnt: number;
}

interface UserInfo {
  name: string;
  email: string;
}

type ViewType = 'login' | 'signup' | 'dashboard' | 'playlist';

const MelonMusicService: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);

  const mockTags: string[] = [
    '힙합', 'R&B', '발라드', '댄스', '록', 'K-POP', '팝', '인디',
    '재즈', '클래식', '트로트', '일렉트로닉', '포크', '어쿠스틱'
  ];

  const mockSongs: Song[] = [
    { id: 1, title: 'Blueming', artist: 'IU', album: 'Love poem', genre: '발라드' },
    { id: 2, title: 'Eight', artist: 'IU (Prod. & Feat. SUGA)', album: 'Eight', genre: 'R&B' },
    { id: 3, title: 'Dynamite', artist: 'BTS', album: 'BE', genre: 'K-POP' },
    { id: 4, title: '롤린', artist: 'Brave Girls', album: 'Rollin\'', genre: '댄스' },
    { id: 5, title: '라일락', artist: 'IU', album: 'LILAC', genre: '팝' },
    { id: 6, title: 'Next Level', artist: 'aespa', album: 'Next Level', genre: 'K-POP' }
  ];

  const mockPlaylists: Playlist[] = [
    {
      id: 1,
      title: '감성 발라드 모음',
      songs: [mockSongs[0], mockSongs[1], mockSongs[4]],
      tags: ['발라드', 'R&B', '감성'],
      like_cnt: 1250
    },
    {
      id: 2,
      title: 'K-POP 히트곡',
      songs: [mockSongs[2], mockSongs[3], mockSongs[5]],
      tags: ['K-POP', '댄스', '인기곡'],
      like_cnt: 2340
    }
  ];

  const handleLogin = (email: string, _password: string): void => {
    setUser({ name: '음악러버', email: email });
    setCurrentView('dashboard');
  };

  const handleSignup = (name: string, email: string, _password: string): void => {
    setUser({ name: name, email: email });
    setCurrentView('dashboard');
  };

  const toggleTag = (tag: string): void => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleSong = (song: Song): void => {
    setSelectedSongs(prev => {
      const exists = prev.find(s => s.id === song.id);
      return exists ? prev.filter(s => s.id !== song.id) : [...prev, song];
    });
  };

  const generatePlaylist = (): void => {
    setCurrentView('playlist');
  };

  const playSong = (song: Song): void => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const togglePlayback = (): void => {
    setIsPlaying(!isPlaying);
  };

  const LoginView: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Music className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Reco Music</h1>
            <p className="text-gray-600 mt-2">AI 기반 음악 추천 서비스</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={() => handleLogin(email, password)}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition duration-200"
            >
              로그인
            </button>
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentView('signup')}
              className="text-green-500 hover:text-green-600"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SignupView: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Music className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Reco Music</h1>
            <p className="text-gray-600 mt-2">새로운 계정을 만들어보세요</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSignup(name, email, password)}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition duration-200"
            >
              가입하기
            </button>
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentView('login')}
              className="text-green-500 hover:text-green-600"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView: React.FC = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Music className="h-8 w-8 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-800">Reco Music</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">안녕하세요, {user?.name}님</span>
                <User className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Hash className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-800">관심 있는 태그를 선택하세요</h2>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {mockTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              
              <div className="text-sm text-gray-500">
                선택된 태그: {selectedTags.length}개
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Music className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-800">최근 관심 있는 노래</h2>
              </div>
              
              <div className="space-y-3">
                {mockSongs.map((song) => (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition duration-200 ${
                      selectedSongs.find(s => s.id === song.id)
                        ? 'bg-green-50 border border-green-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSong(song)}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{song.title}</div>
                      <div className="text-sm text-gray-500">{song.artist}</div>
                    </div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {song.genre}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-500 mt-4">
                선택된 곡: {selectedSongs.length}개
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={generatePlaylist}
              disabled={selectedTags.length === 0 && selectedSongs.length === 0}
              className={`px-8 py-4 rounded-xl font-semibold transition duration-200 ${
                selectedTags.length > 0 || selectedSongs.length > 0
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shuffle className="h-5 w-5" />
                <span>AI 플레이리스트 생성하기</span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PlaylistView: React.FC = () => {
    const generatedPlaylist = mockPlaylists[0];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-green-500 hover:text-green-600"
                >
                  ← 돌아가기
                </button>
                <Music className="h-8 w-8 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-800">추천 플레이리스트</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Heart className="h-6 w-6 text-red-400" />
                <span className="text-sm text-gray-500">{generatedPlaylist.like_cnt} likes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Music className="h-16 w-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{generatedPlaylist.title}</h2>
              <p className="text-gray-600 mb-4">AI가 당신의 취향에 맞춰 생성한 플레이리스트</p>
              
              <div className="flex justify-center space-x-2 mb-6">
                {generatedPlaylist.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => playSong(generatedPlaylist.songs[0])}
                className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 transition duration-200 flex items-center space-x-2 mx-auto"
              >
                <Play className="h-5 w-5" />
                <span>전체 재생</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">곡 목록</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {generatedPlaylist.songs.map((song, index) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${
                    currentSong?.id === song.id ? 'bg-green-50' : ''
                  }`}
                  onClick={() => playSong(song)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 text-center">
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-sm text-gray-400">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{song.title}</div>
                      <div className="text-sm text-gray-500">{song.artist} • {song.album}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {song.genre}
                    </span>
                    <button className="text-gray-400 hover:text-red-400">
                      <Heart className="h-4 w-4" />
                    </button>
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
                <button className="text-gray-400 hover:text-gray-600">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={togglePlayback}
                  className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <SkipForward className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderView = (): React.ReactElement => {
    switch (currentView) {
      case 'login':
        return <LoginView />;
      case 'signup':
        return <SignupView />;
      case 'dashboard':
        return <DashboardView />;
      case 'playlist':
        return <PlaylistView />;
      default:
        return <LoginView />;
    }
  };

  return <div className="font-sans">{renderView()}</div>;
};

export default MelonMusicService;