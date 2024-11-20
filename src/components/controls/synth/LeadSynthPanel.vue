<script lang="ts">
export default {
  name: 'LeadSynthPanel',
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RotaryKnob from '../common/RotaryKnob.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import Fader from '../common/Fader.vue'
import { useOrchestrator } from '../../../composables/audio/useOrchestrator'

const { synthState, updateSynthParam } = useOrchestrator()

const leadParams = computed(() => synthState.value.synthParams.lead)

const updateVolume = (value: number) => updateSynthParam('lead', 'volume', value)
const updateCutoff = (value: number) => updateSynthParam('lead', 'cutoff', value)
const updateDelayTime = (value: number) => updateSynthParam('lead', 'delayTime', value)
const updateDelayFeedback = (value: number) => updateSynthParam('lead', 'delayFeedback', value)
const updateReverbMix = (value: number) => updateSynthParam('lead', 'reverbMix', value)
const updateAttack = (value: number) => updateSynthParam('lead', 'attack', value)
const updateDecay = (value: number) => updateSynthParam('lead', 'decay', value)
const updateSustain = (value: number) => updateSynthParam('lead', 'sustain', value)
const updateRelease = (value: number) => updateSynthParam('lead', 'release', value)
const toggleDistortion = (value: boolean) => updateSynthParam('lead', 'distortion', value)
</script>

<template>
  <div class="lead-synth-panel">
    <div class="panel-header">
      <h3>Lead Synth</h3>
    </div>

    <div class="controls-grid">
      <div class="volume-section">
        <Fader
          v-model="leadParams.volume"
          :min="-60"
          :max="40"
          :step="0.5"
          label="Volume"
          unit="dB"
          @update:modelValue="updateVolume"
        />
      </div>
      <div class="knob-section effects">
        <RotaryKnob
          v-model="leadParams.cutoff"
          :min="20"
          :max="4000"
          :step="10"
          label="Cutoff"
          @update:modelValue="updateCutoff"
        />

        <RotaryKnob
          v-model="leadParams.delayTime"
          :min="0"
          :max="1"
          :step="0.01"
          label="Delay Time"
          @update:modelValue="updateDelayTime"
        />

        <RotaryKnob
          v-model="leadParams.delayFeedback"
          :min="0"
          :max="0.9"
          :step="0.01"
          label="Feedback"
          @update:modelValue="updateDelayFeedback"
        />

        <RotaryKnob
          v-model="leadParams.reverbMix"
          :min="0"
          :max="1"
          :step="0.01"
          label="Reverb"
          @update:modelValue="updateReverbMix"
        />
      </div>

      <div class="knob-section envelope">
        <RotaryKnob
          v-model="leadParams.attack"
          :min="0.0"
          :max="1"
          :step="0.1"
          label="Attack"
          @update:modelValue="updateAttack"
        />

        <RotaryKnob
          v-model="leadParams.decay"
          :min="0.01"
          :max="1"
          :step="0.01"
          label="Decay"
          @update:modelValue="updateDecay"
        />

        <RotaryKnob
          v-model="leadParams.sustain"
          :min="0"
          :max="1"
          :step="0.01"
          label="Sustain"
          @update:modelValue="updateSustain"
        />

        <RotaryKnob
          v-model="leadParams.release"
          :min="0.1"
          :max="2"
          :step="0.01"
          label="Release"
          @update:modelValue="updateRelease"
        />
      </div>

      <div class="knob-section">
        <ToggleSwitch
          v-model="leadParams.distortion"
          label="Distortion"
          @update:modelValue="toggleDistortion"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lead-synth-panel {
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
  align-items: center;
  flex-wrap: wrap;
}

.knob-section.effects,
.knob-section.envelope {
  padding-bottom: 16px;
  border-bottom: 1px solid #333;
}

.volume-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #333;
}
</style>
