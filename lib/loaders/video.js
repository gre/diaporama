var loadImage = require("./image");

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
    current = loadImage(imgs, function (img) {
      if (!current) current = null;
      current = null;
      success({ image: img });
    }, function (e) {
      if (!current) current = null;
      current = null;
      failure(e);
    });
  }

  function onSourceError (e) {
    if (!current) current = null;
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

    var onLoadEvent = function () {
      video.removeEventListener("canplaythrough", onLoadEvent);
      success({ video: video });
    };

    video.crossOrigin = true;
    video.addEventListener("canplaythrough", onLoadEvent, false);
    var sources = [];
    for (var typ in videos) {
      var src = descr[typ];
      var source = document.createElement("source");
      source.addEventListener("error", onSourceError);
      source.type = typ;
      source.src = src;
      sources.push(source);
      video.appendChild(source);
    }
    video.load();

    current = {
      abort: function () {
        sources.forEach(function () {
          source.removeEventListener("error", onSourceError);
          source.src = "";
        });
        video.removeEventListener("canplaythrough", onLoadEvent);
        video.pause();
        video.src = "";
        video.innerHTML = "";
        video = null;
        sources = null;
      }
    };
  }

  return {
    abort: function () {
      if (!current) return;
      current.abort();
      current = null;
    }
  };
};
