<script setup lang="ts">
import { useCounterStore } from '../stores/counter'

const counter = useCounterStore()
</script>

<template>
  <section>
    <h2>Home</h2>
    <p data-testid="count">Count: {{ counter.count }} (doubled: {{ counter.doubled }})</p>
    <button data-testid="increment" @click="counter.increment()">Increment</button>
    <button data-testid="reset" @click="counter.reset()">Reset</button>
  </section>
</template>
