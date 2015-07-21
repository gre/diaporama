var loadImages = require("./loadImages");
var loadVideo = require("./loadVideo");

module.exports = function (descr, success, failure) {
  var current = null;

  if (typeof descr === "string") {
    descr = { "": descr };
  }
  var videos = {};
  var imgs = {};
  for (var t in descr) {
    var s = descr[t];
    if (t.indexOf("image")===0) {
      imgs[t] = s;
    }
    else {
      videos[t] = s;
    }
  }

  function ldImgs () {
    current = loadImages(imgs, function (img) {
      if (!current) current = null;
      current = null;
      success({ image: img });
    }, function (e) {
      if (!current) current = null;
      current = null;
      failure(e);
    });
  }

  if (Object.keys(videos).length === 0) {
    ldImgs();
  }
  else {
    current = loadVideo(videos,function (video) {
      success({ video: video });
    }, function (e) {
      if (Object.keys(imgs).length)
        ldImgs();
      else
        failure(e);
    });
  }

  return function () {
    if (!current) return;
    current();
    current = null;
  };
};
