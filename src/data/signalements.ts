export enum SignalementStatus {
  SIGNALE = 'Signalé',
  EN_COURS = 'En cours',
  TERMINE = 'Résolu'
}

export interface Entreprise {
  id: number;
  nom: string;
}

export interface Signalement {
  id: number | string;
  description: string;
  latitude: number;
  longitude: number;
  surface: number;
  avancement: number;
  budget: number;
  dernier_statut: string;
  entreprise: string;
  id_user?: string;
  email?: string;
  photos?: string[];
}

// Couleurs selon le statut
export const STATUS_COLORS: Record<string, string> = {
  'Signalé': '#EF4444',      // Rouge
  'En cours': '#F59E0B',     // Orange
  'Résolu': '#10B981'       // Vert
};

export const STATUS_LABELS: Record<SignalementStatus, string> = {
  [SignalementStatus.SIGNALE]: 'Signalé',
  [SignalementStatus.EN_COURS]: 'En cours',
  [SignalementStatus.TERMINE]: 'Résolu'
};
