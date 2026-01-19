<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Carte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-content">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Carte</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="map" ref="mapContainer"></div>
      
      <div v-if="loading" class="loading-indicator">
        <ion-spinner></ion-spinner>
        <p>Localisation en cours...</p>
      </div>

      <div v-if="error" class="error-message">
        <ion-alert 
          :is-open="!!error" 
          header="Erreur de localisation"
          :message="error"
          :buttons="['OK']"
          @didDismiss="error = null"
        ></ion-alert>
      </div>

      <div v-if="precision" class="info-badge">
        <p>Précision: ±{{ Math.round(precision) }}m</p>
        <ion-button @click="retryGeolocation" size="small" expand="block">
          Relocaliser
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonSpinner, IonAlert, IonButton } from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATUS_COLORS, type Signalement } from '../data/signalements';
import { getAllSignalements } from '../stores/signalementsStore';

// Icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const mapContainer = ref<HTMLElement>();
const loading = ref(true);
const error = ref<string | null>(null);
const precision = ref<number | null>(null);
let map: L.Map;
let userMarker: L.Marker | null = null;

// Correction des icônes par défaut de leaflet
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.setIcon(defaultIcon);

onMounted(() => {
  initializeMap();
});

const initializeMap = () => {
  // Vérifier si navigator.geolocation est disponible
  if (!navigator.geolocation) {
    error.value = 'La géolocalisation n\'est pas supportée par votre navigateur';
    loading.value = false;
    // Fallback sur une position par défaut (Andoharanofotsy, Antananarivo, Madagascar)
    createMap(-18.8792, 47.5079);
    return;
  }

  // Récupérer la position de l'utilisateur avec haute précision
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      precision.value = accuracy;
      createMap(latitude, longitude);
      loading.value = false;
    },
    (err) => {
      let errorMessage = 'Erreur de géolocalisation';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Permission de localisation refusée. Activez l\'accès à votre position dans les paramètres du navigateur.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Position non disponible. Vérifiez votre connexion internet.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Délai d\'attente dépassé. Réessayez.';
          break;
      }
      
      error.value = errorMessage;
      loading.value = false;
      // Fallback sur une position par défaut (Andoharanofotsy, Antananarivo, Madagascar)
      createMap(-18.8792, 47.5079);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
};

const retryGeolocation = () => {
  loading.value = true;
  error.value = null;
  initializeMap();
};

const createMap = (lat: number, lng: number) => {
  if (!mapContainer.value) return;

  // Supprimer l'ancienne carte si elle existe
  if (map) {
    map.remove();
  }

  // Créer la carte
  map = L.map(mapContainer.value).setView([lat, lng], 15);

  // Ajouter le fond de carte OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Ajouter un marqueur à la position actuelle
  userMarker = L.marker([lat, lng], { icon: defaultIcon })
    .addTo(map)
    .bindPopup(`<strong>📍 Ma position</strong><br>Précision: ±${Math.round((precision.value || 0))}m`)
    .openPopup();

  // Ajouter les signalements sur la carte
  addSignalementsToMap();
};

const addSignalementsToMap = () => {
  const signalements = getAllSignalements().value;
  
  signalements.forEach((signalement: Signalement) => {
    const color = STATUS_COLORS[signalement.statut];
    
    // Créer une icône personnalisée avec la couleur du statut
    const customIcon = L.divIcon({
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">📌</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    // Créer le popup avec les informations du signalement
    const popupContent = `
      <div style="min-width: 250px;">
        <strong style="font-size: 14px;">${signalement.titre}</strong><br>
        <span style="color: ${color}; font-weight: bold;">${signalement.statut.toUpperCase()}</span><br><br>
        <small><strong>Description:</strong> ${signalement.description}</small><br>
        <small><strong>Date:</strong> ${new Date(signalement.date).toLocaleDateString('fr-FR')}</small><br>
        ${signalement.surface ? `<small><strong>Surface:</strong> ${signalement.surface}m²</small><br>` : ''}
      </div>
    `;

    // Ajouter le marqueur sur la carte
    L.marker([signalement.latitude, signalement.longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(popupContent);
  });
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map-content {
  --padding-bottom: 0;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 1rem;
}

.error-message {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin: 1rem;
}

.info-badge {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 400;
  max-width: 200px;
}

.info-badge p {
  margin: 5px 0;
  font-size: 12px;
  color: #333;
}
</style>
