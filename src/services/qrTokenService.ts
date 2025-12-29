import { collection, addDoc, doc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const QR_TOKENS_COLLECTION = 'qr_tokens';

interface QRToken {
  itemId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

/**
 * Genera un token temporal para acceder al PDF del item
 * El token expira en 15 minutos
 */
export const generateQRToken = async (itemId: string): Promise<string> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos

  const tokenData: Omit<QRToken, 'id'> = {
    itemId,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt)
  };

  try {
    const tokensCollection = collection(db, QR_TOKENS_COLLECTION);
    const docRef = await addDoc(tokensCollection, tokenData);
    return docRef.id;
  } catch (error) {
    console.error('Error al generar token QR:', error);
    throw error;
  }
};

/**
 * Valida un token y retorna el itemId si es válido
 * Retorna null si el token es inválido o expiró
 */
export const validateQRToken = async (tokenId: string): Promise<string | null> => {
  if (!db) {
    return null;
  }

  try {
    const tokenDoc = await getDoc(doc(db, QR_TOKENS_COLLECTION, tokenId));
    
    if (!tokenDoc.exists()) {
      return null;
    }

    const tokenData = tokenDoc.data() as QRToken;
    const now = Timestamp.now();
    
    // Verificar si el token expiró
    if (now.toMillis() > tokenData.expiresAt.toMillis()) {
      // Eliminar el token expirado
      try {
        await deleteDoc(doc(db, QR_TOKENS_COLLECTION, tokenId));
      } catch (err) {
        console.error('Error al eliminar token expirado:', err);
      }
      return null;
    }

    return tokenData.itemId;
  } catch (error) {
    console.error('Error al validar token QR:', error);
    return null;
  }
};

/**
 * Limpia tokens expirados (opcional, puede ejecutarse periódicamente)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  // Esta función puede implementarse si se necesita limpieza automática
  // Por ahora, los tokens se validan y eliminan al acceder
};

