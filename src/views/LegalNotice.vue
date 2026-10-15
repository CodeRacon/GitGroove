<script setup lang="ts">
import LegalPage from '@/components/legal/LegalPage.vue'
import OperatorContact from '@/components/legal/OperatorContact.vue'
</script>

<template>
  <LegalPage title="Imprint" description="Impressum · Provider information for GitGroove.">
    <h2>Provider</h2>
    <p>Information pursuant to § 5 DDG and § 18 (1) MStV.</p>
    <OperatorContact />

    <h2>Privacy</h2>
    <p>
      Details about hosting, GitHub contribution requests and your rights are available in our
      <RouterLink :to="{ path: '/', query: { view: 'privacy' }, hash: $route.hash }"
        >privacy policy</RouterLink
      >.
    </p>
  </LegalPage>
</template>
