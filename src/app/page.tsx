'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import CommercialDashboard from '../components/CommercialDashboard';
import PreparateurDashboard from '../components/PreparateurDashboard';
import UserSelector from '../components/UserSelector';

const USERS = {
  preparateur: ['LENA', 'Johan', 'Préparateur1'],
  commercial: ['en attente', 'Youval', 'Betsalel']
} as const;

type UserType = 'preparateur' | 'commercial' | null;

export default function Home() {
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const { setUser, currentUser, userType, initSync } = useStore();
  
  // Initialiser la synchronisation avec Firestore au chargement de la page
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

  const handleSetUser = (user: string, type: UserType) => {
    setUser(user, type);
  };

  const handleReset = () => {
    setSelectedType(null);
    setUser('', null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {!currentUser ? (
          <UserSelector
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            users={USERS}
            onSelectUser={handleSetUser}
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">
                {userType === 'preparateur' ? 'Dashboard Préparateur' : 'Dashboard Commercial'}
              </h1>
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </div>

            {userType === 'preparateur' ? (
              <PreparateurDashboard />
            ) : (
              <CommercialDashboard />
            )}
          </>
        )}
      </div>
    </div>
  );
}
