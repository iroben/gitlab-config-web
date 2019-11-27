import Vue from 'vue'
import VueRouter from 'vue-router'
import Config from './components/config'
import Log from './components/log'

Vue.use(VueRouter)
let base = "/"
if (location.href.indexOf('/gitlab-config-web') !== -1) {
  base = 'gitlab-config-web'
}
export default new VueRouter({
  base,
  mode: 'history',
  routes: [{
    path: '/',
    redirect: '/config'
  }, {
    path: '/config',
    component: Config
  }, {
    path: '/log',
    component: Log
  }]
})
