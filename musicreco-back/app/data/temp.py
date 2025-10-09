import json

# 1. 파일 로드
with open("word_to_idx.json", "r", encoding="utf-8") as f:
    word_to_idx = json.load(f)

# 2. 태그 리스트 추출
tags = list(word_to_idx.keys())

# 3. (선택) 사전순으로 정렬
tags_sorted = sorted(tags)

# 4. 몇 개 출력해보기
print(f"총 태그 개수: {len(tags)}개")
print(tags_sorted[:50])  # 앞 50개만 미리보기

# 5. (선택) txt 파일로 저장
with open("tag_list.txt", "w", encoding="utf-8") as f:
    for tag in tags_sorted:
        f.write(tag + "\n")