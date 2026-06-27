import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

// Global theme (CSS variables + reset) — required by all components.
// Without this the SPA renders unstyled because component styles reference
// var(--cyan), var(--font-display), etc. defined in assets/styles/variables.css.
import './assets/styles/main.css'

import App from './App.vue'
import Home from './views/Home.vue'
import About from './views/About.vue'
import News from './views/News.vue'
import NewsDetail from './views/NewsDetail.vue'
import SupplyChainFinance from './views/SupplyChainFinance.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/news', component: News },
  { path: '/news/:slug', component: NewsDetail, props: true },
  { path: '/services/supply-chain-finance', component: SupplyChainFinance }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
