import { NextResponse, NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const imageId = randomUUID()
  const storagePath = `supplement-images/${user.id}/${id}/${imageId}.jpg`

  const { error: uploadErr } = await supabase.storage.from('supplement-images').upload(storagePath, file)
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 })

  const { error: dbErr } = await supabase.from('supplement_images').insert({
    user_id: user.id,
    supplement_id: id,
    storage_path: `${user.id}/${id}/${imageId}.jpg`,
    type: 'facts'
  })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, imageId })
}
