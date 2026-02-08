import { NextResponse, NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { runOcr } from '@/lib/ocr/provider'

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: img } = await supabase
    .from('supplement_images')
    .select('*')
    .eq('supplement_id', id)
    .eq('type', 'facts')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!img) return NextResponse.json({ error: 'No facts image' }, { status: 400 })

  const { data: publicUrl } = supabase.storage.from('supplement-images').getPublicUrl(`supplement-images/${img.storage_path}`)
  const result = await runOcr(publicUrl.publicUrl)

  const { error } = await supabase.from('ocr_runs').insert({
    user_id: user.id,
    supplement_id: id,
    provider: 'stub',
    raw_text: result.text,
    confidence: result.confidence || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
