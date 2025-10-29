# app/main.py
import os
import numpy as np
import requests
from typing import List, Tuple

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# ===== 기존 추천 스키마/로더/리코더 =====
from app.schema import RecommendRequest, RecommendResponse, SongOut
from app.loaders import (
    load_sgns_embeddings,
    build_id_maps,
    load_song_meta_by_id,
    load_tag_embeddings,
    load_word_to_idx,
)
from app.rec.sgns import SGNSRecommender
from app.rec.dae import DAERecommender
from app.rec.song2tags import Song2Tags

# ===== DB / 모델 / 스키마 / 시큐리티 =====
from app.db import Base, engine, SessionLocal
from app.orm_models import User, Playlist, PlaylistItem
from app.schemas_auth import SignupIn, LoginIn, TokenOut, UserOut
from app.schemas_playlist import PlaylistCreate, PlaylistOut, PlaylistRename
from app.security import hash_pw, verify_pw, create_access_token, decode_token


# -------------------- Config & Data --------------------
DATA_DIR = os.getenv("DATA_DIR", "app/data")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
EMB_PKL = os.path.join(DATA_DIR, "song_embeddings.pkl")
DAE_PTH = os.path.join(DATA_DIR, "dae_model.pth")
META_JSON = os.path.join(DATA_DIR, "song_meta.json")
DAE_NUM_SONGS = 707_989
WORD2IDX_JSON = os.path.join(DATA_DIR, "word_to_idx.json")
TAG_PKL = os.path.join(DATA_DIR, "tag_embeddings.pkl")

E, ids = load_sgns_embeddings(EMB_PKL)      # SGNS: (N,d) L2-normalized 가정
id2idx, idx2id = build_id_maps(ids)
meta = load_song_meta_by_id(META_JSON)       # id -> meta dict
tag_emb = load_tag_embeddings(TAG_PKL)       # dict[str -> np.ndarray] (L2 정규화 가정)
word2idx = load_word_to_idx(WORD2IDX_JSON)   # (선택) 자동완성/검증용



# --- 태그 행렬(빠른 내적용) ---
_tag_words = list(tag_emb.keys())
_tag_mat = np.stack([tag_emb[w] for w in _tag_words], axis=0).astype(np.float32)
_tag_mat /= (np.linalg.norm(_tag_mat, axis=1, keepdims=True) + 1e-12)

def _normalize_tag(t: str) -> str:
    t0 = t.strip()
    if t0 in tag_emb:
        return t0
    t1 = t0.lower()
    return t1 if t1 in tag_emb else t0


# -------------------- Request Models --------------------
class TagRecoRequest(BaseModel):
    tags: List[str]
    k: int = 20
    exclude: List[int] = []

class SongsRecoRequest(BaseModel):
    seed_song_ids: List[int] = []
    k: int = 20
    exclude: List[int] = []

class DAERecoRequest(BaseModel):
    seed_song_ids: List[int] = []
    k: int = 20
    exclude: List[int] = []

class BySongTagsRequest(BaseModel):
    song_id: int
    k: int = 5
    exclude: List[int] = []
    topn: int = 20          # 곡 근처 태그 후보 상위 N
    sample_n: int = 5       # 그중 무작위로 사용할 태그 개수
    seed: int | None = None # 재현용 시드(옵션)


# -------------------- Recommenders --------------------
sgns = SGNSRecommender(E, idx2id, id2idx)
dae = DAERecommender(ckpt_path=DAE_PTH, num_songs=DAE_NUM_SONGS)
s2t = Song2Tags(E, idx2id, _tag_mat, _tag_words)


# -------------------- FastAPI App --------------------
app = FastAPI(title="MusicReco Demo API", version="0.0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ----- DB bootstrap -----
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- Auth helpers/APIs --------------------
def get_current_user(authorization: str = Header(None),
                     db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter_by(email=sub).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/auth/signup", response_model=TokenOut)
def signup(body: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=body.email).first():
        raise HTTPException(400, "Email already registered")
    u = User(email=body.email, name=body.name, password_hash=hash_pw(body.password))
    db.add(u); db.commit()
    token = create_access_token(sub=u.email)
    return TokenOut(access_token=token)

@app.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=body.email).first()
    if not u or not verify_pw(body.password, u.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(sub=u.email)
    return TokenOut(access_token=token)

@app.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(name=user.name, email=user.email)


# -------------------- Playlist APIs (protected) --------------------
@app.post("/playlists", response_model=PlaylistOut)
def create_playlist(req: PlaylistCreate,
                    user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    pl = Playlist(user_id=user.id, title=req.title, tags=req.tags)
    db.add(pl); db.flush()
    for i, it in enumerate(req.items):
        db.add(PlaylistItem(
            playlist_id=pl.id, position=i,
            song_id=it.song_id, title=it.title,
            artists=it.artists, genres=it.genres
        ))
    db.commit(); db.refresh(pl)
    return pl

@app.get("/playlists", response_model=List[PlaylistOut])
def list_playlists(user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    pls = db.query(Playlist).filter_by(user_id=user.id).order_by(Playlist.id.desc()).all()
    return pls

@app.get("/playlists/{pid}", response_model=PlaylistOut)
def get_playlist(pid: int,
                 user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    pl = db.query(Playlist).get(pid)
    if not pl or pl.user_id != user.id:
        raise HTTPException(404, "not found")
    return pl

@app.patch("/playlists/{pid}/title", response_model=PlaylistOut)
def rename_playlist(pid: int, body: PlaylistRename,
                    user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    pl = db.query(Playlist).get(pid)
    if not pl or pl.user_id != user.id:
        raise HTTPException(404, "not found")
    pl.title = body.title
    db.commit(); db.refresh(pl)
    return pl

@app.delete("/playlists/{pid}")
def delete_playlist(pid: int,
                    user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    pl = db.query(Playlist).get(pid)
    if not pl or pl.user_id != user.id:
        raise HTTPException(404, "not found")
    db.delete(pl); db.commit()
    return {"ok": True}

@app.get("/yt/search")
def yt_search(q: str, safe: bool = True):
    if not YOUTUBE_API_KEY:
        raise HTTPException(500, "YOUTUBE_API_KEY not set")
    params = {
        "key": YOUTUBE_API_KEY,
        "part": "snippet",
        "q": q,
        "maxResults": 5,              # 여러 개 받아서 첫 playable만 쓰고 싶으면 5~10
        "type": "video",
        "videoEmbeddable": "true",    # ✅ 임베드 가능한 영상만
    }
    if safe:
        params["safeSearch"] = "moderate"

    r = requests.get("https://www.googleapis.com/youtube/v3/search", params=params, timeout=5)
    j = r.json()
    items = (j.get("items") or [])
    vid = items[0]["id"]["videoId"] if items else None
    return {"videoId": vid}

# -------------------- Recommend APIs --------------------
@app.post("/recommend/by-songs", response_model=RecommendResponse)
def recommend_by_songs(req: SongsRecoRequest):
    seed = [s for s in req.seed_song_ids if s in id2idx]
    if not seed:
        return RecommendResponse(items=[])
    pairs = sgns.similar(seed, topk=req.k)
    ex = set(req.exclude) | set(seed)
    pairs = [(sid, sc) for sid, sc in pairs if sid not in ex][:req.k]
    items = [to_song_out(sid, sc) for sid, sc in pairs]
    return RecommendResponse(items=items)

@app.post("/recommend/by-tags", response_model=RecommendResponse)
def recommend_by_tags(req: TagRecoRequest):
    vecs = []
    for t in req.tags:
        key = _normalize_tag(t)
        v = tag_emb.get(key)
        if v is not None:
            vecs.append(v)
    if not vecs:
        return RecommendResponse(items=[])
    q = np.mean(np.stack(vecs, axis=0), axis=0, keepdims=True)
    q /= (np.linalg.norm(q, axis=1, keepdims=True) + 1e-12)
    pairs = sgns.similar_from_vector(q, topk=req.k, exclude_ids=set(req.exclude))
    items = [to_song_out(sid, sc) for sid, sc in pairs]
    return RecommendResponse(items=items)

@app.post("/recommend/by-dae", response_model=RecommendResponse)
def recommend_by_dae(req: DAERecoRequest):
    seed = list(set(req.seed_song_ids))
    pairs = dae.scores(seed, req.k + len(seed))
    ex = set(req.exclude) | set(seed)
    pairs = [(sid, sc) for sid, sc in pairs if sid not in ex][:req.k]
    items = [to_song_out(sid, sc) for sid, sc in pairs]
    return RecommendResponse(items=items)

# 곡 → 가까운 태그 미리보기
@app.get("/songs/{song_id}/similar-tags")
def similar_tags(song_id: int, topn: int = 8):
    tags = s2t.nearest_tags(song_id, topn=topn)
    return {"song_id": song_id, "tags": tags}

# 곡 1개로부터 나온 태그(복수)의 평균벡터로 SGNS 검색 (랜덤 샘플링)
@app.post("/recommend/by-song-tags", response_model=RecommendResponse)
def recommend_by_song_tags(req: BySongTagsRequest):
    tags = s2t.nearest_tags(req.song_id, topn=max(1, req.topn))
    if not tags:
        return RecommendResponse(items=[])

    rng = np.random.default_rng(req.seed)
    m = min(len(tags), max(1, req.sample_n))
    sel_idx = rng.choice(len(tags), size=m, replace=False)
    chosen = [tags[i] for i in sel_idx]

    vecs = [tag_emb[t] for t in chosen if t in tag_emb]
    if not vecs:
        return RecommendResponse(items=[])
    q = np.mean(np.stack(vecs, axis=0), axis=0, keepdims=True)
    q /= (np.linalg.norm(q, axis=1, keepdims=True) + 1e-12)

    pairs = sgns.similar_from_vector(q, topk=req.k, exclude_ids=set(req.exclude))
    items = [to_song_out(sid, sc) for sid, sc in pairs]
    return RecommendResponse(items=items)

@app.get("/songs/search")
def search_songs(q: str, limit: int = 20):
    qq = (q or "").strip().lower()
    if not qq:
        return {"songs": []}
    out = []
    for sid, m in meta.items():
        title = (m.get("song_name") or m.get("title") or str(sid))
        artists = m.get("artist_name_basket") or m.get("artists") or []
        hay = f"{title} {' '.join(artists)}".lower()
        if qq in hay:
            out.append({
                "id": int(sid),
                "title": title,
                "artist": ", ".join(artists),
                "album": m.get("album_name") or "",
                "genre": ", ".join(m.get("song_gn_gnr_basket") or m.get("genres") or []),
            })
            if len(out) >= limit:
                break
    return {"songs": out}

# 데모: SGNS/DAE 교차 10곡
@app.post("/recommend/demo", response_model=RecommendResponse)
def recommend_demo(req: RecommendRequest):
    seed = list(set(req.seed_song_ids))
    a = sgns.similar(seed, 5 + len(seed))[:5]
    b = dae.scores(seed, 5 + len(seed))[:5]
    mixed = interleave(a, b, want=10)
    items = [to_song_out(sid, sc) for sid, sc in mixed]
    return RecommendResponse(items=items)


# -------------------- Simple Lists/Health --------------------
@app.get("/tags")
def get_tags(limit: int = 60, q: str | None = None):
    keys = list(tag_emb.keys())
    if q:
        qq = q.strip().lower()
        keys = [k for k in keys if qq in k.lower()]
    keys.sort()
    return {"tags": keys[:limit]}

@app.get("/songs/sample")
def get_songs_sample(limit: int = 30):
    out = []
    for sid, m in list(meta.items())[:limit]:
        out.append({
            "id": int(sid),
            "title": m.get("song_name") or str(sid),
            "artist": ", ".join(m.get("artist_name_basket") or []),
            "album": m.get("album_name") or "",
            "genre": ", ".join(m.get("song_gn_gnr_basket") or []),
        })
    return {"songs": out}

@app.get("/health")
def health():
    return {"ok": True, "num_songs": len(ids)}


# -------------------- Helpers --------------------
def to_song_out(sid: int, score: float) -> SongOut:
    m = meta.get(int(sid), {})
    title = m.get("song_name") or m.get("title") or str(sid)
    artists = m.get("artist_name_basket") or m.get("artists") or []
    genres = m.get("song_gn_gnr_basket") or m.get("genres") or []
    return SongOut(id=int(sid), title=title, artists=artists, genres=genres, score=float(score))

def interleave(a: List[Tuple[int, float]], b: List[Tuple[int, float]], want: int):
    out, i, j, seen = [], 0, 0, set()
    while len(out) < want and (i < len(a) or j < len(b)):
        if i < len(a):
            sid, sc = a[i]; i += 1
            if sid not in seen:
                out.append((sid, sc)); seen.add(sid)
        if len(out) >= want: break
        if j < len(b):
            sid, sc = b[j]; j += 1
            if sid not in seen:
                out.append((sid, sc)); seen.add(sid)
    return out[:want]
