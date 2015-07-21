
module.exports = function loadImage (src, success, failure) {
  var img = new window.Image();
  img.crossOrigin = true;
  img.onload = function () {
    success(img);
  };
  img.onabort = img.onerror = failure;
  img.src = src;
  return function () {
    img.onload = null;
    img.onerror = null;
    img.onabort = null;
    img.src = "";
    img = null;
  };
};
