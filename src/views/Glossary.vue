<script lang="ts">
export default {
  name: 'GlossaryView',
}
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

/**
 * Represents a single entry in the application's glossary.
 * Each entry has a term and a corresponding description.
 */
interface GlossaryEntry {
  term: string
  description: string
}

/**
 * Reactive state that keeps track of the currently open glossary entries.
 * This state is used to persist the open/closed state of the glossary entries across page loads.
 */
const openEntries = ref<Set<string>>(new Set())

/**
 * Initializes the `openEntries` state by loading the previously saved open glossary entries from local storage.
 * This ensures that the open/closed state of the glossary entries is persisted across page loads.
 */
onMounted(() => {
  const saved = localStorage.getItem('glossaryOpenEntries')
  if (saved) {
    try {
      const entries: unknown = JSON.parse(saved)
      if (Array.isArray(entries) && entries.every((entry) => typeof entry === 'string'))
        openEntries.value = new Set(entries)
    } catch {
      /* Ignore outdated browser preferences. */
    }
  }
})

/**
 * Toggles the open state of a glossary entry term in the application.
 * If the term is already open, it will be closed. If the term is closed, it will be opened.
 * The open state of the terms is persisted in the browser's local storage.
 *
 * @param term - The term to toggle the open state for.
 */
const handleTermClick = (term: string) => {
  if (openEntries.value.has(term)) {
    openEntries.value.delete(term)
  } else {
    openEntries.value.add(term)
  }
  localStorage.setItem('glossaryOpenEntries', JSON.stringify([...openEntries.value]))
}

/** This is a list of glossary entries for the GitGroove application. 
Each entry contains a term and a description, providing definitions and explanations of 
various musical concepts and features used in the application. The entries are sorted alphabetically by term.
*/
const glossaryEntries: GlossaryEntry[] = [
  {
    term: 'ADSR Envelope',
    description:
      'The four stages that shape a note over time: Attack, Decay, Sustain and Release. Each synth has its own envelope. The pad also has a separate envelope for its FM modulation.',
  },
  {
    term: 'Arpeggio',
    description:
      'A chord played as successive notes. The Arpeggio Pattern selector on Bass and Lead independently offers Original, Up, Down and Up/Down. Up/Down reverses without repeating the turning notes. Patterns restart each week; silent days stay silent. Bass keeps one note per active day; Lead keeps two or four notes on brighter days. Changes keep playback running.',
  },
  {
    term: 'Attack',
    description:
      'Part of the ADSR envelope that determines how quickly a sound reaches its maximum level. Controls the initial punch of a sound.',
  },
  {
    term: 'Bar',
    description:
      'In GitGroove, one bar represents a week with seven evenly spaced day steps over four beats.',
  },
  {
    term: 'Bass Synth',
    description:
      'The low-frequency foundation of the mix. In Original mode it plays the chord root on days with contributions; other patterns walk through the week’s chord tones, one note per active day. Brighter days increase note velocity. Choose Square, Sine, Triangle or Saw to change its basic tone.',
  },

  {
    term: 'BPM (Beats Per Minute)',
    description:
      'The tempo measurement unit that defines how fast the music plays. GitGroove allows BPM adjustment from 30 to 300.',
  },
  {
    term: 'Chord Progression',
    description:
      'A sequence of chords that forms the harmonic foundation. GitGroove chooses I, IV, V or vi for each week from its position and contribution counts. The root key transposes this progression without changing the contribution pattern.',
  },
  {
    term: 'Chorus',
    description:
      'An effect that creates a richer sound by mixing the original signal with slightly delayed and pitch-modulated copies.',
  },
  {
    term: 'Clipping',
    description:
      'Distortion caused when a signal exceeds the available output range. Several voices, resonance and layered effects can add up to excessive peaks. GitGroove uses output headroom, compression and a soft peak ceiling to control these peaks in playback and WAV export. Intentional Distortion on the lead remains a separate effect.',
  },
  {
    term: 'Contribution Calendar',
    description:
      'A grid of daily GitHub activity. Each square is one day and each column is one week. Days with 1–5 contributions trigger bass, 6–10 add pad chords, 11–19 add two lead notes and 20 or more add four lead notes. Empty days start no new notes, but existing notes and effects can continue to fade.',
  },
  {
    term: 'Contribution History',
    description:
      'The year buttons below the grid load the years available from GitHub. Last 12 months is a rolling year; a numbered year runs January–December, or up to today for this year. Years load on demand and are cached for five minutes. Choosing another year stops playback immediately. Explore the new grid after it loads, then press Play; playback never restarts automatically. A failed request leaves the previous grid visible and stopped. Sound settings stay unchanged. Shared sounds remain frozen until you choose Explore profile history.',
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
      'An echo effect on the lead voice that alternates between the left and right channels. Delay Time sets the interval between echoes; Feedback controls how much of each echo repeats.',
  },
  {
    term: 'Distortion',
    description:
      'An effect that adds harmonics by clipping or overdriving the signal, creating a warmer or more aggressive sound.',
  },
  {
    term: 'Effect Tail',
    description:
      'The sound left after the last note, including envelope release, delay and reverb. In Download WAV, Clip with effect tail plays the selected section once and adds 12 seconds of fading sound.',
  },
  {
    term: 'Feedback',
    description:
      'The amount of an echo fed back into the lead delay. Higher values make echoes repeat for longer; lower values let them fade sooner. The 0–1 control maps to at most 95% regeneration, so even the highest setting gradually fades instead of accumulating indefinitely.',
  },
  {
    term: 'Filter',
    description:
      'A sound-shaping tool that affects specific frequencies. Each GitGroove voice has a low-pass filter: lowering Cutoff removes more high frequencies and makes the sound darker.',
  },
  {
    term: 'Harmony',
    description:
      'The combination of simultaneous notes forming chords and their progression. Generated from GitHub contribution patterns in GitGroove.',
  },
  {
    term: 'Lead Synth',
    description:
      'The melodic voice, initially in a higher register. It starts on days with at least 11 contributions. Its tone can be shaped with a filter, envelope, ping-pong delay, reverb and optional distortion.',
  },
  {
    term: 'Lead Focus',
    description:
      'An optional sidechain-style control that briefly lowers the pad when audible lead notes start, making room for their attacks. It leaves your volume faders unchanged and respects Mute and Solo. At 0% it is off; at 100% the pad is lowered by up to 12 dB.',
  },
  {
    term: 'Loop',
    description:
      'A selected section that repeats during playback. One week equals one bar, so section length and tempo determine the loop duration. The Loop WAV export contains exactly one section, with short fades at its boundaries.',
  },
  {
    term: 'Mini Player',
    description:
      'Compact playback controls at the bottom of the screen when the main Play/Pause controls are out of view. It shows the current profile, loop length and playback state, and remains available when paused or reading Glossary/About. Select the profile to return to the studio controls.',
  },
  {
    term: 'Modulation',
    description:
      'One signal changing another to shape a sound. The pad uses FM (frequency modulation). Its Modulation switch changes the four envelope knobs between the normal amplitude envelope and the modulation envelope; it does not turn FM on or off. Both sets of settings are retained.',
  },
  {
    term: 'Mute',
    description:
      'Silences a voice without changing its saved volume or sound settings. Solo can make a muted voice audible temporarily; turning Solo off restores the existing mute states.',
  },
  {
    term: 'Octave',
    description:
      'A pitch interval of twelve semitones. Each synth has its own octave selector: −1 moves its notes lower, +1 moves them higher and 0 keeps their original register. Changing octave keeps playback and its current position; new notes use the selected register while existing notes and effects can ring out.',
  },
  {
    term: 'Pad Synth',
    description:
      'A synthesizer voice creating sustained, atmospheric sounds that fill the background of the mix.',
  },
  {
    term: 'QR Code',
    description:
      'A scannable image of the same complete snapshot link shown in Share sound. Scan it with a camera to open the sound, then press Play. Download QR saves the image as a PNG. If a snapshot is too large for QR, its full link can still be copied.',
  },
  {
    term: 'Release',
    description: 'The time taken for a sound to fade to silence after a note ends.',
  },
  {
    term: 'Reset Sound',
    description:
      'Restores the original synth settings and patterns, C-major root key, octave positions, volume levels, Mute/Solo states, Lead focus and 90 BPM. It stops playback while keeping your contribution calendar, year and selected weeks.',
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
    term: 'Root Key',
    description:
      'The tonal home of the music. The piano-style selector offers twelve major keys and transposes all three voices together. C major is the default. Changing key keeps playback and its current position; new notes use the selected key while existing notes and effects can ring out.',
  },
  {
    term: 'Section Length',
    description:
      'The number of weeks included in your loop; one week is one musical bar. Choose 4, 8, 12 or 16 directly, or use More… for other lengths and the full calendar. A new length stops playback and adjusts the selection to stay inside the calendar.',
  },
  {
    term: 'Snapshot',
    description:
      'A frozen copy of a sound: profile name, contribution dates and counts, selected weeks, tempo, root key, octaves, every synth parameter, effects, volume, Mute/Solo, Lead focus and the pad envelope view. Share sound embeds it in a link. Opening it restores the notes and settings without fetching GitHub again; press Play to listen from the section start. Reverb can vary slightly between sessions.',
  },
  {
    term: 'Solo',
    description:
      'Lets you hear one voice on its own, including a voice that was muted. Press Solo again to restore the stored Mute states and levels. Solo affects both playback and WAV export.',
  },
  {
    term: 'Space Shortcut',
    description:
      'Press Space to start, pause or resume your loaded sequence from Studio, Glossary or About. It does not override text inputs, dropdowns, focused buttons and links, or open dialogs. Holding Space triggers only once. Playback continues when changing between these views.',
  },
  {
    term: 'Sustain',
    description:
      'The level at which a note holds after the decay phase and before the release phase begins.',
  },
  {
    term: 'Sound-sculpture',
    description:
      'An artistic approach that transforms data into audible patterns and textures. In GitGroove, GitHub contribution counts shape rhythm, harmony, and melody.',
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
  {
    term: 'WAV Export',
    description:
      'Download WAV renders your selected section and the settings captured when you start the download, including effects and Mute/Solo. The result is a stereo 44.1 kHz, 16-bit WAV. Choose Loop for exact section length or Clip with effect tail for an extra 12 seconds of fading sound. Export runs separately from live playback. Peaks are reduced if needed to prevent clipping.',
  },
  {
    term: 'Waveform',
    description:
      'The basic shape produced by an oscillator before filtering and effects. The bass offers Square, Sine, Triangle and Saw. Sine is smooth with no upper harmonics; Triangle adds gentle harmonics; Square and Saw offer richer tones. Changing waveform keeps the notes and selected weeks unchanged.',
  },
].sort((a, b) => a.term.localeCompare(b.term))
</script>

<template>
  <div class="glossary">
    <h2>Studio, Sound & Music Glossary</h2>
    <p class="glossary-intro">
      A guide to the contribution calendar, sound controls and sharing. Open a term for a short
      explanation of what it means in GitGroove.
    </p>
    <div class="glossary-grid">
      <div v-for="(entry, index) in glossaryEntries" :key="entry.term" class="glossary-item">
        <button
          class="term"
          type="button"
          :aria-expanded="openEntries.has(entry.term)"
          :aria-controls="`glossary-entry-${index}`"
          @click="handleTermClick(entry.term)"
        >
          {{ entry.term
          }}<span aria-hidden="true">{{ openEntries.has(entry.term) ? '−' : '+' }}</span>
        </button>
        <div
          class="wrapper"
          :id="`glossary-entry-${index}`"
          :aria-hidden="!openEntries.has(entry.term)"
          :class="{ 'is-open': openEntries.has(entry.term) }"
        >
          <div class="inner">
            <div class="content">
              {{ entry.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glossary {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.glossary-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}
.glossary-intro {
  margin-top: 12px;
  color: var(--color-muted);
}

.glossary-item {
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.term {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 48px;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.625rem 1rem;
  cursor: pointer;
  color: var(--color-text);
  font-weight: 700;
  user-select: none;
}

.term:hover {
  background: var(--color-surface-raised);
}

.wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease-out;
}

.wrapper.is-open {
  grid-template-rows: 1fr;
}

.inner {
  overflow: hidden;
}

.content {
  padding: 1rem;
  color: var(--color-muted);
  border-top: 1px solid var(--color-border);
  line-height: 1.5;
}
</style>
