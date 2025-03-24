'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import ClientProvider from '@/components/ClientProvider';
import FirebaseMessageReplacer from '@/components/FirebaseMessageReplacer';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Base Parfaite',
  description: 'Application de gestion des commandes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ClientProvider>
          <AuthProvider>
            <FirebaseMessageReplacer />
            {children}
          </AuthProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
