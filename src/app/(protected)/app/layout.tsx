import { redirect } from 'next/navigation'
import { createServer } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }
  return (
    <section className="min-h-screen">
      <header className="border-b p-4 flex items-center justify-between">
        <span className="font-semibold">Supalement</span>
        <nav className="text-sm space-x-4">
          <a href="/app/dashboard">Dashboard</a>
          <a href="/app/profile">Profile</a>
          <a href="/app/supplements">Supplements</a>
          <a href="/app/schedule">Schedule</a>
        </nav>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
