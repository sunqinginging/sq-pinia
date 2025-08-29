import { isReactive, isRef, toRaw, toRef } from "vue";

// 只需要对对象进行代理 toRefs对函数也会进行代理
export function storeToRefs(store) {
  // 因为需要进行for in 循环取值 所以
  // 需要将reactive的代理对象 转化为代理前的原始对象
  store = toRaw(store);

  let refs = {};
  for (let key in store) {
    let value = store[key];
    // 仅对store里面的ref reactive进行toRef的处理
    if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(store, key);
    }
  }

  return refs;
}
