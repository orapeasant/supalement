"use client"
import { useEffect, useState } from 'react'

export default function SupplementDetail({ params }: any) {
  const [supplement, setSupplement] = useState<any>(null)
  const [factsImage, setFactsImage] = useState<File | null>(null)

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/supplements?id=${params.id}`)
      const json = await res.json()
      setSupplement(json)
    })()
  }, [params.id])

  const uploadFacts = async () => {
    if (!factsImage) return
    const formData = new FormData()
    formData.append('file', factsImage)
    await fetch(`/api/supplements/${params.id}/images`, { method: 'POST', body: formData })
    alert('Uploaded facts image')
  }

  const runOcr = async () => {
    await fetch(`/api/supplements/${params.id}/ocr`, { method: 'POST' })
    alert('OCR complete (stub)')
  }

  const parse = async () => {
    await fetch(`/api/supplements/${params.id}/parse`, { method: 'POST' })
    alert('Parsed nutrients')
  }

  if (!supplement) return <div>Loading...</div>
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{supplement.name}</h1>
      <p className="text-gray-600 mb-4">{supplement.brand} • {supplement.form}</p>
      <div className="grid gap-3 max-w-md">
        <input type="file" accept="image/*" onChange={e=>setFactsImage(e.target.files?.[0] || null)} />
        <button onClick={uploadFacts} className="rounded bg-black text-white py-2">Upload Facts Image</button>
        <button onClick={runOcr} className="rounded bg-black text-white py-2">Run OCR (stub)</button>
        <button onClick={parse} className="rounded bg-black text-white py-2">Parse Nutrients</button>
      </div>
    </div>
  )
}
