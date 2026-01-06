import { useState, useEffect, type FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  validateAndSanitizeEmail,
  validatePassword,
  validateNoXSS,
  validateNoSQLInjection
} from '../utils/security';
import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  getSecurityStatus
} from '../services/securityService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkSecurity = () => {
      const status = getSecurityStatus();
      if (status.blocked && status.retryAfter) {
        setRetryAfter(status.retryAfter);
        setError(`Cuenta bloqueada temporalmente. Intenta en ${Math.ceil(status.retryAfter / 60)} min.`);
      } else {
        setRetryAfter(undefined);
      }
    };

    checkSecurity();
    const interval = setInterval(checkSecurity, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!auth) {
      setError('Firebase no está configurado.');
      setLoading(false);
      return;
    }

    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.error || 'Demasiados intentos.');
      if (rateLimitCheck.retryAfter) setRetryAfter(rateLimitCheck.retryAfter);
      setLoading(false);
      return;
    }

    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Email inválido.');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Contraseña inválida.');
      setLoading(false);
      return;
    }

    if (!validateNoXSS(email) || !validateNoXSS(password)) {
      setError('Caracteres no permitidos.');
      setLoading(false);
      return;
    }

    if (!validateNoSQLInjection(email) || !validateNoSQLInjection(password)) {
      setError('Datos no válidos.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailValidation.sanitized, password);
      recordSuccessfulAttempt();
      setRetryAfter(undefined);
    } catch (err: any) {
      const failedAttempt = recordFailedAttempt();
      
      let errorMessage = 'Error al iniciar sesión.';
      
      if (err.code === 'auth/user-not-found') errorMessage = 'Usuario no encontrado.';
      else if (err.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta.';
      else if (err.code === 'auth/invalid-email') errorMessage = 'Email inválido.';
      else if (err.code === 'auth/user-disabled') errorMessage = 'Usuario deshabilitado.';
      else if (err.code === 'auth/too-many-requests') errorMessage = 'Demasiados intentos.';
      else if (err.code === 'auth/network-request-failed') errorMessage = 'Sin conexión.';

      if (failedAttempt.blocked && failedAttempt.blockedUntil) {
        const minutes = Math.ceil((failedAttempt.blockedUntil - Date.now()) / 60000);
        errorMessage = `Bloqueado por ${minutes} min.`;
        setRetryAfter(Math.ceil((failedAttempt.blockedUntil - Date.now()) / 1000));
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || (retryAfter !== undefined && retryAfter > 0);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden relative">
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full transition-all duration-[2000ms] ease-out ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        />
        <div 
          className={`absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full transition-all duration-[2000ms] delay-300 ease-out ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        />
        <div 
          className={`absolute top-1/4 left-1/4 w-4 h-4 bg-emerald-400 rounded-full transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ animation: mounted ? 'float 6s ease-in-out infinite' : 'none' }}
        />
        <div 
          className={`absolute bottom-1/3 right-1/4 w-3 h-3 bg-teal-400 rounded-full transition-all duration-1000 delay-700 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ animation: mounted ? 'float 8s ease-in-out infinite reverse' : 'none' }}
        />
        <div 
          className={`absolute top-1/2 right-1/3 w-2 h-2 bg-emerald-300 rounded-full transition-all duration-1000 delay-900 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ animation: mounted ? 'float 5s ease-in-out infinite' : 'none' }}
        />
      </div>

      {/* Contenedor principal */}
      <div className={`w-full max-w-sm relative z-10 transition-all duration-700 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        
        {/* Logo animado */}
        <div className={`flex justify-center mb-10 transition-all duration-700 delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}>
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Título */}
        <div className={`text-center mb-10 transition-all duration-700 delay-200 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Inventario ST
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Departamento de Informática
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className={`transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <input
              type="email"
              value={email}
              onChange={(e) => e.target.value.length <= 254 && setEmail(e.target.value)}
              required
              maxLength={254}
              autoComplete="email"
              className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 focus:border-emerald-500 focus:ring-0 text-gray-900 placeholder-gray-400 transition-colors duration-300 outline-none"
              placeholder="Correo electrónico"
              disabled={isDisabled}
            />
          </div>

          {/* Password */}
          <div className={`relative transition-all duration-700 delay-400 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => e.target.value.length <= 128 && setPassword(e.target.value)}
              required
              maxLength={128}
              autoComplete="current-password"
              className="w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 border-gray-200 focus:border-emerald-500 focus:ring-0 text-gray-900 placeholder-gray-400 transition-colors duration-300 outline-none"
              placeholder="Contraseña"
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-500 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm animate-fadeIn">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Retry timer */}
          {retryAfter !== undefined && retryAfter > 0 && !error && (
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <svg className="w-4 h-4 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Espera {Math.ceil(retryAfter / 60)} min</span>
            </div>
          )}

          {/* Submit Button */}
          <div className={`pt-4 transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              type="submit"
              disabled={isDisabled}
              className="relative w-full py-4 bg-gray-900 text-white font-medium rounded-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Línea animada en hover */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:w-full transition-all duration-500" />
              
              <span className={`relative flex items-center justify-center gap-2 transition-all duration-300 ${loading ? 'opacity-0' : ''}`}>
                Ingresar
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Firebase warning */}
        {!auth && (
          <p className={`text-center text-amber-500 text-xs mt-6 transition-all duration-700 delay-600 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
            Firebase no configurado
          </p>
        )}

        {/* Footer */}
        <p className={`text-center text-gray-300 text-xs mt-10 transition-all duration-700 delay-700 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}>
          © {new Date().getFullYear()} Dpto. Informática
        </p>
      </div>

      {/* Estilos de animaciones */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
