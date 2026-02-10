import { ref, computed } from 'vue';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import type { Signalement, Entreprise } from '../data/signalements';
import { FirestoreService } from '../services/firestoreService';

// État réactif
const firestoreSignalements = ref<Signalement[]>([]);
const entreprises = ref<Entreprise[]>([]);
const isLoading = ref(false);
const isRealTimeEnabled = ref(false);

// Références pour les listeners (pour pouvoir les arrêter)
let signalementsUnsubscribe: (() => void) | null = null;
let entreprisesUnsubscribe: (() => void) | null = null;

/**
 * Charger les entreprises depuis Firestore
 */
export const loadEntreprisesFromFirestore = async () => {
  try {
    const data = await FirestoreService.getAllEntreprises();
    entreprises.value = data.sort();
    console.log('✅ Entreprises Firestore chargées:', data.length, data);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des entreprises:', error);
    entreprises.value = [];
  }
};

/**
 * Démarrer l'écoute temps réel des entreprises
 */
export const startEntreprisesRealTimeListener = () => {
  if (entreprisesUnsubscribe) {
    console.log('🔄 Listener entreprises déjà actif');
    return;
  }

  console.log('🎧 Démarrage listener temps réel entreprises...');
  entreprisesUnsubscribe = onSnapshot(
    collection(db, 'entreprise'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        if (docData.id && docData.nom) {
          return {
            id: typeof docData.id === 'number' ? docData.id : parseInt(String(docData.id)) || 0,
            nom: String(docData.nom)
          } as Entreprise;
        }
        return null;
      }).filter((entreprise): entreprise is Entreprise => entreprise !== null);
      entreprises.value = data.sort((a, b) => a.nom.localeCompare(b.nom));
      console.log('🔄 Entreprises mises à jour en temps réel:', data.length);
    },
    (error) => {
      console.error('❌ Erreur listener entreprises:', error);
    }
  );
};

/**
 * Obtenir toutes les entreprises
 */
export const getEntreprises = () => {
  return computed(() => [...entreprises.value]);
};

/**
 * Charger les signalements depuis Firestore
 */
export const loadSignalementsFromFirestore = async () => {
  isLoading.value = true;
  try {
    const data = await FirestoreService.getAllSignalements();
    firestoreSignalements.value = data;
    console.log('✅ Signalements Firestore chargés:', data.length, data);
  } catch (error) {
    console.error('❌ Erreur lors du chargement Firestore:', error);
    firestoreSignalements.value = [];
  } finally {
    isLoading.value = false;
  }
};

/**
 * Démarrer l'écoute temps réel des signalements
 */
export const startSignalementsRealTimeListener = () => {
  if (signalementsUnsubscribe) {
    console.log('🔄 Listener signalements déjà actif');
    return;
  }

  console.log('🎧 Démarrage listener temps réel signalements...');
  signalementsUnsubscribe = onSnapshot(
    collection(db, 'signalement'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Conversion du GeoPoint en lat/lng
        latitude: doc.data().localisation?.latitude || -18.8972,
        longitude: doc.data().localisation?.longitude || 47.501,
        // Assurer que photos est un array
        photos: doc.data().photos || []
      } as Signalement));

      firestoreSignalements.value = data;
      console.log('🔄 Signalements mis à jour en temps réel:', data.length);
    },
    (error) => {
      console.error('❌ Erreur listener signalements:', error);
    }
  );
};

/**
 * Arrêter tous les listeners temps réel
 */
export const stopRealTimeListeners = () => {
  if (signalementsUnsubscribe) {
    console.log('🛑 Arrêt listener signalements');
    signalementsUnsubscribe();
    signalementsUnsubscribe = null;
  }

  if (entreprisesUnsubscribe) {
    console.log('🛑 Arrêt listener entreprises');
    entreprisesUnsubscribe();
    entreprisesUnsubscribe = null;
  }

  isRealTimeEnabled.value = false;
};

/**
 * Obtenir tous les signalements (Firestore)
 */
export const getAllSignalements = () => {
  return computed(() => [...firestoreSignalements.value]);
};

/**
 * Ajouter un nouveau signalement à Firestore
 */
export const addSignalementToFirestore = async (signalement: Omit<Signalement, 'id'>) => {
  try {
    const newSignalement = await FirestoreService.addSignalement(signalement);
    // Recharger la liste pour voir le nouveau signalement
    await loadSignalementsFromFirestore();
    console.log('✅ Signalement ajouté à Firestore:', newSignalement);
    return newSignalement;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du signalement:', error);
    throw error;
  }
};

/**
 * Initialiser le store (charger Firestore et démarrer les listeners temps réel)
 */
export const initSignalementsStore = async () => {
  // Charger les données initiales
  await loadSignalementsFromFirestore();
  await loadEntreprisesFromFirestore();

  // Démarrer les listeners temps réel
  startSignalementsRealTimeListener();
  startEntreprisesRealTimeListener();

  isRealTimeEnabled.value = true;
  console.log('🚀 Store initialisé avec synchronisation temps réel');
};

/**
 * Obtenir l'état de chargement
 */
export const getLoadingState = () => {
  return computed(() => isLoading.value);
};

/**
 * Vérifier si la synchronisation temps réel est active
 */
export const isRealTimeActive = () => {
  return computed(() => isRealTimeEnabled.value);
};
