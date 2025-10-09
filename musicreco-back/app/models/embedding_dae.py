import torch
import torch.nn as nn
import torch.nn.functional as F

class EmbeddingDAE(nn.Module):
    def __init__(self, num_songs, dim=128, depth=2, dropout=0.1):
        super().__init__()
        self.emb = nn.Embedding(num_songs, dim)
        enc = []
        for _ in range(depth):
            enc += [nn.Linear(dim, dim), nn.ReLU(), nn.Dropout(dropout)]
        self.encoder = nn.Sequential(*enc)
        # 디코더는 E와 weight tying(점수= E[cand] · p). 따라서 별도 MLP없음.

        # 선택: 레이어정규화(소배치 안정)
        self.norm = nn.LayerNorm(dim)

    def encode_playlist(self, remain_lists):
        # remain_lists: List[Tensor{n_i}]
        # 각 플레이리스트 임베딩 평균 → encoder → 정규화
        out = []
        for ids in remain_lists:
            if len(ids) == 0:
                # 전부 마스크되는 극단 케이스 방어
                out.append(torch.zeros(self.emb.embedding_dim, device=self.emb.weight.device))
            else:
                e = self.emb(ids.to(self.emb.weight.device))  # [n_i, dim]
                p = e.mean(dim=0)                              # [dim]
                p = self.encoder(p)
                p = self.norm(p)
                out.append(p)
        return torch.stack(out, dim=0)  # [B, dim]

    def score_candidates(self, p, candidates_lists):
        # p: [B, dim], candidates_lists: List[Tensor{m_i}]
        logits_list = []
        for i, cand in enumerate(candidates_lists):
            e_c = self.emb(cand.to(self.emb.weight.device))  # [m_i, dim]
            # 점수 = dot(E[candidates], p[i])
            logits = e_c @ p[i]                              # [m_i]
            logits_list.append(logits)
        return logits_list

    def forward(self, remain_lists, candidates_lists):
        p = self.encode_playlist(remain_lists)               # [B, dim]
        logits = self.score_candidates(p, candidates_lists)  # List[Tensor{m_i}]
        return logits