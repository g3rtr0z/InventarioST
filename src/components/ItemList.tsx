import type { ItemInventario } from '../types/inventario';

interface ItemListProps {
  items: ItemInventario[];
  onEdit: (item: ItemInventario) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  viewMode: 'cards' | 'table';
}

export default function ItemList({ items, onEdit, onDelete, searchTerm, viewMode }: ItemListProps) {

  const filteredItems = items.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numeroFactura?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoColor = (estado: string) => {
    const estadoMap: Record<string, string> = {
      'Disponible': 'text-green-600',
      'En Uso': 'text-blue-600',
      'Mantenimiento': 'text-yellow-600',
      'Baja': 'text-red-600'
    };
    return estadoMap[estado] || 'text-gray-600';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX');
  };

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No se encontraron items</p>
      </div>
    );
  }

  return (
    <div>
      {/* Vista de Tarjetas */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredItems.map(item => (
        <div
          key={item.id}
          className="border border-gray-200 p-4"
        >
          <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              {item.nombre}
            </h3>
            <span className={`text-xs font-medium ${getEstadoColor(item.estado)}`}>
              {item.estado}
            </span>
          </div>

          <div className="space-y-2 text-sm mb-3">
            <div>
              <span className="text-gray-600">Categoría: </span>
              <span className="text-gray-900">{item.categoria}</span>
            </div>
            <div>
              <span className="text-gray-600">Marca/Modelo: </span>
              <span className="text-gray-900">{item.marca} {item.modelo}</span>
            </div>
            <div>
              <span className="text-gray-600">Serie: </span>
              <span className="text-gray-900">{item.numeroSerie}</span>
            </div>
            <div>
              <span className="text-gray-600">Ubicación: </span>
              <span className="text-gray-900">{item.ubicacion}</span>
            </div>
            <div>
              <span className="text-gray-600">Responsable: </span>
              <span className="text-gray-900">{item.responsable}</span>
            </div>
            {item.precio && (
              <div>
                <span className="text-gray-600">Precio: </span>
                <span className="text-gray-900 font-medium">{formatCurrency(item.precio)}</span>
              </div>
            )}
            {item.proveedor && (
              <div>
                <span className="text-gray-600">Proveedor: </span>
                <span className="text-gray-900">{item.proveedor}</span>
              </div>
            )}
            {item.fechaVencimientoGarantia && (
              <div>
                <span className="text-gray-600">Garantía vence: </span>
                <span className="text-gray-900">{formatDate(item.fechaVencimientoGarantia)}</span>
              </div>
            )}
            {item.descripcion && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-600">Descripción: </span>
                <span className="text-gray-900">{item.descripcion}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onEdit(item)}
              className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm hover:bg-green-600"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Nombre</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Categoría</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Marca/Modelo</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Serie</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Estado</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Ubicación</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Responsable</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Precio</th>
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-2 text-gray-900 font-medium">{item.nombre}</td>
                  <td className="px-4 py-2 text-gray-700">{item.categoria}</td>
                  <td className="px-4 py-2 text-gray-700">{item.marca} {item.modelo}</td>
                  <td className="px-4 py-2 text-gray-700">{item.numeroSerie}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${getEstadoColor(item.estado)}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{item.ubicacion}</td>
                  <td className="px-4 py-2 text-gray-700">{item.responsable}</td>
                  <td className="px-4 py-2 text-gray-700">{formatCurrency(item.precio)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="px-2 py-1 bg-green-500 text-white text-xs hover:bg-green-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
