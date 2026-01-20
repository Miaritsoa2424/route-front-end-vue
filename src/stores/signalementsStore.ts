import { ref, computed } from 'vue';
import type { Signalement, Entreprise } from '../data/signalements';
import { FirestoreService } from '../services/firestoreService';

// État réactif
const firestoreSignalements = ref<Signalement[]>([]);
const entreprises = ref<Entreprise[]>([]);
const isLoading = ref(false);

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
  await loadEntreprisesFromFirestore();
};

