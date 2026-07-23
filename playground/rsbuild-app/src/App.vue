<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header>
      <h1>Vue DevTools × Rspack</h1>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/state">State</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 0;
}
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
}
nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
nav a.router-link-active {
  font-weight: bold;
}
</style>
