import { useState, useEffect } from 'react';
import { getAllUsers, changeUserRole, toggleUserStatus, type UserInfo, type UserRole } from '../services/userRoleService';

interface UserManagerProps {
  isAdmin: boolean;
  currentUserEmail: string;
}

export default function UserManager({ isAdmin, currentUserEmail }: UserManagerProps) {
  const [showManager, setShowManager] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (showManager && isAdmin) {
      loadUsers();
    }
  }, [showManager, isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userEmail: string, newRole: UserRole) => {
    if (!window.confirm(`¿Estás seguro de cambiar el rol de ${userEmail} a ${newRole}?`)) {
      return;
    }

    setError(null);
    try {
      await changeUserRole(userEmail, newRole);
      await loadUsers(); // Recargar lista
    } catch (err) {
      setError('Error al cambiar el rol del usuario');
      console.error(err);
    }
  };

  const handleToggleStatus = async (userEmail: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${action} al usuario ${userEmail}?`)) {
      return;
    }

    setError(null);
    try {
      await toggleUserStatus(userEmail, !currentStatus);
      await loadUsers(); // Recargar lista
    } catch (err) {
      setError('Error al cambiar el estado del usuario');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadgeColor = (role: UserRole) => {
    return role === 'administrador' 
      ? 'bg-purple-100 text-purple-700 border-purple-200' 
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

  // Si no es administrador, no mostrar el botón
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        className="px-3 py-2.5 bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors text-sm"
        title="Gestionar Usuarios"
      >
        👥 Usuarios
      </button>

      {showManager && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h2>
              <button
                onClick={() => setShowManager(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {/* Búsqueda */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Botón recargar */}
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total de usuarios: <span className="font-semibold">{filteredUsers.length}</span>
                </div>
                <button
                  onClick={loadUsers}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-md transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : '🔄 Recargar'}
                </button>
              </div>

              {/* Lista de usuarios */}
              {loading && users.length === 0 ? (
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
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                            className={`px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end rounded-b-lg">
              <button
                onClick={() => setShowManager(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 hover:bg-gray-400 rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

