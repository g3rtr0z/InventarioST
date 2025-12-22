# 🔥 Cómo Configurar Firebase - Guía Paso a Paso

## 📋 Paso 1: Obtener las Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Haz clic en el ícono de **⚙️ Configuración** (arriba a la izquierda)
4. Desplázate hacia abajo hasta **"Tus aplicaciones"**
5. Si no tienes una app web, haz clic en el ícono **`</>`** (Web)
6. Registra tu app con un nombre (ej: "Inventario Web")
7. **NO marques** "También configura Firebase Hosting"
8. Haz clic en **"Registrar app"**
9. **Copia las credenciales** que aparecen (deberías ver algo como esto):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 📝 Paso 2: Crear el Archivo .env

1. En la raíz del proyecto (`inventario-st/`), crea un archivo llamado `.env`
2. **IMPORTANTE**: El archivo debe llamarse exactamente `.env` (con el punto al inicio)
3. Copia y pega el siguiente contenido, reemplazando los valores con los tuyos:

```env
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### Ejemplo Real:

```env
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=inventario-st.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=inventario-st
VITE_FIREBASE_STORAGE_BUCKET=inventario-st.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## ✅ Paso 3: Verificar que Firestore esté Activo

1. En Firebase Console, ve a **Firestore Database**
2. Si no está creado, haz clic en **"Crear base de datos"**
3. Selecciona **"Modo de prueba"**
4. Elige una ubicación (ej: `us-central`)
5. Haz clic en **"Habilitar"**

## 🔒 Paso 4: Configurar Reglas de Firestore (Temporal)

En la pestaña **"Reglas"** de Firestore, pega esto:

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

Haz clic en **"Publicar"**.

⚠️ **Nota**: Estas reglas permiten acceso completo. Solo para desarrollo.

## 🔄 Paso 5: Reiniciar el Servidor

1. **Detén** el servidor de desarrollo (Ctrl+C en la terminal)
2. **Reinicia** el servidor:

```bash
npm run dev
```

## ✅ Verificación

Después de reiniciar, deberías ver:
- ✅ El mensaje "Modo local activo" debería desaparecer
- ✅ Los datos se guardarán en Firebase (no solo en localStorage)
- ✅ Puedes ver tus datos en Firebase Console > Firestore Database

## 🆘 Solución de Problemas

### El mensaje sigue apareciendo:
1. Verifica que el archivo `.env` esté en la raíz del proyecto (`inventario-st/.env`)
2. Verifica que todas las variables empiecen con `VITE_`
3. Verifica que no haya espacios alrededor del `=`
4. Reinicia el servidor completamente

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Verifica que copiaste correctamente el `apiKey` desde Firebase Console
- Asegúrate de que no haya espacios o comillas extra

### Los datos no se guardan:
- Abre la consola del navegador (F12) y revisa si hay errores
- Verifica que Firestore esté activado en Firebase Console
- Verifica las reglas de Firestore

## 📍 Ubicación del Archivo .env

El archivo `.env` debe estar aquí:
```
inventario-st/
  ├── .env          ← AQUÍ
  ├── package.json
  ├── src/
  └── ...
```

