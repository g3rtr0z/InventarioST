import jsPDF from 'jspdf';
import type { ItemInventario } from '../types/inventario';

/**
 * Genera un PDF con la información completa del item
 */
export const generateItemPDF = (item: ItemInventario): void => {
  const doc = new jsPDF();
  
  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Función para agregar texto con wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5;
  };

  // Título
  addText('INVENTARIO - DEPARTAMENTO DE INFORMÁTICA', 16, true, '#006600');
  yPosition += 5;
  
  // Línea separadora
  doc.setDrawColor(0, 102, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Información General
  addText('INFORMACIÓN GENERAL', 14, true, '#333333');
  yPosition += 3;
  
  addText(`Nombre del Equipo: ${item.nombre}`, 11);
  addText(`Categoría: ${item.categoria}`, 11);
  addText(`Marca: ${item.marca}`, 11);
  addText(`Modelo: ${item.modelo}`, 11);
  addText(`Número de Serie: ${item.numeroSerie}`, 11);
  addText(`Estado: ${item.estado}`, 11);
  addText(`Tipo de Uso: ${item.tipoUso}`, 11);
  
  yPosition += 5;

  // Ubicación y Responsabilidad
  addText('UBICACIÓN Y RESPONSABILIDAD', 14, true, '#333333');
  yPosition += 3;
  
  addText(`Sede: ${item.sede}`, 11);
  addText(`Ubicación: ${item.ubicacion}`, 11);
  if (item.piso) {
    addText(`Piso: ${item.piso}`, 11);
  }
  if (item.edificio) {
    addText(`Edificio: ${item.edificio}`, 11);
  }
  addText(`Responsable: ${item.responsable}`, 11);
  
  yPosition += 5;

  // Especificaciones Técnicas
  if (item.procesador || item.ram || item.discoDuro) {
    addText('ESPECIFICACIONES TÉCNICAS', 14, true, '#333333');
    yPosition += 3;
    
    if (item.procesador) {
      addText(`Procesador: ${item.procesador}`, 11);
    }
    if (item.ram) {
      addText(`RAM: ${item.ram}`, 11);
    }
    if (item.discoDuro) {
      addText(`Disco Duro: ${item.discoDuro}`, 11);
    }
    
    yPosition += 5;
  }

  // Información de Adquisición
  if (item.fechaAdquisicion || item.precio || item.proveedor || item.numeroFactura) {
    addText('INFORMACIÓN DE ADQUISICIÓN', 14, true, '#333333');
    yPosition += 3;
    
    if (item.fechaAdquisicion) {
      const fecha = new Date(item.fechaAdquisicion).toLocaleDateString('es-MX');
      addText(`Fecha de Adquisición: ${fecha}`, 11);
    }
    if (item.precio) {
      const precio = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.precio);
      addText(`Precio: ${precio}`, 11);
    }
    if (item.proveedor) {
      addText(`Proveedor: ${item.proveedor}`, 11);
    }
    if (item.numeroFactura) {
      addText(`Número de Factura: ${item.numeroFactura}`, 11);
    }
    if (item.fechaVencimientoGarantia) {
      const fechaGarantia = new Date(item.fechaVencimientoGarantia).toLocaleDateString('es-MX');
      addText(`Garantía vence: ${fechaGarantia}`, 11);
    }
    
    yPosition += 5;
  }

  // Mantenimiento
  if (item.fechaUltimoMantenimiento || item.proximoMantenimiento) {
    addText('MANTENIMIENTO', 14, true, '#333333');
    yPosition += 3;
    
    if (item.fechaUltimoMantenimiento) {
      const fechaUltimo = new Date(item.fechaUltimoMantenimiento).toLocaleDateString('es-MX');
      addText(`Último Mantenimiento: ${fechaUltimo}`, 11);
    }
    if (item.proximoMantenimiento) {
      const fechaProximo = new Date(item.proximoMantenimiento).toLocaleDateString('es-MX');
      addText(`Próximo Mantenimiento: ${fechaProximo}`, 11);
    }
    
    yPosition += 5;
  }

  // Descripción
  if (item.descripcion) {
    addText('DESCRIPCIÓN', 14, true, '#333333');
    yPosition += 3;
    addText(item.descripcion, 11);
    yPosition += 5;
  }

  // Observaciones
  if (item.observaciones) {
    addText('OBSERVACIONES', 14, true, '#333333');
    yPosition += 3;
    addText(item.observaciones, 11);
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#666666');
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString('es-MX')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Descargar el PDF
  doc.save(`Inventario_${item.nombre.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

/**
 * Genera y muestra el PDF en una nueva ventana
 */
export const generateAndShowItemPDF = (item: ItemInventario): void => {
  generateItemPDF(item);
};

