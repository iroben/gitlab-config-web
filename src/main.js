import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import {
  Layout,
  Menu,
  Icon,
  Avatar,
  Select,
  Card,
  Button,
  Table,
  Tag,
  Popconfirm,
  Modal,
  Input,
  notification
} from 'ant-design-vue'

Vue.use(Layout)
Vue.use(Menu)
Vue.use(Icon)
Vue.use(Avatar)
Vue.use(Select)
Vue.use(Card)
Vue.use(Button)
Vue.use(Table)
Vue.use(Tag)
Vue.use(Popconfirm)
Vue.use(Modal)
Vue.use(Input)
Vue.use(notification)


Vue.config.productionTip = false
axios.interceptors.request.use(function (config) {
  if (config.url.indexOf('?') !== -1) {
    config.url += "&token=" + localStorage['token']
  } else {
    config.url += "?token=" + localStorage['token']
  }

  return config
}, function (error) {
  return Promise.reject(error)
})
axios.interceptors.response.use(function (response) {
  if (!response.data || response.data.statusCode !== 10000) {
    notification.error({
      title: '系统提示',
      content: response.data.statusCode || '系统错误'
    })
    return Promise.reject("error")
  }
  return response
}, function (error) {
  return Promise.reject(error)
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
