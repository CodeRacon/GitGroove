<script setup lang="ts">
import { ref } from 'vue'
import type { PlaybackStatus } from '@/playback/session'
import PlayPauseButton from './PlayPauseButton.vue'

defineProps<{
  visible: boolean
  profile: string
  bars: number
  status: PlaybackStatus
  disabled: boolean
  starting: boolean
  loading?: boolean
  error?: string
}>()
const emit = defineEmits<{ play: []; pause: []; studio: [] }>()
const focused = ref(false)
function leave(event: FocusEvent) {
  focused.value = (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)
}
</script>

<template>
  <aside
    v-if="visible || focused"
    class="mini-transport"
    aria-label="Quick playback controls"
    @focusin="focused = true"
    @focusout="leave"
  >
    <button
      class="mini-source"
      type="button"
      aria-label="Show studio and playback controls"
      @click="emit('studio')"
    >
      <span class="mini-profile">@{{ profile }}</span>
      <span v-if="error" class="mini-error" role="alert">Audio unavailable · try Play again</span>
      <span v-else class="mini-status"
        >{{ bars }} {{ bars === 1 ? 'bar' : 'bars' }} ·
        {{
          loading
            ? 'Loading…'
            : starting
              ? 'Starting…'
              : status === 'playing'
                ? 'Playing'
                : status === 'paused'
                  ? 'Paused'
                  : 'Ready'
        }}
        <span aria-hidden="true">↗</span></span
      >
    </button>
    <span class="mini-shortcut" title="Space · Play/Pause"><kbd>Space</kbd></span>
    <PlayPauseButton
      :is-playing="status === 'playing'"
      :disabled="disabled"
      :show-stop="false"
      label-prefix="Mini player: "
      @play="emit('play')"
      @pause="emit('pause')"
    />
  </aside>
</template>

<style scoped>
.mini-transport {
  position: fixed;
  z-index: 30;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  width: min(460px, calc(100% - 24px));
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #597061;
  border-radius: 12px;
  background: var(--color-surface-raised);
  box-shadow: 0 6px 24px #0005;
}
.mini-source {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 4px;
  text-align: left;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
}
.mini-source:hover .mini-profile {
  color: var(--color-accent);
}
.mini-profile {
  display: block;
  font-size: 0.85rem;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mini-error {
  display: block;
  font-size: 0.72rem;
  color: var(--color-danger);
}
.mini-status {
  display: block;
  font-size: 0.72rem;
  color: var(--color-muted);
}
.mini-shortcut {
  color: var(--color-muted);
  font-size: 0.7rem;
}
kbd {
  font: inherit;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 3px 6px;
}
@media (max-width: 600px), (hover: none) {
  .mini-shortcut {
    display: none;
  }
  .mini-transport {
    gap: 10px;
    bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
