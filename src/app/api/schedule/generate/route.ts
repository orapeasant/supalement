import { NextResponse, NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { generatePlan } from '@/lib/scheduling/generatePlan'

export async function POST(req: NextRequest) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { profileId, supplementIds } = body
  const { planId } = await generatePlan(supabase, profileId, supplementIds)
  return NextResponse.json({ planId })
}
