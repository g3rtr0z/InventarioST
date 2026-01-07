import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
  type Firestore
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CONFIG_COLLECTION = 'config';

export interface EstadoPersonalizado {
  nombre: string;
  color: string; // Tailwind color class (ej: 'bg-green-100 text-green-800')
  requerido: boolean;
}

export interface ConfiguracionGeneral {
  itemsPorPagina: number;
  formatoFecha: string; // 'DD/MM/YYYY', 'MM/DD/YYYY', etc.
  moneda: string; // 'MXN', 'USD', etc.
  alertaMantenimiento: number; // Días antes de alertar
  alertaGarantia: number; // Días antes de alertar
}

export interface CampoFormulario {
  nombre: string; // nombre del campo (ej: 'nombre', 'marca', etc.)
  seccion: string; // sección a la que pertenece
  visible: boolean;
  obligatorio: boolean;
  orden: number; // orden dentro de la sección
  etiqueta?: string; // etiqueta personalizada (opcional)
  tipo?: 'text' | 'number' | 'date' | 'select' | 'textarea'; // tipo de campo
}

export interface SeccionFormulario {
  nombre: string; // nombre de la sección (ej: 'Información General')
  visible: boolean;
  orden: number; // orden de la sección
  etiqueta?: string; // etiqueta personalizada (opcional)
}

export interface ConfiguracionSistema {
  estados: EstadoPersonalizado[];
  general: ConfiguracionGeneral;
  formulario: CampoFormulario[];
  seccionesFormulario: SeccionFormulario[];
}

const CONFIG_DEFAULT: ConfiguracionSistema = {
  estados: [
    { nombre: 'Disponible', color: 'bg-green-100 text-green-800', requerido: true },
    { nombre: 'En Uso', color: 'bg-green-100 text-green-800', requerido: true },
    { nombre: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-700', requerido: true },
    { nombre: 'Baja', color: 'bg-red-100 text-red-700', requerido: true }
  ],
  general: {
    itemsPorPagina: 12,
    formatoFecha: 'DD/MM/YYYY',
    moneda: 'MXN',
    alertaMantenimiento: 30,
    alertaGarantia: 30
  },
  seccionesFormulario: [
    { nombre: 'Información General', visible: true, orden: 1 },
    { nombre: 'Ubicación y Responsabilidad', visible: true, orden: 2 },
    { nombre: 'Especificaciones Técnicas', visible: true, orden: 3 },
    { nombre: 'Información de Adquisición', visible: true, orden: 4 },
    { nombre: 'Mantenimiento', visible: true, orden: 5 },
    { nombre: 'Observaciones y Descripción', visible: true, orden: 6 }
  ],
  formulario: [
    // Información General
    { nombre: 'nombre', seccion: 'Información General', visible: true, obligatorio: true, orden: 1, etiqueta: 'Nombre del Equipo' },
    { nombre: 'categoria', seccion: 'Información General', visible: true, obligatorio: true, orden: 2, etiqueta: 'Categoría' },
    { nombre: 'estado', seccion: 'Información General', visible: true, obligatorio: true, orden: 3, etiqueta: 'Estado' },
    { nombre: 'tipoUso', seccion: 'Información General', visible: true, obligatorio: true, orden: 4, etiqueta: 'Tipo de Uso' },
    // Ubicación y Responsabilidad
    { nombre: 'sede', seccion: 'Ubicación y Responsabilidad', visible: true, obligatorio: true, orden: 1, etiqueta: 'Sede' },
    { nombre: 'ubicacion', seccion: 'Ubicación y Responsabilidad', visible: true, obligatorio: true, orden: 2, etiqueta: 'Ubicación' },
    { nombre: 'piso', seccion: 'Ubicación y Responsabilidad', visible: true, obligatorio: false, orden: 3, etiqueta: 'Piso' },
    { nombre: 'edificio', seccion: 'Ubicación y Responsabilidad', visible: true, obligatorio: false, orden: 4, etiqueta: 'Edificio' },
    { nombre: 'responsable', seccion: 'Ubicación y Responsabilidad', visible: true, obligatorio: true, orden: 5, etiqueta: 'Responsable' },
    // Especificaciones Técnicas
    { nombre: 'marca', seccion: 'Especificaciones Técnicas', visible: true, obligatorio: true, orden: 1, etiqueta: 'Marca' },
    { nombre: 'modelo', seccion: 'Especificaciones Técnicas', visible: true, obligatorio: true, orden: 2, etiqueta: 'Modelo' },
    { nombre: 'numeroSerie', seccion: 'Especificaciones Técnicas', visible: true, obligatorio: true, orden: 3, etiqueta: 'Número de Serie' },
    { nombre: 'procesador', seccion: 'Especificaciones Técnicas', visible: true, obligatorio: false, orden: 4, etiqueta: 'Procesador' },
    { nombre: 'ram', seccion: 'Especificaciones Técnicas', visible: true, obligatorio: false, orden: 5, etiqueta: 'RAM' },
    { nombre: 'discoDuro', seccion: 'Especificaciones Técnicas', visible: true, obligatorio: false, orden: 6, etiqueta: 'Disco Duro' },
    // Información de Adquisición
    { nombre: 'fechaAdquisicion', seccion: 'Información de Adquisición', visible: true, obligatorio: false, orden: 1, etiqueta: 'Fecha de Adquisición' },
    // Mantenimiento
    { nombre: 'fechaUltimoMantenimiento', seccion: 'Mantenimiento', visible: true, obligatorio: false, orden: 1, etiqueta: 'Último Mantenimiento' },
    { nombre: 'proximoMantenimiento', seccion: 'Mantenimiento', visible: true, obligatorio: false, orden: 2, etiqueta: 'Próximo Mantenimiento' },
    // Observaciones y Descripción
    { nombre: 'descripcion', seccion: 'Observaciones y Descripción', visible: true, obligatorio: false, orden: 1, etiqueta: 'Descripción' },
    { nombre: 'observaciones', seccion: 'Observaciones y Descripción', visible: true, obligatorio: false, orden: 2, etiqueta: 'Observaciones' }
  ]
};

/**
 * Obtener la configuración del sistema
 */
export const getConfig = async (): Promise<ConfiguracionSistema> => {
  if (!db) {
    return CONFIG_DEFAULT;
  }

  try {
    const querySnapshot = await getDocs(collection(db as Firestore, CONFIG_COLLECTION));
    if (querySnapshot.empty) {
      // Crear configuración por defecto si no existe
      await saveConfig(CONFIG_DEFAULT);
      return CONFIG_DEFAULT;
    }
    const configDoc = querySnapshot.docs[0];
    const data = configDoc.data();
    
    // Mergear con valores por defecto para asegurar que todos los campos existan
    return {
      estados: data.estados || CONFIG_DEFAULT.estados,
      general: { ...CONFIG_DEFAULT.general, ...(data.general || {}) },
      formulario: data.formulario || CONFIG_DEFAULT.formulario,
      seccionesFormulario: data.seccionesFormulario || CONFIG_DEFAULT.seccionesFormulario
    } as ConfiguracionSistema;
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return CONFIG_DEFAULT;
  }
};

/**
 * Escuchar cambios en tiempo real de la configuración
 */
export const subscribeToConfig = (
  callback: (config: ConfiguracionSistema) => void
): (() => void) => {
  if (!db) {
    callback(CONFIG_DEFAULT);
    return () => {};
  }

  try {
    return onSnapshot(
      collection(db as Firestore, CONFIG_COLLECTION),
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (snapshot.empty) {
          callback(CONFIG_DEFAULT);
          return;
        }
        const configDoc = snapshot.docs[0];
        const data = configDoc.data();
        
        // Mergear con valores por defecto
        const config: ConfiguracionSistema = {
          estados: data.estados || CONFIG_DEFAULT.estados,
          general: { ...CONFIG_DEFAULT.general, ...(data.general || {}) },
          formulario: data.formulario || CONFIG_DEFAULT.formulario,
          seccionesFormulario: data.seccionesFormulario || CONFIG_DEFAULT.seccionesFormulario
        };
        callback(config);
      },
      () => {
        callback(CONFIG_DEFAULT);
      }
    );
  } catch (error) {
    callback(CONFIG_DEFAULT);
    return () => {};
  }
};

/**
 * Guardar la configuración del sistema
 */
export const saveConfig = async (config: ConfiguracionSistema): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está disponible');
  }

  try {
    const querySnapshot = await getDocs(collection(db as Firestore, CONFIG_COLLECTION));
    
    if (querySnapshot.empty) {
      // Crear documento si no existe
      await addDoc(collection(db as Firestore, CONFIG_COLLECTION), config as any);
    } else {
      // Actualizar documento existente
      const configDoc = querySnapshot.docs[0];
      const configRef = doc(db as Firestore, CONFIG_COLLECTION, configDoc.id);
      await updateDoc(configRef, config as any);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Actualizar solo los estados
 */
export const updateEstados = async (estados: EstadoPersonalizado[]): Promise<void> => {
  const config = await getConfig();
  config.estados = estados;
  await saveConfig(config);
};

/**
 * Actualizar solo la configuración general
 */
export const updateConfigGeneral = async (general: Partial<ConfiguracionGeneral>): Promise<void> => {
  const config = await getConfig();
  config.general = { ...config.general, ...general };
  await saveConfig(config);
};

/**
 * Actualizar solo la configuración del formulario
 */
export const updateFormulario = async (formulario: CampoFormulario[]): Promise<void> => {
  const config = await getConfig();
  config.formulario = formulario;
  await saveConfig(config);
};

/**
 * Actualizar solo las secciones del formulario
 */
export const updateSeccionesFormulario = async (secciones: SeccionFormulario[]): Promise<void> => {
  const config = await getConfig();
  config.seccionesFormulario = secciones;
  await saveConfig(config);
};


