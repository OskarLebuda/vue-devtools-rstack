import { createRouter, createWebHistory } from 'vue-router'
import AboutPage from './pages/AboutPage.vue'
import HomePage from './pages/HomePage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/about', name: 'about', component: AboutPage },
  ],
})
