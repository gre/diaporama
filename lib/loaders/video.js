var loadImage = require("./image");

module.exports = function (descr, success, failure) {

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
    loadImage(imgs, function (img) {
      success({ image: img });
    }, failure);
  }

  function onSourceError (e) {
    if (video.networkState === NETWORK_NO_SOURCE) {
      if (Object.keys(imgs).length)
        ldImgs();
      else
        failure(e);
    }
  }

  if (Object.keys(videos).length === 0) {
    ldImgs();
  }
  else {
    var NETWORK_NO_SOURCE = HTMLMediaElement.NETWORK_NO_SOURCE;
    var video = document.createElement("video");
    video.crossOrigin = true;
    video.addEventListener("canplaythrough", function onLoadEvent () {
      video.removeEventListener("canplaythrough", onLoadEvent);
      success({ video: video });
    }, false);
    for (var typ in videos) {
      var src = descr[typ];
      var source = document.createElement("source");
      source.addEventListener("error", onSourceError);
      source.type = typ;
      source.src = src;
      video.appendChild(source);
    }
    video.load();
  }
};
