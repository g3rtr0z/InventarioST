/**
 * Colores institucionales de la aplicación
 * Estos colores se utilizan en toda la aplicación para mantener consistencia visual
 * 
 * IMPORTANTE: Tailwind CSS requiere que las clases estén completas en el código
 * para poder incluirlas en el build. Por lo tanto, estas constantes deben usarse
 * directamente en los className, no como interpolación de strings.
 */

export const INSTITUTIONAL_COLORS = {
  // Color principal (verde oscuro institucional) - Clases de Tailwind
  bgPrimary: 'bg-green-800',
  bgPrimaryHover: 'bg-green-900',
  bgPrimaryLight: 'bg-green-700',
  
  textPrimary: 'text-green-800',
  textPrimaryHover: 'text-green-900',
  
  borderPrimary: 'border-green-800',
  borderPrimaryHover: 'border-green-900',
  
  ringPrimary: 'ring-green-800',
  ringPrimaryFocus: 'focus:ring-green-800',
  
  // Gradientes
  gradientFrom: 'from-green-800',
  gradientTo: 'to-green-900',
  gradientHoverFrom: 'hover:from-green-700',
  gradientHoverTo: 'hover:to-green-800',
} as const;

