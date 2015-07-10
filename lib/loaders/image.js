module.exports = function (descr, success, failure) {
  var img = new window.Image();
  img.crossOrigin = true;
  img.onload = function () {
    success(img);
  };
  img.onabort = img.onerror = failure;
  img.src = descr;
  return img;
};
