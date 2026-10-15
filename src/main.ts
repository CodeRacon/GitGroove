import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Remove the only preference stored by older releases, without reading its contents.
try {
  localStorage.removeItem('glossaryOpenEntries')
} catch {
  // Browsers may disable storage; the application works without it.
}

app.mount('#app')
