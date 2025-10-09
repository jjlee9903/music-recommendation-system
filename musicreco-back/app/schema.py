from typing import List, Literal
from pydantic import BaseModel

Method = Literal["sgns", "dae", "hybrid"]

class RecommendRequest(BaseModel):
    seed_song_ids: List[int] = []
    k: int = 10
    method: Method = "hybrid"
    alpha: float = 0.6  # hybrid 가중치

class SongOut(BaseModel):
    id: int
    title: str
    artists: List[str]
    genres: List[str]
    score: float

class RecommendResponse(BaseModel):
    items: List[SongOut]
