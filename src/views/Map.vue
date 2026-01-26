<template>
  <ion-page>
    <ion-header>
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

    <ion-content :fullscreen="false" :scrollY="false" class="map-content">
      <!-- Container principal qui prend tout l'espace -->
      <div class="map-wrapper">
        <!-- La carte -->
        <div id="map" ref="mapContainer"></div>
        
        <!-- Barre d'actions en bas -->
        <div class="map-bottom-bar">
          <!-- Légende compacte -->
          <div class="map-legend-compact">
            <div class="legend-item-compact" title="Signalé">
              <span class="legend-dot danger"></span>
              <span class="legend-text">Signalé</span>
            </div>
            <div class="legend-item-compact" title="En cours">
              <span class="legend-dot warning"></span>
              <span class="legend-text">En cours</span>
            </div>
            <div class="legend-item-compact" title="Terminé">
              <span class="legend-dot success"></span>
              <span class="legend-text">Terminé</span>
            </div>
          </div>

          <!-- Bouton filtre mes signalements (si connecté) -->
          <button 
            v-if="authUser" 
            class="filter-button"
            :class="{ active: showOnlyMySignalements }"
            @click="showOnlyMySignalements = !showOnlyMySignalements"
          >
            <ion-icon name="eye"></ion-icon>
            <span>{{ showOnlyMySignalements ? 'Tous les signalements' : 'Voir mes signalements' }}</span>
          </button>
        </div>
        
        <!-- Loading indicator overlay -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-content">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Localisation en cours...</p>
          </div>
        </div>

        <!-- Badge de précision -->
        <div v-if="precision && !loading" class="info-badge">
          <span>📡 ±{{ Math.round(precision) }}m</span>
          <ion-button fill="clear" size="small" @click="retryGeolocation">
            <ion-icon name="refresh"></ion-icon>
          </ion-button>
        </div>
      </div>

      <ion-alert 
        v-if="error"
        :is-open="!!error" 
        header="Erreur de localisation"
        :message="error"
        :buttons="['OK']"
        @didDismiss="error = null"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonSpinner, IonAlert, IonButton, IonSegment, IonSegmentButton, IonButtons, IonIcon, IonToggle, IonItem, IonLabel, IonChip } from '@ionic/vue';
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
.map-content {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
  --overflow: hidden;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#map {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* Barre d'actions en bas */
.map-bottom-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: calc(100% - 40px);
  max-width: 400px;
}

/* Légende compacte */
.map-legend-compact {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
}

.legend-item-compact {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 15px;
  background: rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.legend-item-compact:hover {
  background: rgba(0, 0, 0, 0.08);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.danger {
  background: #EF4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
}

.legend-dot.warning {
  background: #F59E0B;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
}

.legend-dot.success {
  background: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
}

.legend-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  white-space: nowrap;
}

/* Bouton filtre mes signalements */
.filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.filter-button ion-icon {
  font-size: 18px;
  color: var(--route-primary, #1a5f7a);
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.filter-button:active {
  transform: translateY(0);
}

.filter-button.active {
  background: var(--route-primary, #1a5f7a);
  color: white;
}

.filter-button.active ion-icon {
  color: white;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1001;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-content p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-weight: 500;
  font-size: 14px;
}

.loading-content ion-spinner {
  width: 32px;
  height: 32px;
}

/* Badge de précision */
.info-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 10px 6px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
}

.info-badge ion-button {
  --padding-start: 6px;
  --padding-end: 6px;
  margin: 0;
  height: 28px;
}

.info-badge ion-button ion-icon {
  font-size: 16px;
}

/* Responsive */
@media (max-width: 360px) {
  .legend-text {
    display: none;
  }
  
  .legend-item-compact {
    padding: 6px;
  }
  
  .legend-dot {
    width: 14px;
    height: 14px;
  }
  
  .filter-button {
    font-size: 13px;
    padding: 12px 16px;
  }
}
</style>
