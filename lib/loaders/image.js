var assign = require("object-assign");

function loadImage (src, success, failure) {
  var img = new window.Image();
  img.crossOrigin = true;
  img.onload = function () {
    success(img);
  };
  img.onabort = img.onerror = failure;
  img.src = src;
  return {
    abort: function () {
      img.onload = null;
      img.onerror = null;
      img.onabort = null;
      img.src = "";
      img = null;
    }
  };
}


module.exports = function loadImages (descr, success, failure) {
  if (typeof descr === "string") {
    descr = { "": descr };
  }

  var current;

  var keys = Object.keys(descr);
  if (keys.length === 0) {
    failure(new Error("all images failed to load"));
  }
  else {
    current = loadImage(descr[keys[0]], function (img) {
      if (!current) return;
      current = null;
      success(img);
    }, function (e) {
      if (!current) return;
      if (keys.length === 1) {
        current = null;
        failure(e);
      }
      else {
        descr = assign({}, descr);
        delete descr[keys[0]];
        current = loadImages(descr, success, failure);
      }
    });
  }

  return {
    abort: function () {
      if (!current) return;
      current.abort();
      current = null;
    }
  };
};
