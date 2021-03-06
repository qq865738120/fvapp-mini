// DEV_ENV 开发环境 PROD_ENV 生产环境
const envEnum = {
  DEV: "DEV_ENV",
  PROD: "PROD_ENV"
}

const env = envEnum.PROD

const host = env === envEnum.DEV ? "https://fvcms-rd.iotnc.cn" : "https://fvcms.iotnc.cn"

const wssHost = env === envEnum.DEV ? "wss://fvcv-rd.iotnc.cn:9081" : "wss://fvcv0.iotnc.cn:8081"
const wssHostLive = env === envEnum.DEV ? "wss://fvcms-rd.iotnc.cn/ws/mini/" : "wss://fvcms.iotnc.cn/ws/mini/"

export default {
  env,
  host,
  wssHost,
  wssHostLive,
  envEnum
}