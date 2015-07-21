var assign = require("object-assign");
var loadImage = require("./loadImage");

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

  return function () {
    if (!current) return;
    current();
    current = null;
  };
};
