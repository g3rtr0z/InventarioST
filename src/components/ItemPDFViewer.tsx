import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ItemInventario } from '../types/inventario';
import { generateItemPDF } from '../utils/generateItemPDF';
import { validateQRToken } from '../services/qrTokenService';
import Loader from './Loader';

export default function ItemPDFViewer() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemInventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !db) {
        setError('Token no válido o Firebase no configurado');
        setLoading(false);
        return;
      }

      try {
        // Validar el token temporal
        const itemId = await validateQRToken(id);
        
        if (!itemId) {
          setError('El código QR ha expirado o no es válido. Los códigos QR expiran después de 15 minutos.');
          setLoading(false);
          return;
        }

        // Obtener el item usando el itemId del token
        const itemDoc = await getDoc(doc(db, 'items', itemId));
        if (itemDoc.exists()) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() } as ItemInventario;
          setItem(itemData);
          // Generar y descargar el PDF automáticamente
          setTimeout(() => {
            generateItemPDF(itemData);
          }, 500);
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
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Si necesitas acceder al PDF, escanea un código QR nuevo desde el inventario.
          </p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Item no encontrado</h1>
          <p className="text-gray-600">El item solicitado no existe en el inventario.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Información del Item
          </h1>
          <p className="text-gray-600">
            El PDF se está generando y descargará automáticamente...
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Nombre del Equipo</h2>
            <p className="text-gray-700">{item.nombre}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600">Categoría</h3>
              <p className="text-gray-800">{item.categoria}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600">Estado</h3>
              <p className="text-gray-800">{item.estado}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600">Marca</h3>
              <p className="text-gray-800">{item.marca}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600">Modelo</h3>
              <p className="text-gray-800">{item.modelo}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => generateItemPDF(item)}
              className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Descargar PDF nuevamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

