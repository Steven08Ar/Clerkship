import {
  LayoutDashboard, FileText,
  Clock, Library, PersonStanding, Calendar,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavTab {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  route: string | null;
}

export const DASH_NAV: NavTab[] = [
  { id: 'overview',   label: 'Inicio',     Icon: LayoutDashboard, route: '/dashboard'  },
  { id: 'casos',      label: 'Casos',      Icon: FileText,        route: '/casos'      },
  { id: 'historial',  label: 'Historial',  Icon: Clock,           route: '/historial'  },
  { id: 'biblioteca', label: 'Biblioteca', Icon: Library,         route: '/biblioteca' },
  { id: 'anatomia',   label: 'Anatomía',   Icon: PersonStanding,  route: '/anatomia'   },
  { id: 'cronograma', label: 'Cronograma', Icon: Calendar,        route: '/cronograma' },
];
