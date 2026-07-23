<script>
import { useCounterStore } from '../stores/counter'

export default {
  name: 'HomePage',
  setup() {
    return { counter: useCounterStore() }
  },
}
</script>

<template>
  <section>
    <h2>Home</h2>
    <p data-testid="count">Count: {{ counter.count }} (doubled: {{ counter.doubled }})</p>
    <button data-testid="increment" @click="counter.increment()">Increment</button>
  </section>
</template>
