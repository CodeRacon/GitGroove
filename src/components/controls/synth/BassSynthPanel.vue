<script lang="ts">
export default {
  name: 'BassSynthPanel',
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RotaryKnob from '../common/RotaryKnob.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import Fader from '../common/Fader.vue'
import { useSynthControls } from '../../../composables/audio/useSynthControls'
import { useOrchestrator } from '../../../composables/audio/useOrchestrator'

const { synthState, updateSynthParam } = useOrchestrator()

const { updateBassParams } = useSynthControls()

const bassParams = computed(() => synthState.value.synthParams.bass)

const updateVolume = (value: number) => {
  updateSynthParam('bass', 'volume', value)
}

const updateCutoff = (value: number) => {
  updateSynthParam('bass', 'cutoff', value)
}

const updateResonance = (value: number) => {
  updateSynthParam('bass', 'resonance', value)
}

const updateAttack = (value: number) => {
  updateSynthParam('bass', 'attack', value)
}

const updateDecay = (value: number) => {
  updateSynthParam('bass', 'decay', value)
}

const updateSustain = (value: number) => {
  updateSynthParam('bass', 'sustain', value)
}

const updateRelease = (value: number) => {
  updateSynthParam('bass', 'release', value)
}
</script>

<template>
  <div class="bass-synth-panel">
    <div class="panel-header">
      <h3>Bass Synth</h3>
    </div>

    <div class="controls-grid">
      <div class="volume-section">
        <Fader
          v-model="bassParams.volume"
          :min="-60"
          :max="40"
          :step="0.5"
          label="Volume"
          unit="dB"
          @update:modelValue="updateVolume"
        />
      </div>

      <div class="knob-section filter">
        <RotaryKnob
          v-model="bassParams.cutoff"
          :min="20"
          :max="4000"
          :step="10"
          label="Cutoff"
          @update:modelValue="updateCutoff"
        />

        <RotaryKnob
          v-model="bassParams.resonance"
          :min="0.1"
          :max="10"
          :step="0.1"
          label="Resonance"
          @update:modelValue="updateResonance"
        />
      </div>

      <div class="knob-section envelope">
        <RotaryKnob
          v-model="bassParams.attack"
          :min="0.01"
          :max="1"
          :step="0.01"
          label="Attack"
          @update:modelValue="updateAttack"
        />

        <RotaryKnob
          v-model="bassParams.decay"
          :min="0.01"
          :max="1"
          :step="0.01"
          label="Decay"
          @update:modelValue="updateDecay"
        />

        <RotaryKnob
          v-model="bassParams.sustain"
          :min="0"
          :max="1"
          :step="0.01"
          label="Sustain"
          @update:modelValue="updateSustain"
        />

        <RotaryKnob
          v-model="bassParams.release"
          :min="0.01"
          :max="2"
          :step="0.01"
          label="Release"
          @update:modelValue="updateRelease"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bass-synth-panel {
  background: #242424;
  border-radius: 12px;
  padding: 16px;
  width: 12rem;
  height: fit-content;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.panel-header {
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
}

.panel-header h3 {
  margin: 0;
  color: #4caf50;
  font-size: 1.2em;
  font-weight: 500;
}

.controls-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.knob-section {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.knob-section.filter {
  padding-bottom: 16px;
  border-bottom: 1px solid #333;
}

.volume-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #333;
}
</style>
