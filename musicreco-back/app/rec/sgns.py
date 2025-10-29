import numpy as np
from typing import List, Tuple
try:
    import faiss
    FAISS_OK = True
except Exception:
    FAISS_OK = False

class SGNSRecommender:
    def __init__(self, embeddings: np.ndarray, idx2id: List[int], id2idx: dict):
        self.E = embeddings  # (N,d) L2-normalized
        self.idx2id = idx2id
        self.id2idx = id2idx
        d = self.E.shape[1]
        self.index = None
        if FAISS_OK:
            self.index = faiss.IndexFlatIP(d)
            self.index.add(self.E)

    def _mean_vec(self, seed: List[int]):
        idxs = [self.id2idx[s] for s in seed if s in self.id2idx]
        if not idxs: return None
        v = self.E[idxs].mean(axis=0, keepdims=True)
        v /= (np.linalg.norm(v, axis=1, keepdims=True) + 1e-12)
        return v.astype(np.float32)

    def similar(self, seed: List[int], topk: int):
        q = self._mean_vec(seed)
        if q is None: return []
        if self.index is not None:
            sims, idxs = self.index.search(q, topk + len(seed))
            sims, idxs = sims[0], idxs[0]
        else:
            sims = (self.E @ q[0])
            idxs = np.argsort(-sims)[: topk + len(seed)]
            sims = sims[idxs]
        seed_set = set(seed)
        out = []
        for i, s in zip(idxs, sims):
            sid = self.idx2id[i]
            if sid not in seed_set:
                out.append((sid, float(s)))
            if len(out) >= topk: break
        return out
    
    def similar_from_vector(self, qvec, topk: int, exclude_ids: set[int] | None = None):
        if self.index is not None:
            sims, idxs = self.index.search(qvec.astype(np.float32), topk + (len(exclude_ids) if exclude_ids else 0))
            sims, idxs = sims[0], idxs[0]
        else:
            sims = (self.E @ qvec[0])
            idxs = np.argsort(-sims)[: topk + (len(exclude_ids) if exclude_ids else 0)]
            sims = sims[idxs]
        out = []
        for i, s in zip(idxs, sims):
            sid = self.idx2id[i]
            if exclude_ids and sid in exclude_ids:
                continue
            out.append((sid, float(s)))
            if len(out) == topk: break
        return out
