'use client';

import { useState } from 'react';
import { useStore } from '../store/store';
import { Order } from '../types/order';

const ArchiveDashboard = () => {
  const { orders, currentUser, userType } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCriteria, setDeleteCriteria] = useState<'all' | 'older-than-30-days' | 'older-than-90-days' | 'older-than-year'>('older-than-30-days');
  const [isDeleting, setIsDeleting] = useState(false);

  console.log('Toutes les commandes:', orders);
  
  // Filtrer uniquement les commandes archivées
  const archivedOrders = orders.filter(order => {
    console.log('Vérification commande:', order.id, 'archived:', order.archived, 'status:', order.status);
    return order.archived === true || order.status === 'archivée';
  });
  
  console.log('Commandes archivées trouvées:', archivedOrders.length);

  // Filtrer les commandes en fonction de la recherche et du filtre de statut
  const filteredOrders = archivedOrders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    const matchesSearch = searchTerm === '' || 
      order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.commercial?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDeleteArchivedOrders = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement les commandes archivées ${
      deleteCriteria === 'all' ? 'toutes' : 
      deleteCriteria === 'older-than-30-days' ? 'de plus de 30 jours' : 
      deleteCriteria === 'older-than-90-days' ? 'de plus de 90 jours' : 
      'de plus d\'un an'
    } ?`)) {
      try {
        setIsDeleting(true);
        const deletedCount = await useStore.getState().deleteArchivedOrders(deleteCriteria);
        alert(`${deletedCount} commande(s) archivée(s) supprimée(s) avec succès.`);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des commandes archivées.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold">Commandes Archivées</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Rechercher par client, référence ou commercial"
              className="p-2 border rounded w-full md:w-80"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              className="p-2 border rounded"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="à planifier">À planifier</option>
              <option value="planifiée">Planifiée</option>
              <option value="livrée">Livrée</option>
              <option value="archivée">Archivée</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Nettoyage Intelligent
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nettoyage Intelligent des Archives</h2>
            <p className="mb-4">
              Sélectionnez un critère pour supprimer définitivement les commandes archivées.
              Cette action est irréversible.
            </p>
            
            <div className="mb-4">
              <label className="block mb-2">Critère de suppression :</label>
              <select
                className="w-full p-2 border rounded"
                value={deleteCriteria}
                onChange={e => setDeleteCriteria(e.target.value as any)}
                disabled={isDeleting}
              >
                <option value="older-than-30-days">Plus de 30 jours</option>
                <option value="older-than-90-days">Plus de 90 jours</option>
                <option value="older-than-year">Plus d'un an</option>
                <option value="all">Toutes les archives</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteArchivedOrders}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression en cours...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Aucune commande archivée trouvée.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow opacity-75">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{order.clientName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${order.status === 'à planifier' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${order.status === 'planifiée' ? 'bg-blue-100 text-blue-800' : ''}
                      ${order.status === 'livrée' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {order.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      Archivée
                    </span>
                  </div>
                  <p className="text-gray-600">Commercial: {order.commercial}</p>
                  <p className="text-gray-600">Référence: {order.reference || 'Non définie'}</p>
                  <p className={`
                    ${order.status === 'à planifier' ? 'text-yellow-600' : ''}
                    ${order.status === 'planifiée' ? 'text-blue-600' : ''}
                    ${order.status === 'livrée' ? 'text-green-600' : ''}
                  `}>
                    Date de livraison: {order.plannedDeliveryDate 
                      ? (() => {
                          try {
                            const date = new Date(order.plannedDeliveryDate);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              });
                            }
                            return 'Non planifiée';
                          } catch (error) {
                            console.error('Error formatting display date:', error);
                            return 'Non planifiée';
                          }
                        })()
                      : 'Non planifiée'}
                  </p>
                  <p className="text-gray-600">
                    Archivée le: {order.archivedAt 
                      ? new Date(order.archivedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Date inconnue'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveDashboard;
