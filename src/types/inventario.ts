export interface ItemInventario {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  estado: 'Disponible' | 'En Uso' | 'Mantenimiento' | 'Baja';
  ubicacion: string;
  responsable: string;
  // Campos adicionales
  observaciones?: string;
  piso?: string;
  edificio?: string;
  sede: string;
  tipoUso: 'Alumnos' | 'Administrativo';
  procesador?: string;
  ram?: string;
  discoDuro?: string;
  horasNormales?: string; // Horas normales para proyectores
  horasEco?: string; // Horas eco para proyectores
  encargado?: string; // Nombre y correo del usuario que creó el item
}

export type EstadoItem = 'Disponible' | 'En Uso' | 'Mantenimiento' | 'Baja';

export const CATEGORIAS = [
  'Computadora',
  'Laptop',
  'Monitor',
  'Teclado',
  'Mouse',
  'Impresora',
  'Router',
  'Switch',
  'Servidor',
  'Tablet',
  'Teléfono',
  'Otro'
] as const;

