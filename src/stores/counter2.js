import { defineStore } from "../pinia/index";
import { computed, ref } from "vue";

export const useCounterStore2 = defineStore("counter2", () => {
  const count = ref(100);
  const double = computed(() => count.value * 2);
  const addCount = () => {
    count.value++;
  };

  return {
    count,
    addCount,
  };
});
