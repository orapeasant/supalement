import { NextResponse, NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const supabase = await createServer()
  if (id) {
    const { data, error } = await supabase.from('supplements').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }
  return NextResponse.json({})
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, brand, form, profileId } = body
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('supplements')
    .insert({ user_id: user.id, profile_id: profileId, name, brand, form })
    .select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id })
}
