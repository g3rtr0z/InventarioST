/**
 * Servicio de seguridad para rate limiting y detección de fuerza bruta
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface IPRecord {
  attempts: AttemptRecord;
  blocked: boolean;
  blockedUntil?: number;
}

// Almacenamiento en memoria (en producción debería ser Redis o similar)
const attemptStorage = new Map<string, IPRecord>();

// Configuración de seguridad
const SECURITY_CONFIG = {
  // Máximo de intentos fallidos antes de bloquear
  MAX_FAILED_ATTEMPTS: 5,
  // Tiempo de bloqueo en milisegundos (15 minutos)
  BLOCK_DURATION: 15 * 60 * 1000,
  // Ventana de tiempo para contar intentos (5 minutos)
  ATTEMPT_WINDOW: 5 * 60 * 1000,
  // Tiempo entre intentos permitidos (2 segundos)
  MIN_TIME_BETWEEN_ATTEMPTS: 2000,
  // Máximo de intentos por ventana de tiempo
  MAX_ATTEMPTS_PER_WINDOW: 10
};

/**
 * Obtiene la IP del cliente (simulado, en producción usar headers reales)
 */
function getClientIdentifier(): string {
  // En producción, esto debería obtener la IP real del cliente
  // Por ahora usamos una combinación de user agent y timestamp
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const identifier = btoa(userAgent).substring(0, 16);
  return `client_${identifier}`;
}

/**
 * Limpia registros antiguos para evitar acumulación de memoria
 */
function cleanupOldRecords(): void {
  const now = Date.now();
  const maxAge = SECURITY_CONFIG.ATTEMPT_WINDOW * 2;

  for (const [key, record] of attemptStorage.entries()) {
    if (record.attempts.lastAttempt < now - maxAge) {
      attemptStorage.delete(key);
    }
  }
}

/**
 * Verifica si un intento está permitido según rate limiting
 */
export function checkRateLimit(): { allowed: boolean; retryAfter?: number; error?: string } {
  cleanupOldRecords();
  
  const identifier = getClientIdentifier();
  const now = Date.now();
  const record = attemptStorage.get(identifier);

  // Si no hay registro, permitir
  if (!record) {
    return { allowed: true };
  }

  // Verificar si está bloqueado
  if (record.blocked && record.blockedUntil) {
    if (now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        error: `Demasiados intentos fallidos. Intenta nuevamente en ${Math.ceil(retryAfter / 60)} minutos.`
      };
    } else {
      // Bloqueo expirado, resetear
      record.blocked = false;
      record.blockedUntil = undefined;
      record.attempts.count = 0;
    }
  }

  // Verificar tiempo mínimo entre intentos
  const timeSinceLastAttempt = now - record.attempts.lastAttempt;
  if (timeSinceLastAttempt < SECURITY_CONFIG.MIN_TIME_BETWEEN_ATTEMPTS) {
    const retryAfter = Math.ceil((SECURITY_CONFIG.MIN_TIME_BETWEEN_ATTEMPTS - timeSinceLastAttempt) / 1000);
    return {
      allowed: false,
      retryAfter,
      error: `Espera ${retryAfter} segundos antes de intentar nuevamente.`
    };
  }

  // Verificar ventana de tiempo
  const windowStart = now - SECURITY_CONFIG.ATTEMPT_WINDOW;
  if (record.attempts.firstAttempt < windowStart) {
    // Resetear contador si la ventana expiró
    record.attempts.count = 0;
    record.attempts.firstAttempt = now;
  }

  // Verificar máximo de intentos por ventana
  if (record.attempts.count >= SECURITY_CONFIG.MAX_ATTEMPTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.attempts.firstAttempt + SECURITY_CONFIG.ATTEMPT_WINDOW - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      error: `Demasiados intentos. Intenta nuevamente en ${Math.ceil(retryAfter / 60)} minutos.`
    };
  }

  return { allowed: true };
}

/**
 * Registra un intento fallido de autenticación
 */
export function recordFailedAttempt(): { blocked: boolean; blockedUntil?: number } {
  cleanupOldRecords();
  
  const identifier = getClientIdentifier();
  const now = Date.now();
  
  let record = attemptStorage.get(identifier);
  
  if (!record) {
    record = {
      attempts: {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      },
      blocked: false
    };
  }

  // Actualizar registro de intentos
  record.attempts.count++;
  record.attempts.lastAttempt = now;

  if (record.attempts.firstAttempt === 0) {
    record.attempts.firstAttempt = now;
  }

  // Verificar si debe bloquearse
  if (record.attempts.count >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
    record.blocked = true;
    record.blockedUntil = now + SECURITY_CONFIG.BLOCK_DURATION;
    record.attempts.blockedUntil = record.blockedUntil;
    
    return {
      blocked: true,
      blockedUntil: record.blockedUntil
    };
  }

  attemptStorage.set(identifier, record);
  
  return { blocked: false };
}

/**
 * Registra un intento exitoso y resetea el contador
 */
export function recordSuccessfulAttempt(): void {
  const identifier = getClientIdentifier();
  attemptStorage.delete(identifier);
}

/**
 * Obtiene el estado actual de intentos para debugging
 */
export function getSecurityStatus(): {
  attempts: number;
  blocked: boolean;
  blockedUntil?: number;
  retryAfter?: number;
} {
  const identifier = getClientIdentifier();
  const record = attemptStorage.get(identifier);
  
  if (!record) {
    return { attempts: 0, blocked: false };
  }

  const now = Date.now();
  const retryAfter = record.blockedUntil && record.blockedUntil > now
    ? Math.ceil((record.blockedUntil - now) / 1000)
    : undefined;

  return {
    attempts: record.attempts.count,
    blocked: record.blocked || false,
    blockedUntil: record.blockedUntil,
    retryAfter
  };
}

/**
 * Resetea el estado de seguridad (útil para testing)
 */
export function resetSecurityStatus(): void {
  attemptStorage.clear();
}

