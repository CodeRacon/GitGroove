<script setup lang="ts"></script>

<template>
  <div class="app">
    <header>
      <nav>
        <RouterLink to="/">Grid</RouterLink> |
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}

nav {
  padding: 1rem;
  text-align: center;
}

nav a {
  margin: 0 0.5rem;
  text-decoration: none;
  color: #2c3e50;
}

nav a.router-link-active {
  color: #42b883;
}
</style>
