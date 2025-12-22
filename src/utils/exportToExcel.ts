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
    'Ubicación': item.ubicacion,
    'Responsable': item.responsable,
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
    { wch: 15 }, // Ubicación
    { wch: 20 }, // Responsable
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

