import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { getUserRole, isUserAdmin, registerUser, type UserRole } from '../services/userRoleService';

export function useUserRole(user: User | null) {
  const [userRole, setUserRole] = useState<UserRole>('usuario');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.email) {
      setUserRole('usuario');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      try {
        setLoading(true);
        // Registrar/actualizar usuario en Firestore
        await registerUser(user.email!, user.displayName || undefined, new Date().toISOString());
        
        // Obtener rol del usuario
        const role = await getUserRole(user.email!);
        const admin = await isUserAdmin(user.email);
        setUserRole(role);
        setIsAdmin(admin);
      } catch (error) {
        console.error('Error al verificar rol de usuario:', error);
        setUserRole('usuario');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user]);

  return { userRole, isAdmin, loading };
}

