<template>
  <div id="app">
    <a-layout>
      <a-layout-header>
        <div style="float:left">
          <a-menu mode="horizontal">
            <a-menu-item key="config">
              <router-link to="/config">
                <a-icon type="setting" theme="twoTone"/>配置管理
              </router-link>
            </a-menu-item>
            <a-menu-item key="log">
              <router-link to="/log">
                <a-icon type="alert" theme="twoTone"/>日志
              </router-link>
            </a-menu-item>
          </a-menu>
        </div>
        <div class="userinfo">
          你好：{{userinfo.name}}
          <a-avatar :src="userinfo.avatar_url"/>
        </div>
      </a-layout-header>
      <a-layout-content>
        <router-view/>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script>
import axios from "axios";
import config from "@/config";
export default {
  data() {
    return {
      userinfo: {}
    };
  },
  mounted() {
    if (this.$route.query.token) {
      localStorage.token = this.$route.query.token;
    }
    this.loadUserInfo();
  },
  methods: {
    loadUserInfo() {
      axios
        .get(config["gitlab-config-server.domain"] + "/v1/userinfo")
        .then(resp => {
          this.userinfo = resp.data.data;
        })
        .catch(() => {
          location.href =
            config["gitlab-config-server.domain"] + "/gitlab/login";
        });
    }
  }
};
</script>

<style>
#app {
  height: 100%;
}
#app .ant-layout {
  height: 100%;
}
#app .ant-layout-header {
  background: #fff;
  height: 48px;
  padding: 0;
}
#app .ant-layout-content {
  margin: 5px;
  padding: 0;
  height: 100%;
}
#app .userinfo {
  float: right;
  line-height: 48px;
  margin-right: 20px;
}
</style>
