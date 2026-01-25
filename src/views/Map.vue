<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Carte</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="!authUser" router-link="/login">
            <ion-icon slot="start" name="log-in"></ion-icon>
            Se connecter
          </ion-button>
          <ion-button v-else @click="handleLogout">
            <ion-icon slot="start" name="person-circle"></ion-icon>
            {{ authUser.email }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-content">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Carte</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Filtres par statut -->
      <div class="map-filters">
        <!-- Toggle "Mes signalements uniquement" (visible seulement si connecté) -->
        <div v-if="authUser" class="filter-toggle-container">
          <ion-item>
            <ion-label>Mes signalements uniquement</ion-label>
            <ion-toggle 
              v-model="showOnlyMySignalements"
              slot="end"
            ></ion-toggle>
          </ion-item>
        </div>
      </div>

      <div id="map" ref="mapContainer"></div>
      
      <!-- Légende des statuts -->
      <div class="map-legend">
        <div class="legend-title">Statuts</div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #EF4444;"></div>
          <span>Signalé</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #F59E0B;"></div>
          <span>En cours</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #10B981;"></div>
          <span>Terminé</span>
        </div>
      </div>
      
      <!-- Loading indicator overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <ion-spinner name="crescent" color="success"></ion-spinner>
          <p>Localisation en cours...</p>
        </div>
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
import { ref, computed, onMounted, watch } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonSpinner, IonAlert, IonButton, IonSegment, IonSegmentButton, IonButtons, IonIcon, IonToggle, IonItem, IonLabel } from '@ionic/vue';
import { logOut, personCircle } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATUS_COLORS, type Signalement } from '../data/signalements';
import { getAllSignalements } from '../stores/signalementsStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { AuthService } from '../services/authService';
import type { User } from 'firebase/auth';

// Icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const mapContainer = ref<HTMLElement>();
const loading = ref(true);
const error = ref<string | null>(null);
const precision = ref<number | null>(null);
const authUser = ref<User | null>(null);
const showOnlyMySignalements = ref<boolean>(false);
let map: L.Map;
let userMarker: L.Marker | null = null;
let signalementMarkers: L.Marker[] = [];

// Écouter l'authentification
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    authUser.value = user;
  });
});

const handleLogout = async () => {
  try {
    await AuthService.logout();
  } catch (err) {
    console.error('Erreur lors de la déconnexion:', err);
  }
};

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

const allSignalements = computed(() => getAllSignalements().value);

const filteredSignalements = computed(() => {
  let filtered = allSignalements.value;

  // Filtrer par utilisateur si toggle activé
  if (showOnlyMySignalements.value && authUser.value) {
    filtered = filtered.filter((s: Signalement) => s.id_user === authUser.value?.uid);
  }

  return filtered;
});

const getCountByStatus = (status: string) => {
  return allSignalements.value.filter((s: Signalement) => s.dernier_statut === status).length;
};

const getFilteredCountByStatus = (status: string) => {
  return filteredSignalements.value.filter((s: Signalement) => s.dernier_statut === status).length;
};

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
  // Supprimer les anciens marqueurs
  signalementMarkers.forEach(marker => map.removeLayer(marker));
  signalementMarkers = [];
  
  const signalements = filteredSignalements.value;
  
  signalements.forEach((signalement: Signalement) => {
    const color = STATUS_COLORS[signalement.dernier_statut] || '#808080';
    
    // Créer une icône personnalisée avec la couleur du statut
    const customIcon = L.divIcon({
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">📌</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    // Créer le popup avec les informations du signalement
    const statusLabel = {
      'Signalé': 'Signalé',
      'En cours': 'En cours',
      'Résolu': 'Terminé'
    }[signalement.dernier_statut] || signalement.dernier_statut;

    const popupContent = `
      <div style="min-width: 250px;">
        <strong style="font-size: 14px;">${signalement.description}</strong><br>
        <span style="color: ${color}; font-weight: bold;">${statusLabel.toUpperCase()}</span><br><br>
        <small><strong>Entreprise:</strong> ${signalement.entreprise}</small><br>
        <small><strong>Avancement:</strong> ${signalement.avancement}%</small><br>
        ${signalement.surface ? `<small><strong>Surface:</strong> ${signalement.surface}m²</small><br>` : ''}
        ${signalement.budget ? `<small><strong>Budget:</strong> ${signalement.budget}Ar</small><br>` : ''}
      </div>
    `;

    // Ajouter le marqueur sur la carte
    const marker = L.marker([signalement.latitude, signalement.longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(popupContent);
    signalementMarkers.push(marker);
  });
};

// Observer les changements de filtre et réappliquer les marqueurs
watch(() => showOnlyMySignalements.value, () => {
  if (map) {
    addSignalementsToMap();
  }
});
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 8px;
}

.map-content {
  --padding-bottom: 0;
  background: #f8fafc;
  position: relative;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 1rem;
  color: #64748b;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(4px);
  z-index: 100;
  gap: 1rem;
}

.loading-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.loading-content p {
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
}

.loading-content ion-spinner {
  --color: #10b981;
}

.error-message {
  padding: 1rem;
  background-color: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 1rem;
  font-weight: 500;
}

.info-badge {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 400;
  max-width: 200px;
  border: 1px solid #e2e8f0;
}

.info-badge p {
  margin: 6px 0;
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 400;
  border: 1px solid #e2e8f0;
  min-width: 150px;
}

.legend-title {
  font-weight: 600;
  font-size: 12px;
  color: #1e293b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #475569;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.map-filters {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

ion-segment {
  width: 100%;
  --indicator-color: #10b981;
}

.filter-toggle-container {
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

ion-button {
  font-size: 12px;
  font-weight: 500;
}
</style>
