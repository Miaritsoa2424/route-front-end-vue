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
            <!-- Type -->
            <ion-item>
              <ion-label position="floating">Type de problème</ion-label>
              <ion-select v-model="form.type" placeholder="Sélectionner">
                <ion-select-option value="nid-de-poule">Nid de poule</ion-select-option>
                <ion-select-option value="inondation">Inondation</ion-select-option>
                <ion-select-option value="arbre">Arbre tombé</ion-select-option>
                <ion-select-option value="lampadaire">Lampadaire cassé</ion-select-option>
                <ion-select-option value="chaussée">Chaussée dégradée</ion-select-option>
                <ion-select-option value="autre">Autre</ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Titre -->
            <ion-item>
              <ion-label position="floating">Titre</ion-label>
              <ion-input v-model="form.titre" placeholder="Résumé du problème"></ion-input>
            </ion-item>

            <!-- Description -->
            <ion-item>
              <ion-label position="floating">Description détaillée</ion-label>
              <ion-textarea v-model="form.description" placeholder="Décrivez le problème en détail" :rows="4"></ion-textarea>
            </ion-item>

            <!-- Date -->
            <ion-item>
              <ion-label position="floating">Date du problème</ion-label>
              <ion-input v-model="form.date" type="date"></ion-input>
            </ion-item>

            <!-- Surface (optionnel) -->
            <ion-item>
              <ion-label position="floating">Surface (m²) - optionnel</ion-label>
              <ion-input v-model.number="form.surface" type="number" placeholder="0"></ion-input>
            </ion-item>

            <!-- Photo -->
            <div class="photo-section">
              <ion-label>Photo - optionnel</ion-label>
              <div class="photo-preview" v-if="photoPreview">
                <img :src="photoPreview" alt="Photo du problème" class="preview-image">
                <ion-button color="light" size="small" @click="removePhoto">Supprimer</ion-button>
              </div>
              <ion-button v-else color="secondary" fill="outline" @click="triggerPhotoInput">
                <ion-icon slot="start" name="camera"></ion-icon>
                Ajouter une photo
              </ion-button>
              <input 
                ref="photoInput" 
                type="file" 
                accept="image/*" 
                style="display: none"
                @change="handlePhotoSelect"
              >
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Boutons -->
        <ion-button 
          expand="block" 
          color="success"
          :disabled="!isFormValid"
          @click="submitForm"
          class="submit-button"
        >
          <ion-icon slot="start" name="checkmark-done"></ion-icon>
          Créer le signalement
        </ion-button>

        <ion-button 
          expand="block" 
          color="medium"
          @click="resetForm"
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonTextarea, IonButton, IonIcon, IonButtons, IonBackButton,
  IonModal,
  useIonRouter
} from '@ionic/vue';
import { camera, checkmarkDone } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addSignalement } from '../stores/signalementsStore';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const router = useRouter();
const ionRouter = useIonRouter();
const mapContainer = ref<HTMLElement>();
const photoInput = ref<HTMLInputElement>();
let map: L.Map;
let selectedMarker: L.Marker | null = null;

const showMapModal = ref(false);
const selectedPosition = ref<{ lat: number; lng: number } | null>(null);
const photoPreview = ref<string | null>(null);
const photoBase64 = ref<string | null>(null);

const form = ref<{
  type: string;
  titre: string;
  description: string;
  date: string;
  surface: number | null;
}>({
  type: '',
  titre: '',
  description: '',
  date: new Date().toISOString().split('T')[0] as string,
  surface: null as number | null
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
  return form.value.type && form.value.titre && form.value.description && selectedPosition.value;
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

const triggerPhotoInput = () => {
  photoInput.value?.click();
};

const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      photoPreview.value = result;
      photoBase64.value = result;
    };
    reader.readAsDataURL(file);
  }
};

const removePhoto = () => {
  photoPreview.value = null;
  photoBase64.value = null;
  if (photoInput.value) {
    photoInput.value.value = '';
  }
};

const resetForm = () => {
  form.value = {
    type: '',
    titre: '',
    description: '',
    date: new Date().toISOString().split('T')[0] as string,
    surface: null
  };
  selectedPosition.value = null;
  photoPreview.value = null;
  photoBase64.value = null;
  clearPosition();
};

const submitForm = async () => {
  if (!isFormValid.value || !selectedPosition.value) return;

  try {
    addSignalement({
      titre: form.value.titre,
      description: form.value.description,
      latitude: selectedPosition.value.lat,
      longitude: selectedPosition.value.lng,
      date: form.value.date,
      statut: 'signalé',
      type: form.value.type,
      surface: form.value.surface || undefined,
      photoUrl: photoBase64.value || undefined
    });

    // Rediriger vers la liste des signalements
    ionRouter.navigate('/signalements', 'back');
  } catch (error) {
    console.error('Erreur lors de la création du signalement', error);
  }
};
</script>

<style scoped>
.form-container {
  padding: 1rem;
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
