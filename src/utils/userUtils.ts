/**
 * Utilidades para manejar y normalizar nombres de encargados
 */

/**
 * Genera una llave única para un encargado basada en su correo o nombre.
 * Ayuda a consolidar duplicados como "Nombre (correo@dominio.com)" y "correo.dominio.com"
 */
export const getEncargadoKey = (val: string | undefined): string => {
    if (!val) return "";
    let id = val.toLowerCase().trim();

    // Extraer el contenido de los paréntesis si existe (generalmente el correo)
    const match = id.match(/\(([^)]+)\)/);
    if (match) {
        id = match[1].trim();
    }

    // Normalizar separadores comunes para manejar errores de escritura (@ vs .)
    // y quitar espacios para mayor robustez
    return id.replace(/[@.\s]/g, '_');
};

/**
 * Obtiene una lista de encargados únicos, prefiriendo la versión más completa (con nombre)
 */
export const getUniqueEncargados = (items: any[]): string[] => {
    const map = new Map<string, string>();

    items.forEach(item => {
        if (!item.encargado) return;
        const key = getEncargadoKey(item.encargado);
        const current = map.get(key);

        // Si no existe la llave, o si el nuevo valor es más largo (asumiendo que es más completo)
        if (!current || item.encargado.length > current.length) {
            map.set(key, item.encargado);
        }
    });

    return Array.from(map.values()).sort();
};
