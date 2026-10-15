import { createRouter, createWebHistory } from 'vue-router'
import GridView from '../views/GridView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.query.view !== from.query.view) return { top: 0 }
    return false
  },
  routes: [
    {
      path: '/:view?',
      name: 'home',
      component: GridView,
    },
  ],
})

export default router
