import numpy as np
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Tuple
from pydantic import BaseModel

from app.schema import RecommendRequest, RecommendResponse, SongOut
from app.loaders import load_sgns_embeddings, build_id_maps, load_song_meta, load_song_meta_by_id
from app.loaders import load_tag_embeddings, load_word_to_idx
from app.rec.sgns import SGNSRecommender
from app.rec.dae import DAERecommender

DATA_DIR = os.getenv("DATA_DIR", "app/data")
EMB_PKL = os.path.join(DATA_DIR, "song_embeddings.pkl")
DAE_PTH = os.path.join(DATA_DIR, "dae_model.pth")
META_JSON = os.path.join(DATA_DIR, "song_meta.json")
DAE_NUM_SONGS = 707_989
WORD2IDX_JSON = os.path.join(DATA_DIR, "word_to_idx.json")
TAG_PKL = os.path.join(DATA_DIR, "tag_embeddings.pkl")

E, ids = load_sgns_embeddings(EMB_PKL)   # SGNS: id → 벡터
id2idx, idx2id = build_id_maps(ids)      # 필요 시 사용
meta = load_song_meta_by_id(META_JSON)   # id → 메타
tag_emb = load_tag_embeddings(TAG_PKL)         # {tag -> vec}
word2idx = load_word_to_idx(WORD2IDX_JSON)     # (선택) 자동완성/검증용

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

def _normalize_tag(t: str) -> str:
    # 학습 때 저장된 형태를 최대한 그대로 맞추기
    # (샘플 보니 대소문자 혼재: 'OST' 'edm' → 우선 원문 그대로, 없으면 lower())
    t0 = t.strip()
    if t0 in tag_emb: return t0
    t1 = t0.lower()
    return t1 if t1 in tag_emb else t0  # 없는 태그는 그대로 둠(무시될 수 있음)

sgns = SGNSRecommender(E, idx2id, id2idx)
dae = DAERecommender(
    ckpt_path=DAE_PTH,
    num_songs=DAE_NUM_SONGS,
    #songid_to_daeidx=sid2did,    # 있으면 매핑 전달
    #daeidx_to_songid=did2sid,    # 있으면 매핑 전달
    #dim=128, depth=2, dropout=0.1,
    #device="cpu",                # 로컬 CPU면 명시해도 OK
)

app = FastAPI(title="MusicReco Demo API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.post("/recommend/by-songs", response_model=RecommendResponse)
def recommend_by_songs(req: SongsRecoRequest):
    seed = [s for s in req.seed_song_ids if s in id2idx]  # SGNS에 존재하는 곡만
    if not seed:
        return RecommendResponse(items=[])
    pairs = sgns.similar(seed, topk=req.k)
    # 추가 exclude 적용
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

@app.get("/health")
def health():
    return {"ok": True, "num_songs": len(ids)}

def to_song_out(sid: int, score: float) -> SongOut:
    m = meta.get(int(sid), {})
    title = m.get("song_name") or m.get("title") or str(sid)
    artists = m.get("artist_name_basket") or m.get("artists") or []
    genres = m.get("song_gn_gnr_basket") or m.get("genres") or []
    return SongOut(id=int(sid), title=title, artists=artists, genres=genres, score=float(score))

def interleave(a: List[Tuple[int,float]], b: List[Tuple[int,float]], want: int):
    out, i, j, seen = [], 0, 0, set()
    while len(out) < want and (i < len(a) or j < len(b)):
        if i < len(a):
            sid, sc = a[i]; i += 1
            if sid not in seen: out.append((sid, sc)); seen.add(sid)
        if len(out) >= want: break
        if j < len(b):
            sid, sc = b[j]; j += 1
            if sid not in seen: out.append((sid, sc)); seen.add(sid)
    return out[:want]

@app.post("/recommend/demo", response_model=RecommendResponse)
def recommend_demo(req: RecommendRequest):
    seed = list(set(req.seed_song_ids))
    a = sgns.similar(seed, 5 + len(seed))[:5]     # SGNS Top-5
    b = dae.scores(seed, 5 + len(seed))[:5]       # DAE Top-5 (혹은 폴백)
    mixed = interleave(a, b, want=10)             # 교차 10곡
    items = [to_song_out(sid, sc) for sid, sc in mixed]
    return RecommendResponse(items=items)

# ---- 태그 목록 (선택형/자동완성용) ----
@app.get("/tags")
def get_tags(limit: int = 60, q: str | None = None):
    keys = list(tag_emb.keys())
    if q:
        qq = q.strip().lower()
        keys = [k for k in keys if qq in k.lower()]
    keys.sort()
    return {"tags": keys[:limit]}

# ---- 노래 샘플(선택 리스트용) ----
@app.get("/songs/sample")
def get_songs_sample(limit: int = 30):
    out = []
    for sid, m in list(meta.items())[: limit]:
        out.append({
            "id": int(sid),
            "title": m.get("song_name") or str(sid),
            "artist": ", ".join(m.get("artist_name_basket") or []),
            "album": m.get("album_name") or "",
            "genre": ", ".join(m.get("song_gn_gnr_basket") or []),
        })
    return {"songs": out}