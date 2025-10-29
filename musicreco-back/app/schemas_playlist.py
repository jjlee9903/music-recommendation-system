from pydantic import BaseModel
from typing import List

class PlaylistItemIn(BaseModel):
    song_id: int
    title: str
    artists: List[str] = []
    genres: List[str] = []

class PlaylistCreate(BaseModel):
    title: str
    tags: List[str] = []
    items: List[PlaylistItemIn]

class PlaylistRename(BaseModel):
    title: str

class PlaylistOutItem(BaseModel):
    id: int
    position: int
    song_id: int
    title: str
    artists: List[str]
    genres: List[str]
    class Config: from_attributes = True

class PlaylistOut(BaseModel):
    id: int
    title: str
    tags: List[str]
    items: List[PlaylistOutItem]
    class Config: from_attributes = True
