# 🔐 Asignar Roles de Administrador

Este documento explica cómo asignar el rol de administrador a usuarios en el sistema de inventario.

## 📋 Descripción

El sistema ahora incluye un control de roles que separa las funcionalidades entre usuarios regulares y administradores:

- **Usuarios regulares**: Pueden ver y editar items, pero NO pueden:
  - Cambiar la categoría de un item
  - Cambiar la sede de un item
  - Gestionar categorías (agregar/eliminar)
  - Gestionar sedes (agregar/eliminar)

- **Administradores**: Tienen acceso completo a todas las funcionalidades, incluyendo:
  - Cambiar categorías y sedes en items
  - Gestionar la lista de categorías
  - Gestionar la lista de sedes

## 🔧 Cómo Asignar Rol de Administrador

### Opción 1: Desde la Interfaz de Usuarios (Recomendado) ⭐

**Esta es la forma más fácil y recomendada:**

1. Inicia sesión como administrador
2. Haz clic en el botón **"👥 Usuarios"** en la barra de herramientas
3. En la lista de usuarios, busca el usuario al que quieres cambiar el rol
4. En la columna de acciones, selecciona el rol deseado del menú desplegable:
   - **Usuario**: Rol regular (sin permisos administrativos)
   - **Administrador**: Rol con permisos completos
5. Confirma el cambio cuando se te solicite
6. El cambio se aplicará inmediatamente

**Nota**: No puedes cambiar tu propio rol por seguridad.

### Opción 2: Desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Crea o verifica que existe la colección `userRoles`
5. Crea un documento con:
   - **ID del documento**: El email del usuario (ej: `usuario@ejemplo.com`)
   - **Campo**: `role`
   - **Valor**: `administrador`

**Ejemplo de estructura:**
```
Colección: userRoles
  └── Documento ID: usuario@ejemplo.com
      └── role: "administrador"
```

### Opción 3: Desde la Consola del Navegador (Desarrollo)

Si estás en modo desarrollo, puedes ejecutar este código en la consola del navegador:

```javascript
// Importar las funciones necesarias (esto requiere acceso al código)
import { setUserRole } from './services/userRoleService';

// Asignar rol de administrador
await setUserRole('usuario@ejemplo.com', 'administrador');
```

### Opción 4: Crear un Script Temporal

Puedes crear un archivo temporal `assignAdmin.ts` en la raíz del proyecto:

```typescript
import { setUserRole } from './src/services/userRoleService';

async function assignAdmin() {
  const userEmail = 'usuario@ejemplo.com'; // Cambiar por el email del usuario
  try {
    await setUserRole(userEmail, 'administrador');
    console.log(`✅ Rol de administrador asignado a ${userEmail}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignAdmin();
```

Luego ejecutar:
```bash
npx ts-node assignAdmin.ts
```

## 📝 Notas Importantes

1. **Registro automático**: Cuando un usuario inicia sesión por primera vez, se registra automáticamente en el sistema con rol `usuario`.
2. **Por defecto**: Todos los usuarios nuevos tienen el rol `usuario` automáticamente.
3. **Gestión desde interfaz**: Los administradores pueden gestionar usuarios directamente desde la interfaz sin necesidad de acceder a Firebase Console.

2. **Roles disponibles**:
   - `usuario`: Usuario regular (sin permisos administrativos)
   - `administrador`: Usuario con permisos completos

3. **Seguridad**: Asegúrate de proteger las reglas de Firestore para que solo administradores puedan modificar roles. Ejemplo de reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para roles de usuario
    match /userRoles/{userEmail} {
      allow read: if request.auth != null;
      // Solo permitir escritura si el usuario es administrador
      allow write: if request.auth != null 
                  && exists(/databases/$(database)/documents/userRoles/$(request.auth.token.email))
                  && get(/databases/$(database)/documents/userRoles/$(request.auth.token.email)).data.role == 'administrador';
    }
    
    // Otras reglas...
  }
}
```

## 🔍 Verificar el Rol de un Usuario

Para verificar el rol de un usuario, puedes:

1. **Desde Firebase Console**: Buscar el documento en la colección `userRoles` con el email del usuario.

2. **Desde el código**: El hook `useUserRole` se encarga automáticamente de verificar el rol cuando un usuario inicia sesión.

## ⚠️ Solución de Problemas

### El usuario no tiene permisos aunque es administrador

1. Verifica que el documento en Firestore tenga exactamente el campo `role` con valor `administrador` (en minúsculas).
2. Verifica que el ID del documento sea exactamente el email del usuario.
3. Recarga la aplicación para que el hook actualice el rol.

### No puedo crear documentos en Firestore

1. Verifica las reglas de Firestore (ver sección de Seguridad arriba).
2. Asegúrate de estar autenticado en Firebase.
3. Verifica que Firestore esté activado en tu proyecto.

