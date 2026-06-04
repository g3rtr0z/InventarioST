import type { ItemInventario } from '../types/inventario';

export const esCategoriaMonitor = (categoria: string) =>
  categoria.trim().toLowerCase() === 'monitor';

const normalizarResponsable = (nombre: string) => nombre.trim().toLowerCase();

export const buscarMonitorConResponsable = (
  items: ItemInventario[],
  responsable: string,
  excludeItemId?: string
): ItemInventario | undefined => {
  const responsableNormalizado = normalizarResponsable(responsable);
  if (!responsableNormalizado) return undefined;

  return items.find((existingItem) => {
    if (!esCategoriaMonitor(existingItem.categoria)) return false;
    if (existingItem.estado === 'Baja') return false;
    if (excludeItemId && existingItem.id === excludeItemId) return false;
    return normalizarResponsable(existingItem.responsable || '') === responsableNormalizado;
  });
};

export const getMensajeMonitorResponsableDuplicado = (
  responsable: string,
  monitorExistente: ItemInventario
) =>
  `El responsable "${responsable}" ya tiene asociado el monitor "${monitorExistente.nombre}". Solo se permite un monitor por responsable.`;
