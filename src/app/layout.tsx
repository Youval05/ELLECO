'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import ClientProvider from '@/components/ClientProvider';
import AuthProvider from '@/components/AuthProvider';
import FirebaseMessageReplacer from '@/components/FirebaseMessageReplacer';
import FirebaseStatus from '@/components/FirebaseStatus';

const inter = Inter({ subsets: ['latin'] });

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
        <title>Base Parfaite</title>
        <meta name="description" content="Application de gestion des commandes" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ClientProvider>
            <FirebaseMessageReplacer />
            <FirebaseStatus />
            {children}
          </ClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
