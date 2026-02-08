"use client"
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const signIn = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    })
    if (error) console.error(error)
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-sm w-full border rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <button onClick={signIn} className="w-full rounded bg-black text-white py-2 hover:opacity-90">
          Continue with Google
        </button>
      </div>
    </main>
  )
}
