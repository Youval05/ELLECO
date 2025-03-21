import React, { useState, useEffect } from 'react';
import { getFirestore } from 'firebase/firestore';

export default function FirebaseStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    const checkConnection = () => {
      if (db.app) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };

    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  // Style pour le point de statut
  const statusDotClass = `w-2 h-2 rounded-full ${
    isConnected ? 'bg-green-500' : 'bg-red-500'
  } shadow-lg animate-pulse`;

  return (
    <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
      <div className={statusDotClass} />
      <span className="text-sm font-medium text-gray-600">
        {isConnected ? 'Connecté' : 'Déconnecté'}
      </span>
    </div>
  );
}
