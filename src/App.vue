<script setup>
import { getCurrentInstance } from "vue";
import { useCounterStore } from "./stores/counter";
import { useCounterStore2 } from "./stores/counter2";

const store = useCounterStore();

const store2 = useCounterStore2();

const handleClick = () => {
  store.increment(2);
};

const handleClick2 = () => {
  store.$patch({
    count: 100,
    arr: [1, 2, 3, 4],
  });
};

const handleReset = () => {
  store.$reset();
};
</script>

<template>
  <div>{{ store.count }}</div>
  <div>加倍： {{ store.double }}</div>
  <button @click="handleClick">修改状态</button>
  <button @click="handleClick2">$patch修改状态</button>
  <button @click="handleReset">选项式api 重置reset方法</button>
  <div>数组长度： {{ store.arr.length }}</div>

  <div>{{ store2.count }}</div>
</template>

<style scoped></style>
