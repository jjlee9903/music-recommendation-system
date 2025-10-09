import { useEffect, useMemo, useState } from "react";

export function useGenreMap() {
  const [genreMap, setGenreMap] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/genre_map.json").then(r => r.json()).then(setGenreMap)
      .catch(e => console.error("genre_map load failed", e));
  }, []);

  const mapGenreCodes = useMemo(() => {
    return (input: unknown): string[] => {
      if (Array.isArray(input)) return input.map(c => genreMap[String(c)] ?? String(c));
      if (typeof input === "string") {
        const codes = input.match(/GN\d{4}/g) || input.split(/[,\s/]+/).filter(Boolean);
        return codes.map(c => genreMap[c] ?? c);
      }
      return [];
    };
  }, [genreMap]);

  return { genreMap, mapGenreCodes };
}
