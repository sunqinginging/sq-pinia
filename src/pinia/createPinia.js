import { effectScope, ref } from "vue";
import { piniaSymbol } from "./rootStore";

export function createPinia() {
  // effectScope
  // https://cn.vuejs.org/api/reactivity-advanced.html#effectscope
  // 创建一个effectScope effect作用域 对computed watch等进行批量的处理
  const scope = effectScope();
  const state = scope.run(() => ref({})); // 保存每个store的state

  const pinia = {
    _s: new Map(), // 保存所有的store
    _e: scope,
    install(app) {
      // 收集所有store的信息
      // 让所有的store拿到pinia
      app.provide(piniaSymbol, pinia);
      app.config.globalProperties.$pinia = pinia;
    },
    state,
  };

  return pinia;
}
