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
  background: var(--gradient-dark);
  border-radius: var(--card-radius);
  color: white;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.recap-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--route-warning) 0px,
    var(--route-warning) 20px,
    transparent 20px,
    transparent 40px
  );
}

.recap-stat {
  text-align: center;
  padding: 0.5rem;
  position: relative;
}

.recap-stat::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.recap-stat:last-child::after {
  display: none;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--route-accent-light) 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.signalements-container {
  padding: 1rem;
  background: var(--bg-primary);
  min-height: 100vh;
}

.add-button-container {
  margin-bottom: 1.5rem;
}

.add-button-container ion-button {
  --background: var(--gradient-success);
  --box-shadow: var(--shadow-md);
  font-weight: 600;
  height: 52px;
}

.add-button-container ion-button:hover {
  transform: translateY(-2px);
  --box-shadow: var(--shadow-lg);
}

.filters {
  margin-bottom: 1.5rem;
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

ion-segment {
  width: 100%;
  --indicator-color: var(--route-primary);
}

.filter-row {
  margin-bottom: 1rem;
}

.filter-row-toggle {
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-light);
  padding-top: 1rem;
  margin-top: 1rem;
}

.filter-row-toggle ion-item {
  --background: transparent;
  --padding-start: 0;
}

.signalement-item {
  margin-bottom: 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--card-radius);
  padding: 1.25rem;
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.signalement-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--route-primary);
  transition: width 0.3s ease;
}

.signalement-item:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--route-primary-light);
  transform: translateY(-2px);
}

.signalement-item:hover::before {
  width: 6px;
}

.signalement-content {
  width: 100%;
  padding-left: 8px;
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
  font-weight: 700;
  flex: 1;
  color: var(--text-primary);
}

ion-badge {
  white-space: nowrap;
  text-transform: uppercase;
  font-weight: 700;
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 10px;
  letter-spacing: 0.5px;
}

.description {
  margin: 0.5rem 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.details {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0.5rem 0;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border-left: 3px solid var(--route-secondary);
}

.details strong {
  color: var(--text-primary);
  font-weight: 600;
}

.signalement-meta {
  display: flex;
  gap: 1.25rem;
  margin: 0.75rem 0;
  font-size: 13px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.signalement-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-primary);
  border-radius: 20px;
  font-weight: 500;
}

.coordinates {
  margin-top: 0.75rem;
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
}

.empty-state::before {
  content: '🛣️';
  font-size: 48px;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
}
</style>
