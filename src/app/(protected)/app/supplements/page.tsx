"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SupplementsPage() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('supplements').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setItems(data || [])
    })()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Supplements</h1>
      <a href="/app/supplements/new" className="inline-block mb-4 rounded bg-black text-white py-2 px-3">Add supplement</a>
      <div className="grid gap-3">
        {items.map(s => (
          <a key={s.id} href={`/app/supplements/${s.id}`} className="border rounded p-3 flex justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-500">{s.brand || '—'}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-gray-200">{s.status}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
