import { useState, useEffect } from 'react';
import type { ItemInventario } from './types/inventario';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import CategoriaManager from './components/CategoriaManager';
import {
  subscribeToItems,
  subscribeToCategorias,
  addItem,
  updateItem,
  deleteItem,
  saveCategorias
} from './services/inventarioService';
import { isFirebaseReady } from './config/firebase';

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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
    return true;
  });

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
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Header simple */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Inventario - Departamento de Informática
          </h1>
          <p className="text-sm text-gray-600">Sistema de gestión de equipos</p>
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

        {/* Estadísticas */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 border border-gray-200">
              <div className="text-2xl font-semibold text-gray-900">{estadisticas.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="p-3 border border-gray-200">
              <div className="text-2xl font-semibold text-green-600">{estadisticas.disponible}</div>
              <div className="text-xs text-gray-600">Disponibles</div>
            </div>
            <div className="p-3 border border-gray-200">
              <div className="text-2xl font-semibold text-blue-600">{estadisticas.enUso}</div>
              <div className="text-xs text-gray-600">En Uso</div>
            </div>
            <div className="p-3 border border-gray-200">
              <div className="text-2xl font-semibold text-yellow-600">{estadisticas.mantenimiento}</div>
              <div className="text-xs text-gray-600">Mantenimiento</div>
            </div>
            <div className="p-3 border border-gray-200">
              <div className="text-2xl font-semibold text-red-600">{estadisticas.baja}</div>
              <div className="text-xs text-gray-600">Baja</div>
            </div>
          </div>
        </div>

        {/* Panel de búsqueda y filtros */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo, serie, ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleAddItem}
              className="w-10 h-10 bg-green-500 text-white hover:bg-green-600 rounded flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 p-0"
              title="Agregar Item"
            >
              <span className="text-2xl font-light leading-[1]">+</span>
            </button>
            <CategoriaManager
              categorias={categorias}
              onCategoriasChange={handleCategoriasChange}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
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
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="Todas">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              {(filterEstado !== 'Todos' || filterCategoria !== 'Todas') && (
                <button
                  onClick={() => {
                    setFilterEstado('Todos');
                    setFilterCategoria('Todas');
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm border ${
                  viewMode === 'cards' 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm border ${
                  viewMode === 'table' 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Tabla
              </button>
            </div>
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
    </div>
  );
}

export default App;
