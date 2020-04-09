import regeneratorRuntime from 'regenerator-runtime'
import { RequestUrls } from './enum'

class Request {

  /**
   * 接口url
   */
  urls = RequestUrls

  constructor(axios) {
    this.$axios = axios || (getApp() && getApp().$axios)
  }

  /**
   * 提交用户信息
   */
  postUserInfo = async params => {
    return await this.$axios.post(this.urls.info_collection, params);
  }

  /**
   * 获取活动列表
   */
  getActivityList = async params => {
    return await this.$axios.post(this.urls.activity_list, params)
  }

  /**
   * 获取视频列表
   */
  getVideoList = async params => {
    return await this.$axios.post(this.urls.video_list, params);
  }

  /**
   * 获取视频收藏列表
   */
  getVideoStarList = async params => {
    return await this.$axios.post(this.urls.video_star_list, params);
  }

  /**
   * 视频观看统计
   */
  doVideoOpen = async params => {
    return await this.$axios.post(this.urls.video_open, params);
  }

  /**
   * 视频收藏
   */
  doVideoStar = async params => {
    return await this.$axios.post(this.urls.video_star, params);
  }

  /**
   * 视频取消收藏
   */
  doVideoUnstar = async params => {
    return await this.$axios.post(this.urls.video_unstar, params);
  }

  /**
   * 获取视频详情
   */
  getVideoInfo = async params => {
    return await this.$axios.post(this.urls.video_info, params);
  }

  /**
   * 获取房间
   */
  // getVideoRoom = async params => {
  //   return await this.$axios.post("/mini/video/roomid", params);
  // }

  /**
   * 获取usersig
   */
  getUserSig = async params => {
    return await this.$axios.post(this.urls.get_usersig, params);
  }

  /**
   * 获取活动详情
   */
  getActivityInfo = async params => {
    return await this.$axios.post(this.urls.activity_info, params);
  }

  /**
   * 获取海报图片
   */
  getSharePoster = async params => {
    return await this.$axios.post(this.urls.get_poster, params);
  }
}

export default Request;