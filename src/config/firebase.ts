import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validar que todas las variables de entorno estén configuradas
const checkFirebaseConfig = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.includes('your-') &&
    !firebaseConfig.projectId.includes('your-')
  );
};

export const isFirebaseReady = checkFirebaseConfig();

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isFirebaseReady) {
  try {
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
    // Inicializar Firestore
    db = getFirestore(app);
    // Inicializar Auth
    auth = getAuth(app);
  } catch (error) {
    db = undefined;
    app = undefined;
    auth = undefined;
  }
}

export { db, auth };
export default app;
