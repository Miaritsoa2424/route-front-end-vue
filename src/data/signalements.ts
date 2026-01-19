export enum SignalementStatus {
  SIGNALE = 'signalé',
  EN_COURS = 'en_cours',
  TERMINE = 'résolu'
}

export interface Signalement {
  id: number | string;
  titre: string;
  description: string;
  latitude: number;
  longitude: number;
  statut: SignalementStatus;
  date: string;
  surface?: number; // en mètres carrés
  avancement?: number;
  budget?: number;
  dernier_statut?: string;
  entreprise?: string;
}

// Données statiques pour le développement
// Centre: Andoharanofotsy, Antananarivo, Madagascar
export const SIGNALEMENTS_MOCK: Signalement[] = [];

// Couleurs selon le statut
export const STATUS_COLORS: Record<SignalementStatus, string> = {
  [SignalementStatus.SIGNALE]: '#EF4444',      // Rouge
  [SignalementStatus.EN_COURS]: '#F59E0B',     // Orange
  [SignalementStatus.TERMINE]: '#10B981'       // Vert
};

export const STATUS_LABELS: Record<SignalementStatus, string> = {
  [SignalementStatus.SIGNALE]: 'Signalé',
  [SignalementStatus.EN_COURS]: 'En cours',
  [SignalementStatus.TERMINE]: 'Résolu'
};
