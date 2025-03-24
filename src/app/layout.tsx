'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import ClientProvider from '@/components/ClientProvider';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import FirebaseMessageReplacer from '@/components/FirebaseMessageReplacer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifie si l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Si l'utilisateur n'est pas connecté et n'est pas déjà sur la page de connexion
    if (!isLoggedIn && pathname !== '/login') {
      router.push('/login');
    } else if (isLoggedIn && pathname === '/login') {
      // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion
      router.push('/');
    }
    
    setIsLoading(false);
  }, [pathname]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

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
        <ClientProvider>
          <FirebaseMessageReplacer />
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
