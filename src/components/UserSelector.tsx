import { useUserStore } from '../utils/store'
import type { UserRole } from '../utils/store'

const USERS = {
  preparateurs: ['Bryan', 'Muriel'],
  commerciaux: ['Rudy', 'Carlo', 'Jérôme'],
}

export default function UserSelector() {
  const { currentUser, setCurrentUser } = useUserStore()

  const handleUserSelect = (name: string, role: UserRole) => {
    setCurrentUser({ name, role })
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Sélectionnez votre profil</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Préparateurs</h3>
          <div className="grid grid-cols-2 gap-2">
            {USERS.preparateurs.map((name) => (
              <button
                key={name}
                onClick={() => handleUserSelect(name, 'preparateur')}
                className={`p-3 rounded-lg border transition-colors ${
                  currentUser?.name === name
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Commerciaux</h3>
          <div className="grid grid-cols-2 gap-2">
            {USERS.commerciaux.map((name) => (
              <button
                key={name}
                onClick={() => handleUserSelect(name, 'commercial')}
                className={`p-3 rounded-lg border transition-colors ${
                  currentUser?.name === name
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Se déconnecter
      </button>
    </div>
  )
}
