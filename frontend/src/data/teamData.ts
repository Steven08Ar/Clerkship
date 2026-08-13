export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  seed: string;
  color: string;
  role: string;
  avatarUrl: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'zabdiel',
    initials: 'ZQ',
    name: 'Zabdiel Julian Quintero Monroy',
    seed: 'Felix',
    color: '#3B82F6',
    role: 'Agentes de IA · Motor LLM · Prompts CoT · RAG',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=3B82F6',
  },
  {
    id: 'juan-camilo',
    initials: 'JR',
    name: 'Juan Camilo Rojas',
    seed: 'Leo',
    color: '#EC4899',
    role: 'Agentes de IA · Multi-Agente · CoT · Arquitectura IA',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Leo&backgroundColor=EC4899',
  },
  {
    id: 'santiago',
    initials: 'SA',
    name: 'Santiago Steven Arias Estupiñan',
    seed: 'Aneka',
    color: '#10B981',
    role: 'Frontend · React · UI/UX · Conexión del Sistema',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=10B981',
  },
  {
    id: 'camilo-bueno',
    initials: 'CB',
    name: 'Camilo Andres Bueno Rey',
    seed: 'Jasper',
    color: '#8B5CF6',
    role: 'Backend · Node.js · API REST · Conexión del Sistema',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jasper&backgroundColor=8B5CF6',
  },
];
