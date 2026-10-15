<script setup lang="ts">
import { useGitHubStore } from '@/stores/github.store'
const github = useGitHubStore()
</script>

<template>
  <div class="app" :class="{ 'has-transport': github.contributions?.weeks.length }">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="app-header">
      <RouterLink
        class="brand"
        :to="{ path: '/', hash: $route.hash }"
        aria-label="GitGroove studio"
      >
        <svg
          class="brand-mark"
          aria-hidden="true"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="currentColor"
        >
          <rect x="1" y="13" width="5" height="5" rx="1" />
          <rect x="8" y="6" width="5" height="5" rx="1" />
          <rect x="8" y="13" width="5" height="5" rx="1" />
          <rect x="8" y="20" width="5" height="5" rx="1" />
          <rect x="15" y="1" width="5" height="5" rx="1" />
          <rect x="15" y="8" width="5" height="5" rx="1" />
          <rect x="15" y="15" width="5" height="5" rx="1" />
          <rect x="22" y="8" width="5" height="5" rx="1" />
        </svg>
        <span>GitGroove<span class="brand-dot">.</span></span>
      </RouterLink>
      <nav aria-label="Main navigation">
        <RouterLink
          :to="{ path: '/', hash: $route.hash }"
          :class="{ active: !$route.query.view }"
          :aria-current="!$route.query.view ? 'page' : undefined"
          >Studio</RouterLink
        >
        <RouterLink
          :to="{ path: '/', query: { view: 'glossary' }, hash: $route.hash }"
          :class="{ active: $route.query.view === 'glossary' }"
          :aria-current="$route.query.view === 'glossary' ? 'page' : undefined"
          >Glossary</RouterLink
        >
        <RouterLink
          :to="{ path: '/', query: { view: 'imprint' }, hash: $route.hash }"
          :class="{ active: $route.query.view === 'imprint' }"
          :aria-current="$route.query.view === 'imprint' ? 'page' : undefined"
          >About</RouterLink
        >
      </nav>
    </header>
    <RouterView />
    <footer class="app-footer">
      <span>A little code. A little music.</span
      ><span
        >Built by
        <a href="https://github.com/CodeRacon" target="_blank" rel="noopener noreferrer"
          >CodeRacon</a
        ></span
      >
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 1180px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 0 32px;
}
.app.has-transport {
  padding-bottom: calc(104px + env(safe-area-inset-bottom, 0px));
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--color-border);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  text-decoration: none;
  font-size: 1.35rem;
  font-weight: 750;
  letter-spacing: -0.04em;
}
.brand-mark,
.brand-dot {
  color: var(--color-accent);
}
nav {
  display: flex;
  gap: 8px;
}
nav a {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 6px;
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.85rem;
}
nav a:hover,
nav a.active {
  background: var(--color-surface-raised);
  color: var(--color-text);
}
.app-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 24px 0;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.75rem;
}
.skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 12px;
  background: var(--color-accent);
  color: #101512;
  transform: translateY(-160%);
}
.skip-link:focus {
  transform: translateY(0);
}
@media (max-width: 600px) {
  .app {
    padding: 0 16px;
  }
  .app-header {
    gap: 8px;
    padding: 16px 0;
    flex-wrap: wrap;
  }
  .brand {
    font-size: 1.2rem;
  }
  nav {
    gap: 0;
  }
  nav a {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
}
</style>
