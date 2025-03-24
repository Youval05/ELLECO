'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

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
  }, [pathname]);

  return <>{children}</>;
}
