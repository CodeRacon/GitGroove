<script lang="ts">
export default {
  name: 'BassSynthPanel',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { SYNTH_RANGES, type BassWaveform } from '@/audio/params'
import RotaryKnob from '../common/RotaryKnob.vue'
import Fader from '../common/Fader.vue'
import OctaveControl from '../OctaveControl.vue'
import PatternControl from '../PatternControl.vue'
import { useStudio } from '@/audio/studio'

const { state, updateSynthParam, params, mix, toggleSolo, toggleMute } = useStudio()

const bassParams = computed(() => params.bass)
const ranges = SYNTH_RANGES.bass

const updateVolume = (value: number) => updateSynthParam('bass', 'volume', value)
const updateCutoff = (value: number) => updateSynthParam('bass', 'cutoff', value)
const updateResonance = (value: number) => updateSynthParam('bass', 'resonance', value)
const updateAttack = (value: number) => updateSynthParam('bass', 'attack', value)
const updateDecay = (value: number) => updateSynthParam('bass', 'decay', value)
const updateSustain = (value: number) => updateSynthParam('bass', 'sustain', value)
const updateRelease = (value: number) => updateSynthParam('bass', 'release', value)
</script>
<template>
  <div class="bass-synth-panel synth-panel" role="group" aria-label="Bass synthesizer">
    <div class="panel-header">
      <div>
        <h3>Bass</h3>
        <p class="voice-description">Low-end foundation</p>
      </div>
      <div class="control-buttons">
        <button
          class="control-btn"
          type="button"
          :class="{ active: mix.isMuted('bass') }"
          :aria-pressed="mix.isMuted('bass')"
          aria-label="Mute bass"
          @click="toggleMute('bass')"
        >
          Mute
        </button>
        <button
          class="control-btn"
          type="button"
          :class="{ active: mix.solo === 'bass' }"
          :aria-pressed="mix.solo === 'bass'"
          aria-label="Solo bass"
          @click="toggleSolo('bass')"
        >
          Solo
        </button>
      </div>
    </div>

    <div class="controls-grid">
      <div class="tone-options">
        <label class="tone-field"
          ><span class="field-label">Waveform</span
          ><select
            class="studio-select"
            aria-label="Bass waveform"
            :value="bassParams.waveform"
            @change="
              updateSynthParam(
                'bass',
                'waveform',
                ($event.target as HTMLSelectElement).value as BassWaveform,
              )
            "
          >
            <option value="square8">Square</option>
            <option value="sine">Sine</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Saw</option>
          </select></label
        ><OctaveControl voice="bass" v-model="state.sound.octaves.bass" />
        <PatternControl voice="bass" v-model="state.sound.patterns.bass" />
      </div>
      <div class="volume-section">
        <Fader
          v-model="bassParams.volume"
          :min="ranges.volume[0]"
          :max="ranges.volume[1]"
          :step="0.5"
          label="Volume"
          unit="dB"
          @update:modelValue="updateVolume"
        />
      </div>

      <div class="knob-section filter">
        <span class="control-section-title">Filter</span>
        <RotaryKnob
          v-model="bassParams.cutoff"
          :min="ranges.cutoff[0]"
          :max="ranges.cutoff[1]"
          :step="10"
          label="Cutoff"
          unit="Hz"
          @update:modelValue="updateCutoff"
        />

        <RotaryKnob
          v-model="bassParams.resonance"
          :min="ranges.resonance[0]"
          :max="ranges.resonance[1]"
          :step="0.05"
          label="Resonance"
          @update:modelValue="updateResonance"
        />
      </div>

      <div class="knob-section envelope">
        <span class="control-section-title">Envelope</span>
        <RotaryKnob
          v-model="bassParams.attack"
          :min="ranges.attack[0]"
          :max="ranges.attack[1]"
          :step="0.05"
          label="Attack"
          unit="s"
          @update:modelValue="updateAttack"
        />

        <RotaryKnob
          v-model="bassParams.decay"
          :min="ranges.decay[0]"
          :max="ranges.decay[1]"
          :step="0.05"
          label="Decay"
          unit="s"
          @update:modelValue="updateDecay"
        />

        <RotaryKnob
          v-model="bassParams.sustain"
          :min="ranges.sustain[0]"
          :max="ranges.sustain[1]"
          :step="0.05"
          label="Sustain"
          @update:modelValue="updateSustain"
        />

        <RotaryKnob
          v-model="bassParams.release"
          :min="ranges.release[0]"
          :max="ranges.release[1]"
          :step="0.05"
          label="Release"
          unit="s"
          @update:modelValue="updateRelease"
        />
      </div>
    </div>
  </div>
</template>
