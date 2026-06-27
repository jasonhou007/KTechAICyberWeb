import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'

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
import ServiceProjectManagement from './views/ServiceProjectManagement.vue'
import Blockchain from './views/Blockchain.vue'
import ServiceBigData from './views/ServiceBigData.vue'
import ServiceRetailLending from './views/ServiceRetailLending.vue'
import Contact from './views/Contact.vue'
import PositionList from './views/PositionList.vue'
import PrivacyPolicy from './views/PrivacyPolicy.vue'
import Terms from './views/Terms.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/news', component: News },
  { path: '/news/:slug', component: NewsDetail, props: true },
  { path: '/services/supply-chain-finance', component: SupplyChainFinance },
  { path: '/services/project-and-program-management', component: ServiceProjectManagement },
  { path: '/services/blockchain', component: Blockchain },
  { path: '/services/big-data-ai', component: ServiceBigData },
  { path: '/services/retail-lending', component: ServiceRetailLending },
  { path: '/contact', component: Contact },
  { path: '/careers', component: PositionList },
  { path: '/privacy', component: PrivacyPolicy },
  { path: '/terms', component: Terms }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
