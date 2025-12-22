# 🔧 Solucionar Problema: Solo se guardan categorías, no items

## 🔍 Diagnóstico

Si solo aparece la colección `categorias` en Firestore pero no `items`, el problema más probable son las **reglas de Firestore**.

## ✅ Solución Paso a Paso

### 1. Verificar Reglas de Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `inventariost-8c720`
3. Ve a **Firestore Database** > **Reglas** (pestaña en la parte superior)
4. Verifica que las reglas sean exactamente estas:

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

### 2. Publicar las Reglas

1. **IMPORTANTE**: Haz clic en el botón **"Publicar"** (arriba a la derecha)
2. Espera a que aparezca el mensaje de confirmación
3. Las reglas pueden tardar unos segundos en aplicarse

### 3. Verificar que las Reglas se Aplicaron

1. Recarga la página de la aplicación
2. Intenta agregar un dispositivo
3. Abre la consola del navegador (F12)
4. Deberías ver: `✅ Item agregado exitosamente a Firestore`

### 4. Verificar en Firestore

1. Ve a Firebase Console > Firestore Database
2. Deberías ver DOS colecciones:
   - ✅ `categorias`
   - ✅ `items` ← Esta debería aparecer ahora

## 🆘 Si Sigue Sin Funcionar

### Verificar Errores en la Consola

1. Abre la consola del navegador (F12)
2. Agrega un dispositivo
3. Busca mensajes que empiecen con:
   - `❌ Error al agregar item`
   - `❌ PERMISO DENEGADO`
   - `permission-denied`

### Errores Comunes

#### Error: `permission-denied`
**Causa**: Las reglas de Firestore están bloqueando la escritura
**Solución**: 
1. Ve a Firestore Database > Reglas
2. Asegúrate de que las reglas permitan `write: if true`
3. Haz clic en "Publicar"
4. Espera unos segundos y recarga la aplicación

#### Error: `failed-precondition`
**Causa**: Falta un índice para ordenar
**Solución**: El código ahora maneja esto automáticamente, pero si persiste:
1. Ve a Firestore Database > Índices
2. Crea un índice compuesto para `items` con campo `nombre` ascendente

#### No aparece ningún error
**Posibles causas**:
1. Las reglas no se publicaron correctamente
2. Hay un error silencioso
3. El código no está llegando a la función addItem

**Solución**:
1. Verifica en la consola si ves `🔵 Intentando agregar item a Firestore...`
2. Si no ves ese mensaje, el formulario no está llamando a la función
3. Si ves el mensaje pero no `✅ Item agregado`, hay un error que se está silenciando

## 📋 Checklist de Verificación

- [ ] Las reglas de Firestore permiten `write: if true`
- [ ] Las reglas están publicadas (botón "Publicar" presionado)
- [ ] Firestore está activado en Firebase Console
- [ ] El archivo `.env` tiene todas las variables configuradas
- [ ] El servidor de desarrollo fue reiniciado después de crear `.env`
- [ ] La consola del navegador muestra `✅ Firebase inicializado correctamente`
- [ ] La consola muestra `🔵 Intentando agregar item a Firestore...` al agregar un dispositivo

## 🧪 Prueba Rápida

1. Abre la consola del navegador (F12)
2. Agrega un dispositivo nuevo
3. Deberías ver estos mensajes en orden:
   ```
   🔵 handleSaveItem llamado con: {...}
   🔵 Agregando nuevo item
   🔵 Datos a guardar (sin id): {...}
   🔵 Intentando agregar item a Firestore...
   🔵 Datos del item: {...}
   ✅ Item agregado exitosamente a Firestore
   ✅ ID del documento: [algún-id]
   ```
4. Ve a Firebase Console > Firestore Database
5. Deberías ver la colección `items` con el nuevo documento

## 💡 Nota Importante

Las reglas que permiten `write: if true` son **solo para desarrollo**. 
Para producción, deberías implementar autenticación y reglas más restrictivas.

