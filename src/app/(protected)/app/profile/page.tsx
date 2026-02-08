"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [type, setType] = useState<'adult'|'child'>('adult')
  const [age, setAge] = useState<number>(30)
  const [sex, setSex] = useState<'male'|'female'|'other'|'unknown'>('unknown')

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id)
      setProfiles(data || [])
    })()
  }, [])

  const createProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').insert({ user_id: user.id, type, age_years: age, sex })
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id)
    setProfiles(data || [])
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <div className="grid gap-4 max-w-md">
        <label className="grid gap-1">
          <span>Type</span>
          <select value={type} onChange={e=>setType(e.target.value as any)} className="border rounded p-2">
            <option value="adult">Adult</option>
            <option value="child">Child</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span>Age (years)</span>
          <input type="number" value={age} onChange={e=>setAge(parseInt(e.target.value||'0'))} className="border rounded p-2" />
        </label>
        <label className="grid gap-1">
          <span>Sex</span>
          <select value={sex} onChange={e=>setSex(e.target.value as any)} className="border rounded p-2">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <button onClick={createProfile} className="rounded bg-black text-white py-2">Create Profile</button>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Your profiles</h2>
      <ul className="space-y-2">
        {profiles.map(p => (
          <li key={p.id} className="border rounded p-2">
            {p.type} • {p.age_years} • {p.sex}
          </li>
        ))}
      </ul>
    </div>
  )
}
