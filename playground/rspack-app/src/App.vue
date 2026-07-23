<script>
export default {
  name: 'App',
}
</script>

<template>
  <div class="app">
    <h1>Vue DevTools × Rspack (raw)</h1>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>
