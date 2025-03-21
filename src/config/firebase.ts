import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCWrwkQPY-YL17uhUq5kYE7Je1_CsXNKbk",
  authDomain: "test-4-94eac.firebaseapp.com",
  projectId: "test-4-94eac",
  storageBucket: "test-4-94eac.firebasestorage.app",
  messagingSenderId: "276742867200",
  appId: "1:276742867200:web:ca978875b1dcc4f1d64be5"
};

// Log de la configuration pour débogage
console.log('Configuration Firebase:', firebaseConfig);

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connexion anonyme
signInAnonymously(auth)
  .then(() => {
    console.log('Connecté anonymement à Firebase');
  })
  .catch((error) => {
    console.error('Erreur de connexion anonyme:', error);
  });

// En mode production ou sur un déploiement, utiliser la base de données Firestore en ligne
console.log('Mode:', process.env.NODE_ENV);
console.log('Utilisation émulateur:', process.env.NEXT_PUBLIC_USE_EMULATOR);

if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  try {
    console.log('Connexion à l\'émulateur Firestore sur localhost:8090');
    connectFirestoreEmulator(db, 'localhost', 8090);
  } catch (error) {
    console.error('Erreur lors de la connexion à l\'émulateur Firestore:', error);
    console.log('Utilisation de la base de données Firestore en ligne');
  }
} else {
  console.log('Utilisation de la base de données Firestore en ligne');
}

export { db, auth };
