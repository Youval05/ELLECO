'use client';

import { useEffect } from 'react';
import { useStore } from '../../store/store';
import ArchiveDashboard from '../../components/ArchiveDashboard';
import FirebaseStatus from '../../components/FirebaseStatus';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Archives() {
  const { currentUser, userType, initSync } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page d'accueil
    if (!currentUser) {
      router.push('/');
      return;
    }
    
    // Initialiser la synchronisation avec Firestore
    const unsubscribe = initSync();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, router, initSync]);

  if (!currentUser) {
    return <div>Redirection vers la page d'accueil...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Gestionnaire de Livraisons - Archives
          </h1>
          <div className="flex items-center gap-4">
            <FirebaseStatus />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Connecté en tant que {currentUser} ({userType})
              </span>
              <Link href="/" className="text-blue-600 hover:underline">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <ArchiveDashboard />
      </main>
    </div>
  );
}
