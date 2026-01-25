<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Signalements</ion-title>
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

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Signalements</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="signalements-container">
        <!-- Récapitulatif -->
        <div class="recap-section">
          <div class="recap-card">
            <div class="recap-stat">
              <div class="stat-value">{{ filteredSignalements.length }}</div>
              <div class="stat-label">Signalements</div>
            </div>
            <div class="recap-stat">
              <div class="stat-value">{{ filteredTotalSurface.toLocaleString('fr-FR') }}</div>
              <div class="stat-label">m² total</div>
            </div>
            <div class="recap-stat">
              <div class="stat-value">{{ filteredTotalBudget.toLocaleString('fr-FR') }}</div>
              <div class="stat-label">Ar budget</div>
            </div>
            <div class="recap-stat">
              <div class="stat-value">{{ Math.round(filteredAvgAvancement) }}%</div>
              <div class="stat-label">Avancement</div>
            </div>
          </div>
        </div>

        <!-- Bouton ajouter (visible uniquement si connecté) -->
        <div v-if="authUser" class="add-button-container">
          <ion-button expand="block" color="success" router-link="/create-signalement">
            <ion-icon slot="start" name="add-circle"></ion-icon>
            Créer un signalement
          </ion-button>
        </div>

        <!-- Filtres -->
        <div class="filters">
          <!-- Toggle "Mes signalements uniquement" (visible seulement si connecté) -->
          <div v-if="authUser" class="filter-row-toggle">
            <ion-item>
              <ion-label>Mes signalements uniquement</ion-label>
              <ion-toggle 
                v-model="showOnlyMySignalements"
                slot="end"
              ></ion-toggle>
            </ion-item>
          </div>
        </div>

        <!-- Liste des signalements -->
        <ion-list v-if="filteredSignalements.length > 0">
          <ion-item 
            v-for="signalement in filteredSignalements" 
            :key="signalement.id"
            class="signalement-item"
          >
            <div class="signalement-content">
              <div class="signalement-header">
                <h2>{{ signalement.description }}</h2>
                <ion-badge :color="getStatusColor(signalement.dernier_statut)">
                  {{ getStatusLabel(signalement.dernier_statut) }}
                </ion-badge>
              </div>
              
              <p class="details">
                <strong>Entreprise:</strong> {{ signalement.entreprise }} | 
                <strong>Avancement:</strong> {{ signalement.avancement }}%
              </p>
              
              <div class="signalement-meta">
                <span v-if="signalement.surface">📏 {{ signalement.surface }}m²</span>
                <span v-if="signalement.budget">💰 {{ signalement.budget }}Ar</span>
              </div>

              <div class="coordinates">
                <small>📍 {{ signalement.latitude.toFixed(4) }}, {{ signalement.longitude.toFixed(4) }}</small>
              </div>
            </div>
          </ion-item>
        </ion-list>

        <!-- Message vide -->
        <div v-else class="empty-state">
          <p>Aucun signalement trouvé</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem, 
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonIcon,
  IonButtons,
  IonToggle,
  IonLabel
} from '@ionic/vue';
import { addCircle } from 'ionicons/icons';
import {STATUS_COLORS, type Signalement } from '../data/signalements';
import {getAllSignalements } from '../stores/signalementsStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { AuthService } from '../services/authService';
import type { User } from 'firebase/auth';

const selectedStatus = ref<string>('tous');
const authUser = ref<User | null>(null);
const showOnlyMySignalements = ref<boolean>(false);

// Écouter les changements d'authentification
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

const allSignalements = computed(() => getAllSignalements().value);

const totalSignalements = computed(() => allSignalements.value.length);

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

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || 'medium';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'Signalé': 'Signalé',
    'En cours': 'En cours',
    'Résolu': 'Terminé'
  };
  return labels[status] || status;
};

const filteredTotalSurface = computed(() => {
  return filteredSignalements.value.reduce((sum: number, s: Signalement) => sum + (s.surface || 0), 0);
});

const filteredTotalBudget = computed(() => {
  return filteredSignalements.value.reduce((sum: number, s: Signalement) => sum + (s.budget || 0), 0);
});

const filteredAvgAvancement = computed(() => {
  if (filteredSignalements.value.length === 0) return 0;
  const sum = filteredSignalements.value.reduce((acc: number, s: Signalement) => acc + (s.avancement || 0), 0);
  return sum / filteredSignalements.value.length;
});

const totalSurface = computed(() => {
  return allSignalements.value.reduce((sum: number, s: Signalement) => sum + (s.surface || 0), 0);
});

const totalBudget = computed(() => {
  return allSignalements.value.reduce((sum: number, s: Signalement) => sum + (s.budget || 0), 0);
});

const avgAvancement = computed(() => {
  if (allSignalements.value.length === 0) return 0;
  const sum = allSignalements.value.reduce((acc: number, s: Signalement) => acc + (s.avancement || 0), 0);
  return sum / allSignalements.value.length;
});
</script>

<style scoped>
.recap-section {
  margin-bottom: 1.5rem;
}

.recap-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recap-stat {
  text-align: center;
  padding: 0.5rem;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.signalements-container {
  padding: 1rem;
  background: #f8fafc;
  min-height: 100vh;
}

.add-button-container {
  margin-bottom: 1.5rem;
}

.filters {
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

ion-segment {
  width: 100%;
  --indicator-color: #10b981;
}

.filter-row {
  margin-bottom: 1rem;
}

.filter-row-toggle {
  padding: 0.5rem 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

.signalement-item {
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.signalement-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.signalement-content {
  width: 100%;
}

.signalement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.signalement-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  color: #1e293b;
}

ion-badge {
  white-space: nowrap;
  text-transform: capitalize;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
}

.description {
  margin: 0.5rem 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.details {
  font-size: 13px;
  color: #64748b;
  margin: 0.5rem 0;
}

.signalement-meta {
  display: flex;
  gap: 1rem;
  margin: 0.75rem 0;
  font-size: 13px;
  color: #475569;
  flex-wrap: wrap;
}

.coordinates {
  margin-top: 0.75rem;
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
  font-size: 16px;
}
</style>
