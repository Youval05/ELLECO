import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Stockage en mémoire pour le rate limiting (à remplacer par Redis en production)
const ipRequests = new Map<string, { count: number; timestamp: number }>();

// Configuration
const securityConfig = {
  // Rate limiting
  maxRequestsPerMinute: 100,
  blockDuration: 5 * 60 * 1000, // 5 minutes en millisecondes

  // Liste des pays autorisés (à configurer selon vos besoins)
  allowedCountries: ['FR'],

  // En-têtes de sécurité
  securityHeaders: {
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseapp.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  },

  // Extensions de fichiers autorisées
  allowedFileExtensions: ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json'],
};

// Fonction pour vérifier si une IP est en train de faire trop de requêtes
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requestData = ipRequests.get(ip);

  if (!requestData) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  // Réinitialiser le compteur après une minute
  if (now - requestData.timestamp > 60 * 1000) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  // Incrémenter le compteur
  requestData.count++;
  ipRequests.set(ip, requestData);

  // Vérifier si le nombre de requêtes dépasse la limite
  return requestData.count > securityConfig.maxRequestsPerMinute;
}

// Middleware principal
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const ip = request.ip || 'unknown';

  // 1. Vérification du rate limiting
  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // 2. Ajout des en-têtes de sécurité
  Object.entries(securityConfig.securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 3. Vérification de l'extension du fichier (protection contre les uploads malveillants)
  const url = new URL(request.url);
  const ext = url.pathname.split('.').pop();
  if (ext && !securityConfig.allowedFileExtensions.includes('.' + ext)) {
    return new NextResponse('File type not allowed', { status: 403 });
  }

  // 4. Protection contre les attaques par force brute sur l'authentification
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const requestData = ipRequests.get(ip);
    if (requestData && requestData.count > 5) {
      return new NextResponse('Too Many Login Attempts', { status: 429 });
    }
  }

  return response;
}

// Configuration des chemins à protéger
export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico).*)',
  ],
};
