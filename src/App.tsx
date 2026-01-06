import { useState, useEffect, useRef } from 'react';
import type { ItemInventario } from './types/inventario';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import CategoriaManager from './components/CategoriaManager';
import SedeManager from './components/SedeManager';
import UserManager from './components/UserManager';
import Login from './components/Login';
import Loader from './components/Loader';
import {
  subscribeToItems,
  subscribeToCategorias,
  subscribeToSedes,
  addItem,
  updateItem,
  deleteItem,
  saveCategorias,
  saveSedes
} from './services/inventarioService';
import { isFirebaseReady, auth } from './config/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { exportToExcel } from './utils/exportToExcel';
import { useSecurityHeaders } from './hooks/useSecurityHeaders';
import { useUserRole } from './hooks/useUserRole';

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
  // Configurar headers de seguridad
  useSecurityHeaders();
  
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { isAdmin } = useUserRole(user);
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_DEFAULT);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInventario | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('Todas');
  const [filterSede, setFilterSede] = useState<string>('Todas');
  const [filterTipoUso, setFilterTipoUso] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'nombre' | 'categoria' | 'estado' | 'ubicacion'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [activeTab, setActiveTab] = useState<'general' | 'sedes'>('general');
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sedes, setSedes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [isNewLogin, setIsNewLogin] = useState(false);

  // Verificar estado de autenticación
  const wasAuthenticatedRef = useRef(false);
  const isInitialCheckRef = useRef(true);
  
  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isAuthenticated = !!currentUser;
      
      // En la primera verificación (recarga de página), no considerar como nuevo login
      if (isInitialCheckRef.current) {
        isInitialCheckRef.current = false;
        wasAuthenticatedRef.current = isAuthenticated;
        setUser(currentUser);
        setCheckingAuth(false);
        // Si hay usuario en la recarga, no mostrar loader
        if (isAuthenticated) {
          setLoading(false);
        }
        return;
      }
      
      // Si el usuario estaba desautenticado y ahora está autenticado, es un nuevo login
      if (!wasAuthenticatedRef.current && isAuthenticated) {
        setIsNewLogin(true);
        setLoadStartTime(Date.now());
        setLoading(true);
      }
      
      // Si el usuario estaba autenticado y ahora está desautenticado, resetear estados
      if (wasAuthenticatedRef.current && !isAuthenticated) {
        setIsNewLogin(false);
        setLoadStartTime(null);
        setLoading(false);
      }
      
      wasAuthenticatedRef.current = isAuthenticated;
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        // Error silencioso
      }
    }
  };

  // Suscribirse a cambios en tiempo real de items
  useEffect(() => {
    if (!user) {
      return;
    }

    if (!isFirebaseReady) {
      setLoading(false);
      setError('Firebase no está configurado. Por favor, configura las variables de entorno en el archivo .env');
      return;
    }

    // Solo mostrar loader si es un nuevo login, no al recargar la página
    if (!isNewLogin) {
      setLoading(false);
    }

    let unsubscribeItems: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout>;
    let minTimeTimeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      unsubscribeItems = subscribeToItems((itemsData) => {
        setItems(itemsData);
        setError(null);
        
        // Solo aplicar tiempo mínimo si es un nuevo login
        if (isNewLogin && loadStartTime) {
          const elapsedTime = Date.now() - loadStartTime;
          const minDisplayTime = 3000; // 3 segundos
          
          if (elapsedTime < minDisplayTime) {
            const remainingTime = minDisplayTime - elapsedTime;
            minTimeTimeoutId = setTimeout(() => {
              setLoading(false);
              setIsNewLogin(false);
            }, remainingTime);
          } else {
            setLoading(false);
            setIsNewLogin(false);
          }
        } else {
          setLoading(false);
        }
      });

      // Timeout de seguridad: si después de 10 segundos no hay respuesta, mostrar error
      timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Error al conectar con Firebase. Verifica tu conexión y configuración.');
        }
      }, 10000);
    } catch (err) {
      setLoading(false);
      setError('Error al conectar con Firebase. Verifica tu configuración.');
    }

    return () => {
      if (unsubscribeItems) unsubscribeItems();
      clearTimeout(timeoutId);
      if (minTimeTimeoutId) clearTimeout(minTimeTimeoutId);
    };
  }, [user, isFirebaseReady, loadStartTime, isNewLogin]);

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
          saveCategorias(CATEGORIAS_DEFAULT).catch(() => {
            // Error silencioso
          });
        }
      });
    } catch (err) {
      // Error silencioso
    }

    return () => {
      if (unsubscribeCategorias) unsubscribeCategorias();
    };
  }, [isFirebaseReady]);

  // Guardar categorías cuando cambien
  useEffect(() => {
    if (isFirebaseReady && categorias.length > 0 && categorias !== CATEGORIAS_DEFAULT) {
      saveCategorias(categorias).catch(() => {
        // Error silencioso
      });
    }
  }, [categorias, isFirebaseReady]);

  // Suscribirse a cambios en tiempo real de sedes
  useEffect(() => {
    if (!isFirebaseReady) return;

    let unsubscribeSedes: (() => void) | undefined;

    try {
      unsubscribeSedes = subscribeToSedes((sedesData: string[]) => {
        if (sedesData && sedesData.length > 0) {
          setSedes(sedesData);
        } else {
          // Si no hay sedes en Firebase, inicializar con las por defecto
          const sedesDefault = ['Manuel Rodriguez', 'Pedro de Valdivia'];
          setSedes(sedesDefault);
          saveSedes(sedesDefault).catch(() => {
            // Error silencioso
          });
        }
      });
    } catch (err) {
      // Error silencioso
    }

    return () => {
      if (unsubscribeSedes) unsubscribeSedes();
    };
  }, [isFirebaseReady]);


  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: ItemInventario) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSaveItem = async (item: ItemInventario) => {
    try {
      // Validar que el nombre sea único
      const nombreNormalizado = item.nombre.trim().toLowerCase();
      const nombreDuplicado = items.find(existingItem => {
        const existingNombreNormalizado = existingItem.nombre.trim().toLowerCase();
        // Si estamos editando, excluir el item actual de la validación
        if (editingItem && existingItem.id === editingItem.id) {
          return false;
        }
        return existingNombreNormalizado === nombreNormalizado;
      });

      if (nombreDuplicado) {
        throw new Error(`El nombre "${item.nombre}" ya existe en la base de datos. Por favor, usa un nombre diferente.`);
      }

      if (editingItem) {
        // Actualizar item existente
        await updateItem(item.id, item);
      } else {
        // Agregar nuevo item
        const { id, ...itemData } = item;
        await addItem(itemData);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error desconocido al guardar el item';
      alert(`Error al guardar el item: ${errorMessage}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este item?')) {
      try {
        await deleteItem(id);
      } catch (error) {
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
      alert('Error al guardar las categorías. Por favor, intenta nuevamente.');
    }
  };

  const handleSedesChange = async (nuevasSedes: string[]) => {
    try {
      setSedes(nuevasSedes);
      await saveSedes(nuevasSedes);
    } catch (error) {
      alert('Error al guardar las sedes. Por favor, intenta nuevamente.');
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
    if (filterSede !== 'Todas' && item.sede !== filterSede) {
      return false;
    }
    // Filtro por tipo de uso
    if (filterTipoUso !== 'Todos' && item.tipoUso !== filterTipoUso) {
      return false;
    }
    return true;
  });

  // Ordenar items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    switch (sortBy) {
      case 'nombre':
        aValue = a.nombre.toLowerCase();
        bValue = b.nombre.toLowerCase();
        break;
      case 'categoria':
        aValue = a.categoria.toLowerCase();
        bValue = b.categoria.toLowerCase();
        break;
      case 'estado':
        aValue = a.estado;
        bValue = b.estado;
        break;
      case 'ubicacion':
        aValue = a.ubicacion.toLowerCase();
        bValue = b.ubicacion.toLowerCase();
        break;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Items filtrados también por búsqueda (para mostrar en la lista)
  const filteredAndSearchedItems = sortedItems.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredAndSearchedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSearchedItems.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterCategoria, filterSede, filterTipoUso]);

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

  // Mostrar login si no está autenticado
  if (checkingAuth) {
    return null;
  }

  if (!user) {
    return <Login />;
  }

  if (loading) {
    return <Loader />;
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
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                Cerrar Sesión
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
                  isAdmin={isAdmin}
                />
                <SedeManager
                  sedes={sedes}
                  onSedesChange={handleSedesChange}
                  isAdmin={isAdmin}
                />
                <UserManager
                  isAdmin={isAdmin}
                  currentUserEmail={user?.email || ''}
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
                isAdmin={isAdmin}
              />
              <SedeManager
                sedes={sedes}
                onSedesChange={handleSedesChange}
                isAdmin={isAdmin}
              />
              <UserManager
                isAdmin={isAdmin}
                currentUserEmail={user?.email || ''}
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
                  
                  <select
                    value={filterTipoUso}
                    onChange={(e) => setFilterTipoUso(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="Todos">Todos los tipos</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Alumnos">Alumnos</option>
                  </select>
                  
                  {(filterEstado !== 'Todos' || filterCategoria !== 'Todas' || filterSede !== 'Todas' || filterTipoUso !== 'Todos') && (
                    <button
                      onClick={() => {
                        setFilterEstado('Todos');
                        setFilterCategoria('Todas');
                        setFilterSede('Todas');
                        setFilterTipoUso('Todos');
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
          {/* Controles de ordenamiento y paginación */}
          {filteredAndSearchedItems.length > 0 && (
            <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Ordenamiento */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'nombre' | 'categoria' | 'estado' | 'ubicacion')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="nombre">Nombre</option>
                    <option value="categoria">Categoría</option>
                    <option value="estado">Estado</option>
                    <option value="ubicacion">Ubicación</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* Información de paginación */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, filteredAndSearchedItems.length)}</span> de <span className="font-medium">{filteredAndSearchedItems.length}</span> items
                  </div>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="6">6 por página</option>
                    <option value="12">12 por página</option>
                    <option value="24">24 por página</option>
                    <option value="48">48 por página</option>
                  </select>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}

          <ItemList
            items={paginatedItems}
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
            sedes={sedes}
            items={items}
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
              {/* Contenido de las pestañas */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                <div className="space-y-4 mb-6">
                  {sedes.map(sede => {
                    const itemsSede = items.filter(item => item.sede === sede);

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

              {/* Pestañas */}
              <div className="flex gap-1 mt-6 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'general'
                      ? 'text-gray-900 border-t-2 border-green-600 -mt-4 pt-2'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Generales
                </button>
                <button
                  onClick={() => setActiveTab('sedes')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'sedes'
                      ? 'text-gray-900 border-t-2 border-green-600 -mt-4 pt-2'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Por Sede
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default App;
