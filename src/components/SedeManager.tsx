import { useState } from 'react';

interface SedeManagerProps {
  sedes: string[];
  onSedesChange: (sedes: string[]) => void;
}

export default function SedeManager({ sedes, onSedesChange }: SedeManagerProps) {
  const [nuevaSede, setNuevaSede] = useState('');
  const [showManager, setShowManager] = useState(false);

  const handleAgregar = () => {
    if (nuevaSede.trim() && !sedes.includes(nuevaSede.trim())) {
      onSedesChange([...sedes, nuevaSede.trim()]);
      setNuevaSede('');
    }
  };

  const handleEliminar = (sede: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la sede "${sede}"?`)) {
      onSedesChange(sedes.filter(s => s !== sede));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAgregar();
    }
  };

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        className="px-3 py-2.5 bg-gray-500 text-white hover:bg-gray-600 rounded-md transition-colors text-sm"
      >
        Sedes
      </button>

      {showManager && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Gestionar Sedes</h2>
              <button
                onClick={() => setShowManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Agregar nueva sede */}
              <div className="mb-6">
                <label className="block mb-2 text-sm text-gray-700">
                  Agregar Nueva Sede
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevaSede}
                    onChange={(e) => setNuevaSede(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nombre de la sede"
                    className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-700"
                  />
                  <button
                    onClick={handleAgregar}
                    className="px-3 py-1.5 bg-green-800 text-white hover:bg-green-900 rounded-md transition-colors"
                    disabled={!nuevaSede.trim()}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lista de sedes */}
              <div>
                <label className="block mb-3 text-sm text-gray-700">
                  Sedes ({sedes.length})
                </label>
                {sedes.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hay sedes
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sedes.map((sede, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border border-gray-200"
                      >
                        <span className="text-gray-900">{sede}</span>
                        <button
                          onClick={() => handleEliminar(sede)}
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

