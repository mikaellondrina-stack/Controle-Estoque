import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.includes(pathname)

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
