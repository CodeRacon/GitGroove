<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>

<template>
  <article class="legal-page">
    <p class="eyebrow">GitGroove · Legal</p>
    <h1>{{ title }}</h1>
    <p class="legal-intro">{{ description }}</p>
    <div class="legal-copy"><slot /></div>
  </article>
</template>

<style scoped>
.legal-page {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  overflow-wrap: anywhere;
}
h1 {
  margin: 8px 0 12px;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
  line-height: 1.2;
}
.legal-intro {
  color: var(--color-muted);
}
.legal-copy {
  margin-top: 32px;
  color: var(--color-muted);
}
.legal-copy :deep(h2) {
  margin: 28px 0 12px;
  font-size: 1.1rem;
  color: var(--color-text);
}
.legal-copy :deep(p),
.legal-copy :deep(ul) {
  margin: 12px 0;
}
.legal-copy :deep(ul) {
  padding-left: 24px;
}
.legal-copy :deep(li) {
  margin: 6px 0;
}
.legal-copy :deep(address) {
  font-style: normal;
}
.legal-copy :deep(strong) {
  color: var(--color-text);
}
</style>
