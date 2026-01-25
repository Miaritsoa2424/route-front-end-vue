import { getFirestore, collection, getDocs, GeoPoint, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Signalement, Entreprise } from '../data/signalements';
import { SignalementStatus } from '../data/signalements';

const db = getFirestore();

export class FirestoreService {
  /**
   * Récupérer tous les signalements de Firestore
   */
  static async getAllSignalements(): Promise<Signalement[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'signalement'));
      const signalements: Signalement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Extraire latitude et longitude du geopoint
        let latitude = -18.8972;
        let longitude = 47.501;
        
        if (data.localisation && data.localisation instanceof GeoPoint) {
          latitude = data.localisation.latitude;
          longitude = data.localisation.longitude;
        }

        const signalement: Signalement = {
          id: data.id || doc.id,
          description: data.description,
          latitude,
          longitude,
          surface: data.surface || 0,
          avancement: data.avancement || 0,
          budget: data.budget || 0,
          dernier_statut: data.dernier_statut || 'Signalé',
          entreprise: data.entreprise,
          email: data.email,
          id_user: data.id_user
        };

        signalements.push(signalement);
      });

      return signalements;
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      return []; // Retourner un array vide en cas d'erreur
    }
  }

  static async getAllEntreprises(): Promise<Entreprise[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'entreprise'));
      const entreprises: Entreprise[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.id && data.nom) {
          entreprises.push({
            id: data.id,
            nom: data.nom
          });
        }
      });

      // Trier par nom
      return entreprises.sort((a, b) => a.nom.localeCompare(b.nom));
    } catch (error) {
      console.error('Erreur lors de la récupération des entreprises:', error);
      return []; // Retourner un array vide en cas d'erreur
    }
  }

  /**
   * Ajouter un nouveau signalement à Firestore
   */
  static async addSignalement(signalement: Omit<Signalement, 'id'>): Promise<Signalement> {
    try {
      // Créer le geopoint pour Firestore
      const localisationGeoPoint = new GeoPoint(signalement.latitude, signalement.longitude);

      // Document à ajouter à Firestore (structure finale)
      const docData = {
        avancement: signalement.avancement,
        budget: signalement.budget,
        dernier_statut: signalement.dernier_statut,
        entreprise: signalement.entreprise,
        description: signalement.description,
        localisation: localisationGeoPoint,
        surface: signalement.surface,
        email: signalement.email || null,
        id_user: signalement.id_user || null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'signalement'), docData);

      console.log('✅ Signalement ajouté avec ID:', docRef.id);

      // Retourner le signalement avec l'ID généré
      return {
        ...signalement,
        id: docRef.id
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du signalement:', error);
      throw error;
    }
  }

  /**
   * Mapper le statut Firestore vers SignalementStatus
   */
  private static mapStatusToEnum(status: string): SignalementStatus {
    const statusMap: { [key: string]: SignalementStatus } = {
      'Résolu': SignalementStatus.TERMINE,
      'En cours': SignalementStatus.EN_COURS,
      'Signalé': SignalementStatus.SIGNALE,
    };

    return statusMap[status?.toLowerCase()] || SignalementStatus.SIGNALE;
  }
}
