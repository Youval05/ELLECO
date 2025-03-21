'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import CommercialDashboard from '../components/CommercialDashboard';
import PreparateurDashboard from '../components/PreparateurDashboard';
import ClientProvider from '../components/ClientProvider';
import FirebaseStatus from '../components/FirebaseStatus';

const USERS = {
  preparateur: ['Bryan', 'Muriel'],
  commercial: ['Jordan', 'Jérôme', 'Rudy', 'Carlo']
} as const;

type UserType = 'preparateur' | 'commercial' | null;

export default function Home() {
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const { setUser, currentUser, userType, initSync } = useStore();
  
  // Initialiser la synchronisation avec Firestore au chargement de la page
  useEffect(() => {
    console.log('Initialisation de la synchronisation...');
    // Utilisation d'un try-catch pour éviter que les erreurs ne bloquent le rendu
    try {
      const unsubscribe = initSync();
      console.log('Synchronisation initialisée avec succès');
      return () => {
        console.log('Nettoyage de la synchronisation...');
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
          console.log('Synchronisation nettoyée');
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Firestore:', error);
      // Ne pas bloquer le rendu en cas d'erreur
      return () => {};
    }
  }, [initSync]); // Ajouter initSync aux dépendances

  const handleSetUser = (user: string, type: UserType) => {
    setUser(user, type);
  };

  const handleReset = () => {
    setSelectedType(null);
    setUser('', null);
  };

  return (
    <ClientProvider>
      <FirebaseStatus />
      {!selectedType && !userType ? (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8 pt-safe pb-safe">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Sélectionnez votre profil
              </h2>
            </div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedType('preparateur')}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-6 sm:py-8 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200 flex items-center justify-center"
                  >
                    <span>Préparateur</span>
                  </button>
                  <button
                    onClick={() => setSelectedType('commercial')}
                    className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-6 sm:py-8 px-4 rounded-lg border-2 border-green-200 transition-colors duration-200 flex items-center justify-center"
                  >
                    <span>Commercial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8 pt-safe pb-safe">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Sélectionnez votre nom
              </h2>
              <button
                onClick={handleReset}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Retour à la sélection du profil
              </button>
            </div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedType === 'preparateur' ? USERS.preparateur.map(user => (
                    <button
                      key={user}
                      onClick={() => handleSetUser(user, selectedType)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200 flex items-center justify-center"
                    >
                      {user}
                    </button>
                  )) : USERS.commercial.map(user => (
                    <button
                      key={user}
                      onClick={() => handleSetUser(user, selectedType)}
                      className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-4 px-4 rounded-lg border-2 border-green-200 transition-colors duration-200 flex items-center justify-center"
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <header className="bg-white shadow pt-safe">
            <div className="max-w-7xl mx-auto py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {userType === 'preparateur' ? 'Dashboard Préparateur' : 'Dashboard Commercial'}
              </h1>
              <button
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700 text-sm sm:text-base"
              >
                Déconnexion
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-safe">
            {userType === 'preparateur' ? <PreparateurDashboard /> : <CommercialDashboard />}
          </main>
        </div>
      )}
    </ClientProvider>
  );
}
