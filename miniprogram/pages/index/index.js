/**
 * 首页
 */
import regeneratorRuntime from 'regenerator-runtime'
import {
  mapToData
} from 'minii'
import commonStore from '../../stores/common.js';
import {
  px2Rpx,
  getIn
} from '../../common/tools.js';

const app = getApp()
const sysInfo = wx.getSystemInfoSync();
let orderField = "degree";
let currentPage = 1;
let searchVal = "";

const connect = mapToData((state) => ({
  isInit: state.common.isInit,
  userInfo: state.common.userInfo,
  isAuthorization: state.common.isAuthorization,
  activityListRes: state.common.activityListRes,
  activityType: state.common.activityType,
}))

Page(connect({
  data: {
    topBarSelected: 1,
    listHeight: px2Rpx(sysInfo.windowHeight) - 200 + "rpx",
    isLoading: false,
    orderType: ["desc", "desc"] // 活动列表排序状态，desc降序，asc升序
  },

  async onLoad() {
    const timer = setInterval(() => {
      if (this.data.isInit) {
        console.log("isAuthorization", this.data.isAuthorization);
        clearInterval(timer);
      }
    }, 100);
  },

  onShow() {
    currentPage = 1;
    this.setData({
      topBarSelected: 1,
      orderType: ["desc", "desc"]
    });
    commonStore.refechActivityList({
      orderField: "update_time",
      condition: searchVal,
      orderType: "desc",
      ...this.data.activityType
    });
  },

  async onSearch(e) {
    await commonStore.refechActivityList({
      orderField,
      condition: e.detail.detail.value
    });
    searchVal = e.detail.detail.value;
    currentPage = 1;
  },

  async onclean() {
    searchVal = "";
    currentPage = 1;
    await commonStore.refechActivityList({
      orderField,
      condition: searchVal
    });
  },

  onTopBarTap(e) {
    const firstOrderType = this.data.orderType[0] === "desc" ? "asc" : "desc";
    const secondOrderType = this.data.orderType[1] === "desc" ? "asc" : "desc";

    if (e.currentTarget.dataset.index === 0 && this.data.topBarSelected === e.currentTarget.dataset.index) {
      this.setData({
        orderType: [firstOrderType, this.data.orderType[1]]
      })
    } else if (e.currentTarget.dataset.index === 1 && this.data.topBarSelected === e.currentTarget.dataset.index) {
      this.setData({
        orderType: [this.data.orderType[0], secondOrderType]
      })
    }

    switch (e.currentTarget.dataset.index) {
      case 0:
        commonStore.refechActivityList({
          orderField: "degree",
          condition: searchVal,
          orderType: this.data.topBarSelected === e.currentTarget.dataset.index ? firstOrderType : this.data.orderType[0],
          ...this.data.activityType
        });
        orderField = "degree";
        currentPage = 1;
        break;
      case 1:
        commonStore.refechActivityList({
          orderField: "update_time",
          condition: searchVal,
          orderType: this.data.topBarSelected === e.currentTarget.dataset.index ? secondOrderType : this.data.orderType[1],
          ...this.data.activityType
        });
        orderField = "update_time";
        currentPage = 1;
        break;
    }

    this.setData({
      topBarSelected: e.currentTarget.dataset.index
    });
  },

  onFilterTap() {
    wx.navigateTo({
      url: "/pages/filter/filter",
    })
  },

  onGoMore(e) {
    commonStore.changeCurrentActivity(e.currentTarget.dataset.activity)
    wx.navigateTo({
      url: "/pages/more/more",
    })
  },

  onGoVideo(e) {
    commonStore.changeCurrentVideo({ id: e.currentTarget.dataset.activity.defaultVideoId })
    wx.navigateTo({
      url: "/pages/room/room",
    })
  },

  async scrollToLower(e) {
    if (this.data.activityListRes.canLoad) {
      currentPage = currentPage + 1;
      this.setData({
        isLoading: true
      });
      await commonStore.refechActivityList({
        orderField,
        current: currentPage,
        condition: searchVal
      });
      this.setData({
        isLoading: false
      });
    }
  },

  onShareAppMessage() {
    return {
      title: getIn(this.data.activityListRes, ["0", "name"], ""),
      path: `/pages/index/index`,
      imageUrl: getIn(this.data.activityListRes, ["0", "videoBgImgSrc"], "")
    }
  },

}))