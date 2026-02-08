import { NextResponse } from 'next/server'

export async function GET() {
  // Supabase handles cookies; just redirect to dashboard
  return NextResponse.redirect(new URL('/app/dashboard', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
