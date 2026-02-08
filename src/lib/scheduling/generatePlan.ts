import { randomUUID } from 'crypto'

export async function generatePlan(supabase: any, profileId: string, supplementIds: string[]) {
  const planId = randomUUID()
  // create plan and three slots
  await supabase.from('schedule_plans').insert({ id: planId, profile_id: profileId, user_id: (await supabase.auth.getUser()).data.user.id, name: 'Daily Plan' })
  const slots = ['Morning','Midday','Evening']
  const slotIds: string[] = []
  for (const s of slots) {
    const { data } = await supabase.from('schedule_slots').insert({ plan_id: planId, slot_name: s }).select('*').single()
    slotIds.push(data.id)
  }
  // naive: place each supplement with 1 serving in Morning
  for (const supId of supplementIds) {
    await supabase.from('schedule_items').insert({ slot_id: slotIds[0], supplement_id: supId, servings: 1 })
  }
  return { planId }
}
