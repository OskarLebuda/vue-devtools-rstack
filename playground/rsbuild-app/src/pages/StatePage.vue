<script setup lang="ts">
import { reactive, ref } from 'vue'

const message = ref('hello devtools')
const amount = ref(42)
const enabled = ref(true)
const tags = ref(['rspack', 'vue', 'devtools'])
const profile = reactive({
  name: 'Ola',
  address: { city: 'Warszawa', zip: '00-001' },
  scores: [1, 2, 3],
})
</script>

<template>
  <section>
    <h2>Editable state showcase</h2>
    <p data-testid="message">message: {{ message }}</p>
    <p data-testid="amount">amount: {{ amount }}</p>
    <p data-testid="enabled">enabled: {{ enabled }}</p>
    <p data-testid="tags">tags: {{ tags.join(', ') }}</p>
    <p data-testid="profile">profile: {{ profile.name }} / {{ profile.address.city }}</p>
  </section>
</template>
