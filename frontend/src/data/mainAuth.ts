import { signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Autenticación del login principal (/login → /dashboard).
 *
 * Por ahora pega contra Firebase Authentication: son 6 cuentas de PRUEBA
 * (4 desarrolladores + 2 directores de proyecto) mientras el backend real
 * de producción (Flask + Supabase) se termina de construir aparte. El
 * registro (/register) sigue sin estar conectado a nada a propósito —
 * estas cuentas se crean manualmente en la consola de Firebase, no hay
 * self-service todavía.
 *
 * Cuando el backend de producción esté listo, este archivo es el único
 * que hay que tocar para el login: reemplazar `loginWithEmailPassword`
 * por la llamada al endpoint de Supabase/Flask, manteniendo la misma
 * firma (email, password) => Promise<{ ... }>, para no tener que tocar
 * LoginPage.tsx.
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}
