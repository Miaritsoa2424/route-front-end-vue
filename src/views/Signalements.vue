<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Signalements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Signalements</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="signalements-container">
        <!-- Filtres -->
        <div class="filters">
          <ion-segment :value="selectedStatus" @ion-change="selectedStatus = ($event.detail.value as string)">
            <ion-segment-button value="tous">Tous ({{ totalSignalements }})</ion-segment-button>
            <ion-segment-button value="signalé">
              Signalés ({{ getCountByStatus('signalé') }})
            </ion-segment-button>
            <ion-segment-button value="en_cours">
              En cours ({{ getCountByStatus('en_cours') }})
            </ion-segment-button>
            <ion-segment-button value="résolu">
              Résolus ({{ getCountByStatus('résolu') }})
            </ion-segment-button>
          </ion-segment>
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
                <h2>{{ signalement.titre }}</h2>
                <ion-badge :color="getStatusColor(signalement.statut)">
                  {{ signalement.statut }}
                </ion-badge>
              </div>
              
              <p class="description">{{ signalement.description }}</p>
              
              <div class="signalement-meta">
                <span>📅 {{ formatDate(signalement.date) }}</span>
                <span v-if="signalement.surface">📏 {{ signalement.surface }}m²</span>
                <span>🏷️ {{ signalement.type }}</span>
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
import { ref, computed } from 'vue';
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
  IonSegmentButton
} from '@ionic/vue';
import { SIGNALEMENTS_MOCK, STATUS_COLORS, STATUS_LABELS, type SignalementStatus } from '../data/signalements';

const selectedStatus = ref<string>('tous');

const totalSignalements = computed(() => SIGNALEMENTS_MOCK.length);

const filteredSignalements = computed(() => {
  if (selectedStatus.value === 'tous') {
    return SIGNALEMENTS_MOCK;
  }
  return SIGNALEMENTS_MOCK.filter(s => s.statut === selectedStatus.value);
});

const getCountByStatus = (status: SignalementStatus) => {
  return SIGNALEMENTS_MOCK.filter(s => s.statut === status).length;
};

const getStatusColor = (status: SignalementStatus): string => {
  const colors: Record<SignalementStatus, string> = {
    'signalé': 'danger',
    'en_cours': 'warning',
    'résolu': 'success'
  };
  return colors[status];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
</script>

<style scoped>
.signalements-container {
  padding: 1rem;
}

.filters {
  margin-bottom: 1.5rem;
}

ion-segment {
  width: 100%;
}

.signalement-item {
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.signalement-content {
  width: 100%;
}

.signalement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.signalement-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

ion-badge {
  white-space: nowrap;
  text-transform: capitalize;
}

.description {
  margin: 0.5rem 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.signalement-meta {
  display: flex;
  gap: 1rem;
  margin: 0.75rem 0;
  font-size: 12px;
  color: #888;
  flex-wrap: wrap;
}

.coordinates {
  margin-top: 0.5rem;
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}
</style>
