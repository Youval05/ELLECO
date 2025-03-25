import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Stockage en mémoire pour le rate limiting
const ipRequests = new Map<string, { count: number; timestamp: number }>()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const ip = request.ip || 'unknown'

  // Rate limiting
  const now = Date.now()
  const requestData = ipRequests.get(ip)
  
  if (requestData) {
    if (now - requestData.timestamp > 60 * 1000) {
      // Réinitialiser après une minute
      ipRequests.set(ip, { count: 1, timestamp: now })
    } else if (requestData.count > 100) {
      // Limite dépassée
      return new NextResponse('Too Many Requests', { status: 429 })
    } else {
      // Incrémenter le compteur
      requestData.count++
      ipRequests.set(ip, requestData)
    }
  } else {
    // Première requête de cette IP
    ipRequests.set(ip, { count: 1, timestamp: now })
  }

  // En-têtes de sécurité
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseapp.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:;"
  )

  // Protection contre les uploads malveillants
  const url = new URL(request.url)
  const ext = url.pathname.split('.').pop()
  const allowedExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json']
  if (ext && !allowedExtensions.includes('.' + ext)) {
    return new NextResponse('File type not allowed', { status: 403 })
  }

  // Protection contre les attaques par force brute sur l'authentification
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const requestData = ipRequests.get(ip)
    if (requestData && requestData.count > 5) {
      return new NextResponse('Too Many Login Attempts', { status: 429 })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|favicon.ico).*)'
  ]
}
