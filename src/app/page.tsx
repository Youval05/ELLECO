'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import CommercialDashboard from '../components/CommercialDashboard';
import PreparateurDashboard from '../components/PreparateurDashboard';
import ClientProvider from '../components/ClientProvider';
import FirebaseStatus from '../components/FirebaseStatus';
import AuthForm from '../components/AuthForm';

const USERS = {
  preparateur: ['Bryan', 'Muriel', 'Lena', 'Johan'],
  commercial: ['En attente', 'Jordan', 'Jérôme', 'Rudy', 'Carlo']
} as const;

type UserType = 'preparateur' | 'commercial' | null;

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const { setUser, currentUser, userType, initSync } = useStore();
  
  useEffect(() => {
    console.log('Initialisation de la synchronisation...');
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
      return () => {};
    }
  }, [initSync]);

  const handleAuth = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleSetUser = (user: string, type: UserType) => {
    setUser(user, type);
  };

  const handleReset = () => {
    setSelectedType(null);
    setUser('', null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <ClientProvider>
      <div className="min-h-screen bg-gray-100">
        {!selectedType && !userType ? (
          <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Sélectionnez votre profil
                </h2>
              </div>
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedType('preparateur')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-6 sm:py-8 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200"
                    >
                      Préparateur
                    </button>
                    <button
                      onClick={() => setSelectedType('commercial')}
                      className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-6 sm:py-8 px-4 rounded-lg border-2 border-green-200 transition-colors duration-200"
                    >
                      Commercial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !currentUser ? (
          <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
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
                  <div className="grid grid-cols-1 gap-4">
                    {selectedType === 'preparateur' ? (
                      <>
                        {USERS.preparateur.map(user => (
                          <button
                            key={user}
                            onClick={() => handleSetUser(user, selectedType)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200"
                          >
                            {user}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {USERS.commercial.map(user => (
                          <button
                            key={user}
                            onClick={() => handleSetUser(user, selectedType)}
                            className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-4 px-4 rounded-lg border-2 border-green-200 transition-colors duration-200"
                          >
                            {user}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-4 sm:px-0">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {userType === 'preparateur' ? 'Tableau de bord Préparateur' : 'Tableau de bord Commercial'}
                  </h1>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Déconnexion
                  </button>
                </div>
                {userType === 'preparateur' ? (
                  <PreparateurDashboard />
                ) : (
                  <CommercialDashboard />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientProvider>
  );
}
