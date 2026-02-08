import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServer } from './src/lib/supabase/server'

const protectedPrefix = '/app'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  if (pathname.startsWith(protectedPrefix)) {
    const supabase = await createServer()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/auth/callback'],
}
