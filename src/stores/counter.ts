import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * Defines a Pinia store for managing a counter state.
 *
 * The store provides the following properties and methods:
 * - `count`: the current count value, initially set to 0.
 * - `doubleCount`: a computed property that returns the current count value multiplied by 2.
 * - `increment()`: a method that increments the `count` value by 1.
 */
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
