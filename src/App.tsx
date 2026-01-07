import { useState, useEffect, useRef } from 'react';
import type { ItemInventario } from './types/inventario';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
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
import { isUserActive } from './services/userRoleService';

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
  const { isAdmin, loading: loadingRole } = useUserRole(user);
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
  const [sedes, setSedes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
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
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const isAuthenticated = !!currentUser;
      
      // Si hay un usuario autenticado, verificar si está activo
      if (isAuthenticated && currentUser?.email && auth) {
        try {
          const userActive = await isUserActive(currentUser.email);
          if (!userActive) {
            // Si el usuario está desactivado, cerrar sesión
            await signOut(auth);
            setUser(null);
            setCheckingAuth(false);
            return;
          }
        } catch (err) {
          console.error('Error al verificar estado de usuario:', err);
          // En caso de error, permitir acceso
        }
      }
      
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

  // Items filtrados también por búsqueda (para mostrar en la lista)
  const filteredAndSearchedItems = filteredItems.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.responsable.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Mostrar login si no está autenticado
  if (checkingAuth) {
    return null;
  }

  if (!user) {
    return <Login />;
  }

  if (loading || loadingRole) {
    return <Loader />;
  }

  // Si es administrador, mostrar el panel de administración como vista principal
  if (isAdmin) {
    const filteredItems = items.filter(item => {
      const matchesEstado = filterEstado === 'Todos' || item.estado === filterEstado;
      const matchesCategoria = filterCategoria === 'Todas' || item.categoria === filterCategoria;
      const matchesSede = filterSede === 'Todas' || item.sede === filterSede;
      const matchesTipoUso = filterTipoUso === 'Todos' || item.tipoUso === filterTipoUso;
      return matchesEstado && matchesCategoria && matchesSede && matchesTipoUso;
    });

    const filteredAndSearchedItems = filteredItems.filter(item =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numeroFactura?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <AdminPanel
        isAdmin={isAdmin}
        currentUserEmail={user?.email || ''}
        categorias={categorias}
        sedes={sedes}
        items={items}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        filterCategoria={filterCategoria}
        setFilterCategoria={setFilterCategoria}
        filterSede={filterSede}
        setFilterSede={setFilterSede}
        filterTipoUso={filterTipoUso}
        setFilterTipoUso={setFilterTipoUso}
        onCategoriasChange={handleCategoriasChange}
        onSedesChange={handleSedesChange}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onSaveItem={handleSaveItem}
        onCancelForm={handleCancelForm}
        showForm={showForm}
        editingItem={editingItem}
        filteredAndSearchedItems={filteredAndSearchedItems}
        onExportExcel={handleExportExcel}
        onLogout={handleLogout}
      />
    );
  }

  // Si es usuario normal, mostrar el panel de usuario
  return (
    <UserPanel
      currentUserEmail={user?.email || ''}
      categorias={categorias}
      sedes={sedes}
      items={items}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      viewMode={viewMode}
      setViewMode={setViewMode}
      filterEstado={filterEstado}
      setFilterEstado={setFilterEstado}
      filterCategoria={filterCategoria}
      setFilterCategoria={setFilterCategoria}
      filterSede={filterSede}
      setFilterSede={setFilterSede}
      filterTipoUso={filterTipoUso}
      setFilterTipoUso={setFilterTipoUso}
      onAddItem={handleAddItem}
      onEditItem={handleEditItem}
      onDeleteItem={handleDeleteItem}
      onSaveItem={handleSaveItem}
      onCancelForm={handleCancelForm}
      showForm={showForm}
      editingItem={editingItem}
      filteredAndSearchedItems={filteredAndSearchedItems}
      onExportExcel={handleExportExcel}
      onLogout={handleLogout}
    />
  );
}

export default App;
