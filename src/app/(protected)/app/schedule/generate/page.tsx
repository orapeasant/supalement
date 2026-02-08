"use client"
import { useState } from 'react'

export default function GenerateSchedulePage() {
  const [profileId, setProfileId] = useState('')
  const [supplementIds, setSupplementIds] = useState('')

  const generate = async () => {
    const res = await fetch('/api/schedule/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, supplementIds: supplementIds.split(',').map(s=>s.trim()) })
    })
    const json = await res.json()
    alert('Generated plan: ' + json.planId)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Generate Schedule</h1>
      <div className="grid gap-3 max-w-md">
        <input className="border rounded p-2" placeholder="Profile ID" value={profileId} onChange={e=>setProfileId(e.target.value)} />
        <input className="border rounded p-2" placeholder="Supplement IDs (comma-separated)" value={supplementIds} onChange={e=>setSupplementIds(e.target.value)} />
        <button onClick={generate} className="rounded bg-black text-white py-2">Generate</button>
      </div>
    </div>
  )
}
