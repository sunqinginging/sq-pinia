<script setup>
import { getCurrentInstance } from "vue";
import { useCounterStore } from "./stores/counter";
import { useCounterStore2 } from "./stores/counter2";
import { storeToRefs } from "./pinia/storeToRefs";

const store = useCounterStore();

const store2 = useCounterStore2();

const { count } = storeToRefs(store);

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

store.$subscribe((mutation, state) => {
  console.log(state, "卧槽改变了");
});

// 使用store的$onAction
store.$onAction(
  ({
    name, // action 名称
    store, // store 实例，类似 `someStore`
    args, // 传递给 action 的参数数组
    after, // 在 action 返回或解决后的钩子
    onError, // action 抛出或拒绝的钩子
  }) => {
    after((res) => {
      console.log(res, name, store, args);
    });
  }
);
</script>

<template>
  <div>{{ store.count }}</div>
  <div>通过storeToRefs解构的count的值：{{ count }}</div>
  <div>加倍： {{ store.double }}</div>
  <button @click="handleClick">修改状态</button>
  <button @click="handleClick2">$patch修改状态</button>
  <button @click="handleReset">选项式api 重置reset方法</button>
  <div>数组长度： {{ store.arr.length }}</div>

  <div>{{ store2.count }}</div>
</template>

<style scoped></style>
