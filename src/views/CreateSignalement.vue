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
              <ion-label position="stacked">Entreprise</ion-label>
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
              <ion-label position="stacked">Statut</ion-label>
              <ion-select v-model="form.dernier_statut" placeholder="Sélectionner" required>
                <ion-select-option value="Signalé">Signalé</ion-select-option>
                <ion-select-option value="En cours">En cours</ion-select-option>
                <ion-select-option value="Résolu">Terminé</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Section Photos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>3. Photos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" color="secondary" @click="capturePhoto">
              <ion-icon slot="start" name="camera"></ion-icon>
              Capturer une photo
            </ion-button>
            <div v-if="photos.length > 0" class="photos-container">
              <div v-for="(photo, index) in photos" :key="index" class="photo-item">
                <ion-img :src="photo" class="captured-photo"></ion-img>
                <ion-button fill="clear" color="danger" class="delete-photo-btn" @click="deletePhoto(index)">
                  <ion-icon slot="icon-only" name="trash"></ion-icon>
                </ion-button>
              </div>
            </div>
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

      <!-- Modal pour la caméra -->
      <ion-modal :is-open="showCameraModal" @did-dismiss="closeCameraModal">
        <ion-header :translucent="true">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button color="medium" @click="closeCameraModal">Annuler</ion-button>
            </ion-buttons>
            <ion-title>Capturer une photo</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="camera-modal-content">
            <video ref="videoElement" autoplay playsinline class="camera-video"></video>
            <canvas ref="canvasElement" style="display: none;"></canvas>
            <div class="camera-buttons">
              <ion-button expand="block" color="success" @click="takePhoto">
                <ion-icon slot="start" name="camera"></ion-icon>
                Prendre la photo
              </ion-button>
              <ion-button expand="block" color="medium" @click="closeCameraModal">
                <ion-icon slot="start" name="close"></ion-icon>
                Annuler
              </ion-button>
            </div>
          </div>
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
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const router = useRouter();
const ionRouter = useIonRouter();
const mapContainer = ref<HTMLElement>();
const videoElement = ref<HTMLVideoElement>();
const canvasElement = ref<HTMLCanvasElement>();
let map: L.Map;
let selectedMarker: L.Marker | null = null;
let mediaStream: MediaStream | null = null;

const showMapModal = ref(false);
const showCameraModal = ref(false);
const selectedPosition = ref<{ lat: number; lng: number } | null>(null);
const isLoading = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastColor = ref<'success' | 'danger'>('success');
const entreprisesDisponibles = getEntreprises();
const photos = ref<string[]>([]);

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

const capturePhoto = async () => {
  try {
    // Vérifier si on est sur une plateforme native (iOS/Android)
    const { Capacitor } = await import('@capacitor/core');
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Sur mobile, utiliser la caméra native
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      if (image.dataUrl) {
        photos.value.push(image.dataUrl);
      }
    } else {
      // Sur le web, ouvrir le modal avec la caméra en direct
      await openCameraModal();
    }
  } catch (error) {
    console.error('Erreur lors de la capture de photo:', error);
    toastColor.value = 'danger';
    toastMessage.value = 'Erreur lors de la capture de photo';
    showToast.value = true;
  }
};

const openCameraModal = async () => {
  try {
    showCameraModal.value = true;
    
    // Attendre que le modal soit rendu
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Accéder à la caméra
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream;
    }
  } catch (error) {
    console.error('Erreur d\'accès à la caméra:', error);
    showCameraModal.value = false;
    
    // Fallback: ouvrir le sélecteur de fichiers
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          photos.value.push(dataUrl);
          toastColor.value = 'success';
          toastMessage.value = '✅ Photo sélectionnée avec succès!';
          showToast.value = true;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }
};

const takePhoto = () => {
  try {
    if (!videoElement.value || !canvasElement.value) {
      toastColor.value = 'danger';
      toastMessage.value = 'Erreur: Élément vidéo ou canvas non trouvé';
      showToast.value = true;
      return;
    }

    // Obtenir les dimensions de la vidéo
    const video = videoElement.value;
    const canvas = canvasElement.value;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image de la vidéo sur le canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      // Convertir en Data URL et ajouter la photo
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      photos.value.push(dataUrl);
      
      toastColor.value = 'success';
      toastMessage.value = '✅ Photo capturée avec succès!';
      showToast.value = true;
      
      // Fermer le modal
      closeCameraModal();
    }
  } catch (error) {
    console.error('Erreur lors de la capture:', error);
    toastColor.value = 'danger';
    toastMessage.value = 'Erreur lors de la capture de la photo';
    showToast.value = true;
  }
};

const closeCameraModal = () => {
  showCameraModal.value = false;
  
  // Arrêter la caméra
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
};

const deletePhoto = (index: number) => {
  photos.value.splice(index, 1);
  toastColor.value = 'success';
  toastMessage.value = '🗑️ Photo supprimée';
  showToast.value = true;
};

const capturePhotoWeb = async () => {
  try {
    // Créer un élément vidéo temporaire pour accéder à la caméra
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    
    // Créer un élément video
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    // Attendre que la vidéo soit prête
    await new Promise(resolve => {
      video.onloadedmetadata = resolve;
    });
    
    // Créer un canvas et y dessiner l'image de la vidéo
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    
    // Arrêter la caméra
    stream.getTracks().forEach(track => track.stop());
    
    // Convertir en Data URL et ajouter la photo
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    photos.value.push(dataUrl);
    
    toastColor.value = 'success';
    toastMessage.value = '✅ Photo capturée avec succès!';
    showToast.value = true;
  } catch (error) {
    console.error('Erreur d\'accès à la caméra web:', error);
    
    // Fallback: ouvrir le sélecteur de fichiers
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          photos.value.push(dataUrl);
          toastColor.value = 'success';
          toastMessage.value = '✅ Photo sélectionnée avec succès!';
          showToast.value = true;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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
  photos.value = [];
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
      email: userEmail,
      photos: photos.value
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
  background: var(--bg-primary);
  min-height: 100%;
}

.form-container ion-card {
  margin: 0 0 1rem 0;
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.form-container ion-card-header {
  background: var(--gradient-primary);
  padding: 16px 20px;
}

.form-container ion-card-title {
  color: white;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-container ion-card-content {
  padding: 20px;
}

.form-container ion-item {
  --padding-top: 16px;
  --padding-bottom: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  margin-bottom: 16px;
  --background: var(--bg-primary);
  border: 2px solid var(--border-light);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.form-container ion-item:focus-within {
  border-color: var(--route-primary);
  box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.1);
}

.form-container ion-label {
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-container ion-label[position="floating"] {
  transform: translateY(50%) scale(1);
}

.form-container ion-item.item-has-value ion-label[position="floating"],
.form-container ion-item.item-has-focus ion-label[position="floating"] {
  transform: translateY(0) scale(0.82);
}

.form-container ion-select {
  --padding-top: 20px;
  --padding-bottom: 8px;
  font-weight: 500;
  min-height: 50px;
}

.form-container ion-input,
.form-container ion-textarea {
  --padding-top: 8px;
  --padding-bottom: 8px;
  font-weight: 500;
}

.map-selector {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 3px solid var(--border-light);
  overflow: hidden;
}

.map-selector-modal {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.position-info {
  margin-top: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
  border-radius: 12px;
  border-left: 4px solid var(--route-primary);
}

.position-info p {
  margin: 0.25rem 0;
  font-size: 14px;
  color: var(--text-primary);
}

.position-info p:first-child {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 0.75rem;
}

.position-info strong {
  color: var(--route-primary);
}

.position-info ion-button {
  margin-top: 1rem;
  --background: var(--bg-secondary);
  --color: var(--text-primary);
  --border-radius: 8px;
  font-weight: 600;
}

.no-position {
  margin-top: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 12px;
  border-left: 4px solid var(--route-warning);
  color: #92400e;
  font-weight: 500;
}

.no-position::before {
  content: '📍';
  margin-right: 8px;
}

.photo-section {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border: 2px dashed var(--border-medium);
  border-radius: 12px;
  background: var(--bg-primary);
  transition: all 0.3s ease;
}

.photo-section:hover {
  border-color: var(--route-primary);
  background: rgba(26, 95, 122, 0.02);
}

.photo-preview {
  margin-top: 1rem;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-md);
}

.submit-button {
  margin-top: 2rem;
  margin-bottom: 1rem;
  --background: var(--gradient-success);
  --box-shadow: var(--shadow-md);
  height: 54px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  --box-shadow: var(--shadow-lg);
}

.submit-button:disabled {
  --background: var(--bg-tertiary);
  opacity: 0.7;
}

.reset-button {
  margin-bottom: 2rem;
  --background: transparent;
  --color: var(--text-secondary);
  --border-radius: var(--button-radius);
  border: 2px solid var(--border-medium);
  font-weight: 600;
}

.reset-button:hover {
  --background: var(--bg-primary);
  border-color: var(--text-secondary);
}

.photos-container {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.photo-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.captured-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--border-light);
}

.delete-photo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  --padding-start: 4px;
  --padding-end: 4px;
  --padding-top: 4px;
  --padding-bottom: 4px;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --color: #ef4444;
}

.delete-photo-btn:hover {
  --color: #dc2626;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Modal styling */
ion-modal ion-toolbar {
  --background: var(--gradient-primary);
  --color: white;
}

ion-modal ion-button {
  --color: white;
  font-weight: 600;
}

/* Camera Modal Styles */
.camera-modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.camera-video {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.camera-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-light);
}

.camera-buttons ion-button {
  --color: white;
}
</style>
