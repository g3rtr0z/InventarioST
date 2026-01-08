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
  FaUserShield,
  FaCog,
  FaTrash,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaCrown,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';

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
  const [activeSection, setActiveSection] = useState<'inventario' | 'dashboard' | 'usuarios' | 'categorias' | 'sedes' | 'reportes' | 'configuracion'>('inventario');
  const [configSubsection, setConfigSubsection] = useState<'estados' | 'formulario' | 'secciones'>('formulario');

  if (!isAdmin) {
    return null;
  }

  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Iniciar contraído
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    gestion: false,
    reportes: false
  });
  const sidebarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'nombre' | 'categoria' | 'estado' | 'ubicacion'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
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
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState({ nombre: '', color: 'bg-gray-100 text-gray-800', requerido: false });
  
  // Estados para gestión de secciones del formulario
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editandoSeccion, setEditandoSeccion] = useState<{ nombre: string; nuevoNombre: string } | null>(null);
  const [mostrarModalCampoFormulario, setMostrarModalCampoFormulario] = useState(false);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const handleSidebarMouseEnter = () => {
    // Solo expandir con hover en desktop (md y superior)
    if (window.innerWidth >= 768) {
      // Cancelar cualquier timeout pendiente
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
        sidebarTimeoutRef.current = null;
      }
      // Expandir el sidebar
      setSidebarOpen(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    // Solo contraer con hover en desktop (md y superior)
    if (window.innerWidth >= 768) {
      // Esperar un poco antes de contraer (500ms para más suavidad)
      sidebarTimeoutRef.current = setTimeout(() => {
        setSidebarOpen(false);
        sidebarTimeoutRef.current = null;
      }, 100);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, []);

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Resetear página cuando cambian los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterEstado, filterCategoria, filterSede, filterTipoUso, searchTerm]);

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
    setLoadingConfig(true);
    try {
      const config = await getConfig();
      setConfiguracion(config);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAgregarEstado = async () => {
    if (!nuevoEstado.nombre.trim() || !configuracion) return;
    
    const estadoExiste = configuracion.estados.some((e: EstadoPersonalizado) => e.nombre.toLowerCase() === nuevoEstado.nombre.trim().toLowerCase());
    if (estadoExiste) {
      alert('Este estado ya existe');
      return;
    }

    try {
      const nuevosEstados = [...configuracion.estados, { ...nuevoEstado, nombre: nuevoEstado.nombre.trim() }];
      await updateEstados(nuevosEstados);
      setNuevoEstado({ nombre: '', color: 'bg-gray-100 text-gray-800', requerido: false });
    } catch (err) {
      alert('Error al agregar estado');
      console.error(err);
    }
  };

  const handleEliminarEstado = async (nombre: string) => {
    if (!configuracion) return;
    if (!window.confirm(`¿Estás seguro de eliminar el estado "${nombre}"?`)) return;

    try {
      const nuevosEstados = configuracion.estados.filter((e: EstadoPersonalizado) => e.nombre !== nombre);
      await updateEstados(nuevosEstados);
    } catch (err) {
      alert('Error al eliminar estado');
      console.error(err);
    }
  };


  const handleActualizarFormulario = async (formulario: CampoFormulario[]) => {
    try {
      await updateFormulario(formulario);
    } catch (err) {
      alert('Error al actualizar configuración del formulario');
      console.error(err);
    }
  };

  const handleToggleCampoVisible = (nombreCampo: string) => {
    if (!configuracion) return;
    const nuevosCampos = configuracion.formulario.map((campo: CampoFormulario) =>
      campo.nombre === nombreCampo ? { ...campo, visible: !campo.visible } : campo
    );
    handleActualizarFormulario(nuevosCampos);
  };

  const handleToggleCampoObligatorio = (nombreCampo: string) => {
    if (!configuracion) return;
    const nuevosCampos = configuracion.formulario.map((campo: CampoFormulario) =>
      campo.nombre === nombreCampo ? { ...campo, obligatorio: !campo.obligatorio } : campo
    );
    handleActualizarFormulario(nuevosCampos);
  };

  const handleEliminarCampoFormulario = async (nombreCampo: string) => {
    if (!configuracion) return;
    
    // No permitir eliminar campos críticos
    const camposCriticos = ['nombre', 'categoria', 'estado', 'sede', 'ubicacion', 'responsable'];
    if (camposCriticos.includes(nombreCampo)) {
      if (!window.confirm(`¿Estás seguro de eliminar el campo "${nombreCampo}"? Este campo es crítico y podría causar problemas.`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar el campo "${nombreCampo}" del formulario?`)) {
        return;
      }
    }

    try {
      const nuevosCampos = configuracion.formulario.filter((campo: CampoFormulario) => campo.nombre !== nombreCampo);
      await updateFormulario(nuevosCampos);
    } catch (err) {
      alert('Error al eliminar campo');
      console.error(err);
    }
  };

  const handleRestaurarCampo = async (nombreCampo: string, seccion: string, etiqueta: string, orden: number, obligatorio: boolean = false) => {
    if (!configuracion) return;

    try {
      const nuevoCampo: CampoFormulario = {
        nombre: nombreCampo,
        seccion: seccion,
        visible: true,
        obligatorio: obligatorio,
        orden: orden,
        etiqueta: etiqueta
      };

      const nuevosCampos = [...configuracion.formulario, nuevoCampo];
      await updateFormulario(nuevosCampos);
    } catch (err) {
      alert('Error al restaurar campo');
      console.error(err);
    }
  };

  const [nuevoCampoFormulario, setNuevoCampoFormulario] = useState({
    nombre: '',
    seccion: 'Información General',
    etiqueta: '',
    obligatorio: false,
    tipo: 'text' as 'text' | 'number' | 'date' | 'select' | 'textarea'
  });

  const handleAgregarCampoFormulario = async () => {
    if (!configuracion || !nuevoCampoFormulario.nombre.trim() || !nuevoCampoFormulario.etiqueta.trim()) {
      alert('Por favor completa el nombre y la etiqueta del campo');
      return;
    }

    // Validar que el nombre del campo no exista
    const campoExiste = configuracion.formulario.some((c: CampoFormulario) => 
      c.nombre.toLowerCase() === nuevoCampoFormulario.nombre.trim().toLowerCase()
    );

    if (campoExiste) {
      alert('Ya existe un campo con ese nombre');
      return;
    }

    try {
      // Obtener el máximo orden de la sección
      const maxOrdenSeccion = configuracion.formulario
        .filter((c: CampoFormulario) => c.seccion === nuevoCampoFormulario.seccion)
        .reduce((max: number, c: CampoFormulario) => Math.max(max, c.orden), 0);

      const nuevoCampo: CampoFormulario = {
        nombre: nuevoCampoFormulario.nombre.trim().toLowerCase().replace(/\s+/g, '_'),
        seccion: nuevoCampoFormulario.seccion,
        visible: true,
        obligatorio: nuevoCampoFormulario.obligatorio,
        orden: maxOrdenSeccion + 1,
        etiqueta: nuevoCampoFormulario.etiqueta.trim(),
        tipo: nuevoCampoFormulario.tipo
      };

      const nuevosCampos = [...configuracion.formulario, nuevoCampo];
      await updateFormulario(nuevosCampos);
      
      // Limpiar formulario y cerrar modal
      setNuevoCampoFormulario({
        nombre: '',
        seccion: 'Información General',
        etiqueta: '',
        obligatorio: false,
        tipo: 'text'
      });
      setMostrarModalCampoFormulario(false);
      alert('Campo agregado exitosamente');
    } catch (err) {
      alert('Error al agregar campo');
      console.error(err);
    }
  };

  const handleMoverCampo = (nombreCampo: string, direccion: 'arriba' | 'abajo') => {
    if (!configuracion) return;
    
    // Crear una copia profunda del array de campos
    const campos = configuracion.formulario.map((c: CampoFormulario) => ({ ...c }));
    
    // Encontrar el campo y su sección
    const campo = campos.find((c: CampoFormulario) => c.nombre === nombreCampo);
    if (!campo) return;

    // Filtrar campos de la misma sección y ordenarlos
    const camposMismaSeccion = campos
      .filter((c: CampoFormulario) => c.seccion === campo.seccion)
      .sort((a: CampoFormulario, b: CampoFormulario) => a.orden - b.orden);
    
    const indexEnSeccion = camposMismaSeccion.findIndex((c: CampoFormulario) => c.nombre === nombreCampo);

    if (direccion === 'arriba' && indexEnSeccion > 0) {
      // Mover hacia arriba: intercambiar posiciones en el array
      const temp = camposMismaSeccion[indexEnSeccion];
      camposMismaSeccion[indexEnSeccion] = camposMismaSeccion[indexEnSeccion - 1];
      camposMismaSeccion[indexEnSeccion - 1] = temp;
    } else if (direccion === 'abajo' && indexEnSeccion < camposMismaSeccion.length - 1) {
      // Mover hacia abajo: intercambiar posiciones en el array
      const temp = camposMismaSeccion[indexEnSeccion];
      camposMismaSeccion[indexEnSeccion] = camposMismaSeccion[indexEnSeccion + 1];
      camposMismaSeccion[indexEnSeccion + 1] = temp;
    } else {
      return; // No hay nada que hacer
    }

    // Reasignar órdenes secuenciales dentro de la sección
    camposMismaSeccion.forEach((c: CampoFormulario, idx: number) => {
      c.orden = idx + 1;
    });

    // Actualizar los campos en el array principal
    camposMismaSeccion.forEach((campoActualizado: CampoFormulario) => {
      const indexEnOriginal = campos.findIndex((c: CampoFormulario) => c.nombre === campoActualizado.nombre);
      if (indexEnOriginal !== -1) {
        campos[indexEnOriginal] = campoActualizado;
      }
    });

    // Actualizar el array completo con los cambios
    handleActualizarFormulario(campos);
  };

  const handleAgregarSeccion = async () => {
    if (!nuevaSeccion.trim() || !configuracion) return;
    
    const seccionExiste = configuracion.seccionesFormulario.some((s: SeccionFormulario) => 
      s.nombre.toLowerCase() === nuevaSeccion.trim().toLowerCase()
    );
    
    if (seccionExiste) {
      alert('Esta sección ya existe');
      return;
    }

    try {
      const maxOrden = configuracion.seccionesFormulario.length > 0 
        ? Math.max(...configuracion.seccionesFormulario.map((s: SeccionFormulario) => s.orden)) 
        : -1;
      
      const nuevaSeccionCompleta: SeccionFormulario = {
        nombre: nuevaSeccion.trim(),
        visible: true,
        orden: maxOrden + 1
      };

      const nuevasSecciones = [...configuracion.seccionesFormulario, nuevaSeccionCompleta];
      await updateSeccionesFormulario(nuevasSecciones);
      setNuevaSeccion('');
    } catch (err) {
      alert('Error al agregar sección');
      console.error(err);
    }
  };

  const handleEliminarSeccion = async (nombreSeccion: string) => {
    if (!configuracion) return;
    
    // Verificar si hay campos en esta sección
    const camposEnSeccion = configuracion.formulario.filter((c: CampoFormulario) => c.seccion === nombreSeccion);
    
    if (camposEnSeccion.length > 0) {
      if (!window.confirm(`La sección "${nombreSeccion}" tiene ${camposEnSeccion.length} campo(s). ¿Estás seguro de eliminarla? Los campos también se eliminarán.`)) {
        return;
      }
      
      // Eliminar también los campos de esta sección
      const nuevosCampos = configuracion.formulario.filter((c: CampoFormulario) => c.seccion !== nombreSeccion);
      await updateFormulario(nuevosCampos);
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar la sección "${nombreSeccion}"?`)) {
        return;
      }
    }

    try {
      const nuevasSecciones = configuracion.seccionesFormulario.filter((s: SeccionFormulario) => s.nombre !== nombreSeccion);
      await updateSeccionesFormulario(nuevasSecciones);
    } catch (err) {
      alert('Error al eliminar sección');
      console.error(err);
    }
  };

  const handleEditarSeccion = async (nombreOriginal: string, nuevoNombre: string) => {
    if (!configuracion || !nuevoNombre.trim()) return;
    
    if (nombreOriginal === nuevoNombre.trim()) {
      setEditandoSeccion(null);
      return;
    }

    const seccionExiste = configuracion.seccionesFormulario.some((s: SeccionFormulario) => 
      s.nombre.toLowerCase() === nuevoNombre.trim().toLowerCase() && s.nombre !== nombreOriginal
    );
    
    if (seccionExiste) {
      alert('Ya existe una sección con ese nombre');
      return;
    }

    try {
      // Actualizar el nombre de la sección
      const nuevasSecciones = configuracion.seccionesFormulario.map((s: SeccionFormulario) =>
        s.nombre === nombreOriginal ? { ...s, nombre: nuevoNombre.trim() } : s
      );
      await updateSeccionesFormulario(nuevasSecciones);

      // Actualizar todos los campos que pertenecen a esta sección
      const nuevosCampos = configuracion.formulario.map((c: CampoFormulario) =>
        c.seccion === nombreOriginal ? { ...c, seccion: nuevoNombre.trim() } : c
      );
      await updateFormulario(nuevosCampos);

      setEditandoSeccion(null);
    } catch (err) {
      alert('Error al editar sección');
      console.error(err);
    }
  };

  const handleToggleSeccionVisible = (nombreSeccion: string) => {
    if (!configuracion) return;
    const nuevasSecciones = configuracion.seccionesFormulario.map((s: SeccionFormulario) =>
      s.nombre === nombreSeccion ? { ...s, visible: !s.visible } : s
    );
    updateSeccionesFormulario(nuevasSecciones);
  };

  const handleMoverSeccion = (nombreSeccion: string, direccion: 'arriba' | 'abajo') => {
    if (!configuracion) return;
    
    const secciones = [...configuracion.seccionesFormulario];
    const index = secciones.findIndex((s: SeccionFormulario) => s.nombre === nombreSeccion);
    if (index === -1) return;

    const seccion = secciones[index];
    const seccionesOrdenadas = [...secciones].sort((a: SeccionFormulario, b: SeccionFormulario) => a.orden - b.orden);
    const indexEnOrden = seccionesOrdenadas.findIndex((s: SeccionFormulario) => s.nombre === nombreSeccion);

    if (direccion === 'arriba' && indexEnOrden > 0) {
      const seccionAnterior = seccionesOrdenadas[indexEnOrden - 1];
      const tempOrden = seccion.orden;
      seccion.orden = seccionAnterior.orden;
      seccionAnterior.orden = tempOrden;
    } else if (direccion === 'abajo' && indexEnOrden < seccionesOrdenadas.length - 1) {
      const seccionSiguiente = seccionesOrdenadas[indexEnOrden + 1];
      const tempOrden = seccion.orden;
      seccion.orden = seccionSiguiente.orden;
      seccionSiguiente.orden = tempOrden;
    } else {
      return;
    }

    // Reasignar órdenes secuenciales
    seccionesOrdenadas.forEach((s: SeccionFormulario, idx: number) => {
      s.orden = idx + 1;
    });

    updateSeccionesFormulario(secciones);
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
        <div className={`bg-gradient-to-r ${INSTITUTIONAL_COLORS.gradientFrom} ${INSTITUTIONAL_COLORS.gradientTo} px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-md w-full`}>
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden text-white hover:${INSTITUTIONAL_COLORS.bgPrimary} p-2 rounded-md transition-colors flex-shrink-0`}
              title="Toggle Sidebar"
            >
              <FaBars className="text-lg sm:text-xl" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-bold text-white truncate">Panel de Administración</h2>
              <p className="text-green-100 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Gestión completa del sistema</p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={onExportExcel}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white ${INSTITUTIONAL_COLORS.bgPrimary} border border-green-900 rounded-md hover:bg-green-900 transition-colors flex items-center gap-1 sm:gap-2`}
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
          
          {/* Sidebar de navegación - En móvil siempre fixed, en desktop normal */}
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
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {/* Sección Principal */}
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
                    ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
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
                onClick={() => {
                  setActiveSection('dashboard');
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setTimeout(() => setSidebarOpen(false), 100);
                  }
                }}
                onMouseEnter={() => setHoveredItem('dashboard')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group ${
                  activeSection === 'dashboard'
                    ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
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

              {/* Dropdown: Gestión - Solo para administradores */}
              {isAdmin && (
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
                        onClick={() => {
                          setActiveSection('usuarios');
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setTimeout(() => setSidebarOpen(false), 100);
                          }
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          activeSection === 'usuarios'
                            ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FaUsers className={`text-sm ${activeSection === 'usuarios' ? 'text-white' : 'text-gray-600'}`} />
                          <span className="text-sm font-medium">Usuarios</span>
                        </div>
                      </button>
                    
                    <button
                      onClick={() => {
                        setActiveSection('categorias');
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setTimeout(() => setSidebarOpen(false), 100);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'categorias'
                          ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaFolder className={`text-sm ${activeSection === 'categorias' ? 'text-white' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">Categorías</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveSection('sedes');
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setTimeout(() => setSidebarOpen(false), 100);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'sedes'
                          ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
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
              )}

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
                      onClick={() => {
                        setActiveSection('reportes');
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setTimeout(() => setSidebarOpen(false), 100);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === 'reportes'
                          ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
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

              {/* Configuración */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                    } else {
                      setActiveSection('configuracion');
                    }
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setTimeout(() => setSidebarOpen(false), 100);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem('configuracion')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full ${sidebarOpen ? 'px-4 py-3 text-left' : 'px-2 py-3 justify-center'} rounded-lg transition-colors relative group ${
                    activeSection === 'configuracion'
                      ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white shadow-md`
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  title={!sidebarOpen ? 'Configuración' : ''}
                >
                  <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                    <FaCog className={`text-lg ${activeSection === 'configuracion' ? 'text-white' : 'text-gray-600'}`} />
                    {sidebarOpen && <span className="font-medium">Configuración</span>}
                  </div>
                  {/* Tooltip cuando está contraído */}
                  {!sidebarOpen && hoveredItem === 'configuracion' && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 shadow-lg">
                      Configuración
                      <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </button>
              </div>
            </nav>

            {/* Footer del sidebar */}
            <div className={`p-2 border-t border-gray-200 ${!sidebarOpen && 'px-2'}`}>
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                {sidebarOpen ? (
                  <>
                    <div className="text-xs text-gray-500 mb-1">Usuario actual</div>
                    <div className="text-sm font-semibold text-gray-900 truncate">{currentUserEmail}</div>
                    <div className={`text-xs ${INSTITUTIONAL_COLORS.textPrimary} font-medium mt-1 flex items-center gap-1`}>
                      <FaUserShield /> Administrador
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center">
                    <FaUserShield className={`${INSTITUTIONAL_COLORS.textPrimary} text-lg`} title={currentUserEmail} />
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
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent transition-all`}
                      />
                    </div>
                    {/* Botones: Agregar Item a la izquierda, Tarjetas/Tabla a la derecha */}
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={onAddItem}
                        className={`px-4 py-2.5 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium flex items-center gap-2`}
                        title="Agregar Item"
                      >
                        <FaPlus /> Agregar Item
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

                {/* Controles de ordenamiento y paginación */}
                {sortedItems.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Ordenamiento */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => {
                            setSortBy(e.target.value as 'nombre' | 'categoria' | 'estado' | 'ubicacion');
                            setCurrentPage(1);
                          }}
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
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
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
                                  ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white ${INSTITUTIONAL_COLORS.borderPrimary}`
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
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

                {/* Lista de items */}
                <ItemList
                  items={paginatedItems}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  searchTerm=""
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
              </div>
            )}

            {activeSection === 'usuarios' && isAdmin && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h3>
                
                {errorUsers && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {errorUsers}
                  </div>
                )}

                {/* Botón para abrir modal de nuevo usuario */}
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() => {
                      setMostrarFormularioUsuario(true);
                      setErrorUsers(null);
                      setNuevoUsuario({
                        email: '',
                        password: '',
                        displayName: '',
                        role: 'usuario'
                      });
                    }}
                    className="px-4 py-2 bg-green-800 text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <FaPlus />
                    Agregar Usuario
                  </button>
                </div>

                {/* Búsqueda */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por email o nombre..."
                    value={searchTermUsers}
                    onChange={(e) => setSearchTermUsers(e.target.value)}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent`}
                  />
                </div>

                {/* Contador de usuarios */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600">
                    Total de usuarios: <span className="font-semibold">{filteredUsers.length}</span>
                  </div>
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
                            
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-1 rounded border ${getRoleBadgeColor(user.role)} flex items-center gap-1`}>
                                {user.role === 'administrador' ? (
                                  <>
                                    <FaCrown /> Administrador
                                  </>
                                ) : (
                                  <>
                                    <FaUser /> Usuario
                                  </>
                                )}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusBadgeColor(user.isActive)} flex items-center gap-1`}>
                                {user.isActive ? (
                                  <>
                                    <FaCheckCircle /> Activo
                                  </>
                                ) : (
                                  <>
                                    <FaTimesCircle /> Inactivo
                                  </>
                                )}
                              </span>
                              {user.createdAt && (
                                <span className="text-xs text-gray-500">
                                  Creado: {new Date(user.createdAt).toLocaleString('es-MX', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {user.lastLogin && (
                                <span className="text-xs text-gray-500">
                                  Último acceso: {new Date(user.lastLogin).toLocaleString('es-MX', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
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
                                  : `${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900`
                              } ${
                                user.email === currentUserEmail ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={user.email === currentUserEmail ? 'No puedes desactivarte a ti mismo' : ''}
                            >
                              {user.isActive ? 'Desactivar' : 'Activar'}
                            </button>

                            {/* Eliminar usuario */}
                            <button
                              onClick={() => handleEliminarUsuario(user.email)}
                              disabled={user.email === currentUserEmail}
                              className={`px-3 py-1.5 text-sm rounded-md transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 ${
                                user.email === currentUserEmail ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={user.email === currentUserEmail ? 'No puedes eliminarte a ti mismo' : 'Eliminar permanentemente'}
                            >
                              <FaTrash />
                              Eliminar
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
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent`}
                      />
                      <button
                        onClick={handleAgregarCategoria}
                        className={`px-4 py-2 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-md transition-colors font-medium`}
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
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent`}
                      />
                      <button
                        onClick={handleAgregarSede}
                        className={`px-4 py-2 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-md transition-colors font-medium`}
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración del Sistema</h3>
                
                {/* Tabs de subsecciones */}
                <div className="bg-white rounded-lg border border-gray-200 p-1">
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => setConfigSubsection('formulario')}
                      className={`flex-1 min-w-[100px] px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        configSubsection === 'formulario'
                          ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Formulario
                    </button>
                    <button
                      onClick={() => setConfigSubsection('secciones')}
                      className={`flex-1 min-w-[100px] px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        configSubsection === 'secciones'
                          ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Secciones
                    </button>
                    <button
                      onClick={() => setConfigSubsection('estados')}
                      className={`flex-1 min-w-[100px] px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        configSubsection === 'estados'
                          ? `${INSTITUTIONAL_COLORS.bgPrimary} text-white`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Estados
                    </button>
                  </div>
                </div>

                {/* Gestión de Secciones del Formulario */}
                {configSubsection === 'secciones' && configuracion && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Gestión de Secciones del Formulario</h4>
                    <p className="text-sm text-gray-600 mb-6">
                      Administra las secciones del formulario de items. Puedes agregar, editar, eliminar y reordenar secciones.
                    </p>

                    {/* Agregar nueva sección */}
                    <div className={`mb-6 p-4 bg-green-50 rounded-lg border ${INSTITUTIONAL_COLORS.borderPrimary}`}>
                      <h5 className="text-base font-semibold text-gray-800 mb-3">Agregar Nueva Sección</h5>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nuevaSeccion}
                          onChange={(e) => setNuevaSeccion(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAgregarSeccion();
                            }
                          }}
                          placeholder="Nombre de la sección (ej: Información Adicional)"
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent text-sm`}
                        />
                        <button
                          onClick={handleAgregarSeccion}
                          className={`px-4 py-2 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium`}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>

                    {/* Lista de secciones */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Secciones Configuradas</h5>
                      {configuracion.seccionesFormulario
                        .sort((a: SeccionFormulario, b: SeccionFormulario) => a.orden - b.orden)
                        .map((seccion: SeccionFormulario, index: number) => {
                          const puedeSubir = index > 0;
                          const puedeBajar = index < configuracion.seccionesFormulario.length - 1;
                          const camposEnSeccion = configuracion.formulario.filter((c: CampoFormulario) => c.seccion === seccion.nombre).length;
                          const estaEditando = editandoSeccion?.nombre === seccion.nombre;

                          return (
                            <div key={seccion.nombre} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => handleToggleSeccionVisible(seccion.nombre)}
                                  className={`p-2 rounded-md transition-colors ${
                                    seccion.visible
                                      ? 'text-green-800 hover:bg-green-50'
                                      : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                  title={seccion.visible ? 'Ocultar sección' : 'Mostrar sección'}
                                >
                                  {seccion.visible ? <FaEye /> : <FaEyeSlash />}
                                </button>
                                <div className="flex-1">
                                  {estaEditando ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editandoSeccion.nuevoNombre}
                                        onChange={(e) => setEditandoSeccion({ ...editandoSeccion, nuevoNombre: e.target.value })}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleEditarSeccion(seccion.nombre, editandoSeccion.nuevoNombre);
                                          } else if (e.key === 'Escape') {
                                            setEditandoSeccion(null);
                                          }
                                        }}
                                        className={`flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent text-sm`}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleEditarSeccion(seccion.nombre, editandoSeccion.nuevoNombre)}
                                        className={`px-2 py-1 ${INSTITUTIONAL_COLORS.textPrimary} hover:bg-green-50 rounded-md transition-colors`}
                                        title="Guardar"
                                      >
                                        <FaCheck />
                                      </button>
                                      <button
                                        onClick={() => setEditandoSeccion(null)}
                                        className="px-2 py-1 text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                        title="Cancelar"
                                      >
                                        <FaTimes />
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{seccion.nombre}</span>
                                        {!seccion.visible && (
                                          <span className="text-xs text-gray-400">(Oculta)</span>
                                        )}
                                        <span className="text-xs text-gray-500">({camposEnSeccion} campo{camposEnSeccion !== 1 ? 's' : ''})</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {!estaEditando && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditandoSeccion({ nombre: seccion.nombre, nuevoNombre: seccion.nombre })}
                                    className={`px-3 py-1 text-xs ${INSTITUTIONAL_COLORS.textPrimary} hover:bg-green-50 rounded-md transition-colors`}
                                    title="Editar nombre"
                                  >
                                    <FaEdit />
                                  </button>
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => handleMoverSeccion(seccion.nombre, 'arriba')}
                                      disabled={!puedeSubir}
                                      className={`p-1 rounded transition-colors ${
                                        puedeSubir
                                          ? 'text-gray-600 hover:bg-gray-100'
                                          : 'text-gray-300 cursor-not-allowed'
                                      }`}
                                      title="Mover arriba"
                                    >
                                      <FaArrowUp className="text-xs" />
                                    </button>
                                    <button
                                      onClick={() => handleMoverSeccion(seccion.nombre, 'abajo')}
                                      disabled={!puedeBajar}
                                      className={`p-1 rounded transition-colors ${
                                        puedeBajar
                                          ? 'text-gray-600 hover:bg-gray-100'
                                          : 'text-gray-300 cursor-not-allowed'
                                      }`}
                                      title="Mover abajo"
                                    >
                                      <FaArrowDown className="text-xs" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleEliminarSeccion(seccion.nombre)}
                                    className="px-3 py-1 text-xs text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                    title="Eliminar sección"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Personalización de Estados */}
                {configSubsection === 'estados' && configuracion && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Personalización de Estados</h4>
                    
                    {/* Agregar nuevo estado */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Agregar Nuevo Estado
                      </label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={nuevoEstado.nombre}
                          onChange={(e) => setNuevoEstado({ ...nuevoEstado, nombre: e.target.value })}
                          placeholder="Nombre del estado"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent`}
                        />
                        <div className="flex gap-3">
                          <select
                            value={nuevoEstado.color}
                            onChange={(e) => setNuevoEstado({ ...nuevoEstado, color: e.target.value })}
                            className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent`}
                          >
                            <option value="bg-green-100 text-green-800">Verde</option>
                            <option value="bg-blue-100 text-blue-800">Azul</option>
                            <option value="bg-yellow-100 text-yellow-800">Amarillo</option>
                            <option value="bg-red-100 text-red-800">Rojo</option>
                            <option value="bg-purple-100 text-purple-800">Morado</option>
                            <option value="bg-gray-100 text-gray-800">Gris</option>
                          </select>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={nuevoEstado.requerido}
                              onChange={(e) => setNuevoEstado({ ...nuevoEstado, requerido: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">Requerido</span>
                          </label>
                        </div>
                        <button
                          onClick={handleAgregarEstado}
                          className={`w-full px-4 py-2 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium`}
                        >
                          Agregar Estado
                        </button>
                      </div>
                    </div>

                    {/* Lista de estados */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Estados Configurados</h5>
                      {configuracion.estados.map((estado: EstadoPersonalizado, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className={`px-3 py-1 rounded-md text-sm font-medium ${estado.color}`}>
                            {estado.nombre}
                          </span>
                          {estado.requerido && (
                            <span className="text-xs text-gray-500">(Requerido)</span>
                          )}
                          <div className="ml-auto flex gap-2">
                            <button
                              onClick={() => handleEliminarEstado(estado.nombre)}
                              className="px-3 py-1 text-sm text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Eliminar estado"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configuración del Formulario */}
                {configSubsection === 'formulario' && configuracion && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Formulario de Items</h4>
                    <p className="text-sm text-gray-600 mb-6">
                      Configura qué campos se muestran en el formulario de agregar/editar items, su orden y si son obligatorios.
                    </p>

                    {/* Botón para abrir modal de nuevo campo */}
                    <div className="mb-6 flex justify-end">
                      <button
                        onClick={() => {
                          setMostrarModalCampoFormulario(true);
                          setNuevoCampoFormulario({
                            nombre: '',
                            seccion: 'Información General',
                            etiqueta: '',
                            obligatorio: false,
                            tipo: 'text'
                          });
                        }}
                        className="px-4 py-2 bg-green-800 text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FaPlus />
                        Agregar Campo Personalizado
                      </button>
                    </div>

                    {configuracion.seccionesFormulario
                      .filter((s: SeccionFormulario) => s.visible)
                      .sort((a: SeccionFormulario, b: SeccionFormulario) => a.orden - b.orden)
                      .map((seccion: SeccionFormulario) => {
                        const camposSeccion = configuracion.formulario
                          .filter((c: CampoFormulario) => c.seccion === seccion.nombre)
                          .sort((a: CampoFormulario, b: CampoFormulario) => a.orden - b.orden);

                        if (camposSeccion.length === 0) return null;

                        return (
                          <div key={seccion.nombre} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h5 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                              {seccion.nombre}
                            </h5>
                          <div className="space-y-2">
                            {camposSeccion.map((campo: CampoFormulario, index: number) => {
                              const puedeSubir = index > 0;
                              const puedeBajar = index < camposSeccion.length - 1;

                              return (
                                <div key={campo.nombre} className="flex items-center gap-3 p-3 bg-white rounded-md border border-gray-200">
                                  <div className="flex items-center gap-2 flex-1">
                                    <button
                                      onClick={() => handleToggleCampoVisible(campo.nombre)}
                                      className={`p-2 rounded-md transition-colors ${
                                        campo.visible
                                          ? 'text-green-800 hover:bg-green-50'
                                          : 'text-gray-400 hover:bg-gray-100'
                                      }`}
                                      title={campo.visible ? 'Ocultar campo' : 'Mostrar campo'}
                                    >
                                      {campo.visible ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">
                                          {campo.etiqueta || campo.nombre}
                                        </span>
                                        {campo.obligatorio && (
                                          <span className="text-xs text-red-600 font-semibold">*</span>
                                        )}
                                        {!campo.visible && (
                                          <span className="text-xs text-gray-400">(Oculto)</span>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500">{campo.nombre}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleToggleCampoObligatorio(campo.nombre)}
                                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                        campo.obligatorio
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                      title={campo.obligatorio ? 'Marcar como opcional' : 'Marcar como obligatorio'}
                                    >
                                      {campo.obligatorio ? 'Obligatorio' : 'Opcional'}
                                    </button>
                                    <div className="flex flex-col gap-1">
                                      <button
                                        onClick={() => handleMoverCampo(campo.nombre, 'arriba')}
                                        disabled={!puedeSubir}
                                        className={`p-1 rounded transition-colors ${
                                          puedeSubir
                                            ? 'text-gray-600 hover:bg-gray-100'
                                            : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        title="Mover arriba"
                                      >
                                        <FaArrowUp className="text-xs" />
                                      </button>
                                      <button
                                        onClick={() => handleMoverCampo(campo.nombre, 'abajo')}
                                        disabled={!puedeBajar}
                                        className={`p-1 rounded transition-colors ${
                                          puedeBajar
                                            ? 'text-gray-600 hover:bg-gray-100'
                                            : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        title="Mover abajo"
                                      >
                                        <FaArrowDown className="text-xs" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleEliminarCampoFormulario(campo.nombre)}
                                      className="px-3 py-1 text-xs text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                      title="Eliminar campo del formulario"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Sección para restaurar campos eliminados */}
                    {(() => {
                      // Definir todos los campos posibles del formulario
                      const todosLosCampos: Array<{ nombre: string; seccion: string; etiqueta: string; orden: number; obligatorio: boolean }> = [
                        // Información General
                        { nombre: 'nombre', seccion: 'Información General', etiqueta: 'Nombre del Equipo', orden: 1, obligatorio: true },
                        { nombre: 'categoria', seccion: 'Información General', etiqueta: 'Categoría', orden: 2, obligatorio: true },
                        { nombre: 'estado', seccion: 'Información General', etiqueta: 'Estado', orden: 3, obligatorio: true },
                        { nombre: 'tipoUso', seccion: 'Información General', etiqueta: 'Tipo de Uso', orden: 4, obligatorio: true },
                        // Ubicación y Responsabilidad
                        { nombre: 'sede', seccion: 'Ubicación y Responsabilidad', etiqueta: 'Sede', orden: 1, obligatorio: true },
                        { nombre: 'ubicacion', seccion: 'Ubicación y Responsabilidad', etiqueta: 'Ubicación', orden: 2, obligatorio: true },
                        { nombre: 'piso', seccion: 'Ubicación y Responsabilidad', etiqueta: 'Piso', orden: 3, obligatorio: false },
                        { nombre: 'edificio', seccion: 'Ubicación y Responsabilidad', etiqueta: 'Edificio', orden: 4, obligatorio: false },
                        { nombre: 'responsable', seccion: 'Ubicación y Responsabilidad', etiqueta: 'Responsable', orden: 5, obligatorio: true },
                        // Especificaciones Técnicas
                        { nombre: 'marca', seccion: 'Especificaciones Técnicas', etiqueta: 'Marca', orden: 1, obligatorio: true },
                        { nombre: 'modelo', seccion: 'Especificaciones Técnicas', etiqueta: 'Modelo', orden: 2, obligatorio: true },
                        { nombre: 'numeroSerie', seccion: 'Especificaciones Técnicas', etiqueta: 'Número de Serie', orden: 3, obligatorio: true },
                        { nombre: 'procesador', seccion: 'Especificaciones Técnicas', etiqueta: 'Procesador', orden: 4, obligatorio: false },
                        { nombre: 'ram', seccion: 'Especificaciones Técnicas', etiqueta: 'RAM', orden: 5, obligatorio: false },
                        { nombre: 'discoDuro', seccion: 'Especificaciones Técnicas', etiqueta: 'Disco Duro', orden: 6, obligatorio: false },
                        // Información de Adquisición
                        { nombre: 'fechaAdquisicion', seccion: 'Información de Adquisición', etiqueta: 'Fecha de Adquisición', orden: 1, obligatorio: false },
                        // Mantenimiento
                        { nombre: 'fechaUltimoMantenimiento', seccion: 'Mantenimiento', etiqueta: 'Último Mantenimiento', orden: 1, obligatorio: false },
                        { nombre: 'proximoMantenimiento', seccion: 'Mantenimiento', etiqueta: 'Próximo Mantenimiento', orden: 2, obligatorio: false },
                        // Observaciones y Descripción
                        { nombre: 'descripcion', seccion: 'Observaciones y Descripción', etiqueta: 'Descripción', orden: 1, obligatorio: false },
                        { nombre: 'observaciones', seccion: 'Observaciones y Descripción', etiqueta: 'Observaciones', orden: 2, obligatorio: false }
                      ];

                      // Encontrar campos que no están en la configuración actual
                      const camposActuales = configuracion.formulario.map((c: CampoFormulario) => c.nombre);
                      const camposEliminados = todosLosCampos.filter(
                        campo => !camposActuales.includes(campo.nombre)
                      );

                      if (camposEliminados.length === 0) return null;

                      return (
                        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h5 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-yellow-300">
                            Campos Eliminados (Click para restaurar)
                          </h5>
                          <div className="space-y-2">
                            {camposEliminados.map((campo) => {
                              const maxOrdenSeccion = configuracion.formulario
                                .filter((c: CampoFormulario) => c.seccion === campo.seccion)
                                .reduce((max: number, c: CampoFormulario) => Math.max(max, c.orden), 0);

                              return (
                                <button
                                  key={campo.nombre}
                                  onClick={() => handleRestaurarCampo(
                                    campo.nombre,
                                    campo.seccion,
                                    campo.etiqueta,
                                    maxOrdenSeccion + 1,
                                    campo.obligatorio
                                  )}
                                  className="w-full text-left p-3 bg-white rounded-md border border-yellow-300 hover:bg-yellow-100 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium text-gray-900">{campo.etiqueta}</span>
                                      <span className="text-xs text-gray-500 ml-2">({campo.nombre})</span>
                                      <span className="text-xs text-gray-400 ml-2">- {campo.seccion}</span>
                                    </div>
                                    <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                                      Restaurar <FaArrowRight />
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {loadingConfig && (
                  <div className="text-center py-8 text-gray-500">
                    Cargando configuración...
                  </div>
                )}
              </div>
            )}
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
            isAdmin={isAdmin}
            usuarios={users}
          />
        )}

        {/* Modal para agregar nuevo campo personalizado */}
        {mostrarModalCampoFormulario && configuracion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Campo Personalizado</h3>
                <button
                  onClick={() => {
                    setMostrarModalCampoFormulario(false);
                    setNuevoCampoFormulario({
                      nombre: '',
                      seccion: 'Información General',
                      etiqueta: '',
                      obligatorio: false,
                      tipo: 'text'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cerrar"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Nombre del Campo (técnico) *
                    </label>
                    <input
                      type="text"
                      value={nuevoCampoFormulario.nombre}
                      onChange={(e) => setNuevoCampoFormulario({ ...nuevoCampoFormulario, nombre: e.target.value })}
                      placeholder="Ej: precio, proveedor, numeroFactura"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Se convertirá a minúsculas y sin espacios</p>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Etiqueta (lo que verá el usuario) *
                    </label>
                    <input
                      type="text"
                      value={nuevoCampoFormulario.etiqueta}
                      onChange={(e) => setNuevoCampoFormulario({ ...nuevoCampoFormulario, etiqueta: e.target.value })}
                      placeholder="Ej: Precio, Proveedor, Número de Factura"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Sección
                    </label>
                    <select
                      value={nuevoCampoFormulario.seccion}
                      onChange={(e) => setNuevoCampoFormulario({ ...nuevoCampoFormulario, seccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                    >
                      {configuracion?.seccionesFormulario
                        ?.filter((s: SeccionFormulario) => s.visible)
                        .sort((a: SeccionFormulario, b: SeccionFormulario) => a.orden - b.orden)
                        .map((seccion: SeccionFormulario) => (
                          <option key={seccion.nombre} value={seccion.nombre}>{seccion.nombre}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Tipo de Campo
                    </label>
                    <select
                      value={nuevoCampoFormulario.tipo}
                      onChange={(e) => setNuevoCampoFormulario({ ...nuevoCampoFormulario, tipo: e.target.value as 'text' | 'number' | 'date' | 'select' | 'textarea' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                      <option value="textarea">Área de Texto</option>
                      <option value="select">Selector</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={nuevoCampoFormulario.obligatorio}
                      onChange={(e) => setNuevoCampoFormulario({ ...nuevoCampoFormulario, obligatorio: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Campo obligatorio</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAgregarCampoFormulario}
                    disabled={!nuevoCampoFormulario.nombre.trim() || !nuevoCampoFormulario.etiqueta.trim()}
                    className="flex-1 px-4 py-2 bg-green-800 text-white hover:bg-green-900 rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Agregar Campo
                  </button>
                  <button
                    onClick={() => {
                      setMostrarModalCampoFormulario(false);
                      setNuevoCampoFormulario({
                        nombre: '',
                        seccion: 'Información General',
                        etiqueta: '',
                        obligatorio: false,
                        tipo: 'text'
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
  );
}

