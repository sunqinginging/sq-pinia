import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createPinia } from "./pinia/index";
import { debounce } from "./utils/debounce";

const app = createApp(App);

const pinia = createPinia();

pinia.use(({ store }) => {
  let local = localStorage.getItem(`${store.$id}_PINIA_STATE`);
  if (local) {
    store.$state = JSON.parse(local);
  }

  // 订阅store的state的改变
  store.$subscribe(({ storeId: id }, state) => {
    localStorage.setItem(`${id}_PINIA_STATE`, JSON.stringify(state));
  });
});

// 插件实战 添加新的选项
// https://pinia.vuejs.org/zh/core-concepts/plugins.html#adding-new-options
pinia.use(({ store, options }) => {
  // 对store的options的自定义选项debounce中的申明的需要做防抖的action重新定义
  // 并且使用pinia的特性 插件返回的值 会通过Object.assign替换原来的action
  if (options.debounce) {
    return Object.keys(options.debounce).reduce((debounceActions, action) => {
      debounceActions[action] = debounce(
        store[action],
        options.debounce[action],
        true
      );
      return debounceActions;
    }, {});
  }
});

app.use(pinia);
app.mount("#app");
