import React from 'react';
import { useStore } from '../store/store';

const SyncStatus: React.FC = () => {
  // Utiliser try-catch pour éviter que les erreurs ne bloquent le rendu
  try {
    const { syncStatus, syncError, lastSync, reconnect } = useStore();

    // Valeurs par défaut en cas de problème
    const status = syncStatus || 'offline';
    
    const getStatusColor = () => {
      switch (status) {
        case 'connected': return 'text-green-500';
        case 'syncing': return 'text-blue-500';
        case 'offline': return 'text-yellow-500';
        case 'error': return 'text-red-500';
        default: return 'text-gray-500';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'connected': return '✓';
        case 'syncing': return '↻';
        case 'offline': return '!';
        case 'error': return '✗';
        default: return '?';
      }
    };

    const getStatusText = () => {
      switch (status) {
        case 'connected': return 'Connecté';
        case 'syncing': return 'Sync...';
        case 'offline': return 'Hors ligne';
        case 'error': return 'Erreur';
        default: return 'Inconnu';
      }
    };

    return (
      <div className="fixed bottom-2 right-2 z-10">
        <div className="bg-white rounded-lg shadow-md p-2 text-xs">
          <div className="flex items-center">
            <span className={`mr-1 ${getStatusColor()}`}>{getStatusIcon()}</span>
            <span className="font-medium">{getStatusText()}</span>
            {(status === 'offline' || status === 'error') && (
              <button 
                onClick={() => {
                  try {
                    reconnect();
                  } catch (error) {
                    console.error('Erreur lors de la reconnexion:', error);
                  }
                }}
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] py-1 px-1 rounded"
              >
                ↻
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erreur dans le composant SyncStatus:', error);
    // Rendu de secours en cas d'erreur
    return null;
  }
};

export default SyncStatus;
