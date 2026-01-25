<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/signalements"></ion-back-button>
        </ion-buttons>
        <ion-title>Nouveau Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Nouveau Signalement</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="form-container">
        <!-- Section Map pour sélectionner position -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>1. Localiser le problème</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="selectedPosition" class="position-info">
              <p>📍 Position sélectionnée:</p>
              <p><strong>Latitude:</strong> {{ selectedPosition.lat.toFixed(6) }}</p>
              <p><strong>Longitude:</strong> {{ selectedPosition.lng.toFixed(6) }}</p>
              <ion-button color="light" @click="clearPosition">Modifier</ion-button>
            </div>
            <div v-else class="no-position">
              <p>Cliquez sur le bouton ci-dessous pour ouvrir la carte</p>
            </div>
            <ion-button expand="block" color="primary" @click="showMapModal = true">
              <ion-icon slot="start" name="map"></ion-icon>
              {{ selectedPosition ? 'Modifier la position' : 'Afficher la carte' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Formulaire -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>2. Informations du signalement</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Description -->
            <ion-item>
              <ion-label position="floating">Description</ion-label>
              <ion-textarea v-model="form.description" placeholder="Décrivez le signalement" :rows="3" required></ion-textarea>
            </ion-item>

            <!-- Entreprise (Select) -->
            <ion-item>
              <ion-label position="floating">Entreprise</ion-label>
              <ion-select v-model="form.entreprise" placeholder="Sélectionner une entreprise" required>
                <ion-select-option v-for="ent in entreprisesDisponibles" :key="ent.id" :value="ent.nom">
                  {{ ent.nom }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Surface -->
            <ion-item>
              <ion-label position="floating">Surface (m²)</ion-label>
              <ion-input v-model.number="form.surface" type="number" placeholder="0" required></ion-input>
            </ion-item>

            <!-- Budget -->
            <ion-item>
              <ion-label position="floating">Budget (Ar)</ion-label>
              <ion-input v-model.number="form.budget" type="number" placeholder="0" required></ion-input>
            </ion-item>

            <!-- Avancement -->
            <ion-item>
              <ion-label position="floating">Avancement (%)</ion-label>
              <ion-input v-model.number="form.avancement" type="number" placeholder="0" min="0" max="100" required></ion-input>
            </ion-item>

            <!-- Statut -->
            <ion-item>
              <ion-label position="floating">Statut</ion-label>
              <ion-select v-model="form.dernier_statut" placeholder="Sélectionner" required>
                <ion-select-option value="Signalé">Signalé</ion-select-option>
                <ion-select-option value="En cours">En cours</ion-select-option>
                <ion-select-option value="Résolu">Terminé</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Boutons -->
        <ion-button 
          expand="block" 
          color="success"
          :disabled="!isFormValid || isLoading"
          @click="submitForm"
          class="submit-button"
        >
          <ion-spinner v-if="isLoading" name="crescent" />
          <ion-icon v-else slot="start" name="checkmark-done"></ion-icon>
          {{ isLoading ? 'Création en cours...' : 'Créer le signalement' }}
        </ion-button>

        <ion-button 
          expand="block" 
          color="medium"
          @click="resetForm"
          :disabled="isLoading"
          class="reset-button"
        >
          Réinitialiser
        </ion-button>
      </div>

      <!-- Modal pour la carte -->
      <ion-modal :is-open="showMapModal" @did-dismiss="showMapModal = false">
        <ion-header :translucent="true">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button color="medium" @click="showMapModal = false">Fermer</ion-button>
            </ion-buttons>
            <ion-title>Sélectionner une position</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div id="map-selector" ref="mapContainer" class="map-selector-modal"></div>
        </ion-content>
      </ion-modal>

      <!-- Toast pour les messages -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="3000"
        :color="toastColor"
        position="bottom"
        @did-dismiss="showToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonButton, IonIcon, IonButtons, IonBackButton,
  IonModal, IonToast, IonSpinner, IonTextarea,
  useIonRouter
} from '@ionic/vue';
import { checkmarkDone } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addSignalementToFirestore, getEntreprises } from '../stores/signalementsStore';
import { AuthService } from '../services/authService';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const router = useRouter();
const ionRouter = useIonRouter();
const mapContainer = ref<HTMLElement>();
let map: L.Map;
let selectedMarker: L.Marker | null = null;

const showMapModal = ref(false);
const selectedPosition = ref<{ lat: number; lng: number } | null>(null);
const isLoading = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastColor = ref<'success' | 'danger'>('success');
const entreprisesDisponibles = getEntreprises();

const form = ref<{
  description: string;
  entreprise: string;
  surface: number | null;
  budget: number | null;
  avancement: number | null;
  dernier_statut: string;
}>({
  description: '',
  entreprise: '',
  surface: null as number | null,
  budget: null as number | null,
  avancement: 0 as number | null,
  dernier_statut: 'Signalé'
});

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.setIcon(defaultIcon);

const isFormValid = computed(() => {
  return form.value.description && form.value.entreprise && form.value.surface && form.value.budget !== null && form.value.avancement !== null && selectedPosition.value;
});

onMounted(() => {
  // La carte sera initialisée quand la modal s'ouvre
  // Watcher pour la modal
  const unwatch = watch(showMapModal, (newVal) => {
    if (newVal && !map) {
      // Délai pour laisser le DOM se rendre
      setTimeout(() => {
        initializeMapSelector();
      }, 100);
    }
  });
});

const initializeMapSelector = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value).setView([-18.8792, 47.5079], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Permettre le click sur la carte pour sélectionner une position
  map.on('click', (e) => {
    selectPosition(e.latlng.lat, e.latlng.lng);
  });
};

const selectPosition = (lat: number, lng: number) => {
  selectedPosition.value = { lat, lng };

  // Ajouter/mettre à jour le marqueur
  if (selectedMarker) {
    map.removeLayer(selectedMarker);
  }

  const customIcon = L.divIcon({
    html: `<div style="background-color: #EF4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">📌</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  selectedMarker = L.marker([lat, lng], { icon: customIcon })
    .addTo(map)
    .bindPopup('Position sélectionnée')
    .openPopup();

  map.setView([lat, lng], 16);
};

const clearPosition = () => {
  selectedPosition.value = null;
  if (selectedMarker) {
    map.removeLayer(selectedMarker);
    selectedMarker = null;
  }
};

const resetForm = () => {
  form.value = {
    description: '',
    entreprise: '',
    surface: null,
    budget: null,
    avancement: 0,
    dernier_statut: 'Signalé'
  };
  selectedPosition.value = null;
  clearPosition();
};

const submitForm = async () => {
  if (!isFormValid.value || !selectedPosition.value) return;

  isLoading.value = true;

  try {
    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser?.uid || undefined;
    const userEmail = currentUser?.email || undefined;

    await addSignalementToFirestore({
      latitude: selectedPosition.value.lat,
      longitude: selectedPosition.value.lng,
      description: form.value.description,
      surface: form.value.surface || 0,
      budget: form.value.budget || 0,
      avancement: form.value.avancement || 0,
      entreprise: form.value.entreprise,
      dernier_statut: form.value.dernier_statut,
      id_user: userId,
      email: userEmail
    });

    // Afficher le message de succès
    toastColor.value = 'success';
    toastMessage.value = '✅ Signalement créé avec succès!';
    showToast.value = true;

    // Réinitialiser le formulaire
    resetForm();

    // Rediriger vers la liste après 2 secondes
    setTimeout(() => {
      ionRouter.navigate('/signalements', 'back');
    }, 2000);

  } catch (error: any) {
    console.error('❌ Erreur lors de la création du signalement', error);
    
    // Afficher le message d'erreur
    toastColor.value = 'danger';
    
    let userMessage = '❌ Impossible de créer le signalement. Vérifiez vos informations.';
    if (error.message && error.message.includes('permission')) {
      userMessage = '❌ Permission refusée. Vous n\'avez pas les droits nécessaires :' + error.message;
    } else if (error.message && error.message.includes('network')) {
      userMessage = '❌ Erreur réseau. Vérifiez votre connexion internet.';
    } else if (!selectedPosition.value) {
      userMessage = '❌ Veuillez sélectionner une position sur la carte.';
    }
    
    toastMessage.value = userMessage;
    showToast.value = true;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.form-container {
  padding: 1rem;
}

.form-container ion-item {
  --padding-top: 20px;
  --padding-bottom: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  margin-bottom: 16px;
}

.form-container ion-label {
  margin-bottom: 12px;
  font-weight: 500;
}

.form-container ion-input,
.form-container ion-textarea,
.form-container ion-select {
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.map-selector {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 2px solid #e0e0e0;
}

.map-selector-modal {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.position-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f0f8ff;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.position-info p {
  margin: 0.25rem 0;
  font-size: 14px;
}

.no-position {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.photo-section {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.photo-preview {
  margin-top: 1rem;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.submit-button {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.reset-button {
  margin-bottom: 2rem;
}
</style>
