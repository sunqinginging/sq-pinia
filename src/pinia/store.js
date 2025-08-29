import {
  computed,
  effectScope,
  getCurrentInstance,
  inject,
  isReactive,
  isRef,
  reactive,
  toRefs,
  watch,
} from "vue";
import { piniaSymbol } from "./rootStore";
import { addSubscription, triggerSubscriptions } from "./subscribe";
import { setActivePinia } from "pinia";
import { activePinia } from "./createPinia";

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
  let actionSubscriptions = [];
  const partialStore = {
    $patch,
    $subscribe(callback, options) {
      // watch也是effect 所有也用effectScope实例包裹起来 统一管理
      scope.run(() =>
        watch(
          pinia.state.value[id],
          (state) => {
            // 调用$subscribe的时候 用户接受2个参数 一个mutation一个state
            callback({ storeId: id }, state);
          },
          options
        )
      );
    },
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $dispose() {
      // 停止 store 的相关作用域，并从 store 注册表中删除它
      scope.stop();
      actionSubscriptions = [];
      pinia._s.delete(id);
    },
  };

  const store = reactive(partialStore);

  store.$id = id;

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
      const afterCallbackList = [];
      const onErrorCallbackList = [];

      function after(callback) {
        afterCallbackList.push(callback);
      }

      function onError(callback) {
        onErrorCallbackList.push(callback);
      }
      console.log(...arguments);
      triggerSubscriptions(actionSubscriptions, {
        after,
        onError,
        name: id,
        store,
        args: [...arguments],
      });
      let ret;
      try {
        ret = action.apply(store, arguments);
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error);
      }
      // action返回结果可能是一个promise after回调列表会在promise resolve之后执行
      // after的回调函数可以接受一个value值 为promise的resolve的值
      if (ret instanceof Promise) {
        return ret
          .then((result) => {
            triggerSubscriptions(afterCallbackList, result);
          })
          .catch((err) => {
            triggerSubscriptions(onErrorCallbackList, err);
          });
      } else {
        triggerSubscriptions(afterCallbackList, ret);
      }
      // action抛出错误或者action返回的promise是reject
      return ret;
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

  // 替换state 不能完全替换掉 store 的 state，因为那样会破坏其响应性
  // 需要使用store的属性$state
  Object.defineProperty(store, "$state", {
    get() {
      return pinia.state.value[id];
    },
    set: (state) => {
      $patch(($state) => {
        Object.assign($state, state);
      });
    },
  });

  pinia._p.forEach((plugin) => {
    Object.assign(
      store,
      scope.run(() => plugin({ store }))
    );
  });

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
    let pinia = instance && inject(piniaSymbol);

    if (pinia) {
      setActivePinia(pinia);
    }
    pinia = activePinia;

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
