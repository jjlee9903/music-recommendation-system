export type ViewType = "login" | "signup" | "dashboard" | "playlist" | "library";

export interface ApiRecItem { id: number; title: string; artists: string[]; genres: string[]; score: number; }
export interface Song { id: number; title: string; artist: string; album: string; genre: string; }
export interface RawSong { id: number; title: string; artist: string; album?: string; genres?: string[]; genre?: string; }
export interface UserInfo { name: string; email: string; }
