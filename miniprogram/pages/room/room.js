/**
 * 视频详情页
 */
import LastMayday from "./img.js"
import {
  mapToData
} from 'minii'
import {
  px2Rpx,
  getIn,
  isNull,
  randomWord,
  formatTime
} from '../../common/tools.js';
import commonStore from '../../stores/common.js';
import {
  PremitionError,
  RequestUrls
} from '../../common/enum.js';
import config from "../../config.js";

const connect = mapToData((state) => ({
  isInit: state.common.isInit,
  enterType: state.common.enterType,
  enterPath: state.common.enterPath,
  userInfo: state.common.userInfo,
  usersig: state.common.usersig,
  currentVideo: state.common.currentVideo,
  currentActivity: state.common.currentActivity,
  apiError: state.common.apiError,
  isAuthorization: state.common.isAuthorization,
  isCloseAuthorizationModal: state.common.isCloseAuthorizationModal
}))

const sysInfo = wx.getSystemInfoSync();

let videoId = "";
let socketOpen = false
let socketMsgQueue = []
let socketTask;
let timer1;
let timer2;
let timer3 = null;
let timer4;

let videoDetail; // 远端视频推送信息
let orientation = "vertical"; // 手机方向

let lastTime = Date.now();

let step = 0 // 缩放步进

const ORIENTATION_TYPE = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal"
}
const OP_TYPE = {
  PLAY: 3,
  DOWNLOAD: 4,
  SHARE: 5
};
const EVENT_TYPE = {
  LEFT: 0,
  RIGHT: 1,
  ZOOM: 2,
  REDUCE: 3,
  PLAY: 4,
  STOP: 5
}

/**
 * 视频相关参数
 */
const getVideoInfo = (h, w) => {
  const videoHeight = h || 360;
  const videoWidth = w || 640;
  const aspectRatio = orientation === ORIENTATION_TYPE.VERTICAL ? videoWidth / videoHeight : videoHeight / videoWidth; // 视频横宽比
  let clientVideoWidth = orientation === ORIENTATION_TYPE.VERTICAL ? sysInfo.screenWidth : sysInfo.screenWidth / aspectRatio; // 视频在客户端中相对宽度
  let clientVideoHeight = orientation === ORIENTATION_TYPE.VERTICAL ? sysInfo.screenWidth / aspectRatio : sysInfo.screenWidth; // 视频在客户端中相对高度
  let videoTop = orientation === ORIENTATION_TYPE.VERTICAL ? (sysInfo.screenHeight - clientVideoHeight) / 2 : 0; // 视频在客户端中顶部与屏幕顶部距离
  let videoLeft = orientation === ORIENTATION_TYPE.VERTICAL ? 0 : (sysInfo.screenHeight - clientVideoWidth) / 2; // 视频在客户端中最左边距离屏幕左边距离

  return {
    videoHeight,
    videoWidth,
    aspectRatio,
    clientVideoWidth,
    clientVideoHeight,
    videoTop,
    videoLeft
  }
}


Page(connect({

  /**
   * 页面的初始数据
   */
  data: {
    trtcConfig: {
      sdkAppID: '1400342258', // 开通实时音视频服务创建应用后分配的 SDKAppID
      userID: "", // 用户 ID，可以由您的帐号系统指定
      userSig: "", // 身份签名，相当于登录密码的作用
      template: '1v1', // 画面排版模式
      scene: "rtc",
      audioVolumeType: "voicecall",
      enableCamera: false,
      enableMic: true,
      enableAns: false,
      enableAgc: false,
      enableIM: false,
      debugMode: config.env === config.envEnum.DEV ? true : false,
      enableBackgroundMute: true
    },
    isShowBar: true,
    downloadText: "保存",
    isShowDialog: false,
    isShowShare: false,
    imgData: null,
    isStop: false,
    statusBarHeight: px2Rpx(sysInfo.statusBarHeight) + 16 + "rpx",
    PremitionError: PremitionError,
    RequestUrls,
    isShowToast: false,
    tempOrientation: 'vertical'
  },

  onModalButtonTap(e) {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },

  /**
   * 缩放手势
   */
  onPinch(e) {
    const {
      scale,
      touches
    } = e.detail;
    console.log("捏", scale);
    if (scale === 1) return;
    const myStep = scale >= 1 ? scale - 1 : scale;
    step += (myStep < 0 ? 0 : myStep);
    if (step <= 1) return;
    step = 0;

    const {
      videoHeight,
      videoWidth,
      aspectRatio,
      clientVideoWidth,
      clientVideoHeight,
      videoTop,
      videoLeft
    } = getVideoInfo(this.data.currentVideo.videoHeightPixel, this.data.currentVideo.videoWidthPixel); // 获取视频信息
    let centerPointX = (Math.abs(touches[0].clientX - touches[1].clientX) / 2) + Math.min(touches[0].clientX, touches[1].clientX);
    let centerPointY = (Math.abs(touches[0].clientY - touches[1].clientY) / 2) + Math.min(touches[0].clientY, touches[1].clientY);

    /**
     * 越界处理
     * 超出视频边界则将中心点重置到边界线上
     */
    if (orientation === ORIENTATION_TYPE.VERTICAL) { // 手机竖向越界处理
      if (centerPointX >= videoLeft + clientVideoWidth) {
        centerPointX = videoLeft + clientVideoWidth;
      } else if (centerPointX <= videoLeft) {
        centerPointX = videoLeft;
      } else if (centerPointY >= videoTop + clientVideoHeight) {
        centerPointY = videoTop + clientVideoHeight
      } else if (centerPointY <= videoTop) {
        centerPointY = videoTop
      }
    } else { // 手机横向越界处理
      if (centerPointX >= videoTop + clientVideoHeight) {
        centerPointX = videoTop + clientVideoHeight;
      } else if (centerPointX <= videoTop) {
        centerPointX = videoTop;
      } else if (centerPointY >= videoLeft + clientVideoWidth) {
        centerPointY = videoLeft + clientVideoWidth
      } else if (centerPointY <= videoLeft) {
        centerPointY = videoLeft
      }
    }

    /**
     * 如果是横屏模式下，则需要将转换坐标系，将视频坐标系远点顺时针
     * 方向旋转90度然后沿y轴负方向平移一个视频高度。且保持点在屏幕
     * 坐标系中的坐标不变。
     */
    if (orientation === ORIENTATION_TYPE.HORIZONTAL) {
      const temp = centerPointX;
      centerPointX = centerPointY;
      centerPointY = -temp + clientVideoHeight;
    }
    let videoX = (centerPointX - videoLeft) * videoWidth / clientVideoWidth; // 实际视频坐标系的x坐标值
    let videoY = (centerPointY - videoTop) * videoHeight / clientVideoHeight; // 实际视频坐标系的y坐标值

    console.log("sysInfo", sysInfo)
    console.log("clientVideoWidth", clientVideoWidth)
    console.log("clientVideoHeight", clientVideoHeight)
    console.log("aspectRatio", aspectRatio);
    console.log("videoTop", videoTop);
    console.log("videoLeft", videoLeft);
    console.log("centerPointX", centerPointX);
    console.log("centerPointY", centerPointY);

    const x = parseInt(videoX);
    const y = parseInt(videoY);

    const msg = {
      type: scale >= 1 ? EVENT_TYPE.ZOOM : EVENT_TYPE.REDUCE,
      percent: 1,
      roomID: getIn(this.data.currentVideo, ["roomID"]),
      x,
      y,
      width: videoWidth,
      height: videoHeight
    };
    this.sendSocketMessage(msg)
  },

  onSwipe(e) {
    console.log("滑", e);
  },

  onTap(e) {
    console.log("点击", e);
    if (orientation === ORIENTATION_TYPE.HORIZONTAL) return;
    this.setData({
      isShowBar: !this.data.isShowBar
    })
  },

  onDoubleTap(e) {
    this.setData({
      isStop: !this.data.isStop
    })

    if (!isNull(timer3)) {
      clearTimeout(timer3);
      timer3 = null;
    }

    this.setData({
      tempOrientation: orientation
    })

    console.log("双击", this.data.isStop);
    const msg = {
      type: this.data.isStop ? EVENT_TYPE.STOP : EVENT_TYPE.PLAY,
      percent: 1,
      roomID: getIn(this.data.currentVideo, ["roomID"]),
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    console.log("wss message", JSON.stringify(msg))
    this.setData({
      isShowToast: true
    })
    timer3 = setTimeout(() => {
      this.setData({
        isShowToast: false
      })
      timer3 = null;
    }, 1500)
    this.sendSocketMessage(msg)
  },

  /**
   * 滑动手势
   * @param {} e 
   */
  onMove(e) {
    const {
      deltaX,
      deltaY
    } = e.detail;
    if (deltaY && deltaY) {
      console.log("移动", deltaX, deltaY);
      let msg;
      if (orientation === ORIENTATION_TYPE.VERTICAL) {
        msg = {
          type: deltaX > 0 ? EVENT_TYPE.RIGHT : EVENT_TYPE.LEFT,
          percent: parseInt((deltaX > 0 ? deltaX : -deltaX) / 375 * 40),
          roomID: getIn(this.data.currentVideo, ["roomID"]),
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      } else if (orientation === ORIENTATION_TYPE.HORIZONTAL) {
        msg = {
          type: deltaY > 0 ? EVENT_TYPE.RIGHT : EVENT_TYPE.LEFT,
          percent: parseInt((deltaY > 0 ? deltaY : -deltaY) / 750 * 10),
          roomID: getIn(this.data.currentVideo, ["roomID"]),
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      }
      this.sendSocketMessage(msg)
    }
  },

  onShareTap(e) {
    if (!this.data.isAuthorization) {
      commonStore.changeisCloseAuthorizationModal(true)
      setTimeout(() => {
        commonStore.changeisCloseAuthorizationModal(false)
      }, 100)
      return
    }
    commonStore.refechDoVideoOpen({
      videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0),
      opType: OP_TYPE.SHARE
    });
    this.setData({
      isShowShare: true
    })
  },

  onShareWarpTap(e) {
    this.setData({
      isShowShare: false
    })
  },

  onFriendTap(e) {
    this.setData({
      isShowShare: false
    })
  },

  async onCanvasTap(e) {
    this.setData({
      isShowShare: false
    })
    wx.showLoading({
      title: '加载中...',
    })
    const {
      posterUrl
    } = await commonStore.refectGetSharePoster({
      videoId: getIn(this.data, ["currentVideo", "id"], 0)
    });
    console.log("posterUrl", posterUrl)
    wx.hideLoading();
    if (!isNull(posterUrl)) {
      wx.getImageInfo({
        src: posterUrl,
        success: res => {
          const {
            path
          } = res;
          console.log("临时图片路径", path);
          wx.getSetting({
            success: setting => {
              console.log("setting", setting)
              if (setting.authSetting['scope.writePhotosAlbum']) {
                // 已经授权 this.isAuthorization = true;
                wx.saveImageToPhotosAlbum({
                  filePath: path,
                  success(res) {
                    console.log(res.errMsg)
                    wx.showToast({
                      title: '保存成功'
                    })
                  }
                })
              } else {
                // 未授权 this.isAuthorization = false;
                wx.saveImageToPhotosAlbum({
                  filePath: path,
                  success(res) {
                    console.log(res.errMsg)
                    wx.showToast({
                      title: '保存成功'
                    })
                  }
                })
                console.log("false")
                this.setData({
                  isShowDialog: true
                })
              }
            },
            fail: err => {
              console.log("生成海报打开设置失败", err)
              wx.showToast({
                title: '生成海报失败',
                icon: 'none'
              })
            }
          });
        },
        fail: () => {
          console.log("海报未生成", "获取图片信息失败")
          wx.showToast({
            title: '生成海报失败',
            icon: 'none'
          })
        }
      })
    } else {
      console.log("海报未生成", "接口未返回图片链接")
      wx.showToast({
        title: '生成海报失败',
        icon: 'none'
      })
    }
  },

  onCloseAuthorizationTap(e) {
    commonStore.changeisCloseAuthorizationModal(true)
  },

  async onFavoriteTap(e) {
    if (!this.data.isAuthorization) {
      commonStore.changeisCloseAuthorizationModal(true)
      setTimeout(() => {
        commonStore.changeisCloseAuthorizationModal(false)
      }, 100)
      return
    }
    let res;
    if (getIn(this.data.currentVideo, ["stared"], true)) {
      res = await commonStore.refechDoVideoUnstar({
        videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0)
      })
    } else {
      res = await commonStore.refectDoVideoStar({
        videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0)
      })
    }

    if (isNull(res)) {
      // wx.showToast({
      //   title: '收藏成功',
      //   icon: 'none',
      // })
      await commonStore.refechVideoInfo({
        videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0),
        enterType: this.data.enterType
      })
    }
  },

  onBackTap(e) {
    if (this.data.enterPath === "pages/room/room") {
      wx.switchTab({
        url: '/pages/index/index',
      })
    } else {
      wx.navigateBack({
        url: '/pages/more/more',
      })
    }
  },

  onOpenSetting(e) {
    console.log("eeeee", e)
    this.setData({
      isShowDialog: false
    })
  },

  onDownloadTap(e) {
    const that = this;
    if (this.data.downloadText === "保存") {
      commonStore.refechDoVideoOpen({
        videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0),
        opType: OP_TYPE.DOWNLOAD
      });
      const downloadTask = wx.downloadFile({
        url: getIn(this.data.currentVideo, ["pullStreamUrl"], ""),
        header: {
          "Content-Type": "video/mpeg4"
        },
        success(res) {
          console.log("download res", res)
          if (res.statusCode === 200) {
            console.log("res.tempFilePath", res.tempFilePath)
            wx.getSetting({
              success: setting => {
                console.log(setting)
                if (setting.authSetting['scope.writePhotosAlbum']) {
                  // 已经授权 this.isAuthorization = true;
                  wx.saveVideoToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success(res) {
                      wx.showToast({
                        title: '保存成功！',
                      })
                      console.log(res.errMsg)
                    }
                  })
                } else {
                  // 未授权 this.isAuthorization = false;
                  wx.saveVideoToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success(res) {
                      wx.showToast({
                        title: '保存成功！',
                      })
                      console.log(res.errMsg)
                    }
                  })
                  console.log("false")
                  that.setData({
                    isShowDialog: true,
                    downloadText: "保存"
                  })
                }
              },
              fail: err => {
                wx.showToast({
                  icon: "none",
                  title: '下载失败！',
                })
              }
            });
          }
        },
        fail(res) {
          wx.showToast({
            icon: "none",
            title: '下载失败！',
          })
        }
      })
      downloadTask.onProgressUpdate((res) => {
        console.log('下载进度', res.progress)
        this.setData({
          downloadText: res.progress + "%"
        })
      })
    }
  },

  /**
   * 发送手势数据
   */
  sendSocketMessage(msg) {

    const myMsg = getIn(this.data.currentVideo, ["type"]) === 3 ? {
      transactionId: randomWord(),
      service: 'VIDEO_EFFECT',
      sendTime: formatTime(new Date(), 'yyyy-MM-dd hh:mm:ss'),
      data: {
        fvsCode: this.data.currentVideo.fvsCode,
        ...msg
      }
    } : msg
    console.log("wss message", JSON.stringify(myMsg))
    if (socketOpen) {
      wx.sendSocketMessage({
        data: JSON.stringify(myMsg)
      })
    } else {
      socketMsgQueue.push(JSON.stringify(myMsg))
    }
  },

  /**
   * 初始化手势连接
   */
  initSocket(url) {
    /**
     * 连接手势wss
     */
    console.log("----------wss开始连接----------")
    socketTask = wx.connectSocket({
      url: url,
      success: (res) => {
        console.log("---------wss连接成功---------", res)
        timer4 = setInterval(() => {
          this.sendSocketMessage({
            type: 100,
            percent: 0,
            roomID: getIn(this.data.currentVideo, ["roomID"]),
            x: 0,
            y: 0,
            width: 0,
            height: 0
          })
        }, 8000)
      },
      fail: (res) => {
        console.log("---------wss连接失败---------", res)
      }
    })
    socketTask.onClose(function (res) {
      console.log('WebSocket 已关闭！')
    })
    socketTask.onError(res => {
      console.log("-------wss出现错误--------", res)
      wx.showToast({
        title: '手势连接失败，请检查网络。',
        icon: 'none'
      })
    })
    socketTask.onOpen(function (res) {
      console.log("----------wss管道打开成功----------", res)
      socketOpen = true
      for (let i = 0; i < socketMsgQueue.length; i++) {
        this.sendSocketMessage(socketMsgQueue[i])
      }
      socketMsgQueue = []
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.scene) {
      const scene = decodeURIComponent(options.scene)
      videoId = scene;
      console.log("videoId", videoId)
    }

    /**
     * 监听手机方向改变
     */
    let lastState = 0;
    wx.startAccelerometer();
    wx.onAccelerometerChange((res) => {
      const now = Date.now();

      // 500ms检测一次
      if (now - lastTime < 500) {
        return;
      }
      lastTime = now;

      let nowState;

      // 57.3 = 180 / Math.PI
      const Roll = Math.atan2(-res.x, Math.sqrt(res.y * res.y + res.z * res.z)) * 57.3;
      const Pitch = Math.atan2(res.y, res.z) * 57.3;

      // console.log('Roll: ' + Roll, 'Pitch: ' + Pitch)

      // 横屏状态
      if (Roll > 50) {
        if ((Pitch > -180 && Pitch < -60) || (Pitch > 130)) {
          nowState = 1;
        } else {
          nowState = lastState;
        }

      } else if ((Roll > 0 && Roll < 30) || (Roll < 0 && Roll > -30)) {
        let absPitch = Math.abs(Pitch);

        // 如果手机平躺，保持原状态不变，40容错率
        if ((absPitch > 140 || absPitch < 40)) {
          nowState = lastState;
        } else if (Pitch < 0) {
          /*收集竖向正立的情况*/
          nowState = 0;
        } else {
          nowState = lastState;
        }
      } else {
        nowState = lastState;
      }

      const videoContext = wx.createVideoContext("video", this);

      // 状态变化时，触发
      if (nowState !== lastState) {
        lastState = nowState;
        if (nowState === 1) {
          console.log('change:横屏', this.data.currentVideo.type);
          // 设置视频方向
          orientation = "horizontal";
          if (this.data.currentVideo.type === 2) { // 子弹时间
            videoContext.requestFullScreen({
              direction: 90
            })
          } else if (this.data.currentVideo.type === 1) { // 自由视点
            this.trtcComponent && this.trtcComponent.setViewOrientation({
              userID: videoDetail.userID,
              streamType: videoDetail.streamType,
              orientation: 'horizontal' // 竖向：vertical，横向：horizontal
            })
            this.setData({
              isShowBar: false
            })
          }
        } else {
          console.log('change:竖屏', this.data.currentVideo.type);
          // 设置视频方向
          orientation = "vertical";
          if (this.data.currentVideo.type === 2) { // 子弹时间
            videoContext.exitFullScreen()
          } else if (this.data.currentVideo.type === 1) { // 自由视点
            this.trtcComponent && this.trtcComponent.setViewOrientation({
              userID: videoDetail.userID,
              streamType: videoDetail.streamType,
              orientation: 'vertical' // 竖向：vertical，横向：horizontal
            })
            this.setData({
              isShowBar: true
            })
          }
        }
      }
    });

    /**
     * 页面初始化相关操作
     */
    const timer1 = setInterval(async () => {
      if (this.data.isInit) {
        clearInterval(timer1);

        await commonStore.refechVideoInfo({
          videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0),
          enterType: this.data.enterType
        })

        this.setData({
          trtcConfig: {
            ...this.data.trtcConfig,
            userID: getApp().globalData.openid,
            userSig: this.data.usersig
            // userID: "2bec85f1371",
            // userSig: "eJwtzE0LgkAUheH-MuuQ*dSr0CJBCCysDFqPzh25iCIqIUT-PUmX5znwftjzUgZvHFnCZMDZ4b-JYT*Tp40rrMF4oSKx35Nr7TCQY4nQnCstpYHtmanDVU2sYgMRiE1xGWhcPeQaON8b1KxtlfkcfWexz9VY5RYe52YO7et0S9uyyEC7QqZTc78u9ZF9f5ApMeI_"
          }
        })

        commonStore.refechDoVideoOpen({
          videoId: videoId ? videoId : getIn(this.data.currentVideo, ["id"], 0),
          opType: OP_TYPE.PLAY
        });


        /**
         * 直播组件
         */
        const timer2 = setInterval(() => {
          if (getIn(this.data.currentVideo, ["roomID"])) {
            clearInterval(timer2);
            if (getIn(this.data.currentVideo, ["type"]) === 1) {
              // 自由视点
              this.trtcComponent = this.selectComponent('#trtcroom');
              this.bindTRTCRoomEvent();
              this.trtcComponent.enterRoom({
                roomID: parseInt(getIn(this.data.currentVideo, ["roomID"]))
              }).catch((res) => {
                console.error('room joinRoom 进房失败:', res)
              });

              this.initSocket(config.wssHost)
            } else if (getIn(this.data.currentVideo, ["type"]) === 3) {
              // 直播
              this.trtcComponent = this.selectComponent('#trtcroom');

              this.bindTRTCRoomEvent();
              this.trtcComponent.enterRoom({
                roomID: parseInt(getIn(this.data.currentVideo, ["roomID"]))
              }).catch((res) => {
                console.error('room joinRoom 进房失败:', res)
              });

              if (this.data.currentVideo.remoteControlStatus === 1) {
                this.initSocket(config.wssHostLive + getApp().globalData.openid)
              }
            }
          }
        }, 100)
      }
    }, 100);
  },

  onShow() {
    videoDetail && this.trtcComponent.subscribeRemoteAudio({
      userID: videoDetail.userID,
      streamType: videoDetail.streamType,
    })
  },

  onHide() {
    videoDetail && this.trtcComponent.unsubscribeRemoteAudio({
      userID: videoDetail.userID,
      streamType: videoDetail.streamType,
    })
  },

  bindTRTCRoomEvent() {
    const TRTC_EVENT = this.trtcComponent.EVENT
    this.timestamp = []
    // 初始化事件订阅
    this.trtcComponent.on(TRTC_EVENT.LOCAL_JOIN, (event) => {
      console.log('******* 加入房间', this.trtcComponent.getRemoteUserList())
      // this.trtcComponent.publishLocalVideo()
      this.trtcComponent.publishLocalAudio()
    })
    this.trtcComponent.on(TRTC_EVENT.LOCAL_LEAVE, (event) => {
      console.log('* room LOCAL_LEAVE', event)
    })
    this.trtcComponent.on(TRTC_EVENT.ERROR, (event) => {
      console.log('* room ERROR', event)
    })

    // 远端用户推送视频
    this.trtcComponent.on(TRTC_EVENT.REMOTE_VIDEO_ADD, (event) => {
      console.log('* room REMOTE_VIDEO_ADD 远端用户推送视频', event, this.trtcComponent.getRemoteUserList())
      // 订阅视频
      const userList = this.trtcComponent.getRemoteUserList()
      const data = event.data
      videoDetail = event.data


      this.trtcComponent.setViewOrientation({
        userID: videoDetail.userID,
        streamType: videoDetail.streamType,
        orientation // 竖向：vertical，横向：horizontal
      })

      // 设置视频填充方式
      this.trtcComponent.setViewFillMode({
        userID: data.userID,
        streamType: data.streamType,
        fillMode: 'contain'
      })

      // 播放视频
      this.trtcComponent.subscribeRemoteVideo({
        userID: data.userID,
        streamType: data.streamType,
      })
    })

    // 远端用户推送音频
    this.trtcComponent.on(TRTC_EVENT.REMOTE_AUDIO_ADD, (event) => {
      console.log('* room REMOTE_AUDIO_ADD', event, this.trtcComponent.getRemoteUserList())
      // 订阅音频
      const data = event.data
      if (this.template === '1v1' && (!this.remoteUser || this.remoteUser === data.userID)) {
        this.remoteUser = data.userID
        this.trtcComponent.subscribeRemoteAudio({
          userID: data.userID
        })
      } else if (this.template === 'grid' || this.template === 'custom') {
        this.trtcComponent.subscribeRemoteAudio({
          userID: data.userID
        })
      }
      // 如果不订阅就不会自动播放音频
      // this.trtcComponent.subscribeRemoteAudio({ userID: data.userID })
    })

    // 远端用户取消推送音频
    this.trtcComponent.on(TRTC_EVENT.REMOTE_AUDIO_REMOVE, (event) => {
      console.log('* room REMOTE_AUDIO_REMOVE', event, this.trtcComponent.getRemoteUserList())
    })

    this.trtcComponent.on(TRTC_EVENT.IM_MESSAGE_RECEIVED, (event) => {
      console.log('* room IM_MESSAGE_RECEIVED', event)
    })
  },

  onShareAppMessage() {
    return {
      title: getIn(this.data.currentVideo, ["name"], "-"),
      path: `/pages/room/room?scene=${getIn(this.data.currentVideo, ["id"], 0)}`,
      imageUrl: getIn(this.data.currentVideo, ["firstFrameImgSrc"], "")
    }
  },

  onShareTimeline() {
    return {
      title: getIn(this.data.currentVideo, ["name"], "-"),
      query: `scene=${getIn(this.data.currentVideo, ["id"], 0)}`,
      imageUrl: getIn(this.data.currentVideo, ["firstFrameImgSrc"], "")
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    socketTask && socketTask.close({
      complete: res => console.log("------关闭wss------", res)
    })
    if (timer1) {
      clearInterval(timer1);
      timer1 = undefined;
    }
    if (timer2) {
      clearInterval(timer2);
      timer2 = undefined;
    }
    if (timer3) {
      clearInterval(timer3);
      timer3 = undefined;
    }
    if (timer4) {
      clearInterval(timer4);
      timer4 = undefined;
    }
    videoId = undefined
    socketOpen = false
    socketMsgQueue = []
    if (this.trtcComponent) {
      videoDetail && this.trtcComponent.unsubscribeRemoteAudio({
        userID: videoDetail.userID,
        streamType: videoDetail.streamType,
      })
      this.trtcComponent = null;
    }
    wx.stopAccelerometer()
    wx.offAccelerometerChange()
  },
}))