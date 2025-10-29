import json, pickle, numpy as np
from typing import Dict, Any, List, Tuple

def load_tag_embeddings(path: str) -> dict[str, np.ndarray]:
    with open(path, "rb") as f:
        d = pickle.load(f)  
    return d

def load_word_to_idx(path: str) -> dict[str, int]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
        
def load_song_meta_by_id(path: str):
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    # list → dict[id]=meta
    if isinstance(items, list):
        return {int(x["id"]): x for x in items}
    # dict면 그대로, 키를 int로
    return {int(k): v for k, v in items.items()}

def load_song_meta(path: str) -> Dict[int, dict]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            items = json.load(f)
    except FileNotFoundError:
        return {}
    if isinstance(items, list):
        return {int(x.get("_id", x.get("id"))): x for x in items}
    return {int(k): v for k, v in items.items()}

def load_sgns_embeddings(path: str) -> Tuple[np.ndarray, List[int]]:
    with open(path, "rb") as f:
        d: Dict[Any, np.ndarray] = pickle.load(f)  # {song_id: vector}
    ids = [int(k) for k in d.keys()]
    vecs = np.stack([np.asarray(d[k], dtype=np.float32) for k in d.keys()]).astype(np.float32)
    # cosine용 L2 정규화
    vecs /= (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-12)
    return vecs, ids

def build_id_maps(ids: List[int]):
    id2idx = {sid: i for i, sid in enumerate(ids)}
    idx2id = ids
    return id2idx, idx2id
