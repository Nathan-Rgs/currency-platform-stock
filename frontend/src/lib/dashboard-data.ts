export interface ChartRow {
  label: string
  count: number
}

/** Sorts desc, keeps the top `n` and sums the remainder into "Outros". */
export function topN(rows: ChartRow[], n: number): ChartRow[] {
  const sorted = [...rows].sort((a, b) => b.count - a.count)
  if (sorted.length <= n) return sorted
  const rest = sorted.slice(n).reduce((s, r) => s + r.count, 0)
  return [...sorted.slice(0, n), { label: "Outros", count: rest }]
}

/** Groups years into "1990–1999" buckets, ascending. */
export function groupByDecade(rows: { year: number; count: number }[]): ChartRow[] {
  const map = new Map<number, number>()
  for (const { year, count } of rows) {
    const d = Math.floor(year / 10) * 10
    map.set(d, (map.get(d) ?? 0) + count)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, count]) => ({ label: `${d}–${d + 9}`, count }))
}
