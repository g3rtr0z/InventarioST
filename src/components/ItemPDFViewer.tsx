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
      if (!id) {
        setError('ID de item no válido');
        setLoading(false);
        return;
      }

      if (!db) {
        setError('Firebase no está configurado');
        setLoading(false);
        return;
      }

      try {
        // Decodificar el ID si viene codificado
        let decodedId: string;
        try {
          decodedId = decodeURIComponent(id);
        } catch {
          // Si falla la decodificación, usar el ID original
          decodedId = id;
        }
        
        console.log('Buscando item con ID:', decodedId);
        const itemDoc = await getDoc(doc(db, 'items', decodedId));
        if (itemDoc.exists()) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() } as ItemInventario;
          setItem(itemData);
          // Generar y descargar el PDF automáticamente
          setTimeout(() => {
            generateItemPDF(itemData);
          }, 500);
        } else {
          setError(`Item no encontrado. ID: ${decodedId}`);
        }
      } catch (err: any) {
        const errorMessage = err?.message || 'Error desconocido';
        setError(`Error al cargar el item: ${errorMessage}. ID intentado: ${id}`);
        console.error('Error detallado:', err);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
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

