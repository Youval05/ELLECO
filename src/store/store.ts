import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus } from '../types/order';

// Type pour les mises à jour Firestore (où les dates sont des chaînes)
interface FirestoreOrderUpdate extends Omit<Partial<Order>, 'plannedDeliveryDate'> {
  plannedDeliveryDate?: string | null;
  version?: number;
  lastModified?: string;
}

export interface StoreState {
  currentUser: string | null;
  userType: 'preparateur' | 'commercial' | null;
  orders: Order[];
  syncStatus: 'connected' | 'syncing' | 'offline' | 'error';
  syncError: string | null;
  lastSync: Date | null;
  
  // Actions
  initSync: () => (() => void) | undefined;
  addOrder: (order: Partial<Order>) => Promise<void>;
  updateOrder: (orderId: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  markOrderAsDelivered: (orderId: string) => Promise<void>;
  archiveOrder: (orderId: string) => Promise<boolean>;
  deleteArchivedOrders: (criteria: 'all' | 'older-than-30-days' | 'older-than-90-days' | 'older-than-year') => Promise<number>;
  setUser: (name: string, type: 'preparateur' | 'commercial' | null) => void;
  reconnect: () => void;
}

export const useStore = create<StoreState>()(
  (set, get) => ({
    currentUser: null,
    userType: null,
    orders: [],
    syncStatus: 'offline',
    syncError: null,
    lastSync: null,

    initSync: () => {
      try {
        console.log('Initialisation de la synchronisation avec Firestore');
        const ordersRef = collection(db, 'orders');
        
        // Écoute des changements en temps réel
        const unsubscribe = onSnapshot(ordersRef, 
          (snapshot) => {
            const orders = snapshot.docs.map(doc => {
              const data = doc.data();
              
              // Convertir les chaînes ISO en objets Date pour l'interface utilisateur
              let plannedDeliveryDate = null;
              if (data.plannedDeliveryDate) {
                try {
                  plannedDeliveryDate = new Date(data.plannedDeliveryDate);
                  if (isNaN(plannedDeliveryDate.getTime())) {
                    plannedDeliveryDate = null;
                  }
                } catch (e) {
                  console.warn(`Date invalide pour la commande ${doc.id}:`, e);
                  plannedDeliveryDate = null;
                }
              }
              
              return {
                id: doc.id,
                ...data,
                plannedDeliveryDate
              };
            }) as Order[];
            
            set({ 
              orders,
              syncStatus: 'connected',
              syncError: null,
              lastSync: new Date()
            });
            
            console.log(`Synchronisé ${orders.length} commandes depuis Firestore`);
          }, 
          (error) => {
            console.error('Erreur de synchronisation:', error);
            set({ 
              syncStatus: 'error',
              syncError: error.message || 'Erreur de connexion à la base de données'
            });
          }
        );
        
        // Retourner la fonction de nettoyage
        return unsubscribe;
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la synchronisation:', error);
        set({ 
          syncStatus: 'error', 
          syncError: error instanceof Error ? error.message : 'Erreur inconnue'
        });
        return undefined;
      }
    },

    addOrder: async (order) => {
      console.log('Début de l\'ajout d\'une commande:', order);
      try {
        set({ syncStatus: 'syncing' });
        console.log('État de synchronisation mis à jour: syncing');
        
        const ordersRef = collection(db, 'orders');
        console.log('Collection orders récupérée');
        
        const newOrder = {
          ...order,
          createdAt: new Date().toISOString(),
          status: 'à planifier' as const,
          version: 1,
          lastModified: new Date().toISOString()
        };
        console.log('Nouvelle commande préparée:', newOrder);
        
        const docRef = await addDoc(ordersRef, newOrder);
        console.log('Commande ajoutée avec succès, ID:', docRef.id);
        
        set({ syncStatus: 'connected', lastSync: new Date() });
        console.log('État de synchronisation mis à jour: connected');
      } catch (error) {
        console.error('Erreur détaillée lors de l\'ajout:', error);
        set({ syncStatus: 'offline' });
        throw error; // Propager l'erreur pour la gestion d'erreur dans l'UI
      }
    },

    updateOrder: async (orderId, updates) => {
      try {
        set({ syncStatus: 'syncing' });
        console.log('État de synchronisation mis à jour: syncing');
        
        const orderRef = doc(db, 'orders', orderId);
        
        // Convertir les dates en chaînes ISO pour Firestore
        const processedUpdates: FirestoreOrderUpdate = {};
        
        // Copier toutes les propriétés sauf plannedDeliveryDate
        Object.keys(updates).forEach(key => {
          if (key !== 'plannedDeliveryDate') {
            // @ts-ignore - Nous savons que ces propriétés sont compatibles
            processedUpdates[key] = updates[key];
          }
        });
        
        // Traiter la date de livraison planifiée séparément
        if (updates.plannedDeliveryDate instanceof Date) {
          if (!isNaN(updates.plannedDeliveryDate.getTime())) {
            // Convertir la date en chaîne pour Firestore
            processedUpdates.plannedDeliveryDate = updates.plannedDeliveryDate.toISOString();
          } else {
            processedUpdates.plannedDeliveryDate = null;
          }
        } else if (updates.plannedDeliveryDate === null) {
          processedUpdates.plannedDeliveryDate = null;
        }
        
        const updatedOrder = {
          ...processedUpdates,
          version: (get().orders.find(o => o.id === orderId)?.version || 0) + 1,
          lastModified: new Date().toISOString()
        };
        
        await updateDoc(orderRef, updatedOrder);
        
        // Mettre à jour l'état local pour une réponse plus rapide
        const updatedOrders = get().orders.map(order => {
          if (order.id === orderId) {
            // Préserver le type Date pour l'état local
            return { ...order, ...updates };
          }
          return order;
        });
        
        set({ 
          orders: updatedOrders,
          syncStatus: 'connected', 
          lastSync: new Date() 
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        set({ syncStatus: 'offline' });
      }
    },

    deleteOrder: async (orderId) => {
      try {
        set({ syncStatus: 'syncing' });
        console.log(`Tentative de suppression de la commande avec ID: ${orderId}`);
        
        // Vérifier si l'ID est valide
        if (!orderId || orderId.trim() === '') {
          console.error('ID de commande invalide pour la suppression');
          set({ syncStatus: 'offline' });
          return;
        }
        
        const orderRef = doc(db, 'orders', orderId);
        await deleteDoc(orderRef);
        
        // Mise à jour locale de l'état pour une réponse plus rapide
        const updatedOrders = get().orders.filter(order => order.id !== orderId);
        set({ 
          orders: updatedOrders,
          syncStatus: 'connected', 
          lastSync: new Date() 
        });
        
        console.log(`Commande ${orderId} supprimée avec succès`);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        set({ syncStatus: 'offline' });
        alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    },

    markOrderAsDelivered: async (orderId) => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { 
          status: 'livrée',
          lastModified: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erreur lors du marquage comme livré:', error);
      }
    },

    archiveOrder: async (orderId) => {
      try {
        set({ syncStatus: 'syncing' });
        console.log('Début de l\'archivage de la commande:', orderId);
        
        const orderRef = doc(db, 'orders', orderId);
        
        // Utiliser un objet simple pour éviter les problèmes de type
        const updates = {
          archived: true,
          archivedAt: new Date().toISOString(),
          status: 'archivée' as OrderStatus,
          lastModified: new Date().toISOString()
        };
        
        console.log('Mise à jour Firestore avec:', updates);
        await updateDoc(orderRef, updates);
        console.log('Mise à jour Firestore réussie');
        
        // Mettre à jour l'état local pour une réponse plus rapide
        const updatedOrders = get().orders.map(order => {
          if (order.id === orderId) {
            console.log('Mise à jour locale de la commande:', order.id);
            return { 
              ...order, 
              archived: true,
              status: 'archivée' as OrderStatus,
              archivedAt: new Date().toISOString()
            };
          }
          return order;
        });
        
        console.log('Mise à jour du state avec les commandes mises à jour');
        set({ 
          orders: updatedOrders,
          syncStatus: 'connected', 
          lastSync: new Date() 
        });
        
        console.log('Archivage terminé avec succès');
        return true;
      } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
        set({ syncStatus: 'offline' });
        alert(`Erreur lors de l'archivage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        return false;
      }
    },

    deleteArchivedOrders: async (criteria: 'all' | 'older-than-30-days' | 'older-than-90-days' | 'older-than-year') => {
      try {
        set({ syncStatus: 'syncing' });
        const ordersRef = collection(db, 'orders');
        let queryFilter: any;
        
        switch (criteria) {
          case 'all':
            queryFilter = query(ordersRef, where('archived', '==', true));
            break;
          case 'older-than-30-days':
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            queryFilter = query(ordersRef, where('archived', '==', true), where('archivedAt', '<=', thirtyDaysAgo));
            break;
          case 'older-than-90-days':
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            queryFilter = query(ordersRef, where('archived', '==', true), where('archivedAt', '<=', ninetyDaysAgo));
            break;
          case 'older-than-year':
            const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
            queryFilter = query(ordersRef, where('archived', '==', true), where('archivedAt', '<=', oneYearAgo));
            break;
          default:
            throw new Error('Critère de suppression non reconnu');
        }
        
        const querySnapshot = await getDocs(queryFilter);
        const deletedCount = querySnapshot.docs.length;
        
        if (deletedCount > 0) {
          const batch = writeBatch(db);
          querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
        
        // Mettre à jour l'état local pour une réponse plus rapide
        const updatedOrders = get().orders.filter(order => {
          if (criteria === 'all') return !order.archived;
          const archivedAt = order.archivedAt;
          if (!archivedAt) return true; // Si la date d'archivage est manquante, conserver la commande
          
          switch (criteria) {
            case 'older-than-30-days':
              return new Date(archivedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            case 'older-than-90-days':
              return new Date(archivedAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            case 'older-than-year':
              return new Date(archivedAt) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            default:
              return true; // Si le critère n'est pas reconnu, conserver la commande
          }
        });
        
        set({ 
          orders: updatedOrders,
          syncStatus: 'connected', 
          lastSync: new Date() 
        });
        
        return deletedCount;
      } catch (error) {
        console.error('Erreur lors de la suppression des commandes archivées:', error);
        set({ syncStatus: 'offline' });
        return 0;
      }
    },

    setUser: (name, type) => {
      set({ currentUser: name, userType: type });
    },
    
    reconnect: () => {
      const { initSync } = get();
      set({ syncStatus: 'syncing', syncError: null });
      
      // Tenter de réinitialiser la connexion
      try {
        const unsubscribe = initSync();
        if (unsubscribe) {
          console.log('Reconnexion à Firestore réussie');
        } else {
          console.error('Échec de la reconnexion à Firestore');
          set({ 
            syncStatus: 'error', 
            syncError: 'Impossible de se reconnecter à la base de données'
          });
        }
      } catch (error) {
        console.error('Erreur lors de la tentative de reconnexion:', error);
        set({ 
          syncStatus: 'error', 
          syncError: error instanceof Error ? error.message : 'Erreur inconnue lors de la reconnexion'
        });
      }
    }
  })
);
