'use client';

import { useEffect } from 'react';
import { useStore } from '../store/store';
import FirebaseStatus from './FirebaseStatus';

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const initSync = useStore((state) => state.initSync);

  useEffect(() => {
    // initSync retourne une fonction de cleanup ou undefined
    const cleanup = initSync();
    
    return () => {
      cleanup?.(); // Appel optionnel de la fonction de cleanup
    };
  }, [initSync]);

  return (
    <>
      <FirebaseStatus />
      {children}
    </>
  );
};

export default ClientProvider;
