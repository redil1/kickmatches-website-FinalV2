import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = new URL(req.url)
  // Basic auth for admin
  if (url.pathname.startsWith('/admin')) {
    const auth = process.env.ADMIN_BASIC_AUTH
    if (!auth) return NextResponse.json({ ok: false }, { status: 403 })
    const header = req.headers.get('authorization') || ''
    const expected = `Basic ${btoa(auth)}`
    if (header !== expected)
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="admin"' },
      })
  }
  // Security headers
  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  return res
}

export const config = {
  matcher: ['/((?!_next|api/stripe/webhook|favicon.ico|sw.js).*)'],
}


