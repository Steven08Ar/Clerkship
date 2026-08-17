/**
 * Autenticación del login principal (/login → /dashboard).
 *
 * Pega contra el backend real: Flask + PostgreSQL/Supabase
 * (ver pruebas/back/flask-api/app/routes/auth.py). Es el único archivo
 * que hubo que tocar para el swap desde Firebase, tal como estaba
 * planeado — LoginPage.tsx no cambió su forma de llamar a esta función.
 *
 * OJO: esto es independiente del Firebase del Módulo de Desarrollo
 * (Cuestionario/Cronograma/Repositorio, ver data/devAuth.ts) — ese sigue
 * siendo 100% Firebase y no se toca.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface MainUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
}

interface AuthResponse {
  user: MainUser;
  access_token: string;
  refresh_token: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
  student_code?: string;
  semester?: number;
  department?: string;
}

const STORAGE_KEYS = {
  accessToken: 'clerkship_access_token',
  refreshToken: 'clerkship_refresh_token',
  user: 'clerkship_backend_user',
};

/** Se dispara en cada login/logout para que useCurrentUser() se entere sin recargar la página. */
export const MAIN_AUTH_CHANGED_EVENT = 'clerkship-main-auth-changed';

function persistSession(data: AuthResponse) {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
  localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
  window.dispatchEvent(new Event(MAIN_AUTH_CHANGED_EVENT));
}

export async function loginWithEmailPassword(email: string, password: string): Promise<MainUser> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo iniciar sesión.');
  }

  persistSession(data as AuthResponse);
  return (data as AuthResponse).user;
}

export async function registerUser(payload: RegisterPayload): Promise<MainUser> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear la cuenta.');
  }

  persistSession(data as AuthResponse);
  return (data as AuthResponse).user;
}

export function getStoredUser(): MainUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MainUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

/**
 * El access_token dura poco (60 min por defecto, ver JWT_ACCESS_TOKEN_EXPIRES_MINUTES
 * en el .env de flask-api) — es a propósito, por seguridad. Esta función lo renueva
 * usando el refresh_token (dura mucho más, 30 días por defecto), sin pedirle
 * contraseña de nuevo al usuario. La llama apiClient.ts automáticamente cuando
 * un pedido responde 401.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) {
    throw new Error('No hay sesión para renovar.');
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo renovar la sesión.');
  }

  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
  window.dispatchEvent(new Event(MAIN_AUTH_CHANGED_EVENT));
  return data.access_token as string;
}

export function clearMainAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  window.dispatchEvent(new Event(MAIN_AUTH_CHANGED_EVENT));
}

export function mainAuthErrorMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'No se pudo verificar la identidad. Intenta de nuevo.';
}
