import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import { createHistoryPlugin } from './stores/plugins/history';

import './styles/variables.css'; // 全局 Design Tokens
import './styles/index.css'; // 全局样式 (可能会被逐渐移除或重构)

const app = createApp(App);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

const pinia = createPinia();
// Pinia 2.x 中 plugin 需通过 _p 数组注册
(pinia as any)._p.push(
  createHistoryPlugin({
    storeId: 'workflow',
    stateKeys: ['nodes', 'edges'],
    maxHistory: 50,
    trackActions: ['addNodes', 'removeNode', 'removeEdge', 'addEdge'],
    debounceActions: { updateNodeData: 500, updateEdgeData: 500 },
  }),
);
app.use(pinia);
app.use(router);

// 仅在显式启用时使用 Mock（避免覆盖真实后端）
// 强制开启 Mock 用于调试 (已禁用，使用 .env 控制)
// console.log('VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK)
/*
import('./api/mock').then(({ setupMock }) => {
  setupMock()
})
*/
if (import.meta.env.VITE_USE_MOCK === 'true') {
  import('./api/mock').then(({ setupMock }) => {
    setupMock();
  });
}

app.mount('#app');
