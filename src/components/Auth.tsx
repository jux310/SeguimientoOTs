import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UNAUTHORIZED_MESSAGE = 'No tienes autorización para acceder al sistema. Contacta al administrador.';
const EXPIRED_LINK_MESSAGE = 'El enlace de invitación ha expirado. Por favor, solicita uno nuevo.';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpiredLink, setIsExpiredLink] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=access_denied') && hash.includes('error_code=otp_expired')) {
      setIsExpiredLink(true);
      setError(EXPIRED_LINK_MESSAGE);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (retryCount >= 3) {
        throw new Error('Demasiados intentos fallidos. Por favor, intente más tarde.');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setRetryCount(prev => prev + 1);
          throw new Error(UNAUTHORIZED_MESSAGE);
        }
        throw error;
      }
      setRetryCount(0);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isExpiredLink ? 'Enlace Expirado' : 'Iniciar sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isExpiredLink 
              ? 'El enlace de invitación ha expirado. Por favor, contacta al administrador para obtener uno nuevo.'
              : 'Ingresa tus credenciales para acceder al sistema'
            }
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600 text-center">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#00843D] hover:bg-[#006e33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00843D] disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}