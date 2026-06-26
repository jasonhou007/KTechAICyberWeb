import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import About from './views/About.vue'
import News from './views/News.vue'
import NewsDetail from './views/NewsDetail.vue'
import MobileApp from './views/MobileApp.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/news', component: News },
  { path: '/news/:slug', component: NewsDetail, props: true },
  { path: '/services/mobile-app', component: MobileApp }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
