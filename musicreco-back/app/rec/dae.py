from typing import List, Tuple, Optional
import torch
from app.models.embedding_dae import EmbeddingDAE

class DAERecommender:
    def __init__(self, ckpt_path: str, num_songs: int, device: Optional[str] = None,
                 dim: int = 128, depth: int = 2, dropout: float = 0.1):
        self.num_songs = num_songs
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = EmbeddingDAE(num_songs=num_songs, dim=dim, depth=depth, dropout=dropout).to(self.device)

        state = torch.load(ckpt_path, map_location=self.device)
        if isinstance(state, dict) and "state_dict" in state:
            self.model.load_state_dict(state["state_dict"])
        elif isinstance(state, dict):
            self.model.load_state_dict(state)
        else:
            self.model = state.to(self.device)
        self.model.eval()

        self.all_ids = torch.arange(num_songs, device=self.device, dtype=torch.long)

    @torch.inference_mode()
    def scores(self, seed_song_ids: List[int], topk: int) -> List[Tuple[int, float]]:
        # id를 그대로 사용하되, 범위 밖은 필터
        seed = [s for s in seed_song_ids if 0 <= s < self.num_songs]
        remain = torch.tensor(seed, device=self.device, dtype=torch.long) if seed else torch.tensor([], device=self.device, dtype=torch.long)

        p = self.model.encode_playlist([remain])  # [1, dim]
        scores = self.model.emb(self.all_ids) @ p[0]  # [N]
        if len(seed) > 0:
            scores[remain] = -1e9

        vals, idxs = torch.topk(scores, k=min(topk, self.num_songs))
        return [(int(i), float(v)) for i, v in zip(idxs.tolist(), vals.tolist())]

'''
# app/rec/dae.py
from typing import List, Tuple, Optional
import torch
from app.models.embedding_dae import EmbeddingDAE

class DAERecommender:
    """
    EmbeddingDAE(encode_playlist + weight tying)를
    우리 백엔드 인터페이스(scores)로 감싼 어댑터.
    """
    def __init__(
        self,
        ckpt_path: str,
        num_songs: int,
        songid_to_daeidx: Optional[dict[int, int]] = None,
        daeidx_to_songid: Optional[list[Optional[int]]] = None,
        device: Optional[str] = None,
        dim: int = 128,       # 모델 저장 때 썼던 dim과 일치해야 함
        depth: int = 2,
        dropout: float = 0.1,
    ):
        self.num_songs = num_songs
        self.sid2did = songid_to_daeidx
        self.did2sid = daeidx_to_songid
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # 1) 모델 구성 & 로드
        self.model = EmbeddingDAE(num_songs=num_songs, dim=dim, depth=depth, dropout=dropout).to(self.device)
        state = torch.load(ckpt_path, map_location=self.device)
        if isinstance(state, dict) and all(isinstance(k, str) for k in state):
            self.model.load_state_dict(state)
        elif isinstance(state, dict) and "state_dict" in state:
            self.model.load_state_dict(state["state_dict"])
        else:
            # torch.save(model)로 통째 저장했다면
            self.model = state.to(self.device)
        self.model.eval()

        # 2) 전체 후보 인덱스 텐서
        self.all_dae_ids = torch.arange(num_songs, device=self.device, dtype=torch.long)

    def _to_dae_indices(self, seed_song_ids: List[int]) -> List[int]:
        if self.sid2did:
            return [self.sid2did[s] for s in seed_song_ids if s in self.sid2did]
        # 매핑이 없으면 “DAE 인덱스 = song_id”라고 가정(데모 폴백)
        return [s for s in seed_song_ids if 0 <= s < self.num_songs]

    def _to_song_ids(self, dae_indices: List[int]) -> List[int]:
        if self.did2sid:
            out = []
            for i in dae_indices:
                sid = self.did2sid[i] if 0 <= i < len(self.did2sid) else None
                if sid is not None:
                    out.append(int(sid))
            return out
        # 매핑이 없으면 동일 숫자로 반환
        return [int(i) for i in dae_indices]

    @torch.inference_mode()
    def scores(self, seed_song_ids: List[int], topk: int) -> List[Tuple[int, float]]:
        # 1) seed 변환(song_id -> dae_idx)
        seed_dae = self._to_dae_indices(seed_song_ids)

        # 2) 플레이리스트 임베딩
        # EmbeddingDAE.encode_playlist는 []도 처리(0벡터→enc→norm)하도록 이미 방어되어 있음
        remain = torch.tensor(seed_dae, device=self.device, dtype=torch.long) if seed_dae else torch.tensor([], device=self.device, dtype=torch.long)
        p = self.model.encode_playlist([remain])  # [1, dim]

        # 3) 모든 후보 점수 = emb(cand) · p
        all_emb = self.model.emb(self.all_dae_ids)       # [N, dim]
        scores = all_emb @ p[0]                          # [N]

        # 4) 씨드 제외
        if len(seed_dae) > 0:
            scores[remain] = -1e9

        # 5) Top-K
        k = min(topk, self.num_songs)
        vals, idxs = torch.topk(scores, k=k)
        dae_ids = idxs.tolist()
        song_ids = self._to_song_ids(dae_ids)
        return list(zip(song_ids, [float(v) for v in vals.tolist()]))

        '''