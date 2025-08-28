import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createPinia } from "./pinia/index";

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

app.use(pinia);
app.mount("#app");
