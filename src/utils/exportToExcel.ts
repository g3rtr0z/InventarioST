import * as XLSX from 'xlsx';
import type { ItemInventario } from '../types/inventario';

/**
 * Exporta los items del inventario a un archivo Excel
 */
export const exportToExcel = (items: ItemInventario[], filename: string = 'inventario') => {
  // Preparar los datos para Excel
  const data = items.map(item => ({
    'Nombre': item.nombre,
    'Categoría': item.categoria,
    'Marca': item.marca,
    'Modelo': item.modelo,
    'Número de Serie': item.numeroSerie,
    'Estado': item.estado,
    'Sede': item.sede,
    'Ubicación': item.ubicacion,
    'Responsable': item.responsable,
    'Edificio': item.edificio || '',
    'Piso': item.piso || '',
    'Tipo de Uso': item.tipoUso,
    'Procesador': item.procesador || '',
    'RAM': item.ram || '',
    'Disco Duro': item.discoDuro || '',
    'Horas Normales': item.horasNormales || '',
    'Horas Eco': item.horasEco || '',
    'Fecha de Adquisición': item.fechaAdquisicion || '',
    'Descripción': item.descripcion || '',
    'Observaciones': item.observaciones || '',
    'Último Mantenimiento': item.fechaUltimoMantenimiento || '',
    'Próximo Mantenimiento': item.proximoMantenimiento || ''
  }));

  // Crear un libro de trabajo
  const wb = XLSX.utils.book_new();

  // Crear una hoja de cálculo con los datos
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar el ancho de las columnas
  const colWidths = [
    { wch: 20 }, // Nombre
    { wch: 15 }, // Categoría
    { wch: 15 }, // Marca
    { wch: 15 }, // Modelo
    { wch: 20 }, // Número de Serie
    { wch: 15 }, // Estado
    { wch: 20 }, // Sede
    { wch: 15 }, // Ubicación
    { wch: 20 }, // Responsable
    { wch: 20 }, // Edificio
    { wch: 10 }, // Piso
    { wch: 15 }, // Tipo de Uso
    { wch: 25 }, // Procesador
    { wch: 15 }, // RAM
    { wch: 20 }, // Disco Duro
    { wch: 15 }, // Horas Normales
    { wch: 15 }, // Horas Eco
    { wch: 18 }, // Fecha de Adquisición
    { wch: 30 }, // Descripción
    { wch: 30 }, // Observaciones
    { wch: 20 }, // Último Mantenimiento
    { wch: 20 }  // Próximo Mantenimiento
  ];
  ws['!cols'] = colWidths;

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

  // Generar el nombre del archivo con fecha
  const fecha = new Date().toISOString().split('T')[0];
  const nombreArchivo = `${filename}_${fecha}.xlsx`;

  // Descargar el archivo
  XLSX.writeFile(wb, nombreArchivo);
};

/**
 * Importa items desde un archivo Excel con el mismo formato que exportToExcel.
 * Devuelve una lista de items sin id, listos para agregarse a la base de datos.
 */
export const importFromExcel = async (file: File): Promise<Omit<ItemInventario, 'id'>[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

  const items: Omit<ItemInventario, 'id'>[] = rows.map((row) => {
    const getString = (key: string): string => {
      const value = row[key];
      return value == null ? '' : String(value).trim();
    };

    const estado = getString('Estado') as ItemInventario['estado'] | '';
    const tipoUso = getString('Tipo de Uso') as ItemInventario['tipoUso'] | '';

    const rawNombre = getString('Nombre');
    const regexSufijoBaja = /\s+-\s*Baja$/i;
    let nombreNormalizado = rawNombre;

    if (estado === 'Baja') {
      // Asegurar que el nombre termine en " - Baja" sin duplicar el sufijo
      const base = rawNombre.replace(regexSufijoBaja, '');
      nombreNormalizado = `${base} - Baja`;
    } else {
      // Para otros estados, eliminar el sufijo " - Baja" si viene en el Excel
      nombreNormalizado = rawNombre.replace(regexSufijoBaja, '');
    }

    return {
      nombre: nombreNormalizado,
      categoria: getString('Categoría'),
      marca: getString('Marca'),
      modelo: getString('Modelo'),
      numeroSerie: getString('Número de Serie'),
      estado: (estado || 'Disponible') as ItemInventario['estado'],
      sede: getString('Sede'),
      ubicacion: getString('Ubicación'),
      responsable: getString('Responsable'),
      edificio: getString('Edificio') || undefined,
      piso: getString('Piso') || undefined,
      tipoUso: (tipoUso || 'Administrativo') as ItemInventario['tipoUso'],
      procesador: getString('Procesador') || undefined,
      ram: getString('RAM') || undefined,
      discoDuro: getString('Disco Duro') || undefined,
      horasNormales: getString('Horas Normales') || undefined,
      horasEco: getString('Horas Eco') || undefined,
      fechaAdquisicion: getString('Fecha de Adquisición'),
      descripcion: getString('Descripción'),
      observaciones: getString('Observaciones') || undefined,
      fechaUltimoMantenimiento: getString('Último Mantenimiento') || undefined,
      proximoMantenimiento: getString('Próximo Mantenimiento') || undefined
    };
  }).filter(item => item.nombre); // Solo filas con nombre

  return items;
};
