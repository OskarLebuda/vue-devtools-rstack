<script>
export default {
  name: 'AboutPage',
  data() {
    return {
      message: 'raw rspack playground',
      amount: 42,
    }
  },
}
</script>

<template>
  <section>
    <h2>About</h2>
    <p data-testid="message">message: {{ message }}</p>
    <p data-testid="amount">amount: {{ amount }}</p>
  </section>
</template>
