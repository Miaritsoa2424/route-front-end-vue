import { ref, computed } from 'vue';
import type { Signalement } from '../data/signalements';
import { FirestoreService } from '../services/firestoreService';

// État réactif
const firestoreSignalements = ref<Signalement[]>([]);
const isLoading = ref(false);

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
 * Initialiser le store (charger Firestore uniquement)
 */
export const initSignalementsStore = async () => {
  await loadSignalementsFromFirestore();
};

