import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../data/firebase';
import { TEAM_MEMBERS } from '../data/teamData';
import { memberIdForEmail } from '../data/devAuth';

export interface CurrentUserInfo {
  email: string | null;
  name: string;
  initials: string;
  role: string;
  color: string;
  avatarUrl: string;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function buildUserInfo(user: User | null): CurrentUserInfo | null {
  if (!user) return null;

  const email = user.email;
  const memberId = email ? memberIdForEmail(email) : undefined;
  const member = memberId ? TEAM_MEMBERS.find((m) => m.id === memberId) : undefined;

  // 1. Uno de los 4 desarrolladores → reutiliza su avatar/nombre ya definidos.
  if (member) {
    return {
      email,
      name: member.name,
      initials: member.initials,
      role: member.role,
      color: member.color,
      avatarUrl: user.photoURL || member.avatarUrl,
    };
  }

  // 2. Cualquier otra cuenta (ej. directores de proyecto, o futuros usuarios
  //    de Supabase en producción) → foto real si Firebase la tiene, si no
  //    un avatar generado de forma consistente a partir de su correo.
  const name = user.displayName || email?.split('@')[0] || 'Usuario';
  return {
    email,
    name,
    initials: initialsFrom(name),
    role: 'Cuenta de prueba',
    color: '#0284C7',
    avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(email || name)}&backgroundColor=0284C7`,
  };
}

/** Usuario de Firebase actualmente autenticado, reactivo a login/logout. */
export function useCurrentUser(): CurrentUserInfo | null {
  const [info, setInfo] = useState<CurrentUserInfo | null>(() => buildUserInfo(auth.currentUser));

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setInfo(buildUserInfo(user)));
  }, []);

  return info;
}
