"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewSupplementPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [form, setForm] = useState('')
  const [profileId, setProfileId] = useState('')

  const submit = async () => {
    const res = await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand, form, profileId })
    })
    const json = await res.json()
    if (json.id) location.href = `/app/supplements/${json.id}`
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Add Supplement</h1>
      <div className="grid gap-3 max-w-md">
        <input className="border rounded p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded p-2" placeholder="Brand" value={brand} onChange={e=>setBrand(e.target.value)} />
        <input className="border rounded p-2" placeholder="Form" value={form} onChange={e=>setForm(e.target.value)} />
        <input className="border rounded p-2" placeholder="Profile ID" value={profileId} onChange={e=>setProfileId(e.target.value)} />
        <button onClick={submit} className="rounded bg-black text-white py-2">Create</button>
      </div>
    </div>
  )
}
