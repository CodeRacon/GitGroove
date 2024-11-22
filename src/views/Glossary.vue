<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface GlossaryEntry {
  term: string
  description: string
}

const openEntries = ref<Set<string>>(new Set())

onMounted(() => {
  const saved = localStorage.getItem('glossaryOpenEntries')
  if (saved) {
    openEntries.value = new Set(JSON.parse(saved))
  }
})

const handleToggle = (term: string, isOpen: boolean) => {
  if (isOpen) {
    openEntries.value.add(term)
  } else {
    openEntries.value.delete(term)
  }
  localStorage.setItem('glossaryOpenEntries', JSON.stringify([...openEntries.value]))
}

const handleDetailsToggle = (event: Event, term: string) => {
  const details = event.target as HTMLDetailsElement
  handleToggle(term, details.open)
}

const glossaryEntries: GlossaryEntry[] = [
  {
    term: 'Arpeggio',
    description:
      'A musical technique where notes of a chord are played in sequence rather than simultaneously. In GitGroove, arpeggios are triggered by high contribution levels.',
  },
  {
    term: 'Attack',
    description:
      'Part of the ADSR envelope that determines how quickly a sound reaches its maximum level. Controls the initial punch of a sound.',
  },
  {
    term: 'Bar',
    description:
      'In GitGroove, one bar represents a week of GitHub contributions, containing 7 contribution squares. In music, a bar is a segment of time containing a specific number of beats.',
  },
  {
    term: 'Bass Synth',
    description:
      'A synthesizer voice specialized in low frequencies, providing the fundamental harmonic foundation. In GitGroove, the bass synth generates patterns based on contribution levels and plays the root notes of the harmony.',
  },

  {
    term: 'BPM (Beats Per Minute)',
    description:
      'The tempo measurement unit that defines how fast the music plays. GitGroove allows BPM adjustment from 30 to 300.',
  },
  {
    term: 'Chord Progression',
    description:
      'A sequence of musical chords that forms the harmonic foundation. In GitGroove, chord progressions are generated based on contribution patterns.',
  },
  {
    term: 'Chorus',
    description:
      'An effect that creates a richer sound by mixing the original signal with slightly delayed and pitch-modulated copies.',
  },
  {
    term: 'Cutoff',
    description:
      'A filter parameter that determines the frequency above which sound is attenuated. Controls the brightness of the sound.',
  },
  {
    term: 'Decay',
    description:
      'The time taken for a sound to fall from peak level to sustain level after the initial attack phase.',
  },
  {
    term: 'Delay (PingPong)',
    description:
      'An echo effect where the delayed signal alternates between left and right channels, creating a spacial "ping-pong" effect.',
  },
  {
    term: 'Distortion',
    description:
      'An effect that adds harmonics by clipping or overdriving the signal, creating a warmer or more aggressive sound.',
  },
  {
    term: 'Feedback',
    description:
      'In effects like delay or reverb, feedback determines how much of the processed signal is fed back into the effect input.',
  },
  {
    term: 'Filter',
    description:
      'A sound-shaping tool that affects specific frequencies. GitGroove uses filters to create dynamic timbral changes.',
  },
  {
    term: 'Harmony',
    description:
      'The combination of simultaneous notes forming chords and their progression. Generated from GitHub contribution patterns in GitGroove.',
  },
  {
    term: 'Lead Synth',
    description:
      'A synthesizer voice designed for melodic lines that typically play in the higher register and cut through the mix.',
  },
  {
    term: 'Modulation',
    description:
      'The process of one parameter controlling another, creating movement and evolution in sound.',
  },
  {
    term: 'Mute',
    description:
      'A control that silences a specific synth voice while allowing others to continue playing.',
  },
  {
    term: 'Pad Synth',
    description:
      'A synthesizer voice creating sustained, atmospheric sounds that fill the background of the mix.',
  },
  {
    term: 'Release',
    description: 'The time taken for a sound to fade to silence after a note ends.',
  },
  {
    term: 'Resonance',
    description:
      'A filter parameter that boosts frequencies around the cutoff point, creating a more pronounced sweeping effect.',
  },
  {
    term: 'Reverb',
    description:
      'An effect that simulates the natural reflections of sound in a space, adding depth and atmosphere.',
  },
  {
    term: 'Solo',
    description: 'A control that isolates a specific synth voice by muting all others.',
  },
  {
    term: 'Sustain',
    description:
      'The level at which a note holds after the decay phase and before the release phase begins.',
  },
  {
    term: 'Synthesizer/Synth',
    description:
      'An electronic instrument that generates and modifies sound through various parameters and modules.',
  },
  {
    term: 'Volume',
    description:
      'The amplitude or loudness level of a sound, measured in decibels (dB) in GitGroove.',
  },
].sort((a, b) => a.term.localeCompare(b.term))
</script>

<template>
  <div class="glossary">
    <h2>Sound & Music Glossary</h2>
    <div class="glossary-grid">
      <details
        v-for="entry in glossaryEntries"
        :key="entry.term"
        :open="openEntries.has(entry.term)"
        class="glossary-item"
        @toggle="handleDetailsToggle($event, entry.term)"
      >
        <summary>{{ entry.term }}</summary>
        <div class="description">
          {{ entry.description }}
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.glossary {
  padding: 2rem;
  width: 40rem;
  max-width: 800px;
  margin: 0 auto;
}

.glossary-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.glossary-item {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #3333338d;
}

summary {
  /* list-style: none; */
  padding: 0.625rem 1rem;
  cursor: pointer;
  color: #4caf50;
  font-weight: 700;
  user-select: none;
}

summary:hover {
  background: #333;
}

.description {
  padding: 1rem;
  color: #cad9cb;
  border-top: 1px solid #3333338d;
  line-height: 1.5;
}
</style>
