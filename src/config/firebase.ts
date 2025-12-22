import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

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

if (isFirebaseReady) {
  try {
    console.log('🔥 Inicializando Firebase...');
    console.log('🔥 Project ID:', firebaseConfig.projectId);
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
    // Inicializar Firestore
    db = getFirestore(app);
    console.log('✅ Firebase inicializado correctamente');
    console.log('✅ Firestore conectado');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    db = undefined;
    app = undefined;
  }
} else {
  console.warn('⚠️ Firebase no está configurado. Verifica tu archivo .env');
  console.warn('Configuración actual:');
  console.warn('- API Key:', firebaseConfig.apiKey ? '✅ Configurado' : '❌ Faltante');
  console.warn('- Auth Domain:', firebaseConfig.authDomain ? '✅ Configurado' : '❌ Faltante');
  console.warn('- Project ID:', firebaseConfig.projectId ? '✅ Configurado' : '❌ Faltante');
  console.warn('- Storage Bucket:', firebaseConfig.storageBucket ? '✅ Configurado' : '❌ Faltante');
  console.warn('- Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Configurado' : '❌ Faltante');
  console.warn('- App ID:', firebaseConfig.appId ? '✅ Configurado' : '❌ Faltante');
}

export { db };
export default app;
