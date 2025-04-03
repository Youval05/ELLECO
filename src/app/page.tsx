'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import CommercialDashboard from '../components/CommercialDashboard';
import PreparateurDashboard from '../components/PreparateurDashboard';
import ClientProvider from '../components/ClientProvider';
import FirebaseStatus from '../components/FirebaseStatus';
import AuthForm from '../components/AuthForm';
import { migrateOrders } from '../utils/migrateOrders';

const USERS = {
  preparateur: ['Bryan', 'Muriel', 'Lena', 'Johan'],
  commercial: ['commercial']
} as const;

type UserType = 'preparateur' | 'commercial' | null;

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const { setUser, currentUser, userType, initSync } = useStore();
  
  useEffect(() => {
    const init = async () => {
      console.log('Initialisation de la synchronisation...');
      try {
        const unsubscribe = initSync();
        console.log('Synchronisation initialisée avec succès');
        
        // Exécuter la migration des commandes
        try {
          console.log('Démarrage de la migration des commandes...');
          const updatedCount = await migrateOrders();
          console.log(`Migration terminée. ${updatedCount} commandes mises à jour.`);
          
          // Forcer un rechargement des commandes après la migration
          if (updatedCount > 0) {
            console.log('Rechargement de la page pour appliquer les mises à jour...');
            window.location.reload();
          } else {
            console.log('Aucune mise à jour nécessaire.');
          }
        } catch (error) {
          console.error('Erreur lors de la migration:', error);
        }
        
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
    };

    init();
  }, [initSync]);

  const handleAuth = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleSetUser = (user: string, type: UserType) => {
    if (type === 'commercial') {
      setUser('commercial', type);
    } else {
      setUser(user, type);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setUser('', null);
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <AuthForm onAuth={handleAuth} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-center mb-8">Gestion Transport</h1>
            {userType ? (
              <>
                {userType === 'preparateur' && <PreparateurDashboard />}
                {userType === 'commercial' && <CommercialDashboard />}
                <div className="text-center mt-8">
                  <button
                    onClick={handleReset}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
                  >
                    Changer d'utilisateur
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center space-y-4">
                    <button
                      onClick={() => handleSetUser('commercial', 'commercial')}
                      className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-4 px-8 rounded-lg border-2 border-green-200 transition-colors duration-200 w-full"
                    >
                      Commercial
                    </button>
                    <button
                      onClick={() => setSelectedType('preparateur')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-8 rounded-lg border-2 border-blue-200 transition-colors duration-200 w-full"
                    >
                      Préparateur
                    </button>
                  </div>
                  
                  {selectedType === 'preparateur' && (
                    <div className="grid grid-cols-2 gap-4">
                      {USERS.preparateur.map(user => (
                        <button
                          key={user}
                          onClick={() => handleSetUser(user, selectedType)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200"
                        >
                          {user}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
