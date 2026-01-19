import { ref, computed } from 'vue';
import { SIGNALEMENTS_MOCK, type Signalement } from '../data/signalements';

// Initialiser avec les données mock
const allSignalements = ref<Signalement[]>([...SIGNALEMENTS_MOCK]);

const STORAGE_KEY = 'signalements_local';

// Charger depuis le localStorage au démarrage
export const loadSignalementsFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const localSignalements = JSON.parse(stored);
      allSignalements.value = [...SIGNALEMENTS_MOCK, ...localSignalements];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des signalements', error);
  }
};

// Sauvegarder dans le localStorage
const saveToStorage = () => {
  try {
    const localOnly = allSignalements.value.filter(s => s.isLocal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localOnly));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde', error);
  }
};

// Ajouter un nouveau signalement
export const addSignalement = (signalement: Omit<Signalement, 'id'>) => {
  const newId = Math.max(...allSignalements.value.map(s => s.id), 0) + 1;
  const newSignalement: Signalement = {
    ...signalement,
    id: newId,
    isLocal: true
  };
  allSignalements.value.push(newSignalement);
  saveToStorage();
  return newSignalement;
};

// Obtenir tous les signalements
export const getAllSignalements = () => {
  return computed(() => allSignalements.value);
};

// Obtenir les signalements filtrés
export const getSignalementsFiltered = (status: string) => {
  return computed(() => {
    if (status === 'tous') {
      return allSignalements.value;
    }
    return allSignalements.value.filter(s => s.statut === status);
  });
};

// Supprimer un signalement local
export const deleteLocalSignalement = (id: number) => {
  const index = allSignalements.value.findIndex(s => s.id === id && s.isLocal);
  if (index !== -1) {
    allSignalements.value.splice(index, 1);
    saveToStorage();
    return true;
  }
  return false;
};
