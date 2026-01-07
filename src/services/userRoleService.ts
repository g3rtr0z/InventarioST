import { 
  doc, 
  getDoc, 
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  orderBy,
  type Firestore
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';

const ROLES_COLLECTION = 'userRoles';
const USERS_COLLECTION = 'users';

export type UserRole = 'administrador' | 'usuario';

export interface UserInfo {
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

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

/**
 * Registrar o actualizar información de usuario en Firestore
 * Se llama automáticamente cuando un usuario inicia sesión
 */
export const registerUser = async (
  email: string, 
  displayName?: string,
  lastLogin?: string
): Promise<void> => {
  if (!db) {
    return;
  }

  try {
    const userRef = doc(db as Firestore, USERS_COLLECTION, email);
    const userDoc = await getDoc(userRef);
    
    const role = await getUserRole(email);
    const now = new Date().toISOString();
    
    if (userDoc.exists()) {
      // Actualizar usuario existente
      await setDoc(userRef, {
        email,
        displayName: displayName || userDoc.data().displayName || '',
        role,
        createdAt: userDoc.data().createdAt || now,
        lastLogin: lastLogin || now,
        isActive: true
      }, { merge: true });
    } else {
      // Crear nuevo usuario
      await setDoc(userRef, {
        email,
        displayName: displayName || '',
        role,
        createdAt: now,
        lastLogin: lastLogin || now,
        isActive: true
      });
    }
  } catch (error) {
    console.error('Error al registrar usuario:', error);
  }
};

/**
 * Obtener todos los usuarios registrados
 */
export const getAllUsers = async (): Promise<UserInfo[]> => {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db as Firestore, USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as UserInfo[];
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
};

/**
 * Cambiar el rol de un usuario
 */
export const changeUserRole = async (
  userEmail: string, 
  newRole: UserRole
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    // Actualizar rol en la colección de roles
    await setUserRole(userEmail, newRole);
    
    // Actualizar rol en la información del usuario
    const userRef = doc(db as Firestore, USERS_COLLECTION, userEmail);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await setDoc(userRef, { role: newRole }, { merge: true });
    } else {
      // Si no existe en users, crearlo
      await setDoc(userRef, {
        email: userEmail,
        role: newRole,
        createdAt: new Date().toISOString(),
        isActive: true
      });
    }
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    throw error;
  }
};

/**
 * Desactivar o activar un usuario
 */
export const toggleUserStatus = async (
  userEmail: string,
  isActive: boolean
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const userRef = doc(db as Firestore, USERS_COLLECTION, userEmail);
    await setDoc(userRef, { isActive }, { merge: true });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    throw error;
  }
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<void> => {
  if (!auth || !db) {
    throw new Error('Firebase no está disponible');
  }

  try {
    // Crear usuario en Firebase Authentication
    await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar el perfil del usuario con el nombre
    // Nota: Firebase Auth no permite actualizar displayName desde el cliente sin el usuario autenticado
    // Por eso guardamos el displayName solo en Firestore
    
    // Crear registro en Firestore
    const now = new Date().toISOString();
    const userRef = doc(db as Firestore, USERS_COLLECTION, email);
    await setDoc(userRef, {
      email,
      displayName: displayName || '',
      role,
      createdAt: now,
      isActive: true
    });

    // Establecer rol en la colección de roles
    const roleRef = doc(db as Firestore, ROLES_COLLECTION, email);
    await setDoc(roleRef, { role });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    
    // Si el usuario ya existe en Auth pero no en Firestore, crear solo el registro en Firestore
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El email ya está en uso');
    }
    throw error;
  }
};

/**
 * Eliminar un usuario permanentemente
 */
export const deleteUserAccount = async (userEmail: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    // Eliminar de Firestore (colección de usuarios)
    const userRef = doc(db as Firestore, USERS_COLLECTION, userEmail);
    await deleteDoc(userRef);

    // Eliminar de Firestore (colección de roles)
    const roleRef = doc(db as Firestore, ROLES_COLLECTION, userEmail);
    await deleteDoc(roleRef);

    // Nota: Eliminar de Firebase Authentication requiere autenticación del usuario
    // o un backend con privilegios de administrador. Por ahora solo eliminamos de Firestore.
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

