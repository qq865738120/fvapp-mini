export const px2Rpx = px => {
  const sysInfo = wx.getSystemInfoSync();
  return px * 750 / sysInfo.windowWidth
}

export const isNull = value => {
  const isEmpty = typeof value === "string" && value === "";
  const isNaN = typeof value === "number" && Number.isNaN(value);
  return value === null || value === undefined || isEmpty || isNaN;
};

export const isEmptyObj = value => {
  if (typeof value === "undefined" || value === null || typeof value !== "object") {
    return true;
  }
  for (const key of Object.keys(value)) {
    return false;
  }
  return true;
};

export function getIn(data, paths, noSetValue) {
  if (isNull(data) || isEmptyObj(paths)) {
    return noSetValue;
  }
  let result = data;
  try {
    while (paths.length > 0) {
      result = result[paths.shift()];
    }
  } catch (e) {
    result = noSetValue;
  }
  return typeof result === "undefined" ? noSetValue : result;
}

export function randomWord() {
  var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  var nums = "";

  for (var i = 0; i < 32; i++) {
    var id = parseInt(Math.random() * 61);
    nums += chars[id];
  }
  return nums;
}

export function formatTime(date, fmt) {
  var o = {
    "M+": date.getMonth() + 1, //月份 
    "d+": date.getDate(), //日 
    "h+": date.getHours(), //小时 
    "m+": date.getMinutes(), //分 
    "s+": date.getSeconds(), //秒 
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
    "S": date.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
}