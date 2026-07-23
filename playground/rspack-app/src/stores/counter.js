import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'playground-counter',
  }),
  getters: {
    doubled: state => state.count * 2,
  },
  actions: {
    increment() {
      this.count += 1
    },
  },
})
