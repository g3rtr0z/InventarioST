import { 
  doc, 
  getDoc, 
  setDoc,
  type Firestore
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ROLES_COLLECTION = 'userRoles';

export type UserRole = 'administrador' | 'usuario';

/**
 * Obtener el rol de un usuario por su email
 */
export const getUserRole = async (userEmail: string): Promise<UserRole> => {
  if (!db) {
    // Si Firestore no está disponible, retornar 'usuario' por defecto
    return 'usuario';
  }

  try {
    const userRoleRef = doc(db as Firestore, ROLES_COLLECTION, userEmail);
    const userRoleDoc = await getDoc(userRoleRef);
    
    if (userRoleDoc.exists()) {
      const data = userRoleDoc.data();
      return (data.role as UserRole) || 'usuario';
    }
    
    // Si no existe el documento, crear uno con rol 'usuario' por defecto
    await setDoc(userRoleRef, { role: 'usuario' });
    return 'usuario';
  } catch (error) {
    console.error('Error al obtener rol de usuario:', error);
    return 'usuario';
  }
};

/**
 * Establecer el rol de un usuario
 * Solo puede ser llamado por un administrador
 */
export const setUserRole = async (userEmail: string, role: UserRole): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const userRoleRef = doc(db as Firestore, ROLES_COLLECTION, userEmail);
    await setDoc(userRoleRef, { role });
  } catch (error) {
    console.error('Error al establecer rol de usuario:', error);
    throw error;
  }
};

/**
 * Verificar si un usuario es administrador
 */
export const isUserAdmin = async (userEmail: string | null | undefined): Promise<boolean> => {
  if (!userEmail) {
    return false;
  }
  
  const role = await getUserRole(userEmail);
  return role === 'administrador';
};

