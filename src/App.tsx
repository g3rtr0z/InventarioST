import { useState, useEffect } from 'react';
import type { ItemInventario } from './types/inventario';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import CategoriaManager from './components/CategoriaManager';
import SedeManager from './components/SedeManager';
import {
  subscribeToItems,
  subscribeToCategorias,
  addItem,
  updateItem,
  deleteItem,
  saveCategorias
} from './services/inventarioService';
import { isFirebaseReady } from './config/firebase';
import { exportToExcel } from './utils/exportToExcel';

const CATEGORIAS_DEFAULT = [
  'Computadora',
  'Laptop',
  'Monitor',
  'Teclado',
  'Mouse',
  'Impresora',
  'Router',
  'Switch',
  'Servidor',
  'Tablet',
  'Teléfono',
  'Otro'
];

function App() {
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_DEFAULT);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInventario | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('Todas');
  const [filterSede, setFilterSede] = useState<string>('Todas');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState<'general' | 'sedes'>('general');
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sedes, setSedes] = useState<string[]>(['Manuel Rodriguez', 'Pedro de Valdivia']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suscribirse a cambios en tiempo real de items
  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      setError('Firebase no está configurado. Por favor, configura las variables de entorno en el archivo .env');
      return;
    }

    let unsubscribeItems: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout>;

    try {
      unsubscribeItems = subscribeToItems((itemsData) => {
        setItems(itemsData);
        setLoading(false);
        setError(null);
      });

      // Timeout de seguridad: si después de 10 segundos no hay respuesta, mostrar error
      timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Error al conectar con Firebase. Verifica tu conexión y configuración.');
        }
      }, 10000);
    } catch (err) {
      console.error('Error al suscribirse a items:', err);
      setLoading(false);
      setError('Error al conectar con Firebase. Verifica tu configuración.');
    }

    return () => {
      if (unsubscribeItems) unsubscribeItems();
      clearTimeout(timeoutId);
    };
  }, [loading, isFirebaseReady]);

  // Suscribirse a cambios en tiempo real de categorías
  useEffect(() => {
    if (!isFirebaseReady) {
      return;
    }

    let unsubscribeCategorias: (() => void) | undefined;

    try {
      unsubscribeCategorias = subscribeToCategorias((categoriasData) => {
        if (categoriasData.length > 0) {
          setCategorias(categoriasData);
        } else {
          // Si no hay categorías en Firebase, inicializar con las por defecto
          saveCategorias(CATEGORIAS_DEFAULT).catch(err => {
            console.error('Error al inicializar categorías:', err);
          });
        }
      });
    } catch (err) {
      console.error('Error al suscribirse a categorías:', err);
    }

    return () => {
      if (unsubscribeCategorias) unsubscribeCategorias();
    };
  }, [isFirebaseReady]);

  // Guardar categorías cuando cambien
  useEffect(() => {
    if (isFirebaseReady && categorias.length > 0 && categorias !== CATEGORIAS_DEFAULT) {
      saveCategorias(categorias).catch(err => {
        console.error('Error al guardar categorías:', err);
      });
    }
  }, [categorias, isFirebaseReady]);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: ItemInventario) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSaveItem = async (item: ItemInventario) => {
    console.log('🔵 handleSaveItem llamado con:', item);
    try {
      if (editingItem) {
        // Actualizar item existente
        console.log('🔵 Actualizando item existente:', item.id);
        await updateItem(item.id, item);
        console.log('✅ Item actualizado exitosamente');
      } else {
        // Agregar nuevo item
        console.log('🔵 Agregando nuevo item');
        const { id, ...itemData } = item;
        console.log('🔵 Datos a guardar (sin id):', itemData);
        const newId = await addItem(itemData);
        console.log('✅ Item agregado exitosamente con ID:', newId);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('❌ Error en handleSaveItem:', error);
      const errorMessage = error?.message || 'Error desconocido al guardar el item';
      alert(`Error al guardar el item: ${errorMessage}\n\nRevisa la consola del navegador para más detalles.`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este item?')) {
      try {
        await deleteItem(id);
      } catch (error) {
        console.error('Error al eliminar item:', error);
        alert('Error al eliminar el item. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleCategoriasChange = async (nuevasCategorias: string[]) => {
    try {
      setCategorias(nuevasCategorias);
      await saveCategorias(nuevasCategorias);
    } catch (error) {
      console.error('Error al guardar categorías:', error);
      alert('Error al guardar las categorías. Por favor, intenta nuevamente.');
    }
  };

  const filteredItems = items.filter(item => {
    // Filtro por estado
    if (filterEstado !== 'Todos' && item.estado !== filterEstado) {
      return false;
    }
    // Filtro por categoría
    if (filterCategoria !== 'Todas' && item.categoria !== filterCategoria) {
      return false;
    }
    // Filtro por sede
    if (filterSede !== 'Todas') {
      const ubicacionLower = item.ubicacion.toLowerCase();
      const sedeLower = filterSede.toLowerCase();
      // Buscar si la ubicación contiene alguna palabra clave de la sede
      const palabrasSede = sedeLower.split(' ');
      const coincide = palabrasSede.some(palabra => 
        palabra.length > 2 && ubicacionLower.includes(palabra)
      );
      if (!coincide) {
        return false;
      }
    }
    return true;
  });

  // Items filtrados también por búsqueda (para mostrar en la lista)
  const filteredAndSearchedItems = filteredItems.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    // Exportar los items que están siendo mostrados (con filtros y búsqueda aplicados)
    const itemsToExport = filteredAndSearchedItems.length > 0 ? filteredAndSearchedItems : filteredItems;
    
    if (itemsToExport.length === 0) {
      alert('No hay items para exportar');
      return;
    }
    exportToExcel(itemsToExport, 'inventario_departamento_informatica');
  };

  const estadisticas = {
    total: items.length,
    disponible: items.filter(i => i.estado === 'Disponible').length,
    enUso: items.filter(i => i.estado === 'En Uso').length,
    mantenimiento: items.filter(i => i.estado === 'Mantenimiento').length,
    baja: items.filter(i => i.estado === 'Baja').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Cargando inventario...</p>
          {!isFirebaseReady && (
            <p className="text-sm text-yellow-600">
              Firebase no configurado. Usando modo local.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Inventario
              </h1>
              <p className="text-sm text-gray-500">Departamento de Informática</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStats(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Ver estadísticas"
              >
                Estadísticas
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Exportar a Excel"
              >
                Exportar
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-800 text-xs">
              {error}
            </div>
          )}
          {!isFirebaseReady && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-800 text-xs">
              ⚠️ Firebase no está configurado. Configura las variables de entorno en el archivo .env para usar la aplicación.
            </div>
          )}
        </header>


        {/* Panel de búsqueda y filtros */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            {/* Móvil: búsqueda y botón + en la misma línea */}
            <div className="flex gap-2 md:hidden mb-3">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddItem}
                className="px-3 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors text-sm flex-shrink-0"
                title="Agregar Item"
              >
                +
              </button>
            </div>
            
            {/* Escritorio: layout completo */}
            <div className="hidden md:flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre, marca, modelo, serie, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleAddItem}
                  className="px-3 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors text-sm"
                  title="Agregar Item"
                >
                  +
                </button>
                <CategoriaManager
                  categorias={categorias}
                  onCategoriasChange={handleCategoriasChange}
                />
                <SedeManager
                  sedes={sedes}
                  onSedesChange={setSedes}
                />
                <div className="flex gap-0.5 bg-gray-100 rounded-md overflow-hidden border border-gray-300">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2.5 text-sm font-medium transition-colors border-r border-gray-300 ${
                      viewMode === 'cards' 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'bg-white text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tarjetas
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'bg-white text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tabla
                  </button>
                </div>
              </div>
            </div>
            
            {/* Controles adicionales para móvil */}
            <div className="flex gap-2 md:hidden">
              <CategoriaManager
                categorias={categorias}
                onCategoriasChange={handleCategoriasChange}
              />
              <SedeManager
                sedes={sedes}
                onSedesChange={setSedes}
              />
              <div className="flex gap-0.5 bg-gray-100 rounded-md ml-auto overflow-hidden border border-gray-300">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors border-r border-gray-300 ${
                    viewMode === 'cards' 
                      ? 'bg-green-600 text-white shadow-sm' 
                      : 'bg-white text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-green-600 text-white shadow-sm' 
                      : 'bg-white text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tabla
                </button>
              </div>
            </div>
          </div>
          
          {/* Desplegable de Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex justify-between items-center transition-colors"
            >
              <span>Filtros de búsqueda</span>
              <span className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {showFilters && (
              <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filterSede}
                    onChange={(e) => setFilterSede(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="Todas">Todas las sedes</option>
                    {sedes.map(sede => (
                      <option key={sede} value={sede}>{sede}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="Disponible">Disponible</option>
                    <option value="En Uso">En Uso</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Baja">Baja</option>
                  </select>
                  
                  <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="Todas">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  {(filterEstado !== 'Todos' || filterCategoria !== 'Todas' || filterSede !== 'Todas') && (
                    <button
                      onClick={() => {
                        setFilterEstado('Todos');
                        setFilterCategoria('Todas');
                        setFilterSede('Todas');
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <main>
          <ItemList
            items={filteredItems}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            searchTerm={searchTerm}
            viewMode={viewMode}
          />
        </main>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <ItemForm
          item={editingItem}
          categorias={categorias}
          onSave={handleSaveItem}
          onCancel={handleCancelForm}
        />
      )}

      {/* Modal de Estadísticas */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900">Estadísticas</h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {/* Pestañas */}
              <div className="flex gap-1 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'general'
                      ? 'text-gray-900 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Generales
                </button>
                <button
                  onClick={() => setActiveTab('sedes')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'sedes'
                      ? 'text-gray-900 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Por Sede
        </button>
              </div>

              {/* Contenido de las pestañas */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{estadisticas.total}</div>
                    <div className="text-xs text-gray-600 font-medium">Total</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-700 mb-1">{estadisticas.disponible}</div>
                    <div className="text-xs text-gray-600 font-medium">Disponibles</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{estadisticas.enUso}</div>
                    <div className="text-xs text-gray-600 font-medium">En Uso</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-700 mb-1">{estadisticas.mantenimiento}</div>
                    <div className="text-xs text-gray-600 font-medium">Mantenimiento</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-3xl font-bold text-red-700 mb-1">{estadisticas.baja}</div>
                    <div className="text-xs text-gray-600 font-medium">Baja</div>
                  </div>
                </div>
              )}

              {activeTab === 'sedes' && (
                <div className="space-y-4">
                  {sedes.map(sede => {
                    const itemsSede = items.filter(item => {
                      const ubicacionLower = item.ubicacion.toLowerCase();
                      const sedeLower = sede.toLowerCase();
                      // Buscar si la ubicación contiene alguna palabra clave de la sede
                      const palabrasSede = sedeLower.split(' ');
                      return palabrasSede.some(palabra => 
                        palabra.length > 2 && ubicacionLower.includes(palabra)
                      );
                    });

                    const statsSede = {
                      total: itemsSede.length,
                      disponible: itemsSede.filter(i => i.estado === 'Disponible').length,
                      enUso: itemsSede.filter(i => i.estado === 'En Uso').length,
                      mantenimiento: itemsSede.filter(i => i.estado === 'Mantenimiento').length,
                      baja: itemsSede.filter(i => i.estado === 'Baja').length
                    };

                return (
                  <div key={sede} className="p-4 sm:p-5 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">{sede}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                      <div className="text-center sm:text-left">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{statsSede.total}</div>
                        <div className="text-xs text-gray-600 font-medium">Total</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">{statsSede.disponible}</div>
                        <div className="text-xs text-gray-600 font-medium">Disponibles</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-xl sm:text-2xl font-bold text-blue-700 mb-1">{statsSede.enUso}</div>
                        <div className="text-xs text-gray-600 font-medium">En Uso</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-xl sm:text-2xl font-bold text-yellow-700 mb-1">{statsSede.mantenimiento}</div>
                        <div className="text-xs text-gray-600 font-medium">Mantenimiento</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-xl sm:text-2xl font-bold text-red-700 mb-1">{statsSede.baja}</div>
                        <div className="text-xs text-gray-600 font-medium">Baja</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default App;
