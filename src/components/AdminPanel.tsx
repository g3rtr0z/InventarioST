import { useState, useEffect, useRef } from 'react';
import { INSTITUTIONAL_COLORS } from '../constants/colors';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import type { ItemInventario } from '../types/inventario';
import { getAllUsers, changeUserRole, toggleUserStatus, createUser, deleteUserAccount, type UserInfo, type UserRole } from '../services/userRoleService';
import {
  getConfig,
  updateEstados,
  updateFormulario,
  updateSeccionesFormulario,
  updateConfigGeneral,
  updateCategorias,
  updateSedes,
  subscribeToConfig,
  type ConfiguracionSistema,
  type EstadoPersonalizado,
  type CampoFormulario,
  type SeccionFormulario
} from '../services/configService';
import {
  FaBox,
  FaChartBar,
  FaUsers,
  FaSignOutAlt,
  FaFileExport,
  FaPlus,
  FaSearch,
  FaUserShield,
  FaCog,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaCrown,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaThLarge,
  FaList,
  FaExclamationTriangle,
  FaChartPie,
  FaTag,
  FaBuilding,
  FaProjectDiagram,
  FaDesktop,
  FaBell,
  FaShieldAlt,
  FaDatabase,
  FaCloudDownloadAlt
} from 'react-icons/fa';
import { getUniqueEncargados } from '../utils/userUtils';
import { useDarkMode } from '../hooks/useDarkMode';

interface AdminPanelProps {
  isAdmin: boolean;
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
  filterMarca: string;
  setFilterMarca: (marca: string) => void;
  filterPiso: string;
  setFilterPiso: (piso: string) => void;
  filterEdificio: string;
  setFilterEdificio: (edificio: string) => void;
  filterProcesador: string;
  setFilterProcesador: (procesador: string) => void;
  filterRam: string;
  setFilterRam: (ram: string) => void;
  filterDiscoDuro: string;
  setFilterDiscoDuro: (disco: string) => void;
  filterEncargado: string;
  setFilterEncargado: (encargado: string) => void;
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
  onImportExcel: (file: File) => void;
  onLogout: () => void;
  error?: string | null;
}

export default function AdminPanel({
  isAdmin,
  currentUserEmail,
  currentUserName = '',
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
  filterMarca,
  setFilterMarca,
  filterPiso,
  setFilterPiso,
  filterEdificio,
  setFilterEdificio,
  filterProcesador,
  setFilterProcesador,
  filterRam,
  setFilterRam,
  filterDiscoDuro,
  setFilterDiscoDuro,
  filterEncargado,
  setFilterEncargado,
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
  onLogout,
  error
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<'inventario' | 'dashboard' | 'usuarios' | 'reportes' | 'configuracion'>('inventario');
  const { isDarkMode, toggleDarkMode } = useDarkMode();




  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Iniciar contraído


  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);


  // Estados para gestión de usuarios
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [searchTermUsers, setSearchTermUsers] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'usuario' as UserRole
  });
  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(false);

  // Estados para gestión de categorías
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Estados para gestión de sedes
  const [nuevaSede, setNuevaSede] = useState('');

  // Estados para configuración del sistema
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState({ nombre: '', color: 'bg-gray-100 text-gray-800', requerido: false });

  // Estados para gestión de secciones del formulario
  const [mostrarModalCampoFormulario, setMostrarModalCampoFormulario] = useState(false);

  // Estados para configuración general editables
  const [nombreInstitucionEdit, setNombreInstitucionEdit] = useState('');

  const sidebarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  // Detectar cambios de tamaño de ventana para responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Al pasar a desktop, cerrar sidebar si estaba abierto en modo móvil
      if (!mobile) {
        setSidebarOpen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  // Resetear página cuando cambian los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterEstado, filterCategoria, filterSede, filterTipoUso, searchTerm]);

  // Ordenar items alfabéticamente por nombre (fijo)
  const sortedItems = [...filteredAndSearchedItems].sort((a, b) =>
    a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Cargar usuarios cuando se accede a la sección o al montar si es admin
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Recargar usuarios cuando se accede a la sección de usuarios
  useEffect(() => {
    if (activeSection === 'usuarios' && isAdmin) {
      loadUsers();
    }
  }, [activeSection, isAdmin]);

  // Cargar configuración cuando se accede a la sección
  useEffect(() => {
    if (activeSection === 'configuracion' && isAdmin) {
      loadConfig();
    }
  }, [activeSection, isAdmin]);

  // Suscribirse a cambios en la configuración
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToConfig((config) => {
      setConfiguracion(config);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const loadConfig = async () => {
    try {
      const config = await getConfig();
      setConfiguracion(config);
      if (config.general) {
        setNombreInstitucionEdit(config.general.nombreInstitucion || 'Universidad Santo Tomás');
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    }
  };

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

  const handleAgregarUsuario = async () => {
    if (!nuevoUsuario.email.trim() || !nuevoUsuario.password.trim()) {
      setErrorUsers('El email y la contraseña son obligatorios');
      return;
    }

    if (nuevoUsuario.password.length < 6) {
      setErrorUsers('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoUsuario.email.trim())) {
      setErrorUsers('El email no es válido');
      return;
    }

    setErrorUsers(null);
    setLoadingUsers(true);

    try {
      await createUser(
        nuevoUsuario.email.trim(),
        nuevoUsuario.password,
        nuevoUsuario.displayName.trim(),
        nuevoUsuario.role
      );

      // Limpiar formulario
      setNuevoUsuario({
        email: '',
        password: '',
        displayName: '',
        role: 'usuario'
      });
      setMostrarFormularioUsuario(false);

      // Mostrar mensaje de confirmación
      // Nota: createUser ya cerró la sesión del usuario recién creado,
      // por lo que el administrador será redirigido al login
      alert('Usuario creado correctamente');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al crear el usuario';
      setErrorUsers(errorMessage);
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEliminarUsuario = async (userEmail: string) => {
    if (userEmail === currentUserEmail) {
      setErrorUsers('No puedes eliminar tu propia cuenta');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar permanentemente al usuario ${userEmail}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setErrorUsers(null);
    try {
      await deleteUserAccount(userEmail);
      await loadUsers();
      alert('Usuario eliminado exitosamente');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al eliminar el usuario';
      setErrorUsers(errorMessage);
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTermUsers.toLowerCase()))
  );

  const getRoleBadgeColor = (role: UserRole) => {
    return role === 'administrador'
      ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white border-green-900`
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white border-green-900`
      : 'bg-red-100 text-red-700 border-red-200';
  };

  const estadisticas = {
    total: items.length,
    disponible: items.filter(i => i.estado === 'Disponible').length,
    enUso: items.filter(i => i.estado === 'En Uso').length,
    mantenimiento: items.filter(i => i.estado === 'Mantenimiento').length,
    baja: items.filter(i => i.estado === 'Baja').length,
    marcasUnicas: new Set(items.map(i => i.marca).filter(Boolean)).size,
    modelosUnicos: new Set(items.map(i => i.modelo).filter(Boolean)).size,
    sedesConActivos: new Set(items.map(i => i.sede).filter(Boolean)).size,
    porCategoria: items.reduce((acc, i) => {
      acc[i.categoria] = (acc[i.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    porSede: items.reduce((acc, i) => {
      acc[i.sede] = (acc[i.sede] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: FaChartBar, adminOnly: false },
    { id: 'inventario', label: 'Activos', icon: FaBox, adminOnly: false },
    { id: 'usuarios', label: 'Usuarios', icon: FaUsers, adminOnly: true },
    // 'reportes' eliminado de mobile por petición del usuario
    // 'configuracion' excluida de mobile nav — solo disponible en sidebar desktop
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-900 font-sans overflow-hidden">

      {/* ── SIDEBAR DESKTOP (oculto en móvil) ── */}
      <aside
        onMouseEnter={() => {
          if (!isMobile) {
            if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
            setSidebarOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            sidebarTimeoutRef.current = setTimeout(() => {
              setSidebarOpen(false);
            }, 300);
          }
        }}
        className={`hidden md:flex fixed inset-y-0 left-0 z-50 transition-all duration-500 ease-in-out transform bg-white border-r border-slate-200 flex-col overflow-x-hidden ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center">
          <div className="w-20 flex-shrink-0 flex justify-center items-center">
            <div className={`w-10 h-10 ${INSTITUTIONAL_COLORS.bgPrimary} rounded-xl flex items-center justify-center shadow-lg shadow-green-100`}>
              <FaBox className="text-white text-lg" />
            </div>
          </div>
          <div className={`flex flex-col whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${sidebarOpen ? 'max-w-[160px] opacity-100 ml-0' : 'max-w-0 opacity-0 ml-0'
            }`}>
            <span className="font-bold text-slate-800 text-base leading-tight tracking-tight">Inventario</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{configuracion?.general?.nombreInstitucion || 'Sistema ST'}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Panel de Control', icon: FaChartBar, adminOnly: false },
            { id: 'inventario', label: 'Catálogo de Activos', icon: FaBox, adminOnly: false },
            { id: 'usuarios', label: 'Asignaciones', icon: FaUsers, adminOnly: true },
            { id: 'configuracion', label: 'Configuración', icon: FaCog, adminOnly: true },
          ].filter(item => !item.adminOnly || isAdmin).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center transition-all duration-500 group py-3 ${activeSection === item.id
                ? 'bg-green-800 text-white font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <div className="w-20 flex-shrink-0 flex justify-center items-center">
                <item.icon className={`text-xl transition-colors duration-500 ${activeSection === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              </div>
              <span className={`text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${sidebarOpen ? 'max-w-[160px] opacity-100 ml-0' : 'max-w-0 opacity-0 ml-0'
                }`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* User Profile at Bottom */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center transition-all duration-500 py-3">
            <div className="w-20 flex-shrink-0 flex justify-center items-center">
              <div className={`w-10 h-10 rounded-xl ${INSTITUTIONAL_COLORS.bgPrimary} flex items-center justify-center text-white font-bold shadow-sm select-none`}>
                {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${sidebarOpen ? 'max-w-[140px] opacity-100' : 'max-w-0 opacity-0'
              }`}>
              <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{currentUserName || 'Usuario Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate font-medium">Departamento de IT</p>
            </div>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${sidebarOpen ? 'max-w-[40px] opacity-100 pr-2' : 'max-w-0 opacity-0'}`}>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 max-w-full overflow-hidden transition-all duration-300 ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-20'
        }`}>

        {/* ── TOP HEADER MÓVIL ── */}
        {isMobile && (
          <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-10">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 ${INSTITUTIONAL_COLORS.bgPrimary} rounded-lg flex items-center justify-center shadow-sm`}>
                <FaBox className="text-white text-xs" />
              </div>
              <span className="font-black text-slate-800 text-sm tracking-tight">Inventario ST</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1">
                <div className={`w-5 h-5 rounded-lg ${INSTITUTIONAL_COLORS.bgPrimary} flex items-center justify-center text-white text-[9px] font-black`}>
                  {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="text-[10px] font-bold text-slate-600 max-w-[80px] truncate">{currentUserName || 'Admin'}</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setActiveSection('configuracion' as any)}
                  className={`p-1.5 rounded-lg transition-colors ${activeSection === 'configuracion' ? 'text-green-700 bg-green-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                  title="Configuración"
                >
                  <FaCog className="text-sm" />
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          </header>
        )}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto min-w-0 px-4 py-6 md:px-10 lg:px-12 pb-24 md:pb-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-slideIn">
              <FaExclamationTriangle className="text-red-500" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Header Area */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {activeSection === 'inventario' ? 'Inventario' :
                    activeSection === 'dashboard' ? 'Panel de Control' :
                      activeSection === 'usuarios' ? 'Gestión de Usuarios' :
                        activeSection === 'reportes' ? 'Reportes' :
                          'Configuración'}
                </h1>
                <p className="text-slate-400 text-xs font-medium hidden sm:block">
                  {activeSection === 'inventario' ? 'Monitorea y gestiona todos los activos de TI.' :
                    activeSection === 'dashboard' ? 'Resumen general del sistema.' :
                      activeSection === 'usuarios' ? 'Administra los usuarios y sus permisos.' :
                        activeSection === 'reportes' ? 'Exporta y analiza datos del inventario.' :
                          'Personaliza la configuración del sistema.'}
                </p>
              </div>

              {/* Botones solo en sección inventario */}
              {activeSection === 'inventario' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={onExportExcel}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <FaFileExport className="text-slate-400 text-xs" />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                  <button
                    onClick={onAddItem}
                    className={`flex items-center gap-1.5 px-3 py-2 ${INSTITUTIONAL_COLORS.bgPrimary} text-white font-bold text-xs rounded-xl shadow-sm hover:${INSTITUTIONAL_COLORS.bgPrimaryHover} transition-all active:scale-95`}
                  >
                    <FaPlus className="text-xs" />
                    <span>Nuevo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary Area */}
          {activeSection === 'dashboard' && (() => {
            const pctEnUso = estadisticas.total > 0 ? Math.round((estadisticas.enUso / estadisticas.total) * 100) : 0;
            const bajasYMant = estadisticas.baja + estadisticas.mantenimiento;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {/* Card 1 - Total */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {new Set(items.map(i => i.categoria).filter(Boolean)).size} cat.
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <FaBox className="text-base" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Total Activos</p>
                      <p className="text-xl font-black text-slate-900">{estadisticas.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Card 2 - Mantenimiento */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${estadisticas.mantenimiento > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {estadisticas.mantenimiento > 0 ? `${estadisticas.mantenimiento} act.` : 'OK'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                      <FaCog className="text-base" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Mantenimiento</p>
                      <p className="text-xl font-black text-slate-900">{estadisticas.mantenimiento}</p>
                    </div>
                  </div>
                </div>

                {/* Card 3 - En Uso */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {pctEnUso}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <FaUserShield className="text-base" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">En Uso</p>
                      <p className="text-xl font-black text-slate-900">{estadisticas.enUso.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Card 4 - Alertas */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${bajasYMant > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {bajasYMant > 0 ? 'Alertas' : 'OK'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                      <FaExclamationTriangle className="text-base" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Bajas + Mant.</p>
                      <p className="text-xl font-black text-slate-900">{bajasYMant}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Stats Summary Area - Ends here */}

          {/* Section Content */}
          <div className="mt-8">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            {activeSection === 'inventario' && (
              <div className="space-y-6">
                {/* Barra de búsqueda y controles - Diseño Institucional ST */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
                  {/* Row principal: búsqueda + botones */}
                  {/* Toolbar compacto de búsqueda y acciones */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap">
                    {/* Búsqueda */}
                    <div className="flex-1 relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <FaSearch className="text-gray-400 text-sm group-focus-within:text-green-700 transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nombre, serie, marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 text-sm bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-700 font-medium"
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 px-3 py-2 flex-wrap border-t sm:border-t-0 sm:border-l border-gray-100 shrink-0">
                      {/* Toggle vista */}
                      <div className="flex bg-gray-50 p-0.5 rounded-lg">
                        <button
                          onClick={() => setViewMode('cards')}
                          type="button"
                          className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-green-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          title="Vista Cuadrícula"
                        >
                          <FaThLarge className="text-[11px]" />
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          type="button"
                          className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-green-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          title="Vista Tabla"
                        >
                          <FaList className="text-[11px]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowFilterPanel(!showFilterPanel);
                            if (!showFilterPanel) {
                              // Scroll suave al panel de filtros al abrir en móvil
                              setTimeout(() => {
                                window.scrollTo({ top: 100, behavior: 'smooth' });
                              }, 100);
                            }
                          }}
                          type="button"
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${showFilterPanel || (filterEstado !== 'Todos' || filterCategoria !== 'Todas' || filterSede !== 'Todas' || filterMarca !== 'Todas' || filterPiso !== 'Todos' || filterEdificio !== 'Todos' || filterEncargado !== 'Todos') ? 'bg-green-800 text-white border border-green-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          <FaFilter className="text-sm" />
                          <span className="hidden sm:inline">FILTROS</span>
                          {(filterEstado !== 'Todos' || filterCategoria !== 'Todas' || filterSede !== 'Todas' || filterMarca !== 'Todas' || filterPiso !== 'Todos' || filterEdificio !== 'Todos' || filterEncargado !== 'Todos') && (
                            <span className="w-4 h-4 flex items-center justify-center bg-green-600 text-white text-[8px] rounded-full">
                              !
                            </span>
                          )}
                        </button>

                        <button
                          onClick={onAddItem}
                          type="button"
                          className={`flex items-center gap-2 px-3 py-1.5 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-lg shadow-sm transition-all text-[11px] font-bold`}
                        >
                          <FaPlus className="text-xs" />
                          <span className="hidden sm:inline uppercase">Nuevo</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Panel de filtros Minimalista */}
                  {showFilterPanel && (
                    <div className="px-4 py-5 bg-gray-50/50 border-t border-gray-100 animate-fadeIn">
                      {(() => {
                        const marcasUnicas = [...new Set(items.map(i => i.marca).filter(Boolean))].sort();
                        const pisosUnicos = [...new Set(items.map(i => i.piso).filter(Boolean))].sort();
                        const edificiosUnicos = [...new Set(items.map(i => i.edificio).filter(Boolean))].sort();
                        const encargadosUnicos = getUniqueEncargados(items);

                        const selectClass = (active: boolean) =>
                          `w-full pl-3 pr-7 py-2 text-sm font-semibold rounded-lg border transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} ${active ? `bg-green-50 text-green-800 border-green-200 ring-1 ring-green-100` : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`;

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Categoría */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
                              <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className={selectClass(filterCategoria !== 'Todas')}>
                                <option value="Todas">Todas las categorías</option>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>

                            {/* Marca */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Marca</label>
                              <select value={filterMarca} onChange={e => setFilterMarca(e.target.value)} className={selectClass(filterMarca !== 'Todas')}>
                                <option value="Todas">Todas las marcas</option>
                                {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>

                            {/* Estado */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estado</label>
                              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={selectClass(filterEstado !== 'Todos')}>
                                <option value="Todos">Todos los estados</option>
                                <option value="Disponible">Disponible</option>
                                <option value="En Uso">En Uso</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Baja">Baja</option>
                              </select>
                            </div>

                            {/* Sede */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sede</label>
                              <select value={filterSede} onChange={e => setFilterSede(e.target.value)} className={selectClass(filterSede !== 'Todas')}>
                                <option value="Todas">Todas las sedes</option>
                                {sedes.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>

                            {/* Encargado */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Encargado ST</label>
                              <select value={filterEncargado} onChange={e => setFilterEncargado(e.target.value)} className={selectClass(filterEncargado !== 'Todos')}>
                                <option value="Todos">Todos los encargados</option>
                                {encargadosUnicos.map(e => <option key={e} value={e}>{e}</option>)}
                              </select>
                            </div>

                            {/* Piso/Edif */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Piso / Edificio</label>
                              <div className="grid grid-cols-2 gap-2">
                                <select value={filterPiso} onChange={e => setFilterPiso(e.target.value)} className={selectClass(filterPiso !== 'Todos')}>
                                  <option value="Todos">Piso</option>
                                  {pisosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <select value={filterEdificio} onChange={e => setFilterEdificio(e.target.value)} className={selectClass(filterEdificio !== 'Todos')}>
                                  <option value="Todos">Edif.</option>
                                  {edificiosUnicos.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* Hardware Compacto */}
                            <div className="space-y-1.5 lg:col-span-2">
                              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hardware / Uso / Proyector</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <select value={filterProcesador} onChange={e => setFilterProcesador(e.target.value)} className={selectClass(filterProcesador !== 'Todos')}>
                                  <option value="Todos">CPU</option>
                                  {[...new Set(items.map(i => i.procesador).filter(Boolean))].sort().map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <select value={filterRam} onChange={e => setFilterRam(e.target.value)} className={selectClass(filterRam !== 'Todas')}>
                                  <option value="Todas">RAM</option>
                                  {[...new Set(items.map(i => i.ram).filter(Boolean))].sort().map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <select value={filterDiscoDuro} onChange={e => setFilterDiscoDuro(e.target.value)} className={selectClass(filterDiscoDuro !== 'Todos')}>
                                  <option value="Todos">Disco</option>
                                  {[...new Set(items.map(i => i.discoDuro).filter(Boolean))].sort().map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select value={filterTipoUso} onChange={e => setFilterTipoUso(e.target.value)} className={selectClass(filterTipoUso !== 'Todos')}>
                                  <option value="Todos">Uso</option>
                                  <option value="Administrativo">Adm.</option>
                                  <option value="Alumnos">Alu.</option>
                                </select>
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="sm:col-span-2 lg:col-span-4 flex items-end justify-end pt-2">
                              <button
                                onClick={() => {
                                  setFilterEstado('Todos');
                                  setFilterCategoria('Todas');
                                  setFilterSede('Todas');
                                  setFilterTipoUso('Todos');
                                  setFilterMarca('Todas');
                                  setFilterPiso('Todos');
                                  setFilterEdificio('Todos');
                                  setFilterProcesador('Todos');
                                  setFilterRam('Todas');
                                  setFilterDiscoDuro('Todos');
                                  setFilterEncargado('Todos');
                                  setSearchTerm('');
                                }}
                                className="w-full sm:w-auto py-1.5 px-6 text-[10px] font-black text-gray-400 hover:text-red-700 hover:bg-red-50 border border-gray-100 rounded-lg transition-all uppercase tracking-widest"
                              >
                                Limpiar todo
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Controles de paginación */}
                {sortedItems.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Barra superior: info + items por página */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                      {/* Info + items por página */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">
                          <span className="text-slate-700 font-black">{startIndex + 1}–{Math.min(endIndex, sortedItems.length)}</span>
                          {' '}/{' '}
                          <span className="text-slate-700 font-black">{sortedItems.length}</span>
                        </span>
                        <div className="flex bg-slate-50 rounded-xl p-0.5 border border-slate-100">
                          {[6, 12, 24, 48].map(n => (
                            <button
                              key={n}
                              onClick={() => { setItemsPerPage(n); setCurrentPage(1); }}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${itemsPerPage === n
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center flex-wrap gap-1.5 px-4 py-3">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FaArrowUp className="rotate-[-90deg] text-[9px]" /> Ant.
                        </button>

                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 text-[11px] font-black rounded-lg transition-all ${currentPage === pageNum
                                  ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md shadow-green-100`
                                  : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
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
                          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Sig. <FaArrowUp className="rotate-90 text-[9px]" />
                        </button>
                      </div>
                    )}
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

                {/* Paginación al final - Igual que arriba */}
                {totalPages > 1 && (
                  <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
                    <div className="flex items-center justify-center flex-wrap gap-1.5 px-4 py-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FaArrowUp className="rotate-[-90deg] text-[9px]" /> Ant.
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 text-[11px] font-black rounded-lg transition-all ${currentPage === pageNum
                                ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md shadow-green-100`
                                : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
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
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Sig. <FaArrowUp className="rotate-90 text-[9px]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Cabecera de Resumen Rápido */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <FaChartPie className="text-green-600" /> Resumen de Estado
                      </h3>
                      <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-1">
                        <div
                          className="bg-green-600 h-full transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold first:rounded-l-xl"
                          style={{ width: `${(estadisticas.disponible / estadisticas.total) * 100}%` }}
                          title={`Disponible: ${estadisticas.disponible}`}
                        >
                          {estadisticas.disponible > 0 && `${Math.round((estadisticas.disponible / estadisticas.total) * 100)}%`}
                        </div>
                        <div
                          className="bg-green-800 h-full transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold"
                          style={{ width: `${(estadisticas.enUso / estadisticas.total) * 100}%` }}
                          title={`En Uso: ${estadisticas.enUso}`}
                        >
                          {estadisticas.enUso > 0 && `${Math.round((estadisticas.enUso / estadisticas.total) * 100)}%`}
                        </div>
                        <div
                          className="bg-yellow-500 h-full transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold"
                          style={{ width: `${(estadisticas.mantenimiento / estadisticas.total) * 100}%` }}
                          title={`Mantenimiento: ${estadisticas.mantenimiento}`}
                        >
                          {estadisticas.mantenimiento > 0 && `${Math.round((estadisticas.mantenimiento / estadisticas.total) * 100)}%`}
                        </div>
                        <div
                          className="bg-red-500 h-full transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold last:rounded-r-xl"
                          style={{ width: `${(estadisticas.baja / estadisticas.total) * 100}%` }}
                          title={`Baja: ${estadisticas.baja}`}
                        >
                          {estadisticas.baja > 0 && `${Math.round((estadisticas.baja / estadisticas.total) * 100)}%`}
                        </div>
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span> Dispo. ({estadisticas.disponible})
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-800"></span> Uso ({estadisticas.enUso})
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Mant. ({estadisticas.mantenimiento})
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Baja ({estadisticas.baja})
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-2xl font-black text-slate-800">{estadisticas.total}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activos</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-2xl font-black text-slate-800">{estadisticas.marcasUnicas}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marcas</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-2xl font-black text-slate-800">{estadisticas.modelosUnicos}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelos</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-2xl font-black text-slate-800">{estadisticas.sedesConActivos}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sedes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Categorías Compactas */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <FaTag className="text-green-600" /> Por Categoría
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">Top Distribución</span>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(estadisticas.porCategoria)
                        .sort(([, a], [, b]) => b - a)
                        .map(([categoria, count]) => (
                          <div key={categoria} className="group">
                            <div className="flex justify-between items-center mb-1.5 px-1">
                              <span className="text-sm font-bold text-slate-700 group-hover:text-green-700 transition-colors uppercase tracking-tight">{categoria}</span>
                              <span className="text-xs font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                              <div
                                className={`h-full ${INSTITUTIONAL_COLORS.bgPrimary} rounded-full transition-all duration-700 delay-300 opacity-80 group-hover:opacity-100`}
                                style={{ width: `${(count / estadisticas.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Sedes Compactas */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <FaBuilding className="text-green-600" /> Presencia en Sedes
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase font-mono">Resumen Geográfico</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(estadisticas.porSede)
                        .sort(([, a], [, b]) => b - a)
                        .map(([sede, count]) => (
                          <div key={sede} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-green-200 transition-all group overflow-hidden relative">
                            <div className="absolute -right-2 -bottom-2 opacity-5 text-4xl group-hover:scale-110 transition-transform">
                              <FaBuilding />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{sede}</p>
                            <div className="flex items-end gap-2">
                              <p className="text-2xl font-black text-slate-800 tracking-tight">{count}</p>
                              <p className="text-[10px] font-bold text-green-600 mb-1.5">{Math.round((count / estadisticas.total) * 100)}% del total</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'usuarios' && isAdmin && (
              <div className="space-y-4 animate-fadeIn">

                {errorUsers && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {errorUsers}
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Buscar por email o nombre..."
                      value={searchTermUsers}
                      onChange={(e) => setSearchTermUsers(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent bg-white`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setMostrarFormularioUsuario(true);
                      setErrorUsers(null);
                      setNuevoUsuario({ email: '', password: '', displayName: '', role: 'usuario' });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-800 text-white hover:bg-green-900 rounded-xl transition-colors text-sm font-bold shrink-0"
                  >
                    <FaPlus className="text-xs" /> Agregar Usuario
                  </button>
                </div>

                <p className="text-xs text-slate-400 font-semibold">
                  {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
                </p>

                {/* Lista de usuarios */}
                {loadingUsers && users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Cargando usuarios...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No se encontraron usuarios</div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.email}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Fila superior: avatar + info */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl ${INSTITUTIONAL_COLORS.bgPrimary} flex items-center justify-center text-white font-black text-base shrink-0`}>
                            {(user.displayName || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-800 text-sm truncate">
                                {user.displayName || 'Sin nombre'}
                              </span>
                              {user.email === currentUserEmail && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-full border border-blue-100">Tú</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{user.email}</p>
                            {/* Badges rol + estado */}
                            <div className="flex gap-1.5 flex-wrap mt-1.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${getRoleBadgeColor(user.role)}`}>
                                {user.role === 'administrador' ? <><FaCrown className="text-[8px]" /> Admin</> : <><FaUser className="text-[8px]" /> Usuario</>}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${getStatusBadgeColor(user.isActive)}`}>
                                {user.isActive ? <><FaCheckCircle className="text-[8px]" /> Activo</> : <><FaTimesCircle className="text-[8px]" /> Inactivo</>}
                              </span>
                            </div>
                            {/* Fechas compactas */}
                            {(user.lastLogin || user.createdAt) && (
                              <p className="text-[10px] text-slate-300 mt-1">
                                {user.lastLogin && `Acceso: ${new Date(user.lastLogin).toLocaleDateString('es-CL')}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Fila inferior: controles */}
                        <div className="flex items-center gap-2 flex-wrap border-t border-slate-50 pt-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole)}
                            disabled={user.email === currentUserEmail}
                            className={`flex-1 min-w-[100px] px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 ${user.email === currentUserEmail ? 'bg-slate-50 cursor-not-allowed opacity-50' : 'bg-white'}`}
                          >
                            <option value="usuario">Usuario</option>
                            <option value="administrador">Administrador</option>
                          </select>

                          <button
                            onClick={() => handleToggleStatus(user.email, user.isActive)}
                            disabled={user.email === currentUserEmail}
                            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-colors ${user.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'} ${user.email === currentUserEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            onClick={() => handleEliminarUsuario(user.email)}
                            disabled={user.email === currentUserEmail}
                            className={`px-3 py-1.5 text-xs font-black rounded-xl bg-red-50 text-red-600 border border-red-100 btn-delete-override hover:bg-red-100 transition-colors flex items-center gap-1 ${user.email === currentUserEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <FaTrash className="text-[9px]" /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {activeSection === 'reportes' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reportes y Análisis</h3>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">Funcionalidades de reportes avanzados próximamente:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaChartBar /> Reportes por Período
                      </div>
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
                      <div className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaUser /> Por Responsable
                      </div>
                      <div className="text-sm text-gray-600">Distribución de items por responsable</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'configuracion' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-bold text-slate-800">Panel de Configuración</h3>
                </div>
                {/* Contenido de Subsecciones */}
                <div className="space-y-10 min-h-[500px] pb-12">
                  {/* CONFIGURACIÓN GENERAL */}
                  <div id="general" className="scroll-mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <FaBuilding />
                          </div>
                          Identidad Institucional
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la Institución</label>
                            <input
                              type="text"
                              value={nombreInstitucionEdit}
                              onChange={(e) => setNombreInstitucionEdit(e.target.value)}
                              placeholder="Ej: Universidad Santo Tomás"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">Este nombre aparecerá en la barra lateral y reportes.</p>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await updateConfigGeneral({ nombreInstitucion: nombreInstitucionEdit });
                                alert('Configuración guardada correctamente');
                              } catch (e) {
                                alert('Error al guardar');
                              }
                            }}
                            className="w-full py-2.5 bg-green-800 text-white font-bold rounded-xl hover:bg-green-900 transition-colors shadow-lg shadow-green-900/10"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>

                      {/* PREFERENCIAS DE INTERFAZ */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <FaDesktop />
                          </div>
                          Preferencias de Interfaz
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Modo Oscuro</p>
                              <p className="text-[10px] text-slate-400">Reduce el cansancio visual.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={toggleDarkMode} />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Densidad de Datos (Tablas)</p>
                              <p className="text-[10px] text-slate-400">Ajusta el tamaño de filas.</p>
                            </div>
                            <select className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600">
                              <option>Cómoda</option>
                              <option>Compacta</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Animaciones Fluídas</p>
                              <p className="text-[10px] text-slate-400">Transiciones visuales de la aplicación.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NOTIFICACIONES Y SEGURIDAD */}
                  <div id="notificaciones" className="scroll-mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">

                      {/* NOTIFICACIONES */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <FaBell />
                          </div>
                          Alertas y Notificaciones
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="mt-1">
                              <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600 rounded bg-white border-gray-300" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Stock de Insumos Crítico</p>
                              <p className="text-[11px] text-slate-500">Recibe una alerta visual en el panel cuando un ítem pase a estado de "Baja" o esté averiado.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="mt-1">
                              <input type="checkbox" className="w-4 h-4 text-green-600 rounded bg-white border-gray-300" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Resumen Semanal por Email</p>
                              <p className="text-[11px] text-slate-500">Recibe el reporte de los últimos movimientos a tu correo: <span className="font-semibold text-slate-600">{currentUserEmail}</span>.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SEGURIDAD */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <FaShieldAlt />
                          </div>
                          Seguridad y Accesos
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Cierre Automático</p>
                              <p className="text-[10px] text-slate-400">Por inactividad de sesión.</p>
                            </div>
                            <select className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600">
                              <option>30 minutos</option>
                              <option>1 hora (Sugerido)</option>
                              <option>Nunca</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Registro Extendido (Logs)</p>
                              <p className="text-[10px] text-slate-400">Auditar todos los movimientos minuciosamente.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DATOS Y RESPALDO */}
                  <div id="respaldos" className="scroll-mt-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                              <FaDatabase />
                            </div>
                            Respaldo de la Plataforma
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">Reglas de procesamiento, exportación y copias de seguridad de la base de datos centralizada.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl hover:border-slate-300 transition-colors group">
                          <FaFileExport className="text-3xl text-slate-300 group-hover:text-green-600 mb-4 transition-colors" />
                          <h5 className="font-bold text-slate-700 mb-1">Formato Predeterminado</h5>
                          <p className="text-xs text-slate-500 mb-4">Exportación de los reportes.</p>
                          <select className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-green-500">
                            <option>Excel (.xlsx)</option>
                            <option>EAN o CSV nativo</option>
                            <option>JSON RestData</option>
                          </select>
                        </div>
                        <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl hover:border-slate-300 transition-colors group">
                          <FaCloudDownloadAlt className="text-3xl text-slate-300 group-hover:text-blue-600 mb-4 transition-colors" />
                          <h5 className="font-bold text-slate-700 mb-1">Copia Automática Diario</h5>
                          <p className="text-xs text-slate-500 mb-4">Snapshots de base de datos en clúster.</p>
                          <select className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500">
                            <option>Diario (Mediodía y 00:00)</option>
                            <option>Semanal (Solo Domingos)</option>
                            <option>Desactivado - Solo manual</option>
                          </select>
                        </div>
                        <div className="p-5 border border-slate-100 bg-green-50/50 rounded-2xl flex flex-col justify-center items-center text-center">
                          <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl mb-3 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <FaCheckCircle />
                          </div>
                          <h5 className="font-bold text-slate-800">Todo Operativo</h5>
                          <p className="text-xs text-slate-500 mt-2 px-2 leading-relaxed">Última sincronía del sistema confirmada hace 3 minutos. El sistema y la persistencia de datos están saludables.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



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
                isAdmin={isAdmin}
                usuarios={users}
              />
            )}

            {/* Modal para agregar nuevo usuario */}
            {mostrarFormularioUsuario && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Usuario</h3>
                    <button
                      onClick={() => {
                        setMostrarFormularioUsuario(false);
                        setErrorUsers(null);
                        setNuevoUsuario({
                          email: '',
                          password: '',
                          displayName: '',
                          role: 'usuario'
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Cerrar"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {errorUsers && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {errorUsers}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={nuevoUsuario.email}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                          placeholder="usuario@ejemplo.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          value={nuevoUsuario.password}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={nuevoUsuario.displayName}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, displayName: e.target.value })}
                          placeholder="Nombre del usuario"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Rol *
                        </label>
                        <select
                          value={nuevoUsuario.role}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, role: e.target.value as UserRole })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                        >
                          <option value="usuario">Usuario</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleAgregarUsuario}
                        disabled={loadingUsers || !nuevoUsuario.email.trim() || !nuevoUsuario.password.trim()}
                        className="flex-1 px-4 py-2 bg-green-800 text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingUsers ? 'Creando...' : 'Crear Usuario'}
                      </button>
                      <button
                        onClick={() => {
                          setMostrarFormularioUsuario(false);
                          setErrorUsers(null);
                          setNuevoUsuario({
                            email: '',
                            password: '',
                            displayName: '',
                            role: 'usuario'
                          });
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-md transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── BOTTOM NAV BAR MÓVIL ── */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-slate-200 flex items-stretch shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`flex-1 flex flex-col items-center justify-center transition-all relative ${activeSection === item.id
                  ? 'text-green-700'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {activeSection === item.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-b-full" />
                )}

                {/* Contenedor de icono con altura fija para normalizar el espacio */}
                <div className="h-6 flex items-center justify-center mb-0.5">
                  <item.icon className={`text-lg transition-all duration-300 ${activeSection === item.id ? 'scale-115 text-green-600' : ''
                    }`} />
                </div>

                <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${activeSection === item.id ? 'text-green-700' : 'text-slate-400'
                  }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}

