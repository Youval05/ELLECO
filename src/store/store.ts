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
  writeBatch,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus } from '../types/order';
import { nanoid } from 'nanoid';
import { migrateOrders } from '../utils/migrateOrders';

// Type pour les mises à jour Firestore (où les dates sont des chaînes)
interface FirestoreOrderUpdate extends Omit<Partial<Order>, 'plannedDeliveryDate'> {
  plannedDeliveryDate?: string | null;
  version?: number;
  lastModified?: string;
  createdAt?: string;
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
  checkOrdersToArchive: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  (set, get) => ({
    currentUser: null,
    userType: null,
    orders: [],
    syncStatus: 'offline',
    syncError: null,
    lastSync: null,

    checkOrdersToArchive: async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('archived', '==', false),
          where('plannedDeliveryDate', '<=', yesterday.toISOString())
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        let count = 0;

        querySnapshot.forEach((doc) => {
          const orderRef = doc.ref;
          batch.update(orderRef, {
            archived: true,
            archivedAt: new Date().toISOString(),
            status: 'archivée' as OrderStatus
          });
          count++;
        });

        if (count > 0) {
          await batch.commit();
          console.log(`${count} commandes archivées automatiquement`);
        }
      } catch (error) {
        console.error('Erreur lors de l\'archivage automatique:', error);
      }
    },

    initSync: () => {
      try {
        console.log('Initialisation de la synchronisation...');
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('archived', '==', false));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const orders: Order[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // S'assurer que createdAt est toujours présent
            if (!data.createdAt) {
              const now = new Date().toISOString();
              updateDoc(doc.ref, { createdAt: now });
              data.createdAt = now;
            }

            // Convertir les dates en ISO string si nécessaire
            if (data.createdAt instanceof Timestamp) {
              data.createdAt = data.createdAt.toDate().toISOString();
            }

            orders.push({
              ...data,
              id: doc.id,
              createdAt: data.createdAt
            } as Order);
          });
          
          set({ 
            orders,
            syncStatus: 'connected',
            lastSync: new Date()
          });
        }, (error) => {
          console.error('Erreur de synchronisation Firestore:', error);
          set({ 
            syncStatus: 'error',
            syncError: error.message
          });
        });

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

    addOrder: async (order: Partial<Order>) => {
      try {
        const now = new Date().toISOString();
        const newOrder: Order = {
          id: nanoid(),
          createdAt: now, // Toujours définir createdAt
          version: 1,
          archived: false,
          status: order.status || 'à planifier',
          plannedDeliveryDate: order.plannedDeliveryDate || null,
          lastModified: now,
          ...order
        };

        const ordersRef = collection(db, 'orders');
        await addDoc(ordersRef, newOrder);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la commande:', error);
        throw error;
      }
    },

    updateOrder: async (orderId: string, updates: Partial<Order>) => {
      try {
        const now = new Date().toISOString();
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
          throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        const updatedOrder = {
          ...updates,
          lastModified: now,
          createdAt: orderData.createdAt || now, // Garder la date de création existante ou en créer une
          plannedDeliveryDate: updates.plannedDeliveryDate || null
        };

        await updateDoc(orderRef, updatedOrder);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la commande:', error);
        throw error;
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
