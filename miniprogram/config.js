// DEV_ENV 开发环境 PROD_ENV 生产环境
const envEnum = {
  DEV: "DEV_ENV",
  PROD: "PROD_ENV"
}

const env = envEnum.DEV

const host = env === envEnum.DEV ? "https://fvcms-rd.iotnc.cn" : "https://fvcms.iotnc.cn"

export default {
  env,
  host
}