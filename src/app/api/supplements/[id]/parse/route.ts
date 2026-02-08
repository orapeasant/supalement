import { NextResponse, NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { parseSupplementFacts } from '@/lib/parsing/supplementFacts'

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: run } = await supabase
    .from('ocr_runs')
    .select('*')
    .eq('supplement_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!run) return NextResponse.json({ error: 'No OCR run' }, { status: 400 })

  const parsed = parseSupplementFacts(run.raw_text)

  // map name to nutrients_reference
  for (const n of parsed.nutrients) {
    const { data: ref } = await supabase
      .from('nutrients_reference')
      .select('*')
      .eq('canonical_name', n.name.toLowerCase())
      .maybeSingle()
    if (!ref) continue
    const { error: upsertErr } = await supabase
      .from('supplement_nutrients')
      .upsert({
        user_id: user.id,
        supplement_id: id,
        nutrient_id: ref.id,
        amount_per_serving: n.amount,
        unit: n.unit,
        percent_dv: n.percentDV,
      }, { onConflict: 'supplement_id,nutrient_id' })
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })
  }

  await supabase.from('supplements').update({ status: 'parsed' }).eq('id', id)
  return NextResponse.json({ ok: true })
}
