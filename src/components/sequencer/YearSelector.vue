<script setup lang="ts">
defineProps<{
  years: number[]
  selected: number | null
  frozen: boolean
  busy: boolean
  target: number | null
  error: string | null
  disabled: boolean
}>()
const emit = defineEmits<{ select: [year: number | null] }>()
const currentYear = new Date().getUTCFullYear()
</script>

<template>
  <div class="year-selector">
    <template v-if="frozen">
      <div class="history-heading">
        <span class="field-label"
          >Frozen calendar{{ selected === null ? '' : ` · ${selected}` }}</span
        >
        <button
          class="history-button"
          type="button"
          :disabled="disabled"
          @click="emit('select', null)"
        >
          Explore profile history <span aria-hidden="true">↗</span>
        </button>
      </div>
    </template>
    <template v-else>
      <span id="year-label" class="field-label">Explore activity by year</span>
      <div class="year-options" role="group" aria-labelledby="year-label">
        <button
          class="year-button"
          type="button"
          :aria-pressed="selected === null"
          :class="{ loading: busy && target === null }"
          :disabled="disabled"
          @click="emit('select', null)"
        >
          Last 12 months
        </button>
        <button
          v-for="year in years"
          :key="year"
          class="year-button"
          type="button"
          :aria-pressed="selected === year"
          :class="{ loading: busy && target === year }"
          :disabled="disabled"
          @click="emit('select', year)"
        >
          {{ year }}<span v-if="year === currentYear" class="year-to-date"> · to date</span>
        </button>
      </div>
    </template>
    <p
      class="year-feedback"
      :class="{ error: !!error }"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <template v-if="busy"
        >Loading {{ target ?? 'last 12 months' }}… Playback stopped. Your current calendar stays
        available.</template
      >
      <template v-else-if="error"
        >{{ error }} Your calendar is unchanged. Choose the year to retry.</template
      >
      <template v-else-if="!frozen"
        >{{
          selected === null
            ? 'Rolling year up to today.'
            : selected === currentYear
              ? 'January to today.'
              : 'January to December.'
        }}
        Choose a year, explore the grid, then press Play.</template
      >
      <template v-else
        >Captured activity stays unchanged. Explore history to load live GitHub data.</template
      >
    </p>
  </div>
</template>

<style scoped>
.year-selector {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0 16px;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  min-width: 0;
}
.year-options {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 3px 8px;
}
.year-button,
.history-button {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-muted);
  font-size: 0.8rem;
}
.year-button:hover:not(:disabled),
.history-button:hover:not(:disabled) {
  color: var(--color-text);
  border-color: #6a8270;
}
.year-button[aria-pressed='true'] {
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}
.year-button.loading {
  border-style: dashed;
  color: var(--color-text);
}
.year-to-date {
  font-size: 0.7rem;
}
.year-feedback {
  grid-column: 1 / -1;
  font-size: 0.75rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin: 4px 0 0;
}
.year-feedback.error {
  color: var(--color-danger);
}
.year-selector > .field-label {
  margin: 0;
}
.history-heading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.history-heading .field-label {
  margin: 0;
}
@media (max-width: 600px) {
  .year-selector {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
