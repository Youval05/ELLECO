'use client';

import { Dispatch, SetStateAction } from 'react';

type UserType = 'preparateur' | 'commercial' | null;

interface UserSelectorProps {
  selectedType: UserType;
  setSelectedType: Dispatch<SetStateAction<UserType>>;
  users: {
    preparateur: readonly string[];
    commercial: readonly string[];
  };
  onSelectUser: (user: string, type: UserType) => void;
}

const USERS = {
  preparateur: ['Bryan', 'Muriel'],
  commercial: ['Rudy', 'Carlo', 'Jérôme'],
}

export default function UserSelector({ selectedType, setSelectedType, users = USERS, onSelectUser }: UserSelectorProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8 pt-safe pb-safe">
      <div className="max-w-md mx-auto">
        {!selectedType ? (
          <>
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
          </>
        ) : (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Sélectionnez votre nom
              </h2>
              <button
                onClick={() => setSelectedType(null)}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Retour à la sélection du profil
              </button>
            </div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {users[selectedType].map(user => (
                    <button
                      key={user}
                      onClick={() => onSelectUser(user, selectedType)}
                      className={`${
                        selectedType === 'preparateur'
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                      } font-semibold py-4 px-4 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center`}
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
