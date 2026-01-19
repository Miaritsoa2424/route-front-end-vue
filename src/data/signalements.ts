export type SignalementStatus = 'signalé' | 'en_cours' | 'résolu';

export interface Signalement {
  id: number;
  titre: string;
  description: string;
  latitude: number;
  longitude: number;
  statut: SignalementStatus;
  date: string;
  surface?: number; // en mètres carrés
  type: string; // exemple: "nid-de-poule", "inondation", "arbre"
  photoUrl?: string; // URL ou base64 de la photo
  isLocal?: boolean; // Indique si c'est un signalement créé localement
}

// Données statiques pour le développement
// Centre: Andoharanofotsy, Antananarivo, Madagascar
export const SIGNALEMENTS_MOCK: Signalement[] = [
  {
    id: 1,
    titre: "Nid de poule rue Andoharanofotsy",
    description: "Grand nid de poule causant des dégâts aux véhicules",
    latitude: -18.8792,
    longitude: 47.5079,
    statut: 'signalé',
    date: '2024-01-18',
    surface: 0.5,
    type: 'nid-de-poule'
  },
  {
    id: 2,
    titre: "Inondation avenue principale",
    description: "Accumulation d'eau après les pluies, circulation difficile",
    latitude: -18.8805,
    longitude: 47.5095,
    statut: 'en_cours',
    date: '2024-01-17',
    surface: 15.2,
    type: 'inondation'
  },
  {
    id: 3,
    titre: "Arbre tombé près du marché",
    description: "Arbre obstruant la circulation près du marché local",
    latitude: -18.8778,
    longitude: 47.5065,
    statut: 'résolu',
    date: '2024-01-16',
    surface: 2.0,
    type: 'arbre'
  },
  {
    id: 4,
    titre: "Lampadaire cassé rue latérale",
    description: "Lampadaire endommagé, zone sans éclairage la nuit",
    latitude: -18.8815,
    longitude: 47.5085,
    statut: 'signalé',
    date: '2024-01-19',
    surface: 0.2,
    type: 'lampadaire'
  },
  {
    id: 5,
    titre: "Chaussée dégradée près école",
    description: "Plusieurs zones de dégradation de l'asphalte, danger pour enfants",
    latitude: -18.8770,
    longitude: 47.5110,
    statut: 'en_cours',
    date: '2024-01-15',
    surface: 8.5,
    type: 'chaussée'
  }
];

// Couleurs selon le statut
export const STATUS_COLORS: Record<SignalementStatus, string> = {
  'signalé': '#EF4444',      // Rouge
  'en_cours': '#F59E0B',     // Orange
  'résolu': '#10B981'        // Vert
};

export const STATUS_LABELS: Record<SignalementStatus, string> = {
  'signalé': 'Signalé',
  'en_cours': 'En cours',
  'résolu': 'Résolu'
};
