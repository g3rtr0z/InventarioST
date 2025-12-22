# 🔍 Verificar por qué no se guardan los datos en Firestore

## Pasos para Diagnosticar

### 1. Abre la Consola del Navegador (F12)

Al agregar un dispositivo, deberías ver mensajes como:
- ✅ `🔵 Intentando agregar item a Firestore...`
- ✅ `✅ Item agregado exitosamente a Firestore`

Si ves errores, anota el código de error (ej: `permission-denied`)

### 2. Verificar Reglas de Firestore

**Este es el problema más común:**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Reglas**
4. Asegúrate de que las reglas sean:

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

5. Haz clic en **"Publicar"**

⚠️ **IMPORTANTE**: Estas reglas permiten acceso completo. Solo para desarrollo.

### 3. Verificar que Firestore esté Activo

1. En Firebase Console, ve a **Firestore Database**
2. Deberías ver la interfaz de Firestore
3. Si no está creado, haz clic en **"Crear base de datos"**

### 4. Verificar Variables de Entorno

Abre la consola del navegador y busca estos mensajes al iniciar:
- ✅ `🔥 Inicializando Firebase...`
- ✅ `🔥 Project ID: tu-proyecto-id`
- ✅ `✅ Firebase inicializado correctamente`
- ✅ `✅ Firestore conectado`

Si ves `⚠️ Firebase no está configurado`, verifica tu archivo `.env`

### 5. Errores Comunes y Soluciones

#### Error: `permission-denied`
**Solución**: Actualiza las reglas de Firestore (ver paso 2)

#### Error: `unavailable`
**Solución**: Verifica tu conexión a internet

#### Error: `invalid-argument`
**Solución**: Verifica que todos los campos requeridos estén completos

#### No aparece ningún error pero no se guarda
**Solución**: 
1. Verifica las reglas de Firestore
2. Verifica que Firestore esté activado
3. Revisa la consola del navegador para mensajes de error

### 6. Verificar en Firebase Console

Después de agregar un dispositivo:
1. Ve a Firebase Console > Firestore Database
2. Deberías ver la colección `items`
3. Haz clic en `items` para ver los documentos
4. Deberías ver el dispositivo recién agregado

## Prueba Rápida

1. Abre la consola del navegador (F12)
2. Agrega un dispositivo
3. Revisa los mensajes en la consola
4. Comparte los mensajes que veas (especialmente los errores)

