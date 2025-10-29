from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import torch

# API 스키마
class RecommendRequest_DAE(BaseModel):
    user_songs: List[int]
    top_k: int = 10

class RecommendResponse_DAE(BaseModel):
    recommended_songs: List[int]


# DAE wrapper 클래스
class DAE_wrapper_class:
    def __init__(self, model_path: str, num_songs: int, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = EmbeddingDAE(num_songs=num_songs).to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()
        # 전체 곡 vocab (모든 후보)
        self.all_song_ids = torch.arange(num_songs, device=self.device)

    def recommend(self, user_song_ids: List[int], top_k: int) -> List[int]:
        with torch.no_grad():
            remain_tensor = torch.tensor(user_song_ids, device=self.device)
            p = self.model.encode_playlist([remain_tensor])  # [1, dim]
            # 점수(probs)계산
            all_emb = self.model.emb(self.all_song_ids)      # [num_songs, dim]
            scores = all_emb @ p[0]                          # [num_songs]
            # 사용자가 이미 들은 곡은 제외
            scores[user_song_ids] = -1e9

            # Top-K 추천곡 추출
            top_scores, top_indices = torch.topk(scores, top_k)
            return top_indices.cpu().tolist()



'''
# FastAPI 앱 : Backend 반영 완료
app = FastAPI(title="DAE_recommendation_API")

#DAE wrapper 모델(클래스) 초기화
DAE_wrapper = DAE_wrapper_class(
    model_path="pth파일_모델_경로",
    num_songs=707989 
)

@app.post("/recommend_DAE", response_model=RecommendResponse_DAE)
def recommend_DAE(request: RecommendRequest_DAE):
    recommended = DAE_wrapper.recommend(request.user_songs, request.top_k)
    return RecommendResponse_DAE(recommended_songs=recommended)
'''

'''
엔드포인트 정보
URL: /recommend_DAE
Method: POST
Content-Type: json
'''