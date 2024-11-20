<script lang="ts">
export default {
  name: 'PadSynthPanel',
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RotaryKnob from '../common/RotaryKnob.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import Fader from '../common/Fader.vue'
import { useOrchestrator } from '../../../composables/audio/useOrchestrator'
import { useSynthControls } from '../../../composables/audio/useSynthControls'
import type { PadSynthParams } from '../../../composables/audio/useSynthState'

const { updateSynthParam, synthState } = useOrchestrator()
const { toggleSolo, toggleMute } = useSynthControls()

const padParams = computed(() => synthState.value.synthParams.pad)

const isModulation = ref(false)

const envelopeParams = computed(() => ({
  attack: isModulation.value ? padParams.value.modAttack : padParams.value.attack,
  decay: isModulation.value ? padParams.value.modDecay : padParams.value.decay,
  sustain: isModulation.value ? padParams.value.modSustain : padParams.value.sustain,
  release: isModulation.value ? padParams.value.modRelease : padParams.value.release,
}))

const updateEnvelopeParam = (param: string, value: number) => {
  const capitalizedParam = param.charAt(0).toUpperCase() + param.slice(1)
  const paramName = isModulation.value ? `mod${capitalizedParam}` : param
  updateSynthParam('pad', paramName as keyof PadSynthParams, value)
}

const updateVolume = (value: number) => updateSynthParam('pad', 'volume', value)
const updateCutoff = (value: number) => updateSynthParam('pad', 'cutoff', value)
const updateReverbMix = (value: number) => updateSynthParam('pad', 'reverbMix', value)
const toggleModulation = (value: boolean) => {
  isModulation.value = value
}
const toggleChorus = (value: boolean) => updateSynthParam('pad', 'chorus', value)
</script>

<template>
  <div class="pad-synth-panel">
    <div class="panel-header">
      <h3>Pad Synth</h3>
      <div class="control-buttons">
        <button
          class="control-btn"
          :class="{ active: synthState.soloState === 'pad' }"
          @click="() => toggleSolo('pad')"
        >
          S
        </button>
        <button
          class="control-btn"
          :class="{ active: synthState.muteState.has('pad') }"
          @click="() => toggleMute('pad')"
        >
          M
        </button>
      </div>
    </div>

    <div class="controls-grid">
      <div class="volume-section">
        <Fader
          v-model="padParams.volume"
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
          v-model="padParams.cutoff"
          :min="20"
          :max="4000"
          :step="10"
          label="Cutoff"
          @update:modelValue="updateCutoff"
        />

        <RotaryKnob
          v-model="padParams.reverbMix"
          :min="0"
          :max="1"
          :step="0.01"
          label="Reverb"
          @update:modelValue="updateReverbMix"
        />
      </div>

      <div class="knob-section envelope">
        <RotaryKnob
          v-model="envelopeParams.attack"
          :min="0.0"
          :max="4"
          :step="0.1"
          :label="isModulation ? 'Mod Attack' : 'Attack'"
          @update:modelValue="(value) => updateEnvelopeParam('attack', value)"
        />

        <RotaryKnob
          v-model="envelopeParams.decay"
          :min="0.1"
          :max="4"
          :step="0.1"
          :label="isModulation ? 'Mod Decay' : 'Decay'"
          @update:modelValue="(value) => updateEnvelopeParam('decay', value)"
        />

        <RotaryKnob
          v-model="envelopeParams.sustain"
          :min="0"
          :max="1"
          :step="0.01"
          :label="isModulation ? 'Mod Sustain' : 'Sustain'"
          @update:modelValue="(value) => updateEnvelopeParam('sustain', value)"
        />

        <RotaryKnob
          v-model="envelopeParams.release"
          :min="0.1"
          :max="8"
          :step="0.1"
          :label="isModulation ? 'Mod Release' : 'Release'"
          @update:modelValue="(value) => updateEnvelopeParam('release', value)"
        />
      </div>
      <div class="switch-section">
        <ToggleSwitch
          v-model="isModulation"
          label="Modulation"
          @update:modelValue="toggleModulation"
          class="left-align"
        />

        <ToggleSwitch
          v-model="padParams.chorus"
          label="Chorus"
          @update:modelValue="toggleChorus"
          class="right-align"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pad-synth-panel {
  background: #242424;
  border-radius: 12px;
  padding: 16px;
  width: 12rem;
  height: fit-content;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
}

.control-buttons {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 20px;
  background: #2a2a2a;
  border: 1px solid #3333338d;
  border-radius: 4px;
  color: #888;
  font-size: 0.625rem;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #333;
  color: #fff;
}

.control-btn.active {
  color: #1a1a1a;
  background: #4caf50;
  box-shadow: 0 0 4px #4caf50;
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

.switch-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 0 0.5rem;
}

.left-align {
  align-items: flex-start !important;
}

.right-align {
  align-items: flex-end !important;
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
