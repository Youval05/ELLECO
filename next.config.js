/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Masquer l'en-tête X-Powered-By
  
  // Configuration des en-têtes de sécurité HTTP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ],
      },
    ]
  },

  // Configuration de la politique de sécurité du contenu
  async rewrites() {
    return {
      beforeFiles: [
        // Redirection des requêtes API vers votre domaine uniquement
        {
          source: '/api/:path*',
          destination: '/api/:path*',
          has: [
            {
              type: 'header',
              key: 'origin',
              value: process.env.NEXT_PUBLIC_APP_URL,
            },
          ],
        },
      ],
    }
  },
}

module.exports = nextConfig
