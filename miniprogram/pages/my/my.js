/**
 * 我的页
 */
import regeneratorRuntime from 'regenerator-runtime'

const { wxPro } = getApp()

import WxTouchEvent from "wx-touch-event";

let infoListTouchEvent = new WxTouchEvent();

Page({
  data: {
  },

  async onLoad() {
    
  },

  onFavoriteTap() {
    wx.navigateTo({
      url: '/pages/favorite/favorite',
    })
  }

})
