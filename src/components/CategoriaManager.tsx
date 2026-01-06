import { useState } from 'react';

interface CategoriaManagerProps {
  categorias: string[];
  onCategoriasChange: (categorias: string[]) => void;
  isAdmin?: boolean;
}

export default function CategoriaManager({ categorias, onCategoriasChange, isAdmin = false }: CategoriaManagerProps) {
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [showManager, setShowManager] = useState(false);

  const handleAgregar = () => {
    if (nuevaCategoria.trim() && !categorias.includes(nuevaCategoria.trim())) {
      onCategoriasChange([...categorias, nuevaCategoria.trim()]);
      setNuevaCategoria('');
    }
  };

  const handleEliminar = (categoria: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${categoria}"?`)) {
      onCategoriasChange(categorias.filter(cat => cat !== categoria));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAgregar();
    }
  };

  // Si no es administrador, no mostrar el botón
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        className="px-3 py-2.5 bg-gray-500 text-white hover:bg-gray-600 rounded-md transition-colors text-sm"
      >
        Categorías
      </button>

      {showManager && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestionar Categorías</h2>
              <button
                onClick={() => setShowManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Agregar nueva categoría */}
              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-700">
                  Agregar Nueva Categoría
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nombre de la categoría"
                    className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
                  />
                  <button
                    onClick={handleAgregar}
                    className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                    disabled={!nuevaCategoria.trim()}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lista de categorías */}
              <div>
                <label className="block mb-3 text-sm text-gray-700">
                  Categorías ({categorias.length})
                </label>
                {categorias.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hay categorías
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categorias.map((categoria, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border border-gray-200"
                      >
                        <span className="text-gray-900">{categoria}</span>
                        <button
                          onClick={() => handleEliminar(categoria)}
                          className="text-red-500 hover:text-red-700 px-2"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón cerrar */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowManager(false)}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-800 hover:bg-gray-400 rounded-md transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
