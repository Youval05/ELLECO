import { collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const migrateOrders = async () => {
  try {
    console.log('Début de la migration des commandes...');
    const ordersRef = collection(db, 'orders');
    
    // Chercher toutes les commandes
    const snapshot = await getDocs(ordersRef);
    
    console.log(`Nombre total de commandes trouvées: ${snapshot.size}`);
    
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Traitement de la commande ${doc.id}:`, data);
      
      // Mettre à jour toutes les commandes qui n'ont pas de date de création
      if (!data.createdAt) {
        const now = new Date().toISOString();
        batch.update(doc.ref, {
          createdAt: now
        });
        count++;
        console.log(`Commande ${doc.id} mise à jour avec createdAt = ${now}`);
      }
    });

    if (count > 0) {
      console.log(`Tentative de mise à jour de ${count} commandes...`);
      await batch.commit();
      console.log(`${count} commandes mises à jour avec succès`);
    } else {
      console.log('Aucune commande à mettre à jour');
    }

    return count;
  } catch (error) {
    console.error('Erreur lors de la migration des commandes:', error);
    throw error;
  }
};
