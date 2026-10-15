<script lang="ts">
export default {
  name: 'ImprintView',
}
</script>

<script setup lang="ts"></script>

<template>
  <div class="imprint">
    <h2>About GitGroove</h2>
    <div class="content">
      <p class="intro">
        GitHub Contribution Grid × interactive music studio. Turn a year of coding activity into
        bass, chords and melody, shape the sound, then share it or save it as audio.
      </p>
      <h3>The Story Behind</h3>
      <p>
        I'm Micha, frontend developer, music enthusiast... and interested in a lot of things, to say
        the least.
        <br />
        Sound generation is one of those, analogue or <i>synthetic</i> - it has interested me all my
        life, in one way or another.
      </p>

      <p>
        I came across
        <a href="https://eirikbrandal.com/" target="_blank" rel="noopener noreferrer"
          >Eirik Brandal</a
        >
        by chance, which left quite a lasting impression on me.
        <br />
        Eirik is a Norwegian artist and composer who creates fascinating, living sound-sculptures.
        Electronic components, perseverance, precision, a steady hand and lots of creativity. That
        is all he needs to craft something truly magical.
      </p>

      <p>
        But since I don't know much about electronics <i>yet</i>, I had to come up with something I
        can do: A web-app!
        <br />
        Eirik's commitment to bringing his pieces of light, sound and magic to life was instrumental
        in turning my initial idea into a finished project.
      </p>
      <p>
        GitGroove is intended to be a tool and toy for everyone to craft and develop their own
        personal sound-sculpture.
      </p>
      <p>So without further ado:<span> Have fun and make some noise ...literally!</span></p>

      <br />
      <p>Take care!</p>
      <p>Mike</p>

      <hr />

      <h3>Project Essence</h3>
      <p>
        Each square in the contribution calendar is a day; each week becomes a four-beat musical bar
        with seven evenly spaced day steps. Daily contribution counts determine which voices play:
        bass first, then pad chords, then lead notes and arpeggios as activity increases. Empty days
        start no new notes, while existing notes and effects can fade out.
      </p>
      <p>
        Choose a section of the calendar and press Play to hear it repeat. Pause keeps your
        position; Stop returns to the section start. You can try CodeRacon's profile without a
        GitHub account of your own. Explore earlier activity with the year buttons below the grid,
        or keep the rolling Last 12 months view. Choosing another year stops playback immediately.
        Years load on demand; explore the new grid, then press Play. Your sound settings stay in
        place.
      </p>

      <h3>Make It Yours</h3>
      <p>
        Shape three voices — Bass, Pad and Lead — with their own filters, envelopes, volume and
        effects. Choose the bass waveform, transpose the music with the root-key keyboard and shift
        each voice up or down an octave. Bass and Lead each offer Original, Up, Down and Up/Down
        arpeggio patterns; activity still controls the rhythm and silent days stay silent. Mute and
        Solo help you explore the mix; optional Lead focus briefly lowers the pad at lead note
        attacks. It is off by default.
      </p>
      <p>
        Tempo ranges from 30 to 300 BPM. Key, octave and pattern changes keep the loop playing at
        its current position: new notes follow your choice while existing notes and effects can ring
        out. A new selection stops playback at the section start. Reset sound restores the original
        sound, mix and tempo while keeping the calendar and selected weeks.
      </p>

      <p>
        Choose 4, 8, 12 or 16 weeks with the section-length buttons; More… offers other lengths and
        the full calendar. Space toggles Play/Pause outside text fields, dropdowns, focused buttons
        and open dialogs. Playback continues while you read Glossary or About. A compact player
        appears at the bottom when the main controls are out of view, including on mobile; it stays
        available after pausing. Select its profile to return to the studio controls.
      </p>

      <h3>Share a Sound, Save a Loop</h3>
      <p>
        Share sound captures the profile, contribution calendar and year, selected weeks, patterns
        and every sound setting in a complete link and downloadable QR code. The recipient opens
        this frozen snapshot and presses Play; no new GitHub request is needed, so later profile
        activity cannot change its notes or settings. Reverb can vary slightly between sessions.
      </p>
      <p>
        Download WAV saves a stereo recording of the selected section and current settings,
        including effects and Mute/Solo. Choose an exact-length loop with short boundary fades, or a
        clip with an extra 12 seconds of effect tail. Rendering happens in the browser,
        independently of live playback, at 44.1 kHz and 16-bit resolution.
      </p>

      <h3>Technical Approach</h3>
      <p>
        GitGroove combines a reactive interface with reproducible music generation and Web Audio:
      </p>
      <ul class="tech-list">
        <li>Vue 3 with Composition API & TypeScript</li>
        <li>Pinia for contribution data and loading/error states</li>
        <li>Tone.js / Web Audio for scheduled synthesis, effects and offline rendering</li>
        <li>GitHub GraphQL integration through a server endpoint</li>
        <li>Vitest and Cypress for domain logic, controls and end-to-end user flows</li>
      </ul>
      <p>
        Calendar normalization, note generation, playback and synthesis are separate parts of the
        application. The same calendar and mapping settings produce the same note sequence. Live
        playback and WAV export share the synth and effect implementation, with separate audio
        contexts. Versioned snapshots validate incoming data and restore the complete studio state.
        Links and QR codes are created locally, without a snapshot storage service.
      </p>
      <p>
        A shared output stage controls overload peaks, and even maximum echo feedback gradually
        fades. Both live playback and WAV export use this processing, so you can experiment with the
        same sound controls in either setting. Older shared links keep their notes and control
        settings and receive the updated output processing.
      </p>
      <p>
        Explore the architecture and local setup in the
        <a
          href="https://github.com/CodeRacon/GitGroove#readme"
          target="_blank"
          rel="noopener noreferrer"
          >project README</a
        >.
      </p>

      <h3>Data Usage Notice</h3>
      <p>
        GitGroove uses profile names, dates and daily contribution counts to create its music,
        rather than repository or commit contents. You do not need to sign in to GitHub. Profile
        requests pass through a server endpoint, which keeps the API token on the server and caches
        successful calendar responses for five minutes, separately for each profile and period.
        Available history follows GitHub’s contribution visibility rules.
      </p>
      <p>
        Shared links contain the captured profile and calendar alongside the sound settings; anyone
        with the link can open that snapshot. WAV files are rendered locally. The glossary remembers
        expanded terms in your browser's local storage.
      </p>

      <h3>Contact</h3>
      <p>
        In case you have questions, suggestions or want to talk about something specific, feel free
        to reach out via <a href="mailto:hey@michael-buschmann.dev">Email</a> or check one of the
        links below:
      </p>
      <div class="links">
        <a href="https://www.michael-buschmann.dev" target="_blank" rel="noopener noreferrer"
          >www.michael-buschmann.dev</a
        >
        <a href="https://github.com/CodeRacon" target="_blank" rel="noopener noreferrer">GitHub </a>
        <a
          href="https://www.linkedin.com/in/michael-buschmann-front-end-dev/"
          target="_blank"
          rel="noopener noreferrer"
          >LinkedIn
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.imprint {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.content {
  margin-top: 2rem;
  line-height: 1.6;
}
.intro {
  font-size: 1.05rem;
  color: var(--color-text);
}

.links {
  display: flex;
  flex-direction: column;
}

h3 {
  margin-top: 2rem;
  color: var(--color-accent);
}

p {
  margin: 1rem 0;
  color: var(--color-muted);
}

a {
  width: fit-content;
  text-decoration-line: underline;
}

a:hover {
  color: var(--color-text);
}

span {
  font-weight: bold;
  color: white;
}

li {
  color: var(--color-muted);
}
</style>
