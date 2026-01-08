import { useState, useEffect, useRef } from 'react';
import { INSTITUTIONAL_COLORS } from '../constants/colors';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import Pagination from './Pagination';
import type { ItemInventario } from '../types/inventario';
import { 
  FaBox, 
  FaChartBar,
  FaBars,
  FaSignOutAlt,
  FaFileExport,
  FaPlus,
  FaSearch,
  FaUser,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

interface UserPanelProps {
  currentUserEmail: string;
  currentUserName?: string;
  categorias: string[];
  sedes: string[];
  items: ItemInventario[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
  filterEstado: string;
  setFilterEstado: (estado: string) => void;
  filterCategoria: string;
  setFilterCategoria: (categoria: string) => void;
  filterSede: string;
  setFilterSede: (sede: string) => void;
  filterTipoUso: string;
  setFilterTipoUso: (tipo: string) => void;
  onAddItem: () => void;
  onEditItem: (item: ItemInventario) => void;
  onDeleteItem: (id: string) => void;
  onSaveItem: (item: ItemInventario) => void;
  onCancelForm: () => void;
  showForm: boolean;
  editingItem: ItemInventario | null;
  filteredAndSearchedItems: ItemInventario[];
  onExportExcel: () => void;
  onLogout: () => void;
}

export default function UserPanel({
  currentUserEmail,
  currentUserName,
  categorias,
  sedes,
  items,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  filterEstado,
  setFilterEstado,
  filterCategoria,
  setFilterCategoria,
  filterSede,
  setFilterSede,
  filterTipoUso,
  setFilterTipoUso,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onSaveItem,
  onCancelForm,
  showForm,
  editingItem,
  filteredAndSearchedItems,
  onExportExcel,
  onLogout
}: UserPanelProps) {
  const [activeSection, setActiveSection] = useState<'inventario' | 'estadisticas'>('inventario');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'nombre' | 'categoria' | 'estado' | 'ubicacion'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const sidebarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ordenar items
  const sortedItems = [...filteredAndSearchedItems].sort((a, b) => {
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

  // Paginación
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterCategoria, filterSede, filterTipoUso]);

  // Manejar hover del sidebar
  const handleSidebarMouseEnter = () => {
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
    }
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && !sidebarOpen) {
      setSidebarOpen(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && sidebarOpen) {
      sidebarTimeoutRef.current = setTimeout(() => {
        setSidebarOpen(false);
      }, 100);
    }
  };

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const estadisticas = {
    total: items.length,
    disponible: items.filter(i => i.estado === 'Disponible').length,
    enUso: items.filter(i => i.estado === 'En Uso').length,
    mantenimiento: items.filter(i => i.estado === 'Mantenimiento').length,
    baja: items.filter(i => i.estado === 'Baja').length,
    porCategoria: categorias.reduce((acc, cat) => {
      acc[cat] = items.filter(i => i.categoria === cat).length;
      return acc;
    }, {} as Record<string, number>),
    porSede: sedes.reduce((acc, sede) => {
      acc[sede] = items.filter(i => i.sede === sede).length;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <div className="flex flex-col h-screen w-full">
        {/* Header */}
        <div className={`bg-gradient-to-r ${INSTITUTIONAL_COLORS.gradientFrom} ${INSTITUTIONAL_COLORS.gradientTo} px-3 sm:px-6 flex justify-between items-center shadow-md w-full`}>
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-white hover:bg-green-700 p-2 rounded-md transition-colors flex-shrink-0"
              title="Toggle Sidebar"
            >
              <FaBars className="text-lg sm:text-xl" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img 
                src="/assets/logopag-lL0w0gLE.png" 
                alt="Logo Institucional" 
                className="w-16 h-16 sm:w-24 sm:h-24 object-contain flex-shrink-0 brightness-0 invert"
              />
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white truncate">Inventario</h2>
                <p className="text-green-100 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Departamento de Informática</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={onExportExcel}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-green-700 border border-green-600 rounded-md hover:bg-green-600 transition-colors flex items-center gap-1 sm:gap-2"
            >
              <FaFileExport className="text-sm sm:text-base" /> 
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={onLogout}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-500 border border-red-400 rounded-md hover:bg-red-400 transition-colors flex items-center gap-1 sm:gap-2"
            >
              <FaSignOutAlt className="text-sm sm:text-base" /> 
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative w-full">
          {/* Overlay para móvil */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar de navegación */}
          <div 
            className={`${
              sidebarOpen 
                ? 'w-64 md:relative z-50 md:z-auto' 
                : 'md:w-16'
            } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-200 ease-in-out overflow-hidden h-full`}
            style={typeof window !== 'undefined' && window.innerWidth < 768 ? {
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              height: '100vh',
              width: '256px',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 200ms ease-in-out'
            } : {}}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
          >
            <nav className="flex-1 p-2 space-y-1 overflow-hidden">
              {/* Inventario */}
              <button
                onClick={() => {
                  setActiveSection('inventario');
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setTimeout(() => setSidebarOpen(false), 100);
                  }
                }}
                onMouseEnter={() => setHoveredItem('inventario')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group ${
                  activeSection === 'inventario'
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? 'Inventario' : ''}
              >
                <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <FaBox className={`text-lg ${activeSection === 'inventario' ? 'text-white' : 'text-gray-600'}`} />
                  {sidebarOpen && <span className="font-medium">Inventario</span>}
                </div>
                {!sidebarOpen && hoveredItem === 'inventario' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                    Inventario
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </button>
              
              {/* Estadísticas */}
              <button
                onClick={() => {
                  setActiveSection('estadisticas');
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setTimeout(() => setSidebarOpen(false), 100);
                  }
                }}
                onMouseEnter={() => setHoveredItem('estadisticas')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group ${
                  activeSection === 'estadisticas'
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? 'Estadísticas' : ''}
              >
                <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <FaChartBar className={`text-lg ${activeSection === 'estadisticas' ? 'text-white' : 'text-gray-600'}`} />
                  {sidebarOpen && <span className="font-medium">Estadísticas</span>}
                </div>
                {!sidebarOpen && hoveredItem === 'estadisticas' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                    Estadísticas
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </button>
            </nav>

            {/* Footer del sidebar */}
            <div className="p-2 border-t border-gray-200">
              <div className={`${sidebarOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center'} flex items-center gap-2 rounded-lg bg-white`}>
                <FaUser className="text-gray-600" />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{currentUserEmail || 'Usuario'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50 w-full">
            <div className="max-w-[1200px] mx-auto">
            {activeSection === 'inventario' && (
              <div className="space-y-6">
                {/* Barra de búsqueda y controles */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 mb-4">
                    {/* Barra de búsqueda */}
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, marca, modelo, serie, ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent`}
                      />
                    </div>
                    {/* Botones: Agregar Item a la izquierda, Tarjetas/Tabla a la derecha */}
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={onAddItem}
                        className={`px-3 py-2.5 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-md transition-colors text-sm flex items-center gap-2`}
                      >
                        <FaPlus />
                        Agregar Item
                      </button>
                      <div className="flex gap-0.5 bg-gray-100 rounded-md overflow-hidden border border-gray-300">
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`px-3 py-2.5 text-sm font-medium transition-colors border-r border-gray-300 ${
                            viewMode === 'cards' 
                              ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-sm` 
                              : 'bg-white text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Tarjetas
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                            viewMode === 'table' 
                              ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-sm` 
                              : 'bg-white text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Tabla
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filtros */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 flex justify-between items-center py-2"
                    >
                      <span>Filtros de búsqueda</span>
                      <span className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {showFilters && (
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                        <select
                          value={filterSede}
                          onChange={(e) => setFilterSede(e.target.value)}
                          className={`px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
                        >
                          <option value="Todas">Todas las sedes</option>
                          {sedes.map(sede => (
                            <option key={sede} value={sede}>{sede}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterEstado}
                          onChange={(e) => setFilterEstado(e.target.value)}
                          className={`px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
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
                          className={`px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
                        >
                          <option value="Todas">Todas las categorías</option>
                          {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterTipoUso}
                          onChange={(e) => setFilterTipoUso(e.target.value)}
                          className={`px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
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
                    )}
                  </div>
                </div>

                {/* Controles de ordenamiento */}
                {sortedItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Ordenamiento */}
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'nombre' | 'categoria' | 'estado' | 'ubicacion')}
                            className={`px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
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
                            {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
                          </button>
                        </div>

                        {/* Información de paginación */}
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Mostrando <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, sortedItems.length)}</span> de <span className="font-medium">{sortedItems.length}</span> items
                          </div>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className={`px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
                          >
                            <option value="6">6 por página</option>
                            <option value="12">12 por página</option>
                            <option value="24">24 por página</option>
                            <option value="48">48 por página</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Paginación arriba */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}

                {/* Lista de items */}
                <ItemList
                  items={paginatedItems}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  searchTerm=""
                  viewMode={viewMode}
                />

                {/* Paginación al final */}
                {sortedItems.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            )}

            {activeSection === 'estadisticas' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Estadísticas</h3>
                
                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{estadisticas.total}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Items</div>
                  </div>
                  <div className={`bg-green-50 rounded-lg p-3 sm:p-4 border ${INSTITUTIONAL_COLORS.borderPrimary}`}>
                    <div className={`text-2xl sm:text-3xl font-bold ${INSTITUTIONAL_COLORS.textPrimary} mb-1`}>{estadisticas.disponible}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Disponibles</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">{estadisticas.enUso}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">En Uso</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-700 mb-1">{estadisticas.mantenimiento}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Mantenimiento</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                    <div className="text-2xl sm:text-3xl font-bold text-red-700 mb-1">{estadisticas.baja}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Baja</div>
                  </div>
                </div>

                {/* Distribución por categoría */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categoría</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(estadisticas.porCategoria).map(([categoria, count]) => (
                      <div key={categoria} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-lg font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600 truncate">{categoria}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distribución por sede */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Sede</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(estadisticas.porSede).map(([sede, count]) => (
                      <div key={sede} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-lg font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600 truncate">{sede}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <ItemForm
          item={editingItem}
          categorias={categorias}
          sedes={sedes}
          items={items}
          onSave={onSaveItem}
          onCancel={onCancelForm}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          isAdmin={false}
        />
      )}
    </div>
  );
}

