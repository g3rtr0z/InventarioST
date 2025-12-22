import { useState, useEffect } from 'react';
import type { ItemInventario } from './types/inventario';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import CategoriaManager from './components/CategoriaManager';

const STORAGE_KEY = 'inventario-st-items';
const STORAGE_KEY_CATEGORIAS = 'inventario-st-categorias';

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

  // Cargar items del localStorage al iniciar
  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Error al cargar items del localStorage:', error);
      }
    }
  }, []);

  // Cargar categorías del localStorage al iniciar
  useEffect(() => {
    const savedCategorias = localStorage.getItem(STORAGE_KEY_CATEGORIAS);
    if (savedCategorias) {
      try {
        setCategorias(JSON.parse(savedCategorias));
      } catch (error) {
        console.error('Error al cargar categorías del localStorage:', error);
      }
    }
  }, []);

  // Guardar items en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Guardar categorías en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias));
  }, [categorias]);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: ItemInventario) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSaveItem = (item: ItemInventario) => {
    if (editingItem) {
      // Actualizar item existente
      setItems(prevItems =>
        prevItems.map(i => (i.id === item.id ? item : i))
      );
    } else {
      // Agregar nuevo item
      setItems(prevItems => [...prevItems, item]);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este item?')) {
      setItems(prevItems => prevItems.filter(i => i.id !== id));
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const filteredItems = filterEstado === 'Todos'
    ? items
    : items.filter(item => item.estado === filterEstado);

  const estadisticas = {
    total: items.length,
    disponible: items.filter(i => i.estado === 'Disponible').length,
    enUso: items.filter(i => i.estado === 'En Uso').length,
    mantenimiento: items.filter(i => i.estado === 'Mantenimiento').length,
    baja: items.filter(i => i.estado === 'Baja').length
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Header simple */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Inventario - Departamento de Informática
          </h1>
          <p className="text-sm text-gray-600">Sistema de gestión de equipos</p>
        </header>

        {/* Estadísticas simples */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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

        {/* Panel de búsqueda y filtros */}
        <div className="mb-6 space-y-3">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
          />
          <div className="flex gap-2">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="En Uso">En Uso</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Baja">Baja</option>
            </select>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-green-500 text-white hover:bg-green-600"
            >
              Agregar
            </button>
            <CategoriaManager
              categorias={categorias}
              onCategoriasChange={setCategorias}
            />
          </div>
        </div>

        {/* Contenido principal */}
        <main>
          <ItemList
            items={filteredItems}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            searchTerm={searchTerm}
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
