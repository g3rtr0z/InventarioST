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
      'Disponible': 'bg-green-100 text-green-700',
      'En Uso': 'bg-blue-100 text-blue-700',
      'Mantenimiento': 'bg-yellow-100 text-yellow-700',
      'Baja': 'bg-red-100 text-red-700'
    };
    return estadoMap[estado] || 'bg-gray-100 text-gray-700';
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
          className={`bg-white border-2 rounded-lg p-5 shadow-sm hover:shadow-lg transition-all ${
            item.estado === 'Disponible' ? 'border-green-200 hover:border-green-300' :
            item.estado === 'En Uso' ? 'border-blue-200 hover:border-blue-300' :
            item.estado === 'Mantenimiento' ? 'border-yellow-200 hover:border-yellow-300' :
            'border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {item.nombre}
              </h3>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${getEstadoColor(item.estado)}`}>
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
              <span className="text-gray-600">Sede: </span>
              <span className="text-gray-900 font-medium">{item.sede}</span>
            </div>
            <div>
              <span className="text-gray-600">Ubicación: </span>
              <span className="text-gray-900">{item.ubicacion}</span>
            </div>
            {item.piso && (
              <div>
                <span className="text-gray-600">Piso: </span>
                <span className="text-gray-900">{item.piso}</span>
              </div>
            )}
            {item.edificio && (
              <div>
                <span className="text-gray-600">Edificio: </span>
                <span className="text-gray-900">{item.edificio}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Tipo de Uso: </span>
              <span className={`text-gray-900 font-medium ${
                item.tipoUso === 'Alumnos' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {item.tipoUso}
              </span>
            </div>
            {(item.procesador || item.ram || item.discoDuro) && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Especificaciones:</div>
                {item.procesador && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Procesador:</span> {item.procesador}
                  </div>
                )}
                {item.ram && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">RAM:</span> {item.ram}
                  </div>
                )}
                {item.discoDuro && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Disco:</span> {item.discoDuro}
                  </div>
                )}
              </div>
            )}
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

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => onEdit(item)}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoría</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Marca/Modelo</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Serie</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ubicación</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Piso</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo de Uso</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Responsable</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-900 font-medium">{item.nombre}</td>
                    <td className="px-5 py-4 text-gray-700">{item.categoria}</td>
                    <td className="px-5 py-4 text-gray-700">{item.marca} {item.modelo}</td>
                    <td className="px-5 py-4 text-gray-700 font-mono text-xs">{item.numeroSerie}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getEstadoColor(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-medium">{item.sede}</td>
                    <td className="px-5 py-4 text-gray-700">{item.ubicacion}</td>
                    <td className="px-5 py-4 text-gray-700">{item.piso || '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        item.tipoUso === 'Alumnos' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.tipoUso}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{item.responsable}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => printQR(item)}
                          className="px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
                          title="Imprimir código QR"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
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
        </div>
      )}
    </div>
  );
}