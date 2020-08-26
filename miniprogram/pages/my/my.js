/**
 * 我的页
 */
import regeneratorRuntime from 'regenerator-runtime'

const { wxPro } = getApp()

import {
  mapToData
} from 'minii'
import commonStore from '../../stores/common.js';

const connect = mapToData((state) => ({
  isInit: state.common.isInit,
  isAuthorization: state.common.isAuthorization,
  isCloseAuthorizationModal: state.common.isCloseAuthorizationModal
}))

Page(connect({
  data: {
  },

  async onLoad() {
    
  },

  onCloseAuthorizationTap(e) {
    commonStore.changeisCloseAuthorizationModal(true)
  },

  onFavoriteTap() {
    if (!this.data.isAuthorization) {
      commonStore.changeisCloseAuthorizationModal(true)
      setTimeout(() => {
        commonStore.changeisCloseAuthorizationModal(false)
      }, 100)
      return
    }
    wx.navigateTo({
      url: '/pages/favorite/favorite',
    })
  },

  onCooperationTap() {
    wx.navigateTo({
      url: '/pages/cooperation/cooperation',
    })
  },

  onAboutTap() {
    wx.navigateTo({
      url: '/pages/about/about',
    })
  }

}))
