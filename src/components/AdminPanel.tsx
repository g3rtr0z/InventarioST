import { useState, useEffect, useRef } from 'react';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import type { ItemInventario } from '../types/inventario';
import { getAllUsers, changeUserRole, toggleUserStatus, type UserInfo, type UserRole } from '../services/userRoleService';
import { 
  FaBox, 
  FaChartBar, 
  FaUsers, 
  FaFolder, 
  FaBuilding, 
  FaFileAlt,
  FaBars,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaFileExport,
  FaPlus,
  FaSearch,
  FaUserShield
} from 'react-icons/fa';

interface AdminPanelProps {
  isAdmin: boolean;
  currentUserEmail: string;
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
  onCategoriasChange: (categorias: string[]) => void;
  onSedesChange: (sedes: string[]) => void;
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

export default function AdminPanel({
  isAdmin,
  currentUserEmail,
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
  onCategoriasChange,
  onSedesChange,
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
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<'inventario' | 'dashboard' | 'usuarios' | 'categorias' | 'sedes' | 'reportes'>('inventario');

  if (!isAdmin) {
    return null;
  }

  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Iniciar contraído
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    gestion: false,
    configuracion: false
  });
  const sidebarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Estados para gestión de usuarios
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [searchTermUsers, setSearchTermUsers] = useState('');
  
  // Estados para gestión de categorías
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  
  // Estados para gestión de sedes
  const [nuevaSede, setNuevaSede] = useState('');

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const handleSidebarMouseEnter = () => {
    // Cancelar cualquier timeout pendiente
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
      sidebarTimeoutRef.current = null;
    }
    // Expandir el sidebar
    setSidebarOpen(true);
  };

  const handleSidebarMouseLeave = () => {
    // Esperar un poco antes de contraer (500ms para más suavidad)
    sidebarTimeoutRef.current = setTimeout(() => {
      setSidebarOpen(false);
      sidebarTimeoutRef.current = null;
    }, 100);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, []);

  // Cargar usuarios cuando se accede a la sección
  useEffect(() => {
    if (activeSection === 'usuarios' && isAdmin) {
      loadUsers();
    }
  }, [activeSection, isAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (err) {
      setErrorUsers('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userEmail: string, newRole: UserRole) => {
    if (!window.confirm(`¿Estás seguro de cambiar el rol de ${userEmail} a ${newRole}?`)) {
      return;
    }

    setErrorUsers(null);
    try {
      await changeUserRole(userEmail, newRole);
      await loadUsers();
    } catch (err) {
      setErrorUsers('Error al cambiar el rol del usuario');
      console.error(err);
    }
  };

  const handleToggleStatus = async (userEmail: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${action} al usuario ${userEmail}?`)) {
      return;
    }

    setErrorUsers(null);
    try {
      await toggleUserStatus(userEmail, !currentStatus);
      await loadUsers();
    } catch (err) {
      setErrorUsers('Error al cambiar el estado del usuario');
      console.error(err);
    }
  };

  const handleAgregarCategoria = () => {
    if (nuevaCategoria.trim() && !categorias.includes(nuevaCategoria.trim())) {
      onCategoriasChange([...categorias, nuevaCategoria.trim()]);
      setNuevaCategoria('');
    }
  };

  const handleEliminarCategoria = (categoria: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${categoria}"?`)) {
      onCategoriasChange(categorias.filter(cat => cat !== categoria));
    }
  };

  const handleAgregarSede = () => {
    if (nuevaSede.trim() && !sedes.includes(nuevaSede.trim())) {
      onSedesChange([...sedes, nuevaSede.trim()]);
      setNuevaSede('');
    }
  };

  const handleEliminarSede = (sede: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la sede "${sede}"?`)) {
      onSedesChange(sedes.filter(s => s !== sede));
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTermUsers.toLowerCase()))
  );

  const getRoleBadgeColor = (role: UserRole) => {
    return role === 'administrador' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-900 px-6 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-green-700 p-2 rounded-md transition-colors"
              title="Toggle Sidebar"
            >
              <FaBars className="text-xl" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">Panel de Administración</h2>
              <p className="text-green-100 text-sm mt-1">Gestión completa del sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-700 border border-green-600 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
              title="Exportar a Excel"
            >
              <FaFileExport /> Exportar
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 border border-red-400 rounded-md hover:bg-red-400 transition-colors flex items-center gap-2"
              title="Cerrar sesión"
            >
              <FaSignOutAlt /> Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar de navegación */}
          <div 
            className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-200 ease-in-out overflow-hidden relative`}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
          >
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {/* Sección Principal */}
              <button
                onClick={() => setActiveSection('inventario')}
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
                {/* Tooltip cuando está contraído */}
                {!sidebarOpen && hoveredItem === 'inventario' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                    Inventario
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => setActiveSection('dashboard')}
                onMouseEnter={() => setHoveredItem('dashboard')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group ${
                  activeSection === 'dashboard'
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? 'Dashboard' : ''}
              >
                <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <FaChartBar className={`text-lg ${activeSection === 'dashboard' ? 'text-white' : 'text-gray-600'}`} />
                  {sidebarOpen && <span className="font-medium">Dashboard</span>}
                </div>
                {/* Tooltip cuando está contraído */}
                {!sidebarOpen && hoveredItem === 'dashboard' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                    Dashboard
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </button>

              {/* Dropdown: Gestión */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                      setOpenDropdowns({ ...openDropdowns, gestion: true });
                    } else {
                      toggleDropdown('gestion');
                    }
                  }}
                  onMouseEnter={() => setHoveredItem('gestion')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group bg-white text-gray-700 hover:bg-gray-100`}
                  title={!sidebarOpen ? 'Gestión' : ''}
                >
                  <div className={`flex items-center ${sidebarOpen ? 'gap-3 justify-between' : 'justify-center'}`}>
                    <div className={`flex items-center ${sidebarOpen ? 'gap-3' : ''}`}>
                      <FaUsers className="text-lg text-gray-600" />
                      {sidebarOpen && <span className="font-medium">Gestión</span>}
                    </div>
                    {sidebarOpen && (
                      openDropdowns.gestion ? (
                        <FaChevronDown className="text-gray-500 text-xs" />
                      ) : (
                        <FaChevronRight className="text-gray-500 text-xs" />
                      )
                    )}
                  </div>
                  {/* Tooltip cuando está contraído */}
                  {!sidebarOpen && hoveredItem === 'gestion' && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                      Gestión
                      <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </button>
                
                {openDropdowns.gestion && sidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    <button
                      onClick={() => setActiveSection('usuarios')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'usuarios'
                          ? 'bg-green-700 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaUsers className={`text-sm ${activeSection === 'usuarios' ? 'text-white' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">Usuarios</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setActiveSection('categorias')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'categorias'
                          ? 'bg-green-700 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaFolder className={`text-sm ${activeSection === 'categorias' ? 'text-white' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">Categorías</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setActiveSection('sedes')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'sedes'
                          ? 'bg-green-700 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaBuilding className={`text-sm ${activeSection === 'sedes' ? 'text-white' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">Sedes</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown: Reportes */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                      setOpenDropdowns({ ...openDropdowns, configuracion: true });
                    } else {
                      toggleDropdown('configuracion');
                    }
                  }}
                  onMouseEnter={() => setHoveredItem('reportes')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group bg-white text-gray-700 hover:bg-gray-100`}
                  title={!sidebarOpen ? 'Reportes' : ''}
                >
                  <div className={`flex items-center ${sidebarOpen ? 'gap-3 justify-between' : 'justify-center'}`}>
                    <div className={`flex items-center ${sidebarOpen ? 'gap-3' : ''}`}>
                      <FaFileAlt className="text-lg text-gray-600" />
                      {sidebarOpen && <span className="font-medium">Reportes</span>}
                    </div>
                    {sidebarOpen && (
                      openDropdowns.configuracion ? (
                        <FaChevronDown className="text-gray-500 text-xs" />
                      ) : (
                        <FaChevronRight className="text-gray-500 text-xs" />
                      )
                    )}
                  </div>
                  {/* Tooltip cuando está contraído */}
                  {!sidebarOpen && hoveredItem === 'reportes' && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                      Reportes
                      <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </button>
                
                {openDropdowns.configuracion && sidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    <button
                      onClick={() => setActiveSection('reportes')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'reportes'
                          ? 'bg-green-700 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaFileAlt className={`text-sm ${activeSection === 'reportes' ? 'text-white' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">Reportes</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Footer del sidebar */}
            <div className={`p-2 border-t border-gray-200 ${!sidebarOpen && 'px-2'}`}>
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                {sidebarOpen ? (
                  <>
                    <div className="text-xs text-gray-500 mb-1">Usuario actual</div>
                    <div className="text-sm font-semibold text-gray-900 truncate">{currentUserEmail}</div>
                    <div className="text-xs text-green-700 font-medium mt-1 flex items-center gap-1">
                      <FaUserShield /> Administrador
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center">
                    <FaUserShield className="text-green-700 text-lg" title={currentUserEmail} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {activeSection === 'inventario' && (
              <div className="space-y-6">
                {/* Barra de búsqueda y controles */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, marca, modelo, serie, ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onAddItem}
                        className="px-4 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                        title="Agregar Item"
                      >
                        <FaPlus /> Agregar Item
                      </button>
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

                  {/* Filtros */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 flex justify-between items-center"
                    >
                      <span>Filtros de búsqueda</span>
                      <span className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {showFilters && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <select
                          value={filterSede}
                          onChange={(e) => setFilterSede(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                        >
                          <option value="Todas">Todas las sedes</option>
                          {sedes.map(sede => (
                            <option key={sede} value={sede}>{sede}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterEstado}
                          onChange={(e) => setFilterEstado(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
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
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                        >
                          <option value="Todas">Todas las categorías</option>
                          {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterTipoUso}
                          onChange={(e) => setFilterTipoUso(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
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

                {/* Lista de items */}
                <ItemList
                  items={filteredAndSearchedItems}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  searchTerm={searchTerm}
                  viewMode={viewMode}
                />
              </div>
            )}

            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen General</h3>
                  
                  {/* Tarjetas de estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{estadisticas.total}</div>
                      <div className="text-sm text-gray-600 font-medium">Total Items</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-3xl font-bold text-green-700 mb-1">{estadisticas.disponible}</div>
                      <div className="text-sm text-gray-600 font-medium">Disponibles</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-3xl font-bold text-blue-700 mb-1">{estadisticas.enUso}</div>
                      <div className="text-sm text-gray-600 font-medium">En Uso</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="text-3xl font-bold text-yellow-700 mb-1">{estadisticas.mantenimiento}</div>
                      <div className="text-sm text-gray-600 font-medium">Mantenimiento</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="text-3xl font-bold text-red-700 mb-1">{estadisticas.baja}</div>
                      <div className="text-sm text-gray-600 font-medium">Baja</div>
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
              </div>
            )}

            {activeSection === 'usuarios' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h3>
                
                {errorUsers && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {errorUsers}
                  </div>
                )}

                {/* Búsqueda */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por email o nombre..."
                    value={searchTermUsers}
                    onChange={(e) => setSearchTermUsers(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>

                {/* Botón recargar */}
                <div className="mb-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Total de usuarios: <span className="font-semibold">{filteredUsers.length}</span>
                  </div>
                  <button
                    onClick={loadUsers}
                    disabled={loadingUsers}
                    className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-md transition-colors text-sm disabled:opacity-50"
                  >
                    {loadingUsers ? 'Cargando...' : '🔄 Recargar'}
                  </button>
                </div>

                {/* Lista de usuarios */}
                {loadingUsers && users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Cargando usuarios...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.email}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {user.displayName || 'Sin nombre'}
                                  {user.email === currentUserEmail && (
                                    <span className="ml-2 text-xs text-blue-600 font-normal">(Tú)</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs font-semibold px-2 py-1 rounded border ${getRoleBadgeColor(user.role)}`}>
                                {user.role === 'administrador' ? '👑 Administrador' : '👤 Usuario'}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusBadgeColor(user.isActive)}`}>
                                {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                              </span>
                              {user.lastLogin && (
                                <span className="text-xs text-gray-500">
                                  Último acceso: {new Date(user.lastLogin).toLocaleDateString('es-MX')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {/* Cambiar rol */}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole)}
                              disabled={user.email === currentUserEmail}
                              className={`px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 ${
                                user.email === currentUserEmail ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'
                              }`}
                              title={user.email === currentUserEmail ? 'No puedes cambiar tu propio rol' : ''}
                            >
                              <option value="usuario">Usuario</option>
                              <option value="administrador">Administrador</option>
                            </select>

                            {/* Activar/Desactivar */}
                            <button
                              onClick={() => handleToggleStatus(user.email, user.isActive)}
                              disabled={user.email === currentUserEmail}
                              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                user.isActive
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              } ${
                                user.email === currentUserEmail ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={user.email === currentUserEmail ? 'No puedes desactivarte a ti mismo' : ''}
                            >
                              {user.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'categorias' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión de Categorías</h3>
                
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  {/* Agregar nueva categoría */}
                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Agregar Nueva Categoría
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevaCategoria}
                        onChange={(e) => setNuevaCategoria(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarCategoria();
                          }
                        }}
                        placeholder="Nombre de la categoría"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      />
                      <button
                        onClick={handleAgregarCategoria}
                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors font-medium"
                        disabled={!nuevaCategoria.trim()}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de categorías */}
                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-700">
                      Categorías ({categorias.length})
                    </label>
                    {categorias.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        No hay categorías
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {categorias.map((categoria, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-gray-900 font-medium">{categoria}</span>
                            <button
                              onClick={() => handleEliminarCategoria(categoria)}
                              className="text-red-500 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              ✕ Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sedes' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión de Sedes</h3>
                
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  {/* Agregar nueva sede */}
                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Agregar Nueva Sede
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevaSede}
                        onChange={(e) => setNuevaSede(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarSede();
                          }
                        }}
                        placeholder="Nombre de la sede"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      />
                      <button
                        onClick={handleAgregarSede}
                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors font-medium"
                        disabled={!nuevaSede.trim()}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de sedes */}
                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-700">
                      Sedes ({sedes.length})
                    </label>
                    {sedes.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        No hay sedes
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sedes.map((sede, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-gray-900 font-medium">{sede}</span>
                            <button
                              onClick={() => handleEliminarSede(sede)}
                              className="text-red-500 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              ✕ Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'reportes' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reportes y Análisis</h3>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">Funcionalidades de reportes avanzados próximamente:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-lg font-semibold text-gray-900 mb-2">📊 Reportes por Período</div>
                      <div className="text-sm text-gray-600">Items agregados/modificados en un rango de fechas</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-lg font-semibold text-gray-900 mb-2">🔧 Mantenimientos</div>
                      <div className="text-sm text-gray-600">Items que requieren mantenimiento próximamente</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-lg font-semibold text-gray-900 mb-2">📅 Garantías</div>
                      <div className="text-sm text-gray-600">Items con garantías próximas a vencer</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-lg font-semibold text-gray-900 mb-2">👤 Por Responsable</div>
                      <div className="text-sm text-gray-600">Distribución de items por responsable</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          />
        )}
      </div>
    </div>
  );
}

