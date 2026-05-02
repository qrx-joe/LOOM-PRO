<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  labels: string[];
  values: number[];
  height?: number;
}>();

const width = 520;
const height = computed(() => props.height || 140);
const padding = 16;

const points = computed(() => {
  const values = props.values || [];
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = height.value - padding - (value / max) * (height.value - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');
});
</script>

<template>
  <div class="chart">
    <div class="title">
      {{ props.title }}
    </div>
    <svg :width="width" :height="height" class="svg">
      <polyline :points="points" fill="none" stroke="#38bdf8" stroke-width="2" />
    </svg>
    <div v-if="props.labels.length" class="labels">
      <span>{{ props.labels[0] }}</span>
      <span>{{ props.labels[props.labels.length - 1] }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.title {
  font-weight: 600;
  font-size: 13px;
}

.svg {
  background: linear-gradient(180deg, var(--color-border-light) 0%, var(--color-surface) 100%);
  border-radius: var(--radius-sm);
}

.labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-medium);
}
</style>
