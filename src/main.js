import { createApp } from 'vue'
import ElementPlus from 'element-plus';
import 'element-plus/lib/theme-chalk/index.css';
import '@arcgis/core/assets/esri/themes/dark/main.css'
import App from './App.vue'
import Router from '@/router'
import Store from './store'

const app = createApp(App)
app.use(ElementPlus)
app.use(Router)
app.use(Store)
app.mount('#app')
