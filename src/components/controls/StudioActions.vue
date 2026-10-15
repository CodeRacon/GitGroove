<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { StudioSnapshot } from '@/studio/snapshot'
import { encodeSnapshot } from '@/studio/share'
import type { ExportMode } from '@/audio/export'

const props = defineProps<{ capture: () => StudioSnapshot; loopSeconds: number }>()
const route = useRoute()
const shareDialog = ref<HTMLDialogElement | null>(null)
const exportDialog = ref<HTMLDialogElement | null>(null)
const shareLink = ref('')
const qrImage = ref('')
const shareStatus = ref('')
const shareError = ref('')
const sharing = ref(false)
const exporting = ref(false)
const exportStatus = ref('')
const exportError = ref('')
const mode = ref<ExportMode>('loop')
let shareRequest = 0
let exportController: AbortController | undefined
const duration = computed(() => props.loopSeconds + (mode.value === 'tail' ? 12 : 0))
const fileSize = computed(() => ((duration.value * 44100 * 4) / 1024 / 1024).toFixed(1))
function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

async function openShare() {
  const request = ++shareRequest
  shareLink.value = ''
  qrImage.value = ''
  shareStatus.value = ''
  shareError.value = ''
  sharing.value = true
  await nextTick()
  shareDialog.value?.showModal()
  try {
    const saved = props.capture()
    const url = new URL(import.meta.env.BASE_URL, window.location.origin)
    url.hash = 'sound=' + (await encodeSnapshot(saved))
    if (request !== shareRequest) return
    shareLink.value = url.href
    const qr = await import('qrcode')
    const image = await qr.toDataURL(url.href, {
      width: 384,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: { dark: '#101512', light: '#ffffff' },
    })
    if (request === shareRequest) qrImage.value = image
  } catch (error) {
    if (request === shareRequest)
      shareError.value = shareLink.value
        ? 'This sound is too large for a QR code. You can still copy its complete link.'
        : error instanceof Error
          ? error.message
          : 'The sound could not be shared.'
  } finally {
    if (request === shareRequest) sharing.value = false
  }
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    shareStatus.value = 'Link copied.'
  } catch {
    shareStatus.value = 'Select the link below and copy it with your keyboard or touch menu.'
  }
}
function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}
function openExport() {
  exportStatus.value = ''
  exportError.value = ''
  exportDialog.value?.showModal()
}
async function downloadWav() {
  if (exporting.value) return
  exporting.value = true
  exportError.value = ''
  exportStatus.value = 'Preparing your WAV…'
  exportController = new AbortController()
  const controller = exportController
  try {
    const saved = props.capture()
    const chosenMode = mode.value
    const { renderWav } = await import('@/audio/export')
    const result = await renderWav(saved, chosenMode, controller.signal, (status) => {
      exportStatus.value = status
    })
    if (controller.signal.aborted) return
    const url = URL.createObjectURL(result.blob)
    downloadUrl(
      url,
      `gitgroove-${saved.profile}${saved.sourceYear === null ? '' : `-${saved.sourceYear}`}-weeks-${saved.selection.startWeek + 1}-${saved.selection.startWeek + saved.selection.weekCount}-${saved.bpm}bpm-${saved.sound.key.replace('#', 'sharp')}-${chosenMode}.wav`,
    )
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
    exportStatus.value = `WAV downloaded · ${formatDuration(result.duration)}${result.normalized ? ' · peak level reduced to prevent clipping' : ''}.`
  } catch (error) {
    if (controller.signal.aborted) exportStatus.value = 'Export cancelled.'
    else
      exportError.value =
        error instanceof Error
          ? error.message
          : 'The WAV could not be exported. Try a shorter section.'
  } finally {
    exporting.value = false
    exportController = undefined
  }
}
function closeShare() {
  shareRequest++
  sharing.value = false
}
function closeExport() {
  exportController?.abort()
}
onBeforeUnmount(() => {
  closeShare()
  closeExport()
})
watch(
  () => route.fullPath,
  () => {
    shareDialog.value?.close()
    exportDialog.value?.close()
  },
)
</script>

<template>
  <div class="studio-actions">
    <button class="secondary-button" type="button" @click="openShare">
      Share sound <span aria-hidden="true">↗</span>
    </button>
    <button class="secondary-button" type="button" :disabled="exporting" @click="openExport">
      {{ exporting ? 'Exporting WAV…' : 'Download WAV' }} <span aria-hidden="true">↓</span>
    </button>
    <p class="hint">Save your loop or send it to a friend.</p>
  </div>

  <dialog
    ref="shareDialog"
    class="studio-dialog"
    aria-labelledby="share-heading"
    @close="closeShare"
  >
    <div class="dialog-header">
      <h2 id="share-heading">Share this sound</h2>
      <button
        class="dialog-close"
        type="button"
        aria-label="Close sharing"
        @click="shareDialog?.close()"
      >
        ×
      </button>
    </div>
    <p class="hint">
      This link includes the frozen contribution calendar, year, selection, patterns, tempo and all
      sound settings. Your friend can open it and press Play.
    </p>
    <p v-if="sharing" class="dialog-feedback" role="status">Creating your snapshot…</p>
    <p v-if="shareError" class="dialog-error" role="alert">{{ shareError }}</p>
    <img
      v-if="qrImage"
      class="qr-image"
      :src="qrImage"
      width="384"
      height="384"
      alt="QR code to open this complete GitGroove sound snapshot"
    />
    <label v-if="shareLink" class="share-field"
      ><span class="field-label">Snapshot link</span
      ><input
        class="share-link"
        aria-label="Snapshot link"
        :value="shareLink"
        readonly
        @focus="($event.target as HTMLInputElement).select()"
    /></label>
    <div v-if="shareLink" class="dialog-buttons">
      <button class="primary-button" type="button" @click="copyLink">Copy link</button
      ><button
        v-if="qrImage"
        class="secondary-button"
        type="button"
        @click="downloadUrl(qrImage, 'gitgroove-sound-qr.png')"
      >
        Download QR
      </button>
    </div>
    <p class="dialog-feedback" role="status">{{ shareStatus }}</p>
  </dialog>

  <dialog
    ref="exportDialog"
    class="studio-dialog"
    aria-labelledby="export-heading"
    @close="closeExport"
  >
    <div class="dialog-header">
      <h2 id="export-heading">Download your sound</h2>
      <button
        class="dialog-close"
        type="button"
        aria-label="Close export"
        @click="exportDialog?.close()"
      >
        ×
      </button>
    </div>
    <p class="hint">
      A stereo WAV of your selected section and current mix. Sharing and export use the settings
      captured when you start each action.
    </p>
    <fieldset class="export-options" :disabled="exporting">
      <legend>Choose the ending</legend>
      <label
        ><input v-model="mode" type="radio" value="loop" /><span
          ><strong>Loop</strong
          ><small>Exact section length, with a short fade at the boundary.</small></span
        ></label
      >
      <label
        ><input v-model="mode" type="radio" value="tail" /><span
          ><strong>Clip with effect tail</strong
          ><small>One section plus 12 seconds for delay and reverb to fade out.</small></span
        ></label
      >
    </fieldset>
    <div class="export-details">
      <span>{{ formatDuration(duration) }} · approximately {{ fileSize }} MB</span
      ><span>WAV · stereo · 44.1 kHz · 16-bit</span>
    </div>
    <p v-if="exportError" class="dialog-error" role="alert">{{ exportError }}</p>
    <p class="dialog-feedback" role="status" aria-live="polite">{{ exportStatus }}</p>
    <div class="dialog-buttons">
      <button class="primary-button" type="button" :disabled="exporting" @click="downloadWav">
        {{ exporting ? 'Exporting…' : 'Download WAV' }}</button
      ><button class="secondary-button" type="button" @click="exportDialog?.close()">
        {{ exporting ? 'Cancel export' : 'Close' }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.studio-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  margin-top: 16px;
}
.studio-actions button {
  font-size: 0.8rem;
}
.studio-actions .hint {
  margin-left: auto;
}
.studio-dialog {
  width: min(520px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 24px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.studio-dialog::backdrop {
  background: rgb(4 9 6 / 80%);
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.dialog-header h2 {
  font-size: 1.3rem;
  letter-spacing: -0.02em;
}
.dialog-close {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  font-size: 1.4rem;
}
.hint {
  color: var(--color-muted);
  font-size: 0.8rem;
}
.qr-image {
  display: block;
  max-width: 100%;
  width: min(100%, 384px);
  height: auto;
  margin: 20px auto;
  border-radius: 4px;
}
.share-field {
  display: block;
  margin: 16px 0;
}
.share-link {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.8rem;
}
.dialog-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.dialog-feedback {
  color: var(--color-accent);
  font-size: 0.8rem;
  margin-top: 12px;
  min-height: 1.3em;
}
.dialog-error {
  color: var(--color-danger);
  font-size: 0.8rem;
  margin-top: 12px;
}
.export-options {
  border: 0;
  padding: 0;
  margin: 20px 0;
}
.export-options legend {
  font-size: 0.8rem;
  margin-bottom: 8px;
  color: var(--color-muted);
}
.export-options label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 8px;
  min-height: 68px;
  cursor: pointer;
}
.export-options label:has(input:checked) {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
.export-options input {
  accent-color: var(--color-accent);
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}
.export-options strong,
.export-options small {
  display: block;
}
.export-options strong {
  font-size: 0.85rem;
}
.export-options small {
  font-size: 0.75rem;
  color: var(--color-muted);
}
.export-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-muted);
  font-size: 0.8rem;
}
@media (max-width: 600px) {
  .studio-actions .hint {
    margin-left: 0;
    width: 100%;
  }
  .studio-dialog {
    padding: 16px;
  }
}
</style>
