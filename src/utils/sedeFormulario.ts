/** Normaliza el nombre de sede (quita prefijo "Sede", acentos y espacios extra). */
export const normalizarNombreSede = (sede: string) =>
  sede
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^sede\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Sedes que no requieren seleccionar edificio. */
const ALIAS_SEDES_SIN_EDIFICIO = ['cesfam barroso'];

export const sedeRequiereEdificio = (sede: string): boolean => {
  const nombre = normalizarNombreSede(sede);
  if (!nombre) return true;
  if (ALIAS_SEDES_SIN_EDIFICIO.includes(nombre)) return false;
  if (nombre.includes('cesfam') && nombre.includes('barroso')) return false;
  return true;
};
