import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ItemInventario } from '../types/inventario';
import { generateItemPDF } from '../utils/generateItemPDF';
import Loader from './Loader';

export default function ItemPDFViewer() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemInventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !db) {
        setError('ID de item no válido o Firebase no configurado');
        setLoading(false);
        return;
      }

      try {
        const itemDoc = await getDoc(doc(db, 'items', id));
        if (itemDoc.exists()) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() } as ItemInventario;
          setItem(itemData);
        } else {
          setError('Item no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el item');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const getEstadoColor = (estado: string) => {
    const estadoMap: Record<string, string> = {
      'Disponible': 'bg-green-100 text-green-700 border-green-300',
      'En Uso': 'bg-blue-100 text-blue-700 border-blue-300',
      'Mantenimiento': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Baja': 'bg-red-100 text-red-700 border-red-300'
    };
    return estadoMap[estado] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Item no encontrado</h1>
          <p className="text-gray-600">El item solicitado no existe en el inventario.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.nombre}</h1>
              <p className="text-sm text-gray-500">Inventario - Departamento de Informática</p>
            </div>
            <span className={`px-4 py-2 rounded-lg border-2 font-semibold ${getEstadoColor(item.estado)}`}>
              {item.estado}
            </span>
          </div>
        </div>

        {/* Información General */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
            Información General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Categoría</p>
              <p className="text-gray-900">{item.categoria}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Marca</p>
              <p className="text-gray-900">{item.marca}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Modelo</p>
              <p className="text-gray-900">{item.modelo}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Número de Serie</p>
              <p className="text-gray-900 font-mono">{item.numeroSerie}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Tipo de Uso</p>
              <p className={`text-gray-900 font-medium ${
                item.tipoUso === 'Alumnos' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {item.tipoUso}
              </p>
            </div>
          </div>
        </div>

        {/* Ubicación y Responsabilidad */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
            Ubicación y Responsabilidad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Sede</p>
              <p className="text-gray-900 font-medium">{item.sede}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Ubicación</p>
              <p className="text-gray-900">{item.ubicacion}</p>
            </div>
            {item.piso && (
              <div>
                <p className="text-sm font-semibold text-gray-600">Piso</p>
                <p className="text-gray-900">{item.piso}</p>
              </div>
            )}
            {item.edificio && (
              <div>
                <p className="text-sm font-semibold text-gray-600">Edificio</p>
                <p className="text-gray-900">{item.edificio}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-gray-600">Responsable</p>
              <p className="text-gray-900">{item.responsable}</p>
            </div>
          </div>
        </div>

        {/* Especificaciones Técnicas */}
        {(item.procesador || item.ram || item.discoDuro) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
              Especificaciones Técnicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.procesador && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Procesador</p>
                  <p className="text-gray-900">{item.procesador}</p>
                </div>
              )}
              {item.ram && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">RAM</p>
                  <p className="text-gray-900">{item.ram}</p>
                </div>
              )}
              {item.discoDuro && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Disco Duro</p>
                  <p className="text-gray-900">{item.discoDuro}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información de Adquisición */}
        {(item.fechaAdquisicion || item.precio || item.proveedor || item.numeroFactura || item.fechaVencimientoGarantia) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
              Información de Adquisición
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.fechaAdquisicion && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Fecha de Adquisición</p>
                  <p className="text-gray-900">{formatDate(item.fechaAdquisicion)}</p>
                </div>
              )}
              {item.precio && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Precio</p>
                  <p className="text-gray-900 font-medium">{formatCurrency(item.precio)}</p>
                </div>
              )}
              {item.proveedor && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Proveedor</p>
                  <p className="text-gray-900">{item.proveedor}</p>
                </div>
              )}
              {item.numeroFactura && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Número de Factura</p>
                  <p className="text-gray-900">{item.numeroFactura}</p>
                </div>
              )}
              {item.fechaVencimientoGarantia && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Garantía vence</p>
                  <p className="text-gray-900">{formatDate(item.fechaVencimientoGarantia)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mantenimiento */}
        {(item.fechaUltimoMantenimiento || item.proximoMantenimiento) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
              Mantenimiento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.fechaUltimoMantenimiento && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Último Mantenimiento</p>
                  <p className="text-gray-900">{formatDate(item.fechaUltimoMantenimiento)}</p>
                </div>
              )}
              {item.proximoMantenimiento && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Próximo Mantenimiento</p>
                  <p className="text-gray-900 font-medium text-green-600">{formatDate(item.proximoMantenimiento)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Descripción */}
        {item.descripcion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
              Descripción
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap">{item.descripcion}</p>
          </div>
        )}

        {/* Observaciones */}
        {item.observaciones && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500">
              Observaciones
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap">{item.observaciones}</p>
          </div>
        )}

        {/* Botón de descarga PDF */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => generateItemPDF(item)}
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-lg"
          >
            📄 Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

