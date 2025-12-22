import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
  type Firestore
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ItemInventario } from '../types/inventario';

const ITEMS_COLLECTION = 'items';
const CATEGORIAS_COLLECTION = 'categorias';
const SEDES_COLLECTION = 'sedes';

// ========== ITEMS ==========

/**
 * Obtener todos los items del inventario
 */
export const getItems = async (): Promise<ItemInventario[]> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const q = query(collection(db as Firestore, ITEMS_COLLECTION), orderBy('nombre', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ItemInventario[];
  } catch (error) {
    console.error('Error al obtener items:', error);
    throw error;
  }
};

/**
 * Escuchar cambios en tiempo real de los items
 */
export const subscribeToItems = (
  callback: (items: ItemInventario[]) => void
): (() => void) => {
  if (!db) {
    console.error('❌ Firestore no está disponible para suscribirse a items');
    callback([]);
    return () => {};
  }

  try {
    // Primero intentar con orderBy, si falla usar sin ordenar
    const itemsCollection = collection(db as Firestore, ITEMS_COLLECTION);
    
    // Intentar con orderBy primero
    try {
      const q = query(itemsCollection, orderBy('nombre', 'asc'));
      
      return onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ItemInventario[];
          console.log('📦 Items recibidos de Firestore:', items.length);
          callback(items);
        },
        (error: any) => {
          console.error('❌ Error al escuchar items con orderBy:', error);
          // Si falla por falta de índice, intentar sin orderBy
          if (error?.code === 'failed-precondition') {
            console.log('⚠️ Intentando sin orderBy debido a falta de índice...');
            return onSnapshot(
              itemsCollection,
              (snapshot: QuerySnapshot<DocumentData>) => {
                const items = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as ItemInventario[];
                // Ordenar manualmente
                items.sort((a, b) => a.nombre.localeCompare(b.nombre));
                console.log('📦 Items recibidos de Firestore (sin orderBy):', items.length);
                callback(items);
              },
              (err) => {
                console.error('❌ Error al escuchar items:', err);
                callback([]);
              }
            );
          }
          callback([]);
        }
      );
    } catch (orderByError: any) {
      // Si orderBy falla, usar sin ordenar
      console.warn('⚠️ No se puede usar orderBy, usando colección sin ordenar');
      return onSnapshot(
        itemsCollection,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ItemInventario[];
          items.sort((a, b) => a.nombre.localeCompare(b.nombre));
          callback(items);
        },
        (error) => {
          console.error('Error al escuchar items:', error);
          callback([]);
        }
      );
    }
  } catch (error) {
    console.error('Error al suscribirse a items:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Agregar un nuevo item
 */
export const addItem = async (item: Omit<ItemInventario, 'id'>): Promise<string> => {
  if (!db) {
    console.error('❌ Firestore no está disponible');
    throw new Error('Firestore no está disponible');
  }

  // Validar que el item tenga todos los campos requeridos
  if (!item.nombre || !item.categoria || !item.marca || !item.modelo || !item.numeroSerie || !item.estado || !item.ubicacion || !item.responsable || !item.tipoUso) {
    console.error('❌ Item incompleto:', item);
    throw new Error('Todos los campos requeridos deben estar completos');
  }

  // Función helper para limpiar campos undefined y null
  const cleanUndefined = (obj: any): any => {
    const cleaned: any = {};
    for (const key in obj) {
      const value = obj[key];
      // Solo incluir campos que no sean undefined ni null, y si son strings vacíos, mantenerlos
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  // Limpiar el objeto para Firestore (eliminar campos undefined)
  const cleanItem = cleanUndefined(item);

  console.log('🔵 Intentando agregar item a Firestore...');
  console.log('🔵 Datos del item:', JSON.stringify(cleanItem, null, 2));
  console.log('🔵 Colección:', ITEMS_COLLECTION);
  console.log('🔵 DB disponible:', !!db);

  try {
    const itemsCollection = collection(db as Firestore, ITEMS_COLLECTION);
    console.log('🔵 Colección obtenida');
    
    const docRef = await addDoc(itemsCollection, cleanItem);
    console.log('✅ Item agregado exitosamente a Firestore');
    console.log('✅ ID del documento:', docRef.id);
    console.log('✅ Ruta completa:', docRef.path);
    console.log('✅ Verifica en Firebase Console: Firestore Database > items >', docRef.id);
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error al agregar item a Firestore:');
    console.error('❌ Código de error:', error?.code);
    console.error('❌ Mensaje:', error?.message);
    console.error('❌ Error completo:', error);
    
    // Mostrar error más detallado
    if (error?.code === 'permission-denied') {
      console.error('❌ PERMISO DENEGADO: Verifica las reglas de Firestore');
      console.error('❌ Ve a Firebase Console > Firestore Database > Reglas');
      console.error('❌ Asegúrate de que las reglas permitan write en la colección "items"');
      throw new Error('Permiso denegado. Verifica las reglas de Firestore en Firebase Console. Las reglas deben permitir write en la colección "items".');
    } else if (error?.code === 'unavailable') {
      console.error('❌ SERVICIO NO DISPONIBLE: Verifica tu conexión a internet');
      throw new Error('Firestore no está disponible. Verifica tu conexión.');
    } else if (error?.code === 'invalid-argument') {
      console.error('❌ ARGUMENTO INVÁLIDO: Verifica los datos del item');
      throw new Error('Datos inválidos. Verifica que todos los campos estén correctamente completados.');
    } else {
      console.error('❌ Error desconocido:', error);
      throw error;
    }
  }
};

/**
 * Actualizar un item existente
 */
export const updateItem = async (id: string, item: Partial<ItemInventario>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  // Función helper para limpiar campos undefined
  const cleanUndefined = (obj: any): any => {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  };

  try {
    const itemRef = doc(db as Firestore, ITEMS_COLLECTION, id);
    const cleanItem = cleanUndefined(item);
    await updateDoc(itemRef, cleanItem);
  } catch (error) {
    console.error('Error al actualizar item:', error);
    throw error;
  }
};

/**
 * Eliminar un item
 */
export const deleteItem = async (id: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const itemRef = doc(db as Firestore, ITEMS_COLLECTION, id);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error al eliminar item:', error);
    throw error;
  }
};

// ========== CATEGORIAS ==========

/**
 * Obtener todas las categorías
 */
export const getCategorias = async (): Promise<string[]> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const querySnapshot = await getDocs(collection(db as Firestore, CATEGORIAS_COLLECTION));
    if (querySnapshot.empty) {
      return [];
    }
    const categoriasDoc = querySnapshot.docs[0];
    return categoriasDoc.data().lista || [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

/**
 * Escuchar cambios en tiempo real de las categorías
 */
export const subscribeToCategorias = (
  callback: (categorias: string[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    return onSnapshot(
      collection(db as Firestore, CATEGORIAS_COLLECTION),
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const categoriasDoc = snapshot.docs[0];
        const categorias = categoriasDoc.data().lista || [];
        callback(categorias);
      },
      (error) => {
        console.error('Error al escuchar categorías:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error al suscribirse a categorías:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Guardar las categorías
 */
export const saveCategorias = async (categorias: string[]): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const querySnapshot = await getDocs(collection(db as Firestore, CATEGORIAS_COLLECTION));
    
    if (querySnapshot.empty) {
      // Crear documento si no existe
      await addDoc(collection(db as Firestore, CATEGORIAS_COLLECTION), { lista: categorias });
    } else {
      // Actualizar documento existente
      const categoriasDoc = querySnapshot.docs[0];
      const categoriasRef = doc(db as Firestore, CATEGORIAS_COLLECTION, categoriasDoc.id);
      await updateDoc(categoriasRef, { lista: categorias });
    }
  } catch (error) {
    console.error('Error al guardar categorías:', error);
    throw error;
  }
};

// ========== SEDES ==========

/**
 * Escuchar cambios en tiempo real de las sedes
 */
export const subscribeToSedes = (
  callback: (sedes: string[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    return onSnapshot(
      collection(db as Firestore, SEDES_COLLECTION),
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const sedesDoc = snapshot.docs[0];
        const sedes = sedesDoc.data().lista || [];
        callback(sedes);
      },
      (error) => {
        console.error('Error al escuchar sedes:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error al suscribirse a sedes:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Guardar las sedes
 */
export const saveSedes = async (sedes: string[]): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const querySnapshot = await getDocs(collection(db as Firestore, SEDES_COLLECTION));
    
    if (querySnapshot.empty) {
      // Crear documento si no existe
      await addDoc(collection(db as Firestore, SEDES_COLLECTION), { lista: sedes });
    } else {
      // Actualizar documento existente
      const sedesDoc = querySnapshot.docs[0];
      const sedesRef = doc(db as Firestore, SEDES_COLLECTION, sedesDoc.id);
      await updateDoc(sedesRef, { lista: sedes });
    }
  } catch (error) {
    console.error('Error al guardar sedes:', error);
    throw error;
  }
};
