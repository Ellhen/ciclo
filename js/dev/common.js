const isMobile = { Android: function() {
  return navigator.userAgent.match(/Android/i);
}, BlackBerry: function() {
  return navigator.userAgent.match(/BlackBerry/i);
}, iOS: function() {
  return navigator.userAgent.match(/iPhone|iPad|iPod/i);
}, Opera: function() {
  return navigator.userAgent.match(/Opera Mini/i);
}, Windows: function() {
  return navigator.userAgent.match(/IEMobile/i);
}, any: function() {
  return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows();
} };
function getDigFormat(item, sepp = " ") {
  return item.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, `$1${sepp}`);
}
function uniqArray(array) {
  return array.filter((item, index, self) => self.indexOf(item) === index);
}
export {
  getDigFormat as g,
  isMobile as i,
  uniqArray as u
};
