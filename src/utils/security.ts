/**
 * Utilidades de seguridad para prevenir XSS, inyección SQL, y otros ataques
 */

/**
 * Sanitiza una cadena de texto para prevenir XSS
 * Elimina caracteres peligrosos y escapa HTML
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Escapar caracteres HTML especiales
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitiza texto pero permite algunos caracteres básicos
 * Útil para nombres y descripciones
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remover scripts y tags HTML peligrosos
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  // Escapar caracteres HTML pero mantener espacios y saltos de línea
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Valida y sanitiza un email
 */
export function validateAndSanitizeEmail(email: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email es requerido' };
  }

  const trimmed = email.trim().toLowerCase();
  
  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, sanitized: '', error: 'Formato de email inválido' };
  }

  // Validar longitud
  if (trimmed.length > 254) {
    return { isValid: false, sanitized: '', error: 'Email demasiado largo' };
  }

  // Sanitizar pero mantener formato válido
  const sanitized = trimmed
    .replace(/[<>\"']/g, '')
    .substring(0, 254);

  return { isValid: true, sanitized };
}

/**
 * Valida una contraseña según criterios de seguridad
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Contraseña es requerida' };
  }

  // Longitud mínima
  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  // Longitud máxima razonable
  if (password.length > 128) {
    return { isValid: false, error: 'La contraseña es demasiado larga' };
  }

  // Verificar que no contenga caracteres peligrosos de inyección
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /['";\\]/,
    /--/,
    /\/\*/,
    /\*\//,
    /xp_/i,
    /sp_/i,
    /exec/i,
    /execute/i,
    /union/i,
    /select/i,
    /insert/i,
    /delete/i,
    /update/i,
    /drop/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, error: 'La contraseña contiene caracteres no permitidos' };
    }
  }

  return { isValid: true };
}

/**
 * Valida que un string no contenga patrones de inyección SQL
 * (Aunque Firestore no es SQL, es buena práctica)
 */
export function validateNoSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;\s*(DROP|DELETE|UPDATE|INSERT))/i,
    /(\bxp_\w+|\bsp_\w+)/i
  ];

  return !sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Valida que un string no contenga código JavaScript peligroso
 */
export function validateNoXSS(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*=.*javascript:/gi,
    /<svg[^>]*onload/gi,
    /<body[^>]*onload/gi
  ];

  return !xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitiza un objeto completo recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeText(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'string' ? sanitizeText(item) : item
      ) as any;
    }
  }

  return sanitized;
}

/**
 * Valida que un número esté en un rango seguro
 */
export function validateNumberRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Genera un token CSRF simple (para uso básico)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida un token CSRF
 */
export function validateCSRFToken(token: string, storedToken: string | null): boolean {
  return token !== null && storedToken !== null && token === storedToken;
}

