import { collection, getDocs, doc as firestoreDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { convertLegacyOrder } from './orderConverter';

export const migrateOrders = async () => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  querySnapshot.forEach(async (docSnapshot) => {
    const legacyOrder = docSnapshot.data();
    const newOrder = convertLegacyOrder(legacyOrder);
    await setDoc(firestoreDoc(db, 'orders_v2', docSnapshot.id), { ...newOrder });
  });
};
