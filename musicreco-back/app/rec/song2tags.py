import numpy as np
from typing import List

class Song2Tags:
    """
    곡 임베딩 → 태그 임베딩 유사도 기반 근접 태그 조회 유틸.
    - songE, tagE는 L2 정규화 되어 있다고 가정.
    """

    def __init__(self, song_E: np.ndarray, song_idx2id: list, tag_E: np.ndarray, tag_idx2word: list):
        self.songE = song_E
        self.song_idx2id = song_idx2id
        self.tagE = tag_E
        self.tag_idx2word = tag_idx2word
        self.song_id2idx = {sid: i for i, sid in enumerate(song_idx2id)}

    def nearest_tags(
        self,
        song_id: int,
        topn: int = 8,
        candidate_k: int = 20,
        seed: int | None = None,
        keep_similarity_order: bool = True,
    ) -> List[str]:
        """
        곡에 가까운 태그를 반환.
        1) 먼저 상위 candidate_k개 후보를 뽑고
        2) 그 중에서 무작위로 topn개 샘플링(중복 없음)
        3) 선택 결과를 유사도 순으로 정렬(keep_similarity_order=True)하여 반환

        Args:
            song_id: 기준 곡 ID
            topn: 최종 반환 태그 개수
            candidate_k: 후보군 크기(예: 20)
            seed: 재현 가능한 랜덤 샘플링을 원할 때 고정 seed
            keep_similarity_order: True면 선택된 태그를 유사도 내림차순으로 정렬해 반환

        Returns:
            List[str]: 태그 문자열 리스트
        """
        if song_id not in self.song_id2idx:
            return []
        if self.tagE.size == 0:
            return []

        idx = self.song_id2idx[song_id]
        svec = self.songE[idx]  # (d,)
        sims = self.tagE @ svec  # (num_tags,)

        # 1) 상위 candidate_k 후보 인덱스
        k = min(candidate_k, sims.shape[0])
        # np.argpartition은 k번째까지 보장하므로 마지막에 정렬 한 번 더
        cand_idx = np.argpartition(-sims, k - 1)[:k]
        cand_idx = cand_idx[np.argsort(-sims[cand_idx])]

        # 2) 후보 중에서 topn개 무작위 샘플링(중복 없음)
        m = min(topn, cand_idx.shape[0])
        rng = np.random.default_rng(seed)
        if m < cand_idx.shape[0]:
            sel_positions = rng.choice(cand_idx.shape[0], size=m, replace=False)
            sel_idx = cand_idx[sel_positions]
        else:
            sel_idx = cand_idx

        # 3) 유사도 순 정렬 옵션
        if keep_similarity_order and sel_idx.size > 1:
            sel_idx = sel_idx[np.argsort(-sims[sel_idx])]

        return [self.tag_idx2word[i] for i in sel_idx]
