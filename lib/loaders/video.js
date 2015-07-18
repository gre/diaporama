module.exports = function (descr, success, failure) {
  try {
    var NETWORK_NO_SOURCE = HTMLMediaElement.NETWORK_NO_SOURCE;
    var video = document.createElement("video");
    video.addEventListener("canplaythrough", function onLoadEvent () {
      video.removeEventListener("canplaythrough", onLoadEvent);
      success(video);
    }, false);
    if (typeof descr === "string") {
      descr = { "": descr };
    }
    for (var typ in descr) {
      var src = descr[typ];
      var source = document.createElement("source");
      source.addEventListener("error", function (e) {
        if (video.networkState === NETWORK_NO_SOURCE) {
          failure(e);
        }
      });
      source.type = typ;
      source.src = src;
      video.appendChild(source);
    }
    video.load();
  }
  catch (e) {
    failure(e);
  }
  return video;
};
