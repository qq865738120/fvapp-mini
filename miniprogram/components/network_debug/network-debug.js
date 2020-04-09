// components/network_debug/network-debug.js
import config from "../../config"

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    env: config.env
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTap() {
      wx.navigateTo({
        url: '/pages/error/error',
      })
    }
  }
})
