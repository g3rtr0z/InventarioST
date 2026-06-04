/**
 * Hook para configurar headers de seguridad y políticas CSP
 */

import { useEffect } from 'react';

export function useSecurityHeaders() {
  useEffect(() => {
    // Configurar Content Security Policy meta tag si no existe
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!existingCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.firebaseio.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.firebaseio.com https://*.firebaseapp.com https://*.googleapis.com wss://*.firebaseio.com",
        "frame-src 'self' https://lottie.host",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
        // Nota: frame-ancestors no funciona en meta tags, solo en headers HTTP
        // La protección contra clickjacking se maneja mediante JavaScript abajo
      ].join('; ');
      document.head.appendChild(cspMeta);
    }

    // Configurar otros headers de seguridad mediante meta tags
    // Nota: X-Frame-Options no funciona en meta tags, solo en headers HTTP
    // La protección contra clickjacking se maneja mediante JavaScript abajo
    const securityHeaders = [
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
      { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { httpEquiv: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' }
    ];

    securityHeaders.forEach(header => {
      const existing = document.querySelector(`meta[http-equiv="${header.httpEquiv}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.httpEquiv = header.httpEquiv;
        meta.content = header.content;
        document.head.appendChild(meta);
      }
    });

    // Prevenir clickjacking
    const preventClickjacking = () => {
      if (window.top !== window.self) {
        window.top!.location.href = window.self.location.href;
      }
    };

    // Verificar periódicamente
    const interval = setInterval(preventClickjacking, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
}

