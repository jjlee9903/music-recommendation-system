import React, { useMemo, useState } from "react";
import { Hash } from "lucide-react";

interface Props {
  topTags: string[];
  randomPool: string[];
  selected: string[];
  onSelect: (t: string) => void;
  onUnselect: (t: string) => void;
  onRandomize: () => void;
}

const TagPicker: React.FC<Props> = ({ topTags, randomPool, selected, onSelect, onUnselect, onRandomize }) => {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return topTags.filter(t => !selected.includes(t))
                  .filter(t => t.toLowerCase().includes(normalizedQuery))
                  .slice(0, 20);
  }, [topTags, selected, normalizedQuery]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Hash className="h-6 w-6 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-800">관심 있는 태그를 선택하세요</h2>
        </div>
        <button onClick={onRandomize} className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200">
          랜덤 새로고침
        </button>
      </div>

      <div className="mb-3">
        <input value={query} onChange={(e)=>setQuery(e.target.value)}
               placeholder="태그 검색"
               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        {query && suggestions.length > 0 && (
          <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow">
            {suggestions.map((t) => (
              <button key={t} onClick={()=> { onSelect(t); setQuery(""); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50">
                #{t}
              </button>
            ))}
          </div>
        )}
        {query && suggestions.length === 0 && <div className="mt-2 text-sm text-gray-500">검색 결과가 없습니다.</div>}
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selected.map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm flex items-center gap-2">
              #{t}
              <button onClick={()=>onUnselect(t)} className="text-green-700 hover:text-green-900" aria-label={`${t} 제거`}>✕</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {randomPool.map(t => {
          const active = selected.includes(t);
          return (
            <button key={t} onClick={()=> active ? onUnselect(t) : onSelect(t)}
              className={`px-4 py-2 rounded-full text-sm transition ${active ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              #{t}
            </button>
          );
        })}
      </div>

      <div className="text-sm text-gray-500 mt-3">선택된 태그: {selected.length}개</div>
    </div>
  );
};

export default TagPicker;
