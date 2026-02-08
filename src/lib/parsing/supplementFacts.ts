export type ParsedNutrient = { name: string; amount: number; unit: string; percentDV?: number }
export type ParsedFacts = { servingSizeText?: string; nutrients: ParsedNutrient[] }

export function parseSupplementFacts(raw: string): ParsedFacts {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const facts: ParsedFacts = { nutrients: [] }
  for (const line of lines) {
    if (/^serving size/i.test(line)) {
      facts.servingSizeText = line.replace(/^[Ss]erving [Ss]ize\s*/,'')
      continue
    }
    const m = line.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|IU)\s*(\d+%|)$/i)
    if (m) {
      const name = m[1].trim()
      const amount = parseFloat(m[2])
      const unit = m[3].toLowerCase()
      const percent = m[4] ? parseFloat(m[4].replace('%','')) : undefined
      facts.nutrients.push({ name, amount, unit, percentDV: percent })
    }
  }
  return facts
}
