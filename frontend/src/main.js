import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import VueLazyload from 'vue3-lazyload';
import VueVirtualScroller from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const app = createApp(App);


app.use(router);
app.use(createPinia());
app.use(VueLazyload, {
  loading: '/images/loading.gif', // 可替换为你的加载中占位图
  error: '/images/error.png'       // 可替换为加载失败的占位图
});
app.use(VueVirtualScroller);

// 可选：测试插件是否加载成功
console.log('VueVirtualScroller installed');


app.mount('#app');
