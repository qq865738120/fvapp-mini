# fvApp-mini

fv mini program

#部署
*体验版发布：
```js
// miniprogram/config.js

const envEnum = {
  DEV: "DEV_ENV",
  PROD: "PROD_ENV"
}

const env = envEnum.DEV // 将env设置成envEnum.DEV
//...
```
*正式版发布：
```js
// miniprogram/config.js

const envEnum = {
  DEV: "DEV_ENV",
  PROD: "PROD_ENV"
}

const env = envEnum.PROD // 将env设置成envEnum.PROD
//...
```

#目录结构
|-miniprogram
  |-common // 公共文件
  |-components // 组件
  |  |-authorize_popup
  |  |-easyUI
  |  |  |-base
  |  |  |  |-enhance_icon
  |  |  |  |-enhance_text
  |  |  |  |-enhance_view
  |  |  |  |-icon
  |  |  |  |-loading
  |  |  |  |-load_more
  |  |  |  |-transition
  |  |  |-button
  |  |  |  |-base_button
  |  |  |-form
  |  |  |  |-checker
  |  |  |  |-search
  |  |  |-senior
  |  |  |  |-modal
  |  |  |  |-popup
  |  |-network_debug
  |  |-trtc-room
  |  |  |-common
  |  |  |-controller
  |  |  |-libs
  |  |  |-model
  |  |  |-static
  |  |  |-template
  |  |  |  |-1v1
  |  |  |  |-custom
  |  |  |  |-grid
  |  |  |-utils
  |-images // 静态图片资源
  |-lib // 引用到的库文件
  |-miniprogram_npm // npm编译过来的目录包含所有npm依赖库
  |  |-axios
  |  |-axios-miniprogram-adapter
  |  |-debug
  |  |-follow-redirects
  |  |-minii
  |  |  |-api
  |  |-ms
  |  |-qs
  |  |-regenerator-runtime
  |  |-wx-touch-event
  |-pages // 页面
  |  |-about // 关于我们
  |  |-cooperation // 商务合作
  |  |-error // log记录调试
  |  |-favorite // 收藏
  |  |-filter // 活动筛选
  |  |-index // 活动首页
  |  |-more // 活动视频列表
  |  |-my // 我的
  |  |-room // 视频展示
  |-stores // 状态管理