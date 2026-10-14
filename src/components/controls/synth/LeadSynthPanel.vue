<script lang="ts">
export default {
  name: 'LeadSynthPanel',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import RotaryKnob from '../common/RotaryKnob.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import Fader from '../common/Fader.vue'
import { useStudio } from '@/audio/studio'

const { updateSynthParam, params, mix, toggleSolo, toggleMute } = useStudio()

const leadParams = computed(() => params.lead)

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
  <div class="lead-synth-panel synth-panel" role="group" aria-label="Lead synthesizer">
    <div class="panel-header">
      <div>
        <h3>Lead</h3>
        <p class="voice-description">Melody & texture</p>
      </div>
      <div class="control-buttons">
        <button
          class="control-btn"
          type="button"
          :class="{ active: mix.isMuted('lead') }"
          :aria-pressed="mix.isMuted('lead')"
          aria-label="Mute lead"
          @click="toggleMute('lead')"
        >
          Mute
        </button>
        <button
          class="control-btn"
          type="button"
          :class="{ active: mix.solo === 'lead' }"
          :aria-pressed="mix.solo === 'lead'"
          aria-label="Solo lead"
          @click="toggleSolo('lead')"
        >
          Solo
        </button>
      </div>
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
        <span class="control-section-title">Tone & effects</span>
        <RotaryKnob
          v-model="leadParams.cutoff"
          :min="20"
          :max="2000"
          :step="10"
          label="Cutoff"
          unit="Hz"
          @update:modelValue="updateCutoff"
        />

        <RotaryKnob
          v-model="leadParams.delayTime"
          :min="0.1"
          :max="1"
          :step="0.05"
          label="Delay Time"
          unit="s"
          @update:modelValue="updateDelayTime"
        />

        <RotaryKnob
          v-model="leadParams.delayFeedback"
          :min="0"
          :max="1"
          :step="0.05"
          label="Feedback"
          @update:modelValue="updateDelayFeedback"
        />

        <RotaryKnob
          v-model="leadParams.reverbMix"
          :min="0"
          :max="1"
          :step="0.05"
          label="Reverb"
          @update:modelValue="updateReverbMix"
        />
      </div>

      <div class="knob-section envelope">
        <span class="control-section-title">Envelope</span>
        <RotaryKnob
          v-model="leadParams.attack"
          :min="0.1"
          :max="1"
          :step="0.05"
          label="Attack"
          unit="s"
          @update:modelValue="updateAttack"
        />

        <RotaryKnob
          v-model="leadParams.decay"
          :min="0.1"
          :max="1"
          :step="0.05"
          label="Decay"
          unit="s"
          @update:modelValue="updateDecay"
        />

        <RotaryKnob
          v-model="leadParams.sustain"
          :min="0.1"
          :max="1"
          :step="0.05"
          label="Sustain"
          @update:modelValue="updateSustain"
        />

        <RotaryKnob
          v-model="leadParams.release"
          :min="0.1"
          :max="5"
          :step="0.05"
          label="Release"
          unit="s"
          @update:modelValue="updateRelease"
        />
      </div>

      <div class="switch-section">
        <ToggleSwitch
          v-model="leadParams.distortion"
          label="Distortion"
          @update:modelValue="toggleDistortion"
        />
      </div>
    </div>
  </div>
</template>
