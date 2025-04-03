import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

export const migrateOrders = async () => {
  try {
    console.log('Début de la migration des commandes...');
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Si la commande n'a pas de date de création, on utilise la date de dernière modification
      // ou la date actuelle comme fallback
      if (!data.createdAt) {
        batch.update(doc.ref, {
          createdAt: data.lastModified || new Date().toISOString()
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`${count} commandes mises à jour avec une date de création`);
    } else {
      console.log('Aucune commande à mettre à jour');
    }
  } catch (error) {
    console.error('Erreur lors de la migration des commandes:', error);
    throw error;
  }
};
