import {
  computed,
  effectScope,
  getCurrentInstance,
  inject,
  isReactive,
  isRef,
  reactive,
  toRefs,
} from "vue";
import { piniaSymbol } from "./rootStore";

function isComputed(v) {
  return !!(isRef(v) && v.effect);
}

function isObject(value) {
  return typeof value == "object" && value !== null;
}

function mergeReactiveObject(target, state) {
  for (let key in state) {
    let oldValue = target[key];
    let newValue = state[key];
    if (isObject(oldValue) && isObject(newValue)) {
      mergeReactiveObject(oldValue, newValue);
    } else {
      target[key] = newValue;
    }
  }
  return target;
}

function createOptionsStore(id, options, pinia) {
  const { state, actions, getters } = options;

  function setup() {
    // 对options里state actions getters做处理
    pinia.state.value[id] = state ? state() : {};
    // 这里的localState本身还不是ref值不具备响应式
    const localState = toRefs(pinia.state.value[id]);
    return Object.assign(
      {},
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

  const store = createSetupStore(id, setup, pinia, true);
  // 选项是api 重置方法
  store.$reset = function () {
    const newState = state ? state() : {};
    store.$patch((state) => {
      Object.assign(state, newState);
    });
  };
}

function createSetupStore(id, setup, pinia, isOption) {
  let scope;
  function $patch(partialStateOrMutator) {
    if (typeof partialStateOrMutator == "object") {
      mergeReactiveObject(pinia.state.value[id], partialStateOrMutator);
    } else {
      // 函数
      partialStateOrMutator(pinia.state.value[id]);
    }
  }

  const partialStore = {
    $patch,
  };

  const store = reactive(partialStore);

  const initialState = pinia.state.value[id];

  // setup API需要额外处理判断 哪些是state
  if (!initialState && !isOption) {
    pinia.state.value[id] = {};
  }

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
    // 判断是否为状态 ref 但是计算属性本质也是个ref
    if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
      if (!isOption) {
        // 复制给pinia的state
        pinia.state.value[id][key] = prop;
      }
    }
  }

  pinia._s.set(id, store);
  Object.assign(store, setupStore);
  console.log(store);
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
