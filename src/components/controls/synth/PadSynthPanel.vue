<script lang="ts">
export default {
  name: 'PadSynthPanel',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { SYNTH_RANGES } from '@/audio/params'
import RotaryKnob from '../common/RotaryKnob.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import Fader from '../common/Fader.vue'
import OctaveControl from '../OctaveControl.vue'
import { useStudio } from '@/audio/studio'
import type { PadSynthParams } from '@/audio/params'

const { state, updateSynthParam, params, mix, toggleSolo, toggleMute } = useStudio()

const padParams = computed(() => params.pad)
const ranges = SYNTH_RANGES.pad

const isModulation = computed({
  get: () => state.view.padEnvelope === 'modulation',
  set: (value: boolean) => {
    state.view.padEnvelope = value ? 'modulation' : 'amplitude'
  },
})

/**
 * Computes the envelope parameters based on whether modulation is enabled or not.
 * If modulation is enabled, it uses the modulation envelope parameters, otherwise it uses the regular envelope parameters.
 * The envelope parameters include attack, decay, sustain, and release.
 */
const envelopeParams = computed(() => ({
  attack: isModulation.value ? padParams.value.modAttack : padParams.value.attack,
  decay: isModulation.value ? padParams.value.modDecay : padParams.value.decay,
  sustain: isModulation.value ? padParams.value.modSustain : padParams.value.sustain,
  release: isModulation.value ? padParams.value.modRelease : padParams.value.release,
}))

/**
 * Updates the specified envelope parameter for the pad synth.
 *
 * If modulation is enabled, it updates the modulation envelope parameter. Otherwise, it updates the regular envelope parameter.
 *
 * @param param - The name of the envelope parameter to update (e.g. 'attack', 'decay', 'sustain', 'release').
 * @param value - The new value for the envelope parameter.
 */
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

/**
 * Toggles the chorus effect for the pad synth.
 *
 * @param value - A boolean value indicating whether the chorus effect should be enabled or disabled.
 */
const toggleChorus = (value: boolean) => updateSynthParam('pad', 'chorus', value)
</script>

<template>
  <div class="pad-synth-panel synth-panel" role="group" aria-label="Pad synthesizer">
    <div class="panel-header">
      <div>
        <h3>Pad</h3>
        <p class="voice-description">Atmospheric chords</p>
      </div>
      <div class="control-buttons">
        <button
          class="control-btn"
          type="button"
          :class="{ active: mix.isMuted('pad') }"
          :aria-pressed="mix.isMuted('pad')"
          aria-label="Mute pad"
          @click="toggleMute('pad')"
        >
          Mute
        </button>
        <button
          class="control-btn"
          type="button"
          :class="{ active: mix.solo === 'pad' }"
          :aria-pressed="mix.solo === 'pad'"
          aria-label="Solo pad"
          @click="toggleSolo('pad')"
        >
          Solo
        </button>
      </div>
    </div>

    <div class="controls-grid">
      <div class="tone-options">
        <OctaveControl voice="pad" v-model="state.sound.octaves.pad" />
      </div>
      <div class="volume-section">
        <Fader
          v-model="padParams.volume"
          :min="ranges.volume[0]"
          :max="ranges.volume[1]"
          :step="0.5"
          label="Volume"
          unit="dB"
          @update:modelValue="updateVolume"
        />
      </div>

      <div class="knob-section effects">
        <span class="control-section-title">Tone & effects</span>
        <RotaryKnob
          v-model="padParams.cutoff"
          :min="ranges.cutoff[0]"
          :max="ranges.cutoff[1]"
          :step="10"
          label="Cutoff"
          unit="Hz"
          @update:modelValue="updateCutoff"
        />

        <RotaryKnob
          v-model="padParams.reverbMix"
          :min="ranges.reverbMix[0]"
          :max="ranges.reverbMix[1]"
          :step="0.05"
          label="Reverb"
          @update:modelValue="updateReverbMix"
        />
      </div>

      <div class="knob-section envelope">
        <span class="control-section-title">Envelope</span>
        <RotaryKnob
          v-model="envelopeParams.attack"
          :min="ranges.attack[0]"
          :max="ranges.attack[1]"
          :step="0.05"
          :label="isModulation ? 'Mod Attack' : 'Attack'"
          unit="s"
          @update:modelValue="(value) => updateEnvelopeParam('attack', value)"
        />

        <RotaryKnob
          v-model="envelopeParams.decay"
          :min="ranges.decay[0]"
          :max="ranges.decay[1]"
          :step="0.05"
          :label="isModulation ? 'Mod Decay' : 'Decay'"
          unit="s"
          @update:modelValue="(value) => updateEnvelopeParam('decay', value)"
        />

        <RotaryKnob
          v-model="envelopeParams.sustain"
          :min="ranges.sustain[0]"
          :max="ranges.sustain[1]"
          :step="0.05"
          :label="isModulation ? 'Mod Sustain' : 'Sustain'"
          @update:modelValue="(value) => updateEnvelopeParam('sustain', value)"
        />

        <RotaryKnob
          v-model="envelopeParams.release"
          :min="ranges.release[0]"
          :max="ranges.release[1]"
          :step="0.05"
          :label="isModulation ? 'Mod Release' : 'Release'"
          unit="s"
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
