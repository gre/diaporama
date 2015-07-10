module.exports = function (descr, success, failure) {
  var video = document.createElement('video');
  video.addEventListener("canplaythrough", function onLoadEvent () {
    video.removeEventListener("canplaythrough", onLoadEvent);
    success(video);
  }, false);
  video.onerror = failure;
  switch (typeof descr) {
    case "string":
      video.src = descr;
      break;

    case "object":
    for (var typ in descr) {
      var src = descr[typ];
      var source = document.createElement("source");
      source.type = typ;
      source.src = src;
      video.appendChild(source);
    }
    break;
  }
  video.load();
  return video;
};
