<script setup lang="ts"></script>

<template>
  <div class="app">
    <header>
      <h1>GitGroove</h1>
    </header>
    <nav>
      <RouterLink to="/">Home</RouterLink> | <RouterLink to="/glossary">Glossary</RouterLink> |
      <RouterLink to="/imprint">Imprint</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}

header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

h1 {
  font-size: 3.25rem;
  color: #4caf50;
  text-shadow: 0 0 4px #327434;
  margin-bottom: 0;
}
h2 {
  color: #249a32;
}

nav {
  padding: 0;
  text-align: center;
}

nav a {
  margin: 0 0.5rem;
  text-decoration: none;
  color: #2c3e50;
}

nav a:hover {
  color: #42b883;
}

nav a.router-link-active {
  color: #42b883;
  font-weight: 700;
}
</style>
