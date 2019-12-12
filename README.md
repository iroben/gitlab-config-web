
# GitLab配置管理Web端

# 项目效果
![项目效果](https://user-gold-cdn.xitu.io/2019/11/29/16eb503c8adbc967?w=1024&h=639&f=gif&s=2885973)

## 介绍
配置服务的由来，请看这篇文章，[一个简单的基于gitlab的配置服务
](https://juejin.im/post/5dc0036cf265da4d4704246a)。

[前端项目](https://github.com/iroben/gitlab-config-web)

[API接口](https://github.com/iroben/gitlab-config-server)

[GitLab设置请看这里](https://juejin.im/post/5dde281be51d45330766503f)


## 安装
> 1. 先配置好[服务端接口](https://github.com/iroben/gitlab-config-server)
> 2. 在`src`目录下添加`config.js`配置文件
> 3. 安装前端依赖 `npm install`
> 4. 安装前端依赖 `npm run serve`

## config.js

    export default {
        'gitlab-config-server.domain': 'http://localhost:9090'
    }


