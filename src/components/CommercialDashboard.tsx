'use client';

import { useState } from 'react';
import { useStore } from '../store/store';
import { Order, OrderStatus, Pallet } from '../types/order';
import { convertLegacyOrder } from '../utils/orderConverter';
import Link from 'next/link';

const PALLET_DIMENSIONS = ['60x40', '80x120', '100x120'] as const;

const DEFAULT_PALLET: Pallet = {
  dimensions: '80x120',
  weight: 0,
  height: 0
};

interface OrderUpdateData extends Omit<Partial<Order>, 'plannedDeliveryDate'> {
  plannedDeliveryDate?: string | null;
}

interface OrderFormProps {
  order: Order;
  onSubmit: () => void;
  onCancel: () => void;
}

interface EditedOrderForm {
  reference: string;
  pallets: Pallet[];
  palletCount: string;
  plannedDeliveryDate: string;
  status: OrderStatus;
}

const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    // Si c'est une chaîne de caractères
    if (typeof date === 'string') {
      // Essayer de parser la date
      dateObj = new Date(date);
      
      // Vérifier si la date est valide
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date string:', date);
        return '';
      }
    } 
    // Si c'est déjà une date
    else if (date instanceof Date) {
      dateObj = date;
      
      // Vérifier si la date est valide
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid Date object');
        return '';
      }
    } 
    else {
      console.error('Unsupported date format:', date);
      return '';
    }
    
    // Formater la date pour l'input
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const formatDate = (dateStr: string | null | undefined): string => {
  console.log('Tentative de formatage de la date:', dateStr);
  if (!dateStr) {
    console.log('Date non définie');
    return 'Date inconnue';
  }

  try {
    const date = new Date(dateStr);
    console.log('Date parsée:', date);
    if (isNaN(date.getTime())) {
      console.log('Date invalide après parsing');
      return 'Date invalide';
    }

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const formatted = formatter.format(date);
    console.log('Date formatée:', formatted);
    return formatted;
  } catch (error) {
    console.error('Erreur lors du formatage:', error);
    return 'Erreur de date';
  }
};

const CommercialDashboard = () => {
  const { orders: allOrders, currentUser } = useStore();
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  const handlePalletCountChange = (count: number, pallets: Pallet[]) => {
    if (count > pallets.length) {
      const newPallets: Pallet[] = Array(count - pallets.length).fill({
        dimensions: '80x120',
        weight: 0,
        height: 0
      });
      return [...pallets, ...newPallets];
    }
    return pallets.slice(0, count);
  };

  // Filtrer les commandes pour n'afficher que celles qui ne sont pas archivées
  const myOrders = allOrders
    .filter(order => !order.archived)
    .map(order => convertLegacyOrder(order));

  // Filtrer et trier les commandes
  const filteredOrders = myOrders
    .filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .filter(order => {
      if (statusFilter === 'all') return true;
      return order.status === statusFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Fonction pour changer le tri
  const toggleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleArchiveOrder = async (orderId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir archiver cette commande ?')) {
      try {
        console.log('Archivage de la commande:', orderId);
        await useStore.getState().archiveOrder(orderId);
        // Feedback visuel de succès
        alert('Commande archivée avec succès');
        // Forcer un rafraîchissement de la liste
        const unsubscribe = useStore.getState().initSync();
        if (unsubscribe) setTimeout(() => unsubscribe(), 1000);
      } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
      }
    }
  };

  const OrderForm: React.FC<OrderFormProps> = ({ order, onSubmit, onCancel }) => {
    const [editedOrder, setEditedOrder] = useState<EditedOrderForm>({
      reference: order.reference || '',
      pallets: order.pallets || [],
      palletCount: (order.pallets?.length || 0).toString(),
      plannedDeliveryDate: order.plannedDeliveryDate || '',
      status: order.status || 'à planifier'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const updatedOrder: OrderUpdateData = {
          reference: editedOrder.reference,
          plannedDeliveryDate: editedOrder.plannedDeliveryDate ? editedOrder.plannedDeliveryDate : null,
          status: editedOrder.status
        };

        useStore.getState().updateOrder(order.id, updatedOrder);
        onSubmit();
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date de chargement prévu
          </label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={editedOrder.plannedDeliveryDate || ''}
            onChange={(e) => {
              // Si une date est ajoutée et que le statut est "à planifier", le passer à "confirmée"
              const newStatus = 
                e.target.value && editedOrder.status === 'à planifier' 
                  ? 'confirmée' 
                  : editedOrder.status;
              
              setEditedOrder({ 
                ...editedOrder, 
                plannedDeliveryDate: e.target.value,
                status: newStatus
              });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Référence
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={editedOrder.reference}
            onChange={(e) => setEditedOrder({ ...editedOrder, reference: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Palettes
          </label>
          <div className="mt-2 bg-gray-50 p-4 rounded-lg">
            {editedOrder.pallets?.map((pallet, index) => (
              <div key={index} className="mb-4 p-4 bg-white rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Dimensions</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
                      value={pallet.dimensions || ''}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Poids (kg)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
                      value={pallet.weight || ''}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Hauteur (cm)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
                      value={pallet.height || ''}
                      disabled
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 mt-2">Les détails des palettes ne peuvent être modifiés que par les préparateurs.</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Enregistrer
          </button>
          <button
            type="button"
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
            onClick={onCancel}
          >
            Annuler
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Mes commandes
            </h2>
            <div>
              <Link
                href="/archives"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium text-center"
              >
                Archives
              </Link>
            </div>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="à planifier">À planifier</option>
                <option value="confirmée">Confirmée</option>
                <option value="livrée">Livrée</option>
              </select>
            </div>
          </div>

          {/* En-tête avec bouton de tri */}
          <div className="mb-4 flex items-center">
            <button
              onClick={toggleSort}
              className="px-3 py-1 rounded bg-blue-100 text-blue-700"
            >
              Date de création {sortOrder === 'desc' ? '▼' : '▲'}
            </button>
          </div>

          {/* Liste des commandes */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <div key={order.id} className="mobile-list-item bg-white border border-gray-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {order.clientName || 'Client sans nom'}
                        </h3>
                        <p className="text-sm text-gray-600">Référence: {order.reference || 'Non définie'}</p>
                        <p className="text-sm text-gray-600">
                          Date de chargement prévu : {order.plannedDeliveryDate ? new Date(order.plannedDeliveryDate).toLocaleDateString() : 'Non planifié'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Nombre de palettes : {order.pallets?.length || 0} | Poids total : {order.pallets?.reduce((total, pallet) => total + (pallet.weight || 0), 0)} kg
                        </p>
                        <p className="text-sm text-gray-600">
                          Préparateur : {order.preparateur || 'Non assigné'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Créée le : {formatDate(order.createdAt)}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'à planifier' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmée' ? 'bg-green-100 text-green-800' :
                            order.status === 'livrée' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col justify-end space-x-2 sm:space-x-0 sm:space-y-2">
                        <button
                          onClick={() => {
                            setEditingOrder(order.id);
                            setMode('edit');
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleArchiveOrder(order.id)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm"
                        >
                          Archiver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire d'édition */}
      {mode === 'edit' && editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Modifier la commande</h2>
              <OrderForm
                order={filteredOrders.find(o => o.id === editingOrder) || filteredOrders[0]}
                onSubmit={() => {
                  setMode('list');
                  setEditingOrder(null);
                }}
                onCancel={() => {
                  setMode('list');
                  setEditingOrder(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialDashboard;
