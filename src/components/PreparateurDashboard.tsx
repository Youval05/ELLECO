'use client';

import { useState } from 'react';
import { useStore } from '../store/store';
import { convertLegacyOrder } from '../utils/orderConverter';
import { Order, OrderStatus, Pallet } from '../types/order';
import Link from 'next/link';

const PALLET_DIMENSIONS = ['60x40', '80x120', '100x120'] as const;

const DEFAULT_PALLET: Pallet = {
  dimensions: '80x120',
  weight: 0,
  height: 0
};

interface OrderUpdateData extends Omit<Partial<Order>, 'plannedDeliveryDate'> {
  plannedDeliveryDate?: string | null;
  pallets?: Pallet[];
  status?: OrderStatus;
  preparateur?: string;
  reference?: string;
}

interface EditedOrderForm {
  reference: string;
  pallets: Pallet[];
  palletCount: string;
  plannedDeliveryDate: string;
  status: OrderStatus;
  preparateur: string;
}

interface OrderFormProps {
  order: Order;
  onSubmit: () => void;
  onCancel: () => void;
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

const PreparateurDashboard = () => {
  const { orders, currentUser } = useStore();
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list');
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [newOrder, setNewOrder] = useState({
    clientName: '',
    reference: '',
    palletCount: '',
    pallets: [{ ...DEFAULT_PALLET }]
  });

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

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    useStore.getState().addOrder({
      client: newOrder.clientName,
      clientName: newOrder.clientName,
      reference: newOrder.reference,
      preparateur: currentUser,
      pallets: newOrder.pallets,
    });
    setNewOrder({
      clientName: '',
      reference: '',
      palletCount: '',
      pallets: [{ ...DEFAULT_PALLET }]
    });
    setMode('list');
  };

  const ordersList = orders.map(order => convertLegacyOrder(order));

  // Filtrer et trier les commandes
  const filteredOrders = ordersList
    .filter(order => {
      // Exclure les commandes archivées
      if (order.archived === true || order.status === 'archivée') return false;
      
      // Filtrer par statut
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      
      const matchesSearch = searchTerm === '' || 
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
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

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await useStore.getState().deleteOrder(orderId);
        // Feedback visuel de succès
        alert('Commande supprimée avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
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
      status: order.status || 'à planifier',
      preparateur: order.preparateur || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const updatedOrder: OrderUpdateData = {
          reference: editedOrder.reference,
          plannedDeliveryDate: editedOrder.plannedDeliveryDate ? editedOrder.plannedDeliveryDate : null,
          status: editedOrder.status,
          pallets: editedOrder.pallets,
          preparateur: editedOrder.preparateur
        };

        useStore.getState().updateOrder(order.id, updatedOrder);
        onSubmit();
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    };

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

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date de chargement prévu
          </label>
          <input
            type="date"
            value={editedOrder.plannedDeliveryDate}
            onChange={(e) => {
              console.log('New date value:', e.target.value);
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Statut
          </label>
          <select
            value={editedOrder.status}
            onChange={(e) => setEditedOrder({ ...editedOrder, status: e.target.value as OrderStatus })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3"
          >
            <option value="à planifier">À planifier</option>
            <option value="confirmée">Confirmée</option>
            <option value="livrée">Livrée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Préparateur
          </label>
          <input
            type="text"
            value={editedOrder.preparateur}
            onChange={(e) => setEditedOrder({ ...editedOrder, preparateur: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Référence
          </label>
          <input
            type="text"
            value={editedOrder.reference}
            onChange={(e) => setEditedOrder({ ...editedOrder, reference: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium mb-1">Palettes</label>
            <button
              type="button"
              onClick={() => {
                const newPallets = [...editedOrder.pallets, { ...DEFAULT_PALLET }];
                setEditedOrder({
                  ...editedOrder,
                  pallets: newPallets,
                  palletCount: newPallets.length.toString()
                });
              }}
              className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200"
            >
              + Ajouter une palette
            </button>
          </div>
          <div className="space-y-6">
            {editedOrder.pallets?.map((pallet: Pallet, index: number) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium mb-3 text-base">Palette {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newPallets = [...editedOrder.pallets];
                      newPallets.splice(index, 1);
                      setEditedOrder({
                        ...editedOrder,
                        pallets: newPallets,
                        palletCount: newPallets.length.toString()
                      });
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Poids (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full p-3 border border-gray-300 rounded-md text-base"
                      value={pallet.weight}
                      onChange={e => {
                        const newPallets = [...editedOrder.pallets];
                        newPallets[index] = {
                          ...pallet,
                          weight: parseFloat(e.target.value) || 0
                        };
                        setEditedOrder({ ...editedOrder, pallets: newPallets });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dimensions</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md text-base"
                      value={pallet.dimensions}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const newPallets = [...editedOrder.pallets];
                        newPallets[index] = {
                          ...pallet,
                          dimensions: e.target.value
                        };
                        setEditedOrder({ ...editedOrder, pallets: newPallets });
                      }}
                    >
                      <option value="">Sélectionner</option>
                      {PALLET_DIMENSIONS.map(dim => (
                        <option key={dim} value={dim}>
                          {dim}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hauteur (cm)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full p-3 border border-gray-300 rounded-md text-base"
                      value={pallet.height}
                      onChange={e => {
                        const newPallets = [...editedOrder.pallets];
                        newPallets[index] = {
                          ...pallet,
                          height: parseFloat(e.target.value) || 0
                        };
                        setEditedOrder({ ...editedOrder, pallets: newPallets });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-600 w-full sm:w-auto"
            >
              Enregistrer
            </button>
            <button
              type="button"
              className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-200 w-full sm:w-auto"
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-base font-medium hover:bg-red-200 w-full sm:w-auto"
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
                  useStore.getState().deleteOrder(order.id);
                  onSubmit();
                }
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 safe-areas">
      {mode === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
            <h1 className="text-xl font-bold">Tableau de bord</h1>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setMode('new')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 w-full sm:w-auto"
              >
                New Order
              </button>
              <Link 
                href="/archives" 
                className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-700 text-center w-full sm:w-auto"
              >
                Archives
              </Link>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              className="p-3 border border-gray-300 rounded-lg text-base w-full sm:w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="à planifier">À planifier</option>
              <option value="confirmée">Confirmée</option>
              <option value="livrée">Livrée</option>
            </select>
            <input
              type="text"
              placeholder="Rechercher..."
              className="p-3 border border-gray-300 rounded-lg text-base flex-grow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
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
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">Aucune commande trouvée</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start space-y-3 sm:space-y-0">
                    <div className="w-full sm:w-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{order.clientName || 'Client sans nom'}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'à planifier' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmée' ? 'bg-green-100 text-green-800' :
                          order.status === 'livrée' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">Référence: {order.reference || 'Non définie'}</p>
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
                        Créée le : {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Date inconnue'}
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setEditingOrder(order.id);
                          setMode('edit');
                        }}
                        className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 flex-1 sm:flex-none"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 flex-1 sm:flex-none"
                      >
                        Supprimer
                      </button>
                      <button
                        onClick={() => handleArchiveOrder(order.id)}
                        className="bg-purple-100 text-purple-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 flex-1 sm:flex-none"
                      >
                        Archiver
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {mode === 'edit' && (
        <div className="safe-areas">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
            <h1 className="text-xl font-bold">Modification de la commande</h1>
            <button
              onClick={() => {
                setEditingOrder(null);
                setMode('list');
              }}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-base font-medium hover:bg-gray-200 w-full sm:w-auto"
            >
              Retour à la liste
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            {ordersList.find(o => o.id === editingOrder) ? (
              <OrderForm
                order={ordersList.find(o => o.id === editingOrder)!}
                onSubmit={() => {
                  setEditingOrder(null);
                  setMode('list');
                }}
                onCancel={() => {
                  setEditingOrder(null);
                  setMode('list');
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      {mode === 'new' && (
        <div className="safe-areas">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
            <h1 className="text-xl font-bold">Nouvelle Commande</h1>
            <button
              onClick={() => {
                setNewOrder({
                  clientName: '',
                  reference: '',
                  palletCount: '',
                  pallets: [{ ...DEFAULT_PALLET }]
                });
                setMode('list');
              }}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-base font-medium hover:bg-gray-200 w-full sm:w-auto"
            >
              Retour à la liste
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4">
            <form onSubmit={(e) => {
              handleAddOrder(e);
              setMode('list');
            }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg text-base"
                    value={newOrder.clientName}
                    onChange={e => setNewOrder({ ...newOrder, clientName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Référence</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg text-base"
                  value={newOrder.reference}
                  onChange={e => setNewOrder({ ...newOrder, reference: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium mb-1">Palettes</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newPallets = [...newOrder.pallets, { ...DEFAULT_PALLET }];
                      setNewOrder({
                        ...newOrder,
                        pallets: newPallets,
                        palletCount: newPallets.length.toString()
                      });
                    }}
                    className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200"
                  >
                    + Ajouter une palette
                  </button>
                </div>
                {newOrder.pallets?.map((pallet, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-300 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium mb-3 text-base">Palette {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newPallets = [...newOrder.pallets];
                          newPallets.splice(index, 1);
                          setNewOrder({
                            ...newOrder,
                            pallets: newPallets,
                            palletCount: newPallets.length.toString()
                          });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Dimensions</label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg text-base"
                          value={pallet.dimensions}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newPallets = [...newOrder.pallets];
                            newPallets[index] = {
                              ...pallet,
                              dimensions: e.target.value
                            };
                            setNewOrder({ ...newOrder, pallets: newPallets });
                          }}
                          required
                        >
                          <option value="">Sélectionner</option>
                          {PALLET_DIMENSIONS.map(dim => (
                            <option key={dim} value={dim}>
                              {dim}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Poids (kg)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-full p-3 border border-gray-300 rounded-lg text-base"
                          value={pallet.weight}
                          onChange={e => {
                            const newPallets = [...newOrder.pallets];
                            newPallets[index] = {
                              ...pallet,
                              weight: parseFloat(e.target.value) || 0
                            };
                            setNewOrder({ ...newOrder, pallets: newPallets });
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hauteur (cm)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-full p-3 border border-gray-300 rounded-lg text-base"
                          value={pallet.height}
                          onChange={e => {
                            const newPallets = [...newOrder.pallets];
                            newPallets[index] = {
                              ...pallet,
                              height: parseFloat(e.target.value) || 0
                            };
                            setNewOrder({ ...newOrder, pallets: newPallets });
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                <button
                  type="button"
                  className="px-4 py-3 text-gray-600 bg-gray-100 rounded-lg text-base font-medium hover:bg-gray-200 order-2 sm:order-1"
                  onClick={() => {
                    setNewOrder({
                      clientName: '',
                      reference: '',
                      palletCount: '',
                      pallets: [{ ...DEFAULT_PALLET }]
                    });
                    setMode('list');
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 order-1 sm:order-2"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreparateurDashboard;
