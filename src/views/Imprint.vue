<script setup lang="ts"></script>

<template>
  <div class="imprint">
    <h2>The Story behind</h2>
    <div class="content">
      <p>
        I'm Micha, frontend developer, music enthusiast... and interested in a lot of things, to say
        the least.
        <br />
        Sound generation is one of those, analogue or <i>synthetic</i> - it has interested me all my
        life, in one way or another.
      </p>

      <p>
        I came across <a href="https://eirikbrandal.com/" target="blank">Eirik Brandal</a> by
        chance, which left quite a lasting impression on me.
        <br />
        Eirik is an norwegian artist and composer who creates fascinating, living sound-sculptures.
        Electronic components, perseverance, precision, a steady hand and lots of creativity. That
        is all he needs to craft something true magic.
      </p>

      <p>
        But since I don't know much about electronics <i>yet</i>, I had to come up with something I
        can do: A web-app!
        <br />
        Eiriks commitment to bring his pieces of light, sound and magic to life were instrumental in
        turning my initial idea into a finished project.
      </p>
      <p>
        GitGroove is intended to be a tool and toy for everyone to craft and develop their own
        personal sound-sculpture.
      </p>
      <p>So without further ado:<span> Go make some noise ...I mean, literally!</span></p>
      <br />

      <hr />

      <h3>Project Essence</h3>
      <p>
        GitGroove combines software development and music in an experimental, playful way.
        <br />
        Every contribution becomes a musical element, where Git metrics are mapped to musical
        components. The result is a harmonious carpet of sound that reflects the development of your
        projects in an entirely new dimension.
      </p>

      <h3>Data Usage Notice</h3>
      <p>
        GitGroove only uses publicly available GitHub contribution data to create its sonic
        patterns. I don't collect or store any private information.
      </p>

      <h3>Contact</h3>
      <p>
        Do you have questions, concerns, praise, criticism, suggestions for improvement or would
        like to talk about something specific?
        <br />
        <br />
        Feel free to reach out via
        <a href="mailto:hey@michael-buschmann.dev">hey@michael-buschmann.dev</a> or check one of the
        links below:
      </p>
      <div class="links">
        <a href="www.michael-buschmann.dev" target="blank">www.michael-buschmann.dev</a>
        <a href="https://github.com/CodeRacon" target="blank">GitHub </a>
        <a href="https://www.linkedin.com/in/michael-buschmann-front-end-dev/" target="blank"
          >LinkedIn
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.imprint {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.content {
  margin-top: 2rem;
  line-height: 1.6;
}

.links {
  display: flex;
  flex-direction: column;
}

h3 {
  margin-top: 2rem;
  color: #4caf50;
}

p {
  margin: 1rem 0;
  color: #cad9cb;
}

a {
  text-decoration-line: underline;
}

a:hover {
  color: #7dede0;
}

span {
  font-weight: bold;
  color: white;
}
</style>
