import {
  computed,
  effectScope,
  getCurrentInstance,
  inject,
  reactive,
} from "vue";
import { piniaSymbol } from "./rootStore";

function createOptionsStore(id, options, pinia) {
  const { state, actions, getters } = options;

  function setup() {
    // 对options里state actions getters做处理
    const localState = (pinia.state.value[id] = state ? state() : {});

    return Object.assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce((meno, name) => {
        meno[name] = computed(() => {
          let store = pinia._s.get(id);
          return getters[name].call(store);
        });
        return meno;
      }, {})
    );
  }

  createSetupStore(id, setup, pinia);
}

function createSetupStore(id, setup, pinia) {
  let scope;
  const store = reactive({});

  const setupStore = pinia._e.run(() => {
    scope = effectScope();
    return scope.run(() => setup());
  });

  function wrapAction(key, action) {
    return function () {
      return action.apply(store, arguments);
    };
  }

  for (let key in setupStore) {
    const prop = setupStore[key];
    if (typeof prop == "function") {
      setupStore[key] = wrapAction(key, prop);
    }
  }

  pinia._s.set(id, store);

  Object.assign(store, setupStore);
  return store;
}

export function defineStore(idOrOptions, setup) {
  let id;
  let options;
  if (typeof idOrOptions == "string") {
    id = idOrOptions;
    options = setup;
  } else {
    options = idOrOptions;
    id = idOrOptions.id;
  }

  const isSetupStore = typeof setup == "function";

  function useStore() {
    // 这个方法一般在组件用调用
    // 这个方法 会在不同组件被多次调用 需要通过pinia的_s来保存和维护
    let instance = getCurrentInstance();
    const pinia = instance && inject(piniaSymbol);

    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
    }

    const store = pinia._s.get(id);

    return store;
  }

  return useStore;
}
