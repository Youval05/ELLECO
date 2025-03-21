import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import FirebaseMessageReplacer from '@/components/FirebaseMessageReplacer'

const inter = Inter({ subsets: ['latin'] })

// Charger le composant SyncStatus côté client uniquement
// Temporairement désactivé pour éviter les erreurs
// const SyncStatus = dynamic(() => import('../components/SyncStatus'), { 
//   ssr: false,
//   loading: () => null
// })

export const metadata: Metadata = {
  title: 'Base Parfaite',
  description: 'Application de gestion des commandes',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Base Parfaite',
  },
  formatDetection: {
    telephone: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Delivery Manager" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} bg-gray-50 safe-areas`}>
        <FirebaseMessageReplacer />
        {children}
        {/* Temporairement désactivé pour éviter les erreurs */}
        {/* {(() => {
          try {
            return <SyncStatus />;
          } catch (error) {
            console.error('Erreur lors du rendu de SyncStatus:', error);
            return null;
          }
        })()} */}
      </body>
    </html>
  )
}
