import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/GridView.vue'

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
      name: 'home',
      component: HomeView,
    },
  ],
})

export default router
