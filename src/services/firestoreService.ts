import { getFirestore, collection, getDocs, GeoPoint, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Signalement } from '../data/signalements';
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

        // Mapper dernier_statut vers statut
        const statut = this.mapStatusToEnum(data.dernier_statut);

        const signalement: Signalement = {
          id: data.id || doc.id,
          titre: data.titre || `Signalement ${data.id}`,
          description: data.description || `Entreprise: ${data.entreprise}, Budget: ${data.budget}`,
          latitude,
          longitude,
          statut,
          date: data.date || new Date().toISOString(),
          surface: data.surface || 0,
          avancement: data.avancement,
          budget: data.budget,
          dernier_statut: data.dernier_statut,
          entreprise: data.entreprise
        };

        signalements.push(signalement);
      });

      return signalements;
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
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

      // Document à ajouter à Firestore (respecte la structure Firestore)
      const docData = {
        avancement: signalement.avancement || 0,
        budget: signalement.budget || 0,
        dernier_statut: signalement.dernier_statut || 'signale',
        entreprise: signalement.entreprise,
        localisation: localisationGeoPoint,
        surface: signalement.surface || 0,
        // Champs additionnels pour l'app
        titre: signalement.titre,
        description: signalement.description,
        date: signalement.date || new Date().toISOString(),
        statut: signalement.statut,
        // Timestamp serveur
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
      'termine': SignalementStatus.TERMINE,
      'en_cours': SignalementStatus.EN_COURS,
      'signale': SignalementStatus.SIGNALE,
      'en cours': SignalementStatus.EN_COURS,
    };

    return statusMap[status?.toLowerCase()] || SignalementStatus.SIGNALE;
  }
}
