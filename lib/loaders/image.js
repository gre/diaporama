var assign = require("object-assign");

function loadImage (src, success, failure) {
  var img = new window.Image();
  img.crossOrigin = true;
  img.onload = function () {
    success(img);
  };
  img.onabort = img.onerror = failure;
  img.src = src;
  return img;
}


module.exports = function loadImages (descr, success, failure) {
  if (typeof descr === "string") {
    descr = { "": descr };
  }

  var keys = Object.keys(descr);
  if (keys.length === 0) {
    failure(new Error("all images failed to load"));
  }
  else {
    loadImage(descr[keys[0]], success, function (e) {
      if (keys.length === 1)
        failure(e);
      else {
        descr = assign({}, descr);
        delete descr[keys[0]];
        loadImages(descr, success, failure);
      }
    });
  }
};
