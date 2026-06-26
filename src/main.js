import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Lazy load route components for code splitting
const Home = () => import('./views/Home.vue')
const About = () => import('./views/About.vue')
const Services = () => import('./views/Services.vue')
const ServiceProjectManagement = () => import('./views/ServiceProjectManagement.vue')

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/services', component: Services },
  { path: '/services/project-management', component: ServiceProjectManagement }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')
