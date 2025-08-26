import { defineStore } from "../pinia/index";
import { ref } from "vue";

export const useCounterStore2 = defineStore("counter", () => {
  const count = ref(100);

  const addCount = () => {
    count.value++;
  };

  return {
    count,
    addCount,
  };
});
