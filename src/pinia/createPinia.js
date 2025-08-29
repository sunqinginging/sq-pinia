import { effectScope, ref } from "vue";
import { piniaSymbol } from "./rootStore";

// 保证pinia实例 在组件外使用store的时候比如路由拦截的时候 也能被获取到
export let activePinia;
export const setActivePinia = (pinia) => {
  activePinia = pinia;
};

export function createPinia() {
  // effectScope
  // https://cn.vuejs.org/api/reactivity-advanced.html#effectscope
  // 创建一个effectScope effect作用域 对computed watch等进行批量的处理
  const scope = effectScope();
  const state = scope.run(() => ref({})); // 保存每个store的state

  const _p = [];
  const pinia = {
    use(plugin) {
      _p.push(plugin);
      return this;
    },
    _p,
    _s: new Map(), // 保存所有的store
    _e: scope,
    install(app) {
      setActivePinia(pinia);
      // 收集所有store的信息
      // 让所有的store拿到pinia
      app.provide(piniaSymbol, pinia);
      app.config.globalProperties.$pinia = pinia;
    },
    state,
  };

  return pinia;
}
