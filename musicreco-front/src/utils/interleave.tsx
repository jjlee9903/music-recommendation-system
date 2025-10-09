export function interleaveDedup<T extends { id: number }>(a: T[], b: T[], want = 20) {
  const seen = new Set<number>();
  const merged: T[] = [];
  let i = 0;
  while (merged.length < want && (a[i] || b[i])) {
    for (const src of [a[i], b[i]]) {
      if (!src) continue;
      if (!seen.has(src.id)) { seen.add(src.id); merged.push(src); }
    }
    i += 1;
  }
  return merged;
}
