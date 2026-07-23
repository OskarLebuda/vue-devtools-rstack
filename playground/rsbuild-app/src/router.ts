import { createRouter, createWebHistory } from 'vue-router'

declare const __APP_BASE__: string

export const router = createRouter({
  history: createWebHistory(typeof __APP_BASE__ === 'string' ? __APP_BASE__ : '/'),
  routes: [
    { path: '/', name: 'home', component: () => import('./pages/HomePage.vue') },
    { path: '/about', name: 'about', component: () => import('./pages/AboutPage.vue') },
    { path: '/state', name: 'state', component: () => import('./pages/StatePage.vue') },
  ],
})
