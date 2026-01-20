export enum SignalementStatus {
  SIGNALE = 'signalé',
  EN_COURS = 'en_cours',
  TERMINE = 'résolu'
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
}

// Couleurs selon le statut
export const STATUS_COLORS: Record<string, string> = {
  'signale': '#EF4444',      // Rouge
  'en_cours': '#F59E0B',     // Orange
  'termine': '#10B981'       // Vert
};

export const STATUS_LABELS: Record<SignalementStatus, string> = {
  [SignalementStatus.SIGNALE]: 'Signalé',
  [SignalementStatus.EN_COURS]: 'En cours',
  [SignalementStatus.TERMINE]: 'Résolu'
};
