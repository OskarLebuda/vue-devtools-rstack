import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'playground-counter',
    history: [] as number[],
  }),
  getters: {
    doubled: state => state.count * 2,
  },
  actions: {
    increment() {
      this.count += 1
      this.history.push(this.count)
    },
    reset() {
      this.count = 0
      this.history = []
    },
  },
})
