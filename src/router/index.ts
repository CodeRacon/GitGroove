import { createRouter, createWebHistory } from 'vue-router'
import GridView from '../views/GridView.vue'
import Glossary from '@/views/Glossary.vue'
import Imprint from '@/views/Imprint.vue'

/**
 * Creates a Vue Router instance with a single route that renders the `HomeView` component.
 * The router is configured to use the `createWebHistory` mode, which uses the HTML5 history API
 * to handle client-side routing without full page refreshes.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '',
      component: GridView,
    },
    {
      path: '/glossary',
      name: 'glossary',
      component: Glossary,
    },
    {
      path: '/imprint',
      name: 'imprint',
      component: Imprint,
    },
  ],
})

export default router
