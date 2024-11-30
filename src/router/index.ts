import { createRouter, createWebHistory } from 'vue-router'
import GridView from '../views/GridView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:view?',
      name: 'home',
      component: GridView,
    },
  ],
})

export default router
