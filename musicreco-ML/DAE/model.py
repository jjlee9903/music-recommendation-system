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
        # 디코더는 E와 weight tying
        self.norm = nn.LayerNorm(dim)

    def encoder(self, remain_lists):
        out = []
        for ids in remain_lists:
            # 예외처리
            if len(ids) == 0:
                out.append(torch.zeros(self.emb.embedding_dim, device=self.emb.weight.device))
            else:
                e = self.emb(ids.to(self.emb.weight.device))  # [ids_length, dim]
                p = e.mean(dim=0)                              # [dim]
                p = self.encoder(p)
                p = self.norm(p)
                out.append(p)
        return torch.stack(out, dim=0)  # [B, dim]

    def score_candidates(self, p, candidates_lists):
        # p: [B, dim], candidates_lists: List[Tensor{m}]
        logits_list = []
        for i, cand in enumerate(candidates_lists):
            e_c = self.emb(cand.to(self.emb.weight.device))  # [m, dim]
            # 점수 = dot(E[candidates], p[i])
            logits = e_c @ p[i]                              # [m]
            logits_list.append(logits)
        return logits_list

    def forward(self, remain_lists, candidates_lists):
        p = self.encoder(remain_lists)               # [B, dim]
        logits = self.score_candidates(p, candidates_lists)  # List[Tensor{m}]
        return logits