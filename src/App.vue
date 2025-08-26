<script setup>
import { getCurrentInstance } from "vue";
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();

const handleClick = () => {
  store.increment(2);
};
</script>

<template>
  <div>{{ store.count }}</div>
  <div>加倍： {{ store.double }}</div>
  <button @click="handleClick">修改状态</button>
</template>

<style scoped></style>
