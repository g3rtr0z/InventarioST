# 🔒 Solución Rápida: Error "Missing or insufficient permissions"

## 🚨 Problema

Si ves este error en la consola:
```
❌ Error no recuperable en subscribeToItems: FirebaseError: Missing or insufficient permissions.
```

**Causa**: Las reglas de Firestore están bloqueando el acceso a los datos.

## ✅ Solución en 5 Pasos

### Paso 1: Abre Firebase Console
1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu proyecto (ej: `inventariost-8c720`)

### Paso 2: Ve a Firestore Database
1. En el menú lateral izquierdo, haz clic en **"Firestore Database"**
2. Haz clic en la pestaña **"Reglas"** (arriba, junto a "Datos")

### Paso 3: Configura las Reglas
Copia y pega exactamente estas reglas en el editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Paso 4: Publica las Reglas
1. **IMPORTANTE**: Haz clic en el botón **"Publicar"** (arriba a la derecha)
2. Espera a que aparezca el mensaje de confirmación: "Reglas publicadas correctamente"
3. Las reglas pueden tardar 10-30 segundos en aplicarse

### Paso 5: Recarga la Aplicación
1. Vuelve a tu aplicación
2. Recarga la página (F5 o Ctrl+R)
3. Los datos deberían aparecer ahora

## ✅ Verificación

Después de configurar las reglas, deberías ver en la consola del navegador:

```
🔥 Inicializando Firebase...
✅ Firebase inicializado correctamente
✅ Firestore conectado
🔵 Iniciando suscripción a items de Firestore...
✅ Recibidos X items de Firestore
```

## 🆘 Si Sigue Sin Funcionar

### Verifica que las Reglas se Publicaron
1. Ve a Firestore Database > Reglas
2. Verifica que las reglas que configuraste estén ahí
3. Si no están, vuelve a copiarlas y haz clic en "Publicar"

### Verifica que Firestore esté Activo
1. En Firebase Console, ve a Firestore Database
2. Deberías ver la interfaz de Firestore (no un botón de "Crear base de datos")
3. Si no está creado, haz clic en "Crear base de datos" y selecciona "Modo de prueba"

### Verifica la Autenticación
1. Asegúrate de estar autenticado en la aplicación
2. Si no puedes iniciar sesión, verifica que Authentication esté habilitado en Firebase Console

### Limpia la Caché del Navegador
1. Presiona Ctrl+Shift+Delete
2. Selecciona "Caché" y "Datos de sitios"
3. Haz clic en "Limpiar datos"
4. Recarga la página

## ⚠️ Nota de Seguridad

Las reglas `allow read, write: if true` permiten acceso completo a todos los datos. 
**Esto es solo para desarrollo**. 

Para producción, deberías implementar reglas más restrictivas que requieran autenticación:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /items/{itemId} {
      allow read, write: if request.auth != null;
    }
    match /categorias/{categoriaId} {
      allow read, write: if request.auth != null;
    }
    match /sedes/{sedeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📞 ¿Necesitas Más Ayuda?

Si después de seguir estos pasos el problema persiste:
1. Abre la consola del navegador (F12)
2. Copia todos los mensajes de error que veas
3. Verifica que las reglas estén publicadas correctamente
4. Revisa que Firestore esté activado en tu proyecto

