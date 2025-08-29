import { defineStore } from "../pinia/index";

export const useCounterStore = defineStore("counter", {
  state: () => {
    return {
      count: 0,
      arr: [1, 2],
    };
  },
  getters: {
    double() {
      return this.count * 2;
    },
  },
  actions: {
    increment(payload) {
      this.count += payload;
    },
  },
  debounce: {
    increment: 3000,
  },
});
