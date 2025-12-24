# Documentación de Seguridad

Este documento describe las medidas de seguridad implementadas en la aplicación de Inventario ST.

## Medidas de Seguridad Implementadas

### 1. Protección contra XSS (Cross-Site Scripting)

#### Sanitización de Inputs
- **Archivo**: `src/utils/security.ts`
- **Funciones**: `sanitizeInput()`, `sanitizeText()`, `validateNoXSS()`
- **Descripción**: Todos los inputs del usuario son sanitizados para prevenir la inyección de código JavaScript malicioso.

#### Implementación:
- Escapado de caracteres HTML especiales (`<`, `>`, `&`, `"`, `'`, `/`)
- Eliminación de tags peligrosos (`<script>`, `<iframe>`, eventos `on*`)
- Validación de patrones XSS comunes

### 2. Rate Limiting y Protección contra Fuerza Bruta

#### Sistema de Rate Limiting
- **Archivo**: `src/services/securityService.ts`
- **Configuración**:
  - Máximo de intentos fallidos: **5 intentos**
  - Duración de bloqueo: **15 minutos**
  - Ventana de tiempo para contar intentos: **5 minutos**
  - Tiempo mínimo entre intentos: **2 segundos**
  - Máximo de intentos por ventana: **10 intentos**

#### Funcionalidades:
- `checkRateLimit()`: Verifica si un intento está permitido
- `recordFailedAttempt()`: Registra un intento fallido y bloquea si es necesario
- `recordSuccessfulAttempt()`: Resetea el contador tras un login exitoso
- Bloqueo automático de IP/cliente después de múltiples intentos fallidos

### 3. Protección contra Inyección SQL

#### Validación de Patrones
- **Archivo**: `src/utils/security.ts`
- **Función**: `validateNoSQLInjection()`
- **Descripción**: Aunque Firestore no es SQL, se valida contra patrones comunes de inyección SQL como medida preventiva.

#### Patrones detectados:
- Comandos SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.)
- Comentarios SQL (`--`, `#`, `/* */`)
- Operadores lógicos maliciosos (`OR 1=1`, `AND 1=1`)
- Comandos de procedimientos almacenados (`xp_`, `sp_`)

### 4. Validación de Contraseñas

#### Criterios de Seguridad
- **Archivo**: `src/utils/security.ts`
- **Función**: `validatePassword()`
- **Requisitos**:
  - Longitud mínima: **8 caracteres**
  - Longitud máxima: **128 caracteres**
  - Validación contra caracteres peligrosos
  - Validación contra patrones de inyección

### 5. Validación de Emails

#### Sanitización y Validación
- **Archivo**: `src/utils/security.ts`
- **Función**: `validateAndSanitizeEmail()`
- **Validaciones**:
  - Formato de email válido
  - Longitud máxima: **254 caracteres**
  - Sanitización de caracteres peligrosos

### 6. Content Security Policy (CSP)

#### Headers de Seguridad
- **Archivo**: `src/hooks/useSecurityHeaders.ts`
- **Hook**: `useSecurityHeaders()`
- **Políticas implementadas**:
  - `default-src 'self'`: Solo recursos del mismo origen
  - `script-src`: Permite scripts necesarios de Firebase
  - `style-src 'self' 'unsafe-inline'`: Estilos locales
  - `frame-src 'none'`: Bloquea iframes
  - `object-src 'none'`: Bloquea objetos embebidos
  - `frame-ancestors 'none'`: Previene clickjacking

#### Otros Headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Restringe geolocalización, micrófono y cámara

### 7. Protección contra Clickjacking

- Verificación periódica de que la aplicación no está siendo embebida en un iframe
- Redirección automática si se detecta un iframe malicioso

### 8. Sanitización de Datos en Formularios

#### Componente ItemForm
- **Archivo**: `src/components/ItemForm.tsx`
- Todos los campos de texto son sanitizados antes de guardarse
- Validación contra XSS e inyección SQL en tiempo real
- Sanitización final antes de enviar datos a Firebase

### 9. Autenticación Segura

#### Login Component
- **Archivo**: `src/components/Login.tsx`
- Validación de rate limiting antes de cada intento
- Sanitización de email y contraseña
- Validación contra XSS e inyección SQL
- Manejo seguro de errores sin exponer información sensible

## Configuración Recomendada en Firebase

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para items
    match /items/{itemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.keys().hasAll(['nombre', 'categoria', 'marca', 'modelo'])
                    && request.resource.data.nombre is string
                    && request.resource.data.nombre.size() > 0
                    && request.resource.data.nombre.size() <= 200;
      allow update: if request.auth != null
                    && request.resource.data.nombre is string
                    && request.resource.data.nombre.size() > 0
                    && request.resource.data.nombre.size() <= 200;
      allow delete: if request.auth != null;
    }
    
    // Reglas para categorías y sedes
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Firebase Authentication

1. Habilitar **Email/Password** en Authentication
2. Configurar políticas de contraseña:
   - Longitud mínima: 8 caracteres
   - Requerir mayúsculas y números (recomendado)
3. Habilitar protección contra fuerza bruta en Firebase Console

## Mejores Prácticas Adicionales

### Para Producción

1. **Rate Limiting en Servidor**: Implementar rate limiting en el backend o usar Firebase App Check
2. **Logging de Seguridad**: Registrar intentos de acceso fallidos
3. **Monitoreo**: Configurar alertas para múltiples intentos fallidos
4. **HTTPS Obligatorio**: Asegurar que toda la comunicación sea HTTPS
5. **Tokens de Renovación**: Implementar renovación automática de tokens
6. **Validación en Backend**: Nunca confiar solo en validación del cliente

### Limitaciones Actuales

1. **Rate Limiting en Cliente**: El rate limiting actual es en memoria del cliente. Para producción, debería implementarse en el servidor.
2. **Identificación de IP**: Actualmente se usa un identificador basado en User Agent. En producción, debería obtenerse la IP real del cliente.
3. **Almacenamiento de Intentos**: Los intentos se almacenan en memoria. Para producción, usar Redis o base de datos.

## Actualizaciones de Seguridad

Para mantener la aplicación segura:

1. Mantener dependencias actualizadas
2. Revisar logs de seguridad regularmente
3. Actualizar reglas de Firestore según necesidades
4. Monitorear intentos de acceso sospechosos
5. Realizar auditorías de seguridad periódicas

## Contacto

Para reportar vulnerabilidades de seguridad, contactar al administrador del sistema.

