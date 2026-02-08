export type TotalsRow = { nutrient_id: string; total: number; unit: string }

export function computeTotals(items: Array<{ nutrient_id: string; amount: number; unit: string }>): TotalsRow[] {
  const map = new Map<string, { total: number; unit: string }>()
  for (const it of items) {
    const cur = map.get(it.nutrient_id) || { total: 0, unit: it.unit }
    cur.total += it.amount
    map.set(it.nutrient_id, cur)
  }
  return Array.from(map.entries()).map(([nutrient_id, v]) => ({ nutrient_id, total: v.total, unit: v.unit }))
}
